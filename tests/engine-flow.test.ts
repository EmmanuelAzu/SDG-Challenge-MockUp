import { describe, expect, it } from 'vitest';
import { buildWorld } from '@/lib/world/seed';
import { award, xpOf } from '@/lib/engine/award';
import { completeAction, completeLesson, completeOnboarding, createAccount, recordLookup, signIn, submitFeedback, submitQuiz } from '@/lib/engine/actions';
import { getJourney } from '@/lib/engine/journey';
import { weeklyFor } from '@/lib/engine/weeklyTarget';
import { levelFor } from '@/lib/engine/levels';
import { COURSES } from '@/lib/content';

// a Wednesday, so "this week" has room before and after
const NOW = new Date('2026-10-07T10:00:00Z');
const quiz = { source: 'allowance', goal: 'budget', timeframe: 'month', obligations: 'none', checkins: 1 } as const;
const confidence = [2, 2, 2, 2, 2];

function newUser(w = buildWorld(NOW), ref: string | null = null) {
  const r = createAccount(w, { email: 'sam@example.com', password: 'longenough', displayName: 'Sam', ref }, NOW);
  if (!r.ok) throw new Error(r.error);
  return { w, id: r.id };
}

describe('accounts', () => {
  it('creates and signs in', () => {
    const { w, id } = newUser();
    expect(signIn(w, 'SAM@example.com', 'longenough')).toBe(id);
    expect(signIn(w, 'sam@example.com', 'wrong')).toBeNull();
  });
  it('rejects bad input and duplicates', () => {
    const w = buildWorld(NOW);
    expect(createAccount(w, { email: 'nope', password: 'longenough', displayName: 'x' }, NOW).ok).toBe(false);
    expect(createAccount(w, { email: 'a@b.co', password: 'short', displayName: 'x' }, NOW).ok).toBe(false);
    expect(createAccount(w, { email: 'nomsa@demo.sisi.app', password: 'longenough', displayName: 'x' }, NOW).ok).toBe(false);
  });
  it('demo personas sign in with the demo password', () => expect(signIn(buildWorld(NOW), 'nomsa@demo.sisi.app', 'SisiDemo2026!')).toBe('u-nomsa'));
});

describe('onboarding', () => {
  it('lands with Started + Founding Member, >= 10 points, a track and a target', () => {
    const { w, id } = newUser();
    const comm = w.communities[0].id;
    const e = completeOnboarding(w, id, { displayName: 'Sam', nickname: 'S', communityId: comm, quiz, confidence }, NOW);
    expect(e.badges.map((b) => b.slug).sort()).toEqual(['founding-member', 'started']);
    expect(xpOf(w, id)).toBeGreaterThanOrEqual(10);
    expect(w.users[id].lifeTrack).toBe('student');
    expect(w.users[id].weeklyTarget).toBe(1);
    expect(w.communityMembers.some((m) => m.userId === id && m.communityId === comm)).toBe(true);
    expect(w.surveys.some((s) => s.userId === id && s.kind === 'pre')).toBe(true);
  });
  it('joins by code', () => {
    const { w, id } = newUser();
    completeOnboarding(w, id, { displayName: 'Sam', nickname: '', communityId: null, joinCode: 'wits26', quiz, confidence }, NOW);
    expect(w.communityMembers.some((m) => m.userId === id && m.communityId === 'comm-wits')).toBe(true);
  });
  it('a referral earns the inviter Hype Girl once the friend finishes onboarding', () => {
    const w = buildWorld(NOW);
    const code = w.users['u-nomsa'].referralCode;
    const { id } = newUser(w, code);
    expect(w.users[id].referredBy).toBe('u-nomsa');
    expect(w.userBadges.some((b) => b.userId === 'u-nomsa' && b.slug === 'hype-girl')).toBe(false);
    completeOnboarding(w, id, { displayName: 'Sam', nickname: '', communityId: null, quiz, confidence }, NOW);
    expect(w.userBadges.some((b) => b.userId === 'u-nomsa' && b.slug === 'hype-girl')).toBe(true);
    expect(w.notifications.some((n) => n.userId === 'u-nomsa' && n.kind === 'referral')).toBe(true);
  });
});

describe('points', () => {
  it('awards once per (user, source, id)', () => {
    const w = buildWorld(NOW);
    expect(award(w, { userId: 'u-new', source: 'lesson', sourceId: 'x', now: NOW })).toBe(10);
    expect(award(w, { userId: 'u-new', source: 'lesson', sourceId: 'x', now: NOW })).toBe(0);
    expect(xpOf(w, 'u-new')).toBe(10);
  });
});

