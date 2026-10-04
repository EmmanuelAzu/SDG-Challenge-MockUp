import type { BuddyItem, BuddyPair, BuddyPlan, World } from '@/lib/world/types';
import { LESSONS, MILESTONES, lessonsForMilestone } from '@/lib/content';
import { isoWeekKey, sastDate } from '@/lib/time';
import { award } from './award';
import { firstName, notify, uid } from './helpers';
import { weekStart } from './leaderboard';

export const NUDGES_PER_DAY = 1;
export const JOINT_WEEKS_NEEDED = 2;
export const SIM_BUDDY_ID = 'm-0';

export const pairOf = (w: World, userId: string): BuddyPair | undefined => w.buddies.find((p) => p.status !== 'ended' && (p.inviterId === userId || p.inviteeId === userId));
export const partnerId = (p: BuddyPair, userId: string) => (p.inviterId === userId ? p.inviteeId : p.inviterId);
export const weekKeyOf = (now: Date) => isoWeekKey(sastDate(now));

export function createInvite(w: World, userId: string, now: Date): { ok: true; pair: BuddyPair } | { ok: false; error: string } {
  if (pairOf(w, userId)) return { ok: false, error: 'You already have a Money Buddy invite or pairing. End it first to start a new one.' };
  const pair: BuddyPair = { id: uid('pair'), inviterId: userId, inviteeId: null, code: Math.random().toString(36).slice(2, 10), status: 'pending', sim: false, createdAt: now.toISOString(), plans: [], nudges: [], jointAt: null };
  w.buddies.push(pair);
  return { ok: true, pair };
}

export function acceptInvite(w: World, userId: string, code: string, now: Date): { ok: true; pair: BuddyPair } | { ok: false; error: string } {
  const pair = w.buddies.find((p) => p.code === code);
  if (!pair || pair.status !== 'pending') return { ok: false, error: 'This invite is no longer available.' };
  if (pair.inviterId === userId) return { ok: false, error: 'This is your own invite. Send it to a friend.' };
  if (pairOf(w, userId)) return { ok: false, error: 'You already have a Money Buddy. End that pairing first.' };
  pair.inviteeId = userId;
  pair.status = 'active';
  const ensure = ensureBuddyChannel(w, pair.id);
  w.messages.push({ id: uid('msg'), channelId: ensure.id, userId: null, body: `${firstName(w.users[userId].displayName)} and ${firstName(w.users[pair.inviterId].displayName)} are now Money Buddies. Plan your week together.`, replyTo: null, kind: 'system', pinned: false, deleted: false, at: now.toISOString() });
  notify(w, pair.inviterId, { kind: 'buddy', title: 'Your Money Buddy joined!', body: `${firstName(w.users[userId].displayName)} accepted your invite.`, href: '/pathways/buddy', key: `buddy-accepted-${pair.id}` }, now);
  currentPlan(w, pair, now);
  return { ok: true, pair };
}

/** Try the whole flow alone: pair with a simulated buddy (clearly labelled in the UI). */
export function startSimBuddy(w: World, userId: string, now: Date): { ok: true; pair: BuddyPair } | { ok: false; error: string } {
  const existing = pairOf(w, userId);
  if (existing && existing.status === 'active') return { ok: false, error: 'You already have a Money Buddy.' };
  if (existing) existing.status = 'ended'; // replace a pending invite
  const pair: BuddyPair = { id: uid('pair'), inviterId: userId, inviteeId: SIM_BUDDY_ID, code: Math.random().toString(36).slice(2, 10), status: 'active', sim: true, createdAt: now.toISOString(), plans: [], nudges: [], jointAt: null };
  w.buddies.push(pair);
  const ch = ensureBuddyChannel(w, pair.id);
  w.messages.push({ id: uid('msg'), channelId: ch.id, userId: SIM_BUDDY_ID, body: 'Hi! I am your practice Money Buddy. Ready to plan our week? 💪', replyTo: null, kind: 'user', pinned: false, deleted: false, at: now.toISOString() });
  currentPlan(w, pair, now);
  return { ok: true, pair };
}

