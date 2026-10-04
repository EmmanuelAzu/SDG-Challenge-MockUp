import type { World } from '@/lib/world/types';
import { CHAT_POOLS, COMMUNITY_TOPIC } from '@/lib/content/community-data';
import { sastDate, isoWeekKey } from '@/lib/time';
import { award } from './award';
import { currentChallenge } from './rewards';
import { evaluateBadges } from './badges';
import { circlesOf } from './community';
import { CHALLENGE_SEEDS } from '@/lib/content/community-data';
import { currentPlan, itemDone, syncBuddy } from './buddy';
import { runWeeklyDraw } from './rewards';
import { weekStart } from './leaderboard';
import { fmtWhen } from './events';
import { postMilestones } from './feed';
import { notify, uid } from './helpers';
import { campusBoard, pointsIn } from './leaderboard';
import { pickWinner, previousMonth } from './winners';
import { weeklyFor } from './weeklyTarget';

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
const unit = (s: string) => hash(s) / 4294967296;

/** Simulated members keep earning points and chatting while the demo clock moves, so leaderboards and chats change. */
export function simulateDay(w: World, now: Date) {
  const date = sastDate(now);
  const iso = now.toISOString();
  for (const u of Object.values(w.users)) {
    if (!u.sim) continue;
    // chance of being active today ~ their weekly target / 5
    if (unit(`${u.id}:${date}:active`) < (u.weeklyTarget / 5) * 0.95) {
      award(w, { userId: u.id, source: 'lesson', sourceId: `sim-${date}`, now });
      if (unit(`${u.id}:${date}:action`) < 0.6) award(w, { userId: u.id, source: 'action', sourceId: `sim-${date}`, now });
      const wk = weeklyFor(w, u.id, now);
      if (wk.thisWeek.hit && award(w, { userId: u.id, source: 'weekly_target', sourceId: wk.thisWeek.weekKey, now })) postMilestones(w, u.id, { badges: [], milestones: [], level: null, weeklyStreak: wk.streakWeeks }, now);
      evaluateBadges(w, u.id, now);
    }
  }
  // sims join this week's challenge now and then, and sim buddies chip away at the weekly plan
  const ch0 = currentChallenge(w, now);
  if (ch0) for (const u of Object.values(w.users)) {
    if (u.sim && !w.challengeDone.some((d) => d.challengeId === ch0.id && d.userId === u.id) && unit(`${u.id}:${date}:challenge`) < 0.12) {
      w.challengeDone.push({ challengeId: ch0.id, userId: u.id, at: iso });
      award(w, { userId: u.id, source: 'challenge', sourceId: ch0.id, points: ch0.points, now });
    }
  }
  for (const pair of w.buddies) {
    if (pair.status !== 'active' || !pair.sim || !pair.inviteeId) continue;
    const plan = currentPlan(w, pair, now);
    const sim = pair.inviteeId;
    const next = plan.items.find((i) => !itemDone(w, plan, sim, i));
    if (next && unit(`${pair.id}:${date}:buddy`) < 0.5) (plan.done[sim] ??= []).push(next.id);
    syncBuddy(w, pair.inviterId, now);
  }

  // a little chatter in each channel
  for (const ch of w.channels) {
    if (unit(`${ch.id}:${date}:chat`) > 0.55) continue;
    const people = (ch.kind === 'circle' ? w.circleMembers.filter((m) => m.circleId === ch.refId).map((m) => m.userId) : w.communityMembers.filter((m) => m.communityId === ch.refId && m.status === 'active').map((m) => m.userId)).filter((id) => w.users[id]?.sim);
    if (!people.length) continue;
    const slug = w.communities.find((c) => c.id === (ch.kind === 'community' ? ch.refId : w.circles.find((x) => x.id === ch.refId)?.communityId))?.slug ?? '';
    const pool = CHAT_POOLS[COMMUNITY_TOPIC[slug] ?? 'general'];
    w.messages.push({ id: uid('msg'), channelId: ch.id, userId: people[hash(`${ch.id}${date}u`) % people.length], body: pool[hash(`${ch.id}${date}b`) % pool.length], replyTo: null, kind: 'user', pinned: false, deleted: false, at: iso });
  }
}

/** A new weekly challenge appears each Monday, rotating through the content list. */
export function ensureWeeklyChallenge(w: World, now: Date) {
  const monday = weekStart(now).slice(0, 10);
  if (w.challenges.some((c) => c.weekStart === monday)) return;
  const n = Math.floor(new Date(`${monday}T00:00:00Z`).getTime() / (7 * 86400_000));
  const seed = CHALLENGE_SEEDS[n % CHALLENGE_SEEDS.length];
  w.challenges.push({ id: `ch-${monday}`, communityId: null, ...seed, weekStart: monday });
}

const isoWeekday = (d: string) => ((new Date(`${d}T12:00:00Z`).getUTCDay() + 6) % 7) + 1;

