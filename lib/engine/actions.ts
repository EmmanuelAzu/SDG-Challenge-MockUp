import type { Earned, EarnedBadge, User, World } from '@/lib/world/types';
import { assignTrack, type QuizAnswers } from '@/lib/content/life-tracks';
import { badgeBySlug, glossaryBySlug, lessonById } from '@/lib/content';
import { award, xpOf } from './award';
import { evaluateBadges } from './badges';
import { notify, track, uid } from './helpers';
import { lessonKey, syncMilestones } from './milestones';
import { FEEDBACK_PER_WEEK, POINTS } from './points';
import { syncBuddy } from './buddy';
import { postMilestones } from './feed';
import { levelFor } from './levels';
import { checkWeeklyTarget, weeklyFor } from './weeklyTarget';

export const DEFAULT_REMINDER_DAYS: Record<number, number[]> = { 1: [3], 2: [2, 4], 3: [1, 3, 5] };
const COLORS = ['#D81B60', '#7E57C2', '#0F7B5F', '#F2B33D', '#AD1457', '#F48FB1'];

/** Call after any point-earning action: weekly target bonus, milestones, badges. */
export function afterEarn(w: World, userId: string, now: Date): { badges: EarnedBadge[]; milestones: string[] } {
  checkWeeklyTarget(w, userId, now);
  const milestones = syncMilestones(w, userId, now);
  syncBuddy(w, userId, now);
  const badges = evaluateBadges(w, userId, now);
  return { badges, milestones };
}

/** Runs a mutation and reports what it earned (points delta, badges, milestones), and shares milestones with the community feed if the user opted in. */
export function earning(w: World, userId: string, now: Date, fn: () => void): Earned {
  const before = xpOf(w, userId);
  const levelBefore = levelFor(before).name;
  const wtBefore = w.pointEvents.filter((p) => p.userId === userId && p.source === 'weekly_target').length;
  fn();
  const e = afterEarn(w, userId, now);
  const after = xpOf(w, userId);
  const levelAfter = levelFor(after).name;
  const weeklyHit = w.pointEvents.filter((p) => p.userId === userId && p.source === 'weekly_target').length > wtBefore;
  postMilestones(w, userId, { badges: e.badges, milestones: e.milestones, level: levelAfter !== levelBefore ? levelAfter : null, weeklyStreak: weeklyHit ? weeklyFor(w, userId, now).streakWeeks : null }, now);
  return { ...e, points: after - before };
}

export function startLesson(w: World, userId: string, lessonId: string, now: Date) {
  const k = lessonKey(userId, lessonId);
  if (!w.lessonProgress[k]) {
    w.lessonProgress[k] = { status: 'started', quizScore: null, startedAt: now.toISOString(), completedAt: null };
    track(w, userId, 'lesson_started', { lesson: lessonId }, now);
  }
}

/** Cards finished: lesson counts as complete (+10, once). */
export function completeLesson(w: World, userId: string, lessonId: string, now: Date): Earned {
  return earning(w, userId, now, () => {
    startLesson(w, userId, lessonId, now);
    const p = w.lessonProgress[lessonKey(userId, lessonId)];
    if (p.status === 'started') p.status = 'completed';
    p.completedAt ??= now.toISOString();
    award(w, { userId, source: 'lesson', sourceId: lessonId, now });
    track(w, userId, 'lesson_completed', { lesson: lessonId }, now);
  });
}