export function endPair(w: World, userId: string, pairId: string) {
  const p = w.buddies.find((x) => x.id === pairId && (x.inviterId === userId || x.inviteeId === userId));
  if (p) p.status = 'ended';
}

export function ensureBuddyChannel(w: World, pairId: string) {
  let ch = w.channels.find((c) => c.kind === 'buddy' && c.refId === pairId);
  if (!ch) { ch = { id: `chan-${pairId}`, kind: 'buddy', refId: pairId }; w.channels.push(ch); }
  return ch;
}

const MANUAL: BuddyItem[] = [
  { id: 'm:win', title: 'Share one money win with your buddy', kind: 'manual' },
  { id: 'm:notes', title: 'Compare notes: what surprised you this week?', kind: 'manual' },
  { id: 'm:check', title: 'Check in with each other mid-week', kind: 'manual' },
];

/** Three actions for the week, auto-picked from the milestone the pair is working on. */
export function pickItems(w: World, pair: BuddyPair): BuddyItem[] {
  const humans = [pair.inviterId, pair.inviteeId].filter((id): id is string => !!id && !w.users[id]?.sim);
  const finished = (lessonId: string, actionId: string, userId: string) => w.lessonProgress[`${userId}:${lessonId}`]?.status === 'passed' && w.actionCompletions[`${userId}:${actionId}`]?.status === 'done';
  const items: BuddyItem[] = [];
  for (const m of MILESTONES) {
    for (const l of lessonsForMilestone(m.slug)) {
      const open = humans.some((u) => !w.actionCompletions[`${u}:${l.action.id}`] || w.actionCompletions[`${u}:${l.action.id}`].status !== 'done');
      if (open && items.length < 2 && !humans.every((u) => finished(l.id, l.action.id, u))) items.push({ id: `act:${l.id}`, title: l.action.title, kind: 'action', lessonId: l.id });
    }
    if (items.length >= 2) break;
  }
  for (const m of MANUAL) if (items.length < 3) items.push(m);
  return items.slice(0, 3);
}

export function currentPlan(w: World, pair: BuddyPair, now: Date): BuddyPlan {
  const weekKey = weekKeyOf(now);
  let plan = pair.plans.find((p) => p.weekKey === weekKey);
  if (!plan) { plan = { weekKey, weekStart: weekStart(now), items: pickItems(w, pair), done: {} }; pair.plans.push(plan); }
  return plan;
}

export function itemDone(w: World, plan: BuddyPlan, userId: string, item: BuddyItem): boolean {
  if (plan.done[userId]?.includes(item.id)) return true;
  if (item.kind === 'action' && item.lessonId && !w.users[userId]?.sim) {
    const lesson = LESSONS.find((l) => l.id === item.lessonId);
    const c = lesson && w.actionCompletions[`${userId}:${lesson.action.id}`];
    return !!c && c.status === 'done' && c.at >= plan.weekStart;
  }
  return false;
}
export const planProgress = (w: World, plan: BuddyPlan, userId: string) => ({ done: plan.items.filter((i) => itemDone(w, plan, userId, i)).length, total: plan.items.length });
export const userComplete = (w: World, plan: BuddyPlan, userId: string) => { const p = planProgress(w, plan, userId); return p.total > 0 && p.done === p.total; };
export const bothComplete = (w: World, plan: BuddyPlan, pair: BuddyPair) => !!pair.inviteeId && userComplete(w, plan, pair.inviterId) && userComplete(w, plan, pair.inviteeId);

/** Consecutive weeks both buddies finished the plan. The current week counts once complete; while in progress it never breaks the run. */
export function jointWeeks(w: World, pair: BuddyPair, now: Date): number {
  const keyAt = (i: number) => weekKeyOf(new Date(now.getTime() - i * 7 * 86400_000));
  const complete = (key: string) => { const p = pair.plans.find((x) => x.weekKey === key); return !!p && bothComplete(w, p, pair); };
  let i = complete(keyAt(0)) ? 0 : 1;
  let n = 0;
  while (complete(keyAt(i))) { n++; i++; }
  return n;
}