describe('lesson → quiz → action', () => {
  const [l1, l2] = COURSES[0].lessons;
  it('awards 10 + 5 + 15 and a First Lesson badge, and +25 when the weekly target is hit', () => {
    const { w, id } = newUser();
    completeOnboarding(w, id, { displayName: 'Sam', nickname: '', communityId: null, quiz, confidence }, NOW); // target = 1 day
    const before = xpOf(w, id);
    const a = completeLesson(w, id, l1.slug, NOW);
    expect(a.badges.map((b) => b.slug)).toContain('first-lesson');
    const q = submitQuiz(w, id, l1.slug, l1.quiz.map((x) => x.correct), NOW);
    expect(q.passed).toBe(true);
    const c = completeAction(w, id, l1.slug, 'done', NOW);
    expect(c.points).toBe(15);
    expect(xpOf(w, id) - before).toBe(10 + 5 + 15 + 25); // + weekly target bonus
    expect(weeklyFor(w, id, NOW).thisWeek.hit).toBe(true);
  });
  it('a failed quiz earns nothing and can be retried; points only on first pass', () => {
    const { w, id } = newUser();
    completeLesson(w, id, l1.slug, NOW);
    const wrong = l1.quiz.map((x) => (x.correct + 1) % x.options.length);
    expect(submitQuiz(w, id, l1.slug, wrong, NOW)).toMatchObject({ passed: false, points: 0 });
    expect(submitQuiz(w, id, l1.slug, l1.quiz.map((x) => x.correct), NOW)).toMatchObject({ passed: true, points: 5 });
    expect(submitQuiz(w, id, l1.slug, l1.quiz.map((x) => x.correct), NOW).points).toBe(0);
  });
  it('2 of 3 is a pass', () => {
    const { w, id } = newUser();
    completeLesson(w, id, l1.slug, NOW);
    const answers = l1.quiz.map((x, i) => (i === 0 ? (x.correct + 1) % x.options.length : x.correct));
    expect(submitQuiz(w, id, l1.slug, answers, NOW)).toMatchObject({ passed: true, correct: 2 });
  });
  it('finishing both lessons and actions completes the milestone', () => {
    const { w, id } = newUser();
    for (const l of [l1, l2]) {
      completeLesson(w, id, l.slug, NOW);
      submitQuiz(w, id, l.slug, l.quiz.map((x) => x.correct), NOW);
      const e = completeAction(w, id, l.slug, 'done', NOW);
      if (l === l2) expect(e.milestones).toEqual(['Cash-flow check']);
    }
    expect(getJourney(w, id).doneCount).toBe(1);
  });
  it('skipping an action keeps it on the list and awards nothing', () => {
    const { w, id } = newUser();
    completeLesson(w, id, l1.slug, NOW);
    submitQuiz(w, id, l1.slug, l1.quiz.map((x) => x.correct), NOW);
    expect(completeAction(w, id, l1.slug, 'skipped', NOW).points).toBe(0);
    expect(getJourney(w, id).next?.kind).toBe('action');
  });
});

describe('journey', () => {
  it('follows the Life Track order', () => {
    const { w, id } = newUser();
    completeOnboarding(w, id, { displayName: 'Sam', nickname: '', communityId: null, quiz: { ...quiz, goal: 'investing' }, confidence }, NOW);
    expect(w.users[id].lifeTrack).toBe('invest-small');
    expect(getJourney(w, id).next?.href).toContain('why-start-small');
  });
});

describe('feedback and glossary', () => {
  it('rating earns 5, capped at 5 awards a week', () => {
    const { w, id } = newUser();
    const lessons = COURSES.flatMap((c) => c.lessons).slice(0, 7);
    const pts = lessons.map((l) => submitFeedback(w, id, l.slug, 5, '', NOW));
    expect(pts).toEqual([5, 5, 5, 5, 5, 0, 0]);
  });
  it('ten distinct terms earn Word Wise', () => {
    const { w, id } = newUser();
    const slugs = ['compound-interest', 'tfsa', 'unit-trust', 'etf', 'paye', 'uif', 'gross-pay', 'net-pay', 'inflation', 'emergency-fund'];
    let got: string[] = [];
    slugs.forEach((s) => { got = got.concat(recordLookup(w, id, s, NOW).badges.map((b) => b.slug)); });
    expect(got).toContain('plain-talker');
  });
});

describe('seeded Nomsa', () => {
  it('is mid-journey: level Bud, 4-week streak, 3 badges, milestone 1', () => {
    const w = buildWorld(NOW);
    expect(levelFor(xpOf(w, 'u-nomsa')).name).toBe('Bud');
    expect(weeklyFor(w, 'u-nomsa', NOW).streakWeeks).toBe(4);
    expect(w.userBadges.filter((b) => b.userId === 'u-nomsa')).toHaveLength(3);
    expect(getJourney(w, 'u-nomsa').doneCount).toBe(1);
  });
});