/** Pass = at least min(2, n) correct. Unlimited retries; points only on first pass. */
export function submitQuiz(w: World, userId: string, lessonId: string, answers: number[], now: Date): Earned & { passed: boolean; correct: number; total: number } {
  const lesson = lessonById(lessonId);
  if (!lesson || lesson.quiz.length !== answers.length) throw new Error('Answer every question first');
  const correct = lesson.quiz.filter((q, i) => q.correct === answers[i]).length;
  const passed = correct >= Math.min(2, lesson.quiz.length);
  const e = earning(w, userId, now, () => {
    startLesson(w, userId, lessonId, now);
    const p = w.lessonProgress[lessonKey(userId, lessonId)];
    p.quizScore = Math.round((correct / lesson.quiz.length) * 100);
    p.completedAt ??= now.toISOString();
    if (passed) {
      p.status = 'passed';
      award(w, { userId, source: 'quiz', sourceId: lessonId, now });
    } else if (p.status === 'started') p.status = 'completed';
    track(w, userId, 'quiz_submitted', { lesson: lessonId, correct, passed }, now);
  });
  return { ...e, passed, correct, total: lesson.quiz.length };
}

export function completeAction(w: World, userId: string, lessonId: string, status: 'done' | 'skipped', now: Date): Earned {
  const lesson = lessonById(lessonId);
  if (!lesson) throw new Error('Lesson not found');
  return earning(w, userId, now, () => {
    w.actionCompletions[`${userId}:${lesson.action.id}`] = { status, at: now.toISOString() };
    if (status === 'done') {
      award(w, { userId, source: 'action', sourceId: lesson.action.id, now });
      track(w, userId, 'action_done', { lesson: lessonId }, now);
    }
  });
}

/** Opening a glossary term counts toward Word Wise (10 distinct). */
export function recordLookup(w: World, userId: string, termSlug: string, now: Date): Earned {
  return earning(w, userId, now, () => {
    if (!glossaryBySlug(termSlug)) return;
    const list = (w.glossaryLookups[userId] ??= []);
    if (!list.includes(termSlug)) list.push(termSlug);
  });
}

function feedbackAward(w: World, userId: string, sourceId: string, now: Date) {
  const since = now.getTime() - 7 * 86400_000;
  const recent = w.pointEvents.filter((p) => p.userId === userId && p.source === 'feedback' && new Date(p.at).getTime() >= since).length;
  return recent >= FEEDBACK_PER_WEEK ? 0 : award(w, { userId, source: 'feedback', sourceId, now });
}

export function submitFeedback(w: World, userId: string, lessonId: string, rating: number, text: string, now: Date): number {
  const i = w.feedback.findIndex((f) => f.userId === userId && f.lessonId === lessonId);
  const row = { userId, lessonId, rating, text: text.trim().slice(0, 300), at: now.toISOString() };
  if (i >= 0) w.feedback[i] = row; else w.feedback.push(row);
  track(w, userId, 'lesson_rated', { lesson: lessonId, rating }, now);
  return feedbackAward(w, userId, `lesson-${lessonId}`, now);
}

export function suggestTopic(w: World, userId: string, body: string, now: Date): number {
  const text = body.trim().slice(0, 200);
  if (text.length < 3) return 0;
  const id = uid('t');
  w.topicSuggestions.push({ id, userId, body: text, voters: [userId], at: now.toISOString() });
  return feedbackAward(w, userId, `suggest-${id}`, now);
}

export function voteTopic(w: World, userId: string, id: string) {
  const t = w.topicSuggestions.find((x) => x.id === id);
  if (t && !t.voters.includes(userId)) t.voters.push(userId);
}

export function joinCommunity(w: World, userId: string, communityId: string, now: Date) {
  const c = w.communities.find((x) => x.id === communityId);
  if (!c || w.communityMembers.some((m) => m.communityId === communityId && m.userId === userId)) return;
  w.communityMembers.push({ communityId, userId, role: 'member', status: c.requiresApproval ? 'pending' : 'active', joinedAt: now.toISOString(), agreedAt: null });
}

export type OnboardingInput = { displayName: string; nickname: string; communityId: string | null; joinCode?: string; quiz: QuizAnswers; confidence: number[]; };

