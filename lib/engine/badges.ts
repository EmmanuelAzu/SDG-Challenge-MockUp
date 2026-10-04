import type { EarnedBadge, World } from '@/lib/world/types';
import { badgeBySlug } from '@/lib/content';
import { isoWeekKey, sastDate } from '@/lib/time';
import { uid } from './helpers';
import { qualifyingBadges, type Stats } from './rules';
import { weeklyFor } from './weeklyTarget';

export function statsFor(w: World, userId: string, now: Date): Stats {
  const u = w.users[userId];
  const mine = w.pointEvents.filter((p) => p.userId === userId);
  const has = (source: string) => mine.some((p) => p.source === source);
  const count = (source: string) => mine.filter((p) => p.source === source).length;
  const progress = Object.entries(w.lessonProgress).filter(([k, v]) => k.startsWith(`${userId}:`) && v.completedAt);
  const referrals = Object.values(w.users).filter((x) => x.referredBy === userId && x.onboardedAt).length;
  return {
    onboarded: !!u?.onboardedAt,
    lessons: progress.length,
    perfectQuizzes: progress.filter(([, v]) => v.quizScore === 100).length,
    milestones: Object.keys(w.milestonesDone[userId] ?? {}),
    investDone: has('invest_done'),
    streakWeeks: weeklyFor(w, userId, now).streakWeeks,
    sessionsAttended: count('session'),
    eventCheckins: count('event'),
    buddyJoint: has('buddy_joint'),
    referrals,
    oweekDone: has('oweek_done'),
    circleCup: has('circle_cup'),
    campusCup: has('campus_cup'),
    actionWeeks: new Set(mine.filter((p) => p.source === 'action').map((p) => isoWeekKey(sastDate(new Date(p.at))))).size,
    payslipDone: has('payslip_done'),
    goalReached: has('goal_reached'),
    glossaryTerms: (w.glossaryLookups[userId] ?? []).length,
  };
}

/** Grants any newly qualifying badges and returns only the new ones. */
export function evaluateBadges(w: World, userId: string, now: Date): EarnedBadge[] {
  const owned = new Set(w.userBadges.filter((b) => b.userId === userId).map((b) => b.slug));
  const fresh = qualifyingBadges(statsFor(w, userId, now)).filter((s) => !owned.has(s));
  return fresh.map((slug) => {
    const b = badgeBySlug(slug)!;
    const ub = { id: uid('ub'), userId, slug, earnedAt: now.toISOString() };
    w.userBadges.push(ub);
    return { id: ub.id, slug, name: b.name, meaning: b.meaning, rarity: b.rarity };
  });
}