/** The single daily job (18:00 SAST): reminders, the 1st-of-month Circle Cup, Campus Cup at season end. Idempotent. */
export function dailyJob(w: World, now: Date) {
  const date = sastDate(now);
  const out = { reminders: 0, nudges: 0, draws: 0, circleCup: [] as string[], campusCup: [] as string[] };
  const until = new Date(now.getTime() + 24 * 3600_000).toISOString();

  // 0) make sure this week has a challenge, then draw last week's prize winners
  ensureWeeklyChallenge(w, now);
  const drawn = runWeeklyDraw(w, now);
  out.draws = drawn.length;

  // 1) in-app reminders for sessions and bookings in the next 24 hours
  for (const s of w.sessions) {
    if (s.cancelled || s.startsAt < now.toISOString() || s.startsAt > until) continue;
    for (const [k, v] of Object.entries(w.rsvps)) {
      const [sid, uid2] = k.split(':');
      if (sid === s.id && v === 'going' && !w.users[uid2]?.sim && notify(w, uid2, { kind: 'reminder', title: `Coming up: ${s.title}`, body: fmtWhen(s.startsAt), href: '/calendar', key: `session-${s.id}` }, now)) out.reminders++;
    }
  }
  for (const b of w.bookings) {
    const e = w.events.find((x) => x.id === b.eventId);
    if (!e || b.status !== 'booked' || e.startsAt < now.toISOString() || e.startsAt > until || w.users[b.userId]?.sim) continue;
    if (notify(w, b.userId, { kind: 'reminder', title: `Tomorrow: ${e.title}`, body: `${fmtWhen(e.startsAt)}. Your ticket is ready.`, href: `/tickets/${b.id}`, key: `booking-${b.id}` }, now)) out.reminders++;
  }

  // 2) smart reminders: on reminder days, if this week's target isn't hit, max 3 a week
  for (const u of Object.values(w.users)) {
    if (u.sim || !u.onboardedAt || !u.reminderEnabled || !u.reminderDays.includes(isoWeekday(date))) continue;
    const wk = weeklyFor(w, u.id, now);
    const sentThisWeek = w.notifications.filter((n) => n.userId === u.id && n.kind === 'nudge' && isoWeekKey(sastDate(new Date(n.at))) === wk.thisWeek.weekKey).length;
    if (wk.thisWeek.hit || sentThisWeek >= 3) continue;
    const lines = ['2 minutes for your next lesson?', 'A tiny step today keeps your week on track.', 'One small action today. You have got this.'];
    if (notify(w, u.id, { kind: 'nudge', title: 'Sisi', body: lines[sentThisWeek % lines.length], href: '/home', key: `nudge-${date}` }, now)) out.nudges++;
  }

  // 3) Circle Cup on the 1st (SAST), for the previous month
  if (date.endsWith('-01')) {
    const month = previousMonth(date);
    for (const c of w.communities) {
      const rows = circlesOf(w, c.id).map((circle) => {
        const ids = w.circleMembers.filter((m) => m.circleId === circle.id).map((m) => m.userId);
        const total = ids.reduce((a, u) => a + pointsIn(w, u, c.id, month.from, month.to), 0);
        return { id: circle.id, name: circle.name, ids, score: ids.length ? total / ids.length : 0, challengeCompletions: w.challengeDone.filter((d) => ids.includes(d.userId) && d.at >= month.from && d.at < month.to).length };
      });
      const win = pickWinner(rows);
      if (!win || win.score <= 0) continue;
      for (const userId of win.ids) {
        award(w, { userId, source: 'circle_cup', sourceId: `${c.id}-${month.key}`, points: 0, communityId: c.id, now });
        notify(w, userId, { kind: 'cup', title: 'Your Circle won the Circle Cup!', body: `${win.name} was top in ${c.name} for the month.`, href: '/rewards', key: `cup-${c.id}-${month.key}` }, now);
        evaluateBadges(w, userId, now);
      }
      out.circleCup.push(`${c.name}: ${win.name}`);
    }
  }

  // 4) Campus Cup at season end
  for (const s of w.seasons) {
    if (s.awardedAt || s.endsOn >= date) continue;
    const board = campusBoard(w, s, new Date(`${s.endsOn}T23:00:00+02:00`));
    const win = board[0];
    if (win && win.points > 0) {
      for (const m of w.communityMembers.filter((x) => x.communityId === win.id && x.status === 'active')) {
        award(w, { userId: m.userId, source: 'campus_cup', sourceId: s.id, points: 0, now });
        notify(w, m.userId, { kind: 'cup', title: 'Your community won the Campus Cup!', body: `${win.name} won ${s.name}.`, href: '/rewards', key: `campus-${s.id}` }, now);
        evaluateBadges(w, m.userId, now);
      }
      out.campusCup.push(`${s.name}: ${win.name}`);
    }
    s.awardedAt = now.toISOString();
  }
  return out;
}

/** Moves the demo clock forward day by day, running simulated activity and the daily job at each step. */
export function advanceClock(w: World, ms: number) {
  const step = 24 * 3600_000;
  let remaining = ms;
  const log: ReturnType<typeof dailyJob>[] = [];
  while (remaining > 0) {
    const d = Math.min(step, remaining);
    w.clockOffsetMs += d;
    remaining -= d;
    const now = new Date(Date.now() + w.clockOffsetMs);
    simulateDay(w, now);
    log.push(dailyJob(w, now));
  }
  return log;
}
