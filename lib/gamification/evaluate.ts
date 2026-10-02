import { adminClient } from '@/lib/supabase/admin';
import { sastDate, isoWeekKey } from '@/lib/time';
import { awardPoints } from './award';
import { weeklyProgress, type WeeklyProgress } from './weekly';
import { NON_ACTIVITY_SOURCES } from './points';
import { qualifyingBadges, type Stats } from './rules';

export type EarnedBadge = { id: string; slug: string; name: string; meaning_line: string | null; rarity: string };
export type Earned = { badges: EarnedBadge[]; milestones: string[] };

async function gatherStats(userId: string): Promise<Stats> {
  const db = adminClient();
  const [profile, progress, ms, weekly, att, bk, buddy, refs, flags, actions, gloss] = await Promise.all([
    db.from('profiles').select('onboarded_at').eq('id', userId).single(),
    db.from('lesson_progress').select('quiz_score,completed_at').eq('user_id', userId).not('completed_at', 'is', null),
    db.from('user_milestones').select('milestones(slug)').eq('user_id', userId),
    getWeekly(userId),
    db.from('session_attendance').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    db.from('bookings').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'checked_in'),
    db.from('point_events').select('id').eq('user_id', userId).eq('source', 'buddy_joint').limit(1),
    db.from('profiles').select('*', { count: 'exact', head: true }).eq('referred_by', userId).not('onboarded_at', 'is', null),
    db.from('point_events').select('source').eq('user_id', userId).in('source', ['invest_done', 'oweek_done', 'circle_cup', 'campus_cup', 'payslip_done', 'goal_reached']),
    db.from('point_events').select('created_at').eq('user_id', userId).eq('source', 'action'),
    db.from('glossary_lookups').select('*', { count: 'exact', head: true }).eq('user_id', userId),
  ]);
  const sources = new Set((flags.data ?? []).map((r) => r.source));
  const weeks = new Set((actions.data ?? []).map((r) => isoWeekKey(sastDate(new Date(r.created_at)))));
  return {
    onboarded: !!profile.data?.onboarded_at,
    lessons: progress.data?.length ?? 0,
    perfectQuizzes: (progress.data ?? []).filter((r) => r.quiz_score === 100).length,
    milestones: (ms.data ?? []).map((r: any) => r.milestones?.slug).filter(Boolean),
    investDone: sources.has('invest_done'),
    streakWeeks: weekly.streakWeeks,
    sessionsAttended: att.count ?? 0,
    eventCheckins: bk.count ?? 0,
    buddyJoint: (buddy.data?.length ?? 0) > 0,
    referrals: refs.count ?? 0,
    oweekDone: sources.has('oweek_done'),
    circleCup: sources.has('circle_cup'),
    campusCup: sources.has('campus_cup'),
    payslipDone: sources.has('payslip_done'),
    goalReached: sources.has('goal_reached'),
    glossaryTerms: gloss.count ?? 0,
    actionWeeks: weeks.size,
  };
}

/** Awards any badges the user now qualifies for; returns only the newly earned ones. */
export async function evaluateBadges(userId: string): Promise<EarnedBadge[]> {
  const db = adminClient();
  const qualifying = qualifyingBadges(await gatherStats(userId));
  const { data: have } = await db.from('user_badges').select('badge_slug').eq('user_id', userId);
  const owned = new Set((have ?? []).map((r) => r.badge_slug));
  const fresh = qualifying.filter((s) => !owned.has(s));
  if (!fresh.length) return [];
  const { data: rows } = await db
    .from('user_badges')
    .upsert(fresh.map((badge_slug) => ({ user_id: userId, badge_slug })), { onConflict: 'user_id,badge_slug', ignoreDuplicates: true })
    .select('id,badge_slug,badges(name,meaning_line,rarity)');
  return (rows ?? []).map((r: any) => ({ id: r.id, slug: r.badge_slug, name: r.badges.name, meaning_line: r.badges.meaning_line, rarity: r.badges.rarity }));
}

/** Reads this user's weekly-target progress from their effort activity (SAST days with points). */
export async function getWeekly(userId: string): Promise<WeeklyProgress> {
  const db = adminClient();
  const [{ data: prof }, { data: ev }] = await Promise.all([
    db.from('profiles').select('weekly_target').eq('id', userId).single(),
    db.from('point_events').select('created_at,source').eq('user_id', userId).gte('created_at', new Date(Date.now() - 13 * 7 * 86400_000).toISOString()),
  ]);
  const skip = new Set<string>(NON_ACTIVITY_SOURCES);
  const dates = (ev ?? []).filter((e) => !skip.has(e.source)).map((e) => sastDate(new Date(e.created_at)));
  return weeklyProgress(dates, prof?.weekly_target ?? 2, sastDate());
}

/** Awards the weekly-target bonus (+25, once per ISO week) when this week's target is met. */
export async function checkWeeklyTarget(userId: string): Promise<WeeklyProgress> {
  const w = await getWeekly(userId);
  if (w.thisWeek.hit) await awardPoints({ userId, source: 'weekly_target', sourceId: w.thisWeek.weekKey });
  return w;
}

/** A milestone is complete when all its course lessons are completed and all their actions are done. */
export async function syncMilestones(userId: string): Promise<string[]> {
  const db = adminClient();
  const [{ data: milestones }, { data: done }] = await Promise.all([
    db.from('milestones').select('id,slug,title,courses(lessons(id,actions(id)))'),
    db.from('user_milestones').select('milestone_id').eq('user_id', userId),
  ]);
  const have = new Set((done ?? []).map((r) => r.milestone_id));
  const [{ data: lp }, { data: ac }] = await Promise.all([
    db.from('lesson_progress').select('lesson_id').eq('user_id', userId).not('completed_at', 'is', null),
    db.from('action_completions').select('action_id').eq('user_id', userId).eq('status', 'done'),
  ]);
  const lessonsDone = new Set((lp ?? []).map((r) => r.lesson_id));
  const actionsDone = new Set((ac ?? []).map((r) => r.action_id));
  const newly: string[] = [];
  for (const m of (milestones ?? []) as any[]) {
    if (have.has(m.id)) continue;
    const lessons = (m.courses ?? []).flatMap((c: any) => c.lessons ?? []);
    if (!lessons.length) continue;
    const ok = lessons.every((l: any) => lessonsDone.has(l.id) && (l.actions ?? []).every((a: any) => actionsDone.has(a.id)));
    if (ok) {
      await db.from('user_milestones').upsert({ user_id: userId, milestone_id: m.id }, { onConflict: 'user_id,milestone_id', ignoreDuplicates: true });
      newly.push(m.title);
    }
  }
  return newly;
}

/** Call after any point-earning action. */
export async function afterEarn(userId: string): Promise<Earned> {
  await checkWeeklyTarget(userId);
  const milestones = await syncMilestones(userId);
  const badges = await evaluateBadges(userId);
  return { badges, milestones };
}