export function completeOnboarding(w: World, userId: string, input: OnboardingInput, now: Date): Earned & { track: string } {
  const u = w.users[userId];
  const plan = assignTrack(input.quiz);
  const first = !u.onboardedAt;
  let communityId = input.communityId;
  if (input.joinCode) communityId = w.communities.find((c) => c.joinCode.toLowerCase() === input.joinCode!.trim().toLowerCase())?.id ?? communityId;
  if (communityId) joinCommunity(w, userId, communityId, now);

  Object.assign(u, {
    displayName: input.displayName.trim(), nickname: input.nickname.trim(), goals: [input.quiz.goal], lifeTrack: plan.track,
    weeklyTarget: plan.weeklyTarget, reminderDays: DEFAULT_REMINDER_DAYS[plan.weeklyTarget], consentedAt: now.toISOString(), onboardedAt: u.onboardedAt ?? now.toISOString(),
  } satisfies Partial<User>);
  if (first) w.surveys.push({ userId, kind: 'pre', answers: input.confidence, at: now.toISOString() });

  const e = earning(w, userId, now, () => { award(w, { userId, source: 'onboarding', sourceId: 'onboarding', now }); });
  if (first && u.referredBy && w.users[u.referredBy]) {
    const ref = u.referredBy;
    notify(w, ref, { kind: 'referral', title: 'A friend joined Sisi', body: `${u.displayName} joined through your link.`, href: '/rewards', key: `ref-${userId}` }, now);
    evaluateBadges(w, ref, now);
  }
  track(w, userId, 'onboarding_completed', { track: plan.track, target: plan.weeklyTarget }, now);
  return { ...e, track: plan.track };
}

export function createAccount(w: World, o: { email: string; password: string; displayName: string; ref?: string | null }, now: Date): { ok: true; id: string } | { ok: false; error: string } {
  const email = o.email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: 'Enter a valid email address.' };
  if (o.password.length < 8) return { ok: false, error: 'Use at least 8 characters for your password.' };
  if (Object.values(w.users).some((u) => u.email === email)) return { ok: false, error: 'That email already has an account. Try signing in.' };
  const id = uid('u');
  const refUser = o.ref ? Object.values(w.users).find((u) => u.referralCode === o.ref) : undefined;
  w.users[id] = {
    id, email, password: o.password, displayName: o.displayName.trim(), nickname: '', role: 'member', color: COLORS[Object.keys(w.users).length % COLORS.length],
    lifeTrack: null, weeklyTarget: 2, focusMode: false, shareMilestones: false, showOnLeaderboard: false, shareNameMode: 'first', goals: [],
    reminderDays: [2, 4], reminderEnabled: false, consentedAt: null, onboardedAt: null, referralCode: Math.random().toString(36).slice(2, 10), referredBy: refUser?.id ?? null, createdAt: now.toISOString(),
  };
  return { ok: true, id };
}

export function signIn(w: World, email: string, password: string): string | null {
  const u = Object.values(w.users).find((x) => !x.sim && x.email === email.trim().toLowerCase());
  return u && u.password === password ? u.id : null;
}

export type Settings = Pick<User, 'nickname' | 'shareNameMode' | 'showOnLeaderboard' | 'weeklyTarget' | 'focusMode' | 'lifeTrack' | 'shareMilestones' | 'reminderDays' | 'reminderEnabled'>;
export function saveSettings(w: World, userId: string, s: Settings) {
  const u = w.users[userId];
  Object.assign(u, s, { shareNameMode: s.shareNameMode === 'nickname' && !s.nickname.trim() ? 'first' : s.shareNameMode });
}

/** Creates (or reuses) a share link for one of the user's badges. Sharing never earns points. */
export function createShare(w: World, userId: string, badgeId: string, now: Date): string | null {
  const ub = w.userBadges.find((b) => b.id === badgeId && b.userId === userId);
  if (!ub) return null;
  const existing = w.shares.find((s) => s.badgeId === badgeId && !s.revoked);
  if (existing) return existing.code;
  const code = uid('s');
  w.shares.push({ code, userId, badgeId, at: now.toISOString(), revoked: false });
  track(w, userId, 'share_clicked', { badge: ub.slug }, now);
  return code;
}

export const badgeInfo = (slug: string) => badgeBySlug(slug);
export { POINTS };