export function markManual(w: World, userId: string, pairId: string, itemId: string, now: Date) {
  const pair = w.buddies.find((p) => p.id === pairId && p.status === 'active' && (p.inviterId === userId || p.inviteeId === userId));
  if (!pair) return;
  const plan = currentPlan(w, pair, now);
  if (!plan.items.some((i) => i.id === itemId && i.kind === 'manual')) return;
  const list = (plan.done[userId] ??= []);
  if (!list.includes(itemId)) list.push(itemId);
  syncBuddy(w, userId, now);
}

export const nudgedToday = (pair: BuddyPair, userId: string, now: Date) => pair.nudges.some((n) => n.fromId === userId && sastDate(new Date(n.at)) === sastDate(now));

/** One nudge per buddy per day. */
export function nudge(w: World, userId: string, pairId: string, now: Date): { ok: true } | { ok: false; error: string } {
  const pair = w.buddies.find((p) => p.id === pairId && p.status === 'active' && (p.inviterId === userId || p.inviteeId === userId));
  const to = pair && partnerId(pair, userId);
  if (!pair || !to) return { ok: false, error: 'No active buddy to nudge.' };
  if (nudgedToday(pair, userId, now)) return { ok: false, error: 'You already nudged your buddy today. One a day keeps it friendly.' };
  pair.nudges.push({ fromId: userId, at: now.toISOString() });
  if (!w.users[to]?.sim) notify(w, to, { kind: 'buddy', title: `${firstName(w.users[userId].displayName)} nudged you`, body: 'A friendly nudge to do this week’s buddy plan.', href: '/pathways/buddy', key: `nudge-${pair.id}-${userId}-${sastDate(now)}` }, now);
  return { ok: true };
}

/** After any change: both finished the week → +20 each (once); two weeks running → Better Together + joint reward eligibility. */
export function syncBuddy(w: World, userId: string, now: Date) {
  const pair = pairOf(w, userId);
  if (!pair || pair.status !== 'active' || !pair.inviteeId) return;
  const plan = currentPlan(w, pair, now);
  if (bothComplete(w, plan, pair)) {
    for (const id of [pair.inviterId, pair.inviteeId]) {
      if (w.users[id]?.sim) continue;
      if (award(w, { userId: id, source: 'buddy', sourceId: `${pair.id}-${plan.weekKey}`, now }) > 0 && id !== userId) notify(w, id, { kind: 'buddy', title: 'You both finished the week 🎉', body: '+20 points for you and your buddy.', href: '/pathways/buddy', key: `buddy-week-${pair.id}-${plan.weekKey}` }, now);
    }
  }
  if (!pair.jointAt && jointWeeks(w, pair, now) >= JOINT_WEEKS_NEEDED) {
    pair.jointAt = now.toISOString();
    for (const id of [pair.inviterId, pair.inviteeId]) {
      if (w.users[id]?.sim) continue;
      award(w, { userId: id, source: 'buddy_joint', sourceId: pair.id, points: 0, now });
      notify(w, id, { kind: 'buddy', title: 'Better Together! 💗', body: 'Two weeks running with your buddy. You earned a badge and joint reward eligibility.', href: '/rewards', key: `buddy-joint-${pair.id}` }, now);
    }
  }
}

const SIM_REPLIES = ['Thanks for the nudge! On it 💪', 'Got you, doing mine now.', 'Ha, caught me! Almost done 🌸', 'Just finished one. Your turn!'];

/** A practice buddy answers a nudge: replies in the buddy chat and ticks off one of its own items. */
export function simRespond(w: World, userId: string, pairId: string, now: Date) {
  const pair = w.buddies.find((p) => p.id === pairId && p.status === 'active' && p.sim && p.inviterId === userId);
  if (!pair) return;
  const plan = currentPlan(w, pair, now);
  const list = (plan.done[SIM_BUDDY_ID] ??= []);
  const next = plan.items.find((i) => !list.includes(i.id));
  if (next) list.push(next.id);
  const ch = ensureBuddyChannel(w, pair.id);
  w.messages.push({ id: uid('msg'), channelId: ch.id, userId: SIM_BUDDY_ID, body: SIM_REPLIES[pair.nudges.length % SIM_REPLIES.length], replyTo: null, kind: 'user', pinned: false, deleted: false, at: now.toISOString() });
  syncBuddy(w, userId, now);
}
