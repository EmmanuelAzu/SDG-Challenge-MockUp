import { describe, expect, it } from 'vitest';
import { weeklyProgress } from '@/lib/engine/weekly';
import { levelFor } from '@/lib/engine/levels';
import { qualifyingBadges, type Stats } from '@/lib/engine/rules';

const base: Stats = { onboarded: false, lessons: 0, perfectQuizzes: 0, milestones: [], investDone: false, streakWeeks: 0, sessionsAttended: 0, eventCheckins: 0, buddyJoint: false, referrals: 0, oweekDone: false, circleCup: false, campusCup: false, actionWeeks: 0, payslipDone: false, goalReached: false, glossaryTerms: 0 };

// 2026-10-05 is a Monday (ISO week 41)
describe('weekly target mode', () => {
  it('counts distinct active days, not events', () => {
    const w = weeklyProgress(['2026-10-05', '2026-10-05', '2026-10-06'], 2, '2026-10-07');
    expect(w.thisWeek.days).toBe(2);
    expect(w.thisWeek.hit).toBe(true);
  });
  it('a missed day inside the week costs nothing', () => {
    const w = weeklyProgress(['2026-10-05', '2026-10-09'], 2, '2026-10-11'); // Mon + Fri, nothing between
    expect(w.thisWeek.hit).toBe(true);
    expect(w.streakWeeks).toBe(1);
  });
  it('an in-progress week does not break a running streak', () => {
    const w = weeklyProgress(['2026-09-21', '2026-09-22', '2026-09-28', '2026-09-29', '2026-10-05'], 2, '2026-10-06');
    expect(w.thisWeek.hit).toBe(false);
    expect(w.streakWeeks).toBe(2);
  });
  it('hitting this week extends the streak', () => {
    const w = weeklyProgress(['2026-09-28', '2026-09-29', '2026-10-05', '2026-10-06'], 2, '2026-10-06');
    expect(w.streakWeeks).toBe(2);
  });
  it('a whole missed week ends the streak', () => {
    const w = weeklyProgress(['2026-09-14', '2026-09-15', '2026-10-05', '2026-10-06'], 2, '2026-10-06');
    expect(w.streakWeeks).toBe(1);
  });
  it('target of 1 is met by a single day', () => expect(weeklyProgress(['2026-10-07'], 1, '2026-10-08').thisWeek.hit).toBe(true));
  it('returns 12 weeks of history ending now', () => {
    const w = weeklyProgress([], 2, '2026-10-06');
    expect(w.history).toHaveLength(12);
    expect(w.history[11].weekKey).toBe('2026-W41');
  });
});

describe('levels', () => {
  it('maps XP to the spec thresholds', () => {
    expect(levelFor(0).name).toBe('Seed');
    expect(levelFor(149).name).toBe('Seed');
    expect(levelFor(150).name).toBe('Sprout');
    expect(levelFor(400).name).toBe('Bud');
    expect(levelFor(800).name).toBe('Bloom');
    expect(levelFor(1500).name).toBe('Blossom');
  });
  it('reports progress to the next level', () => {
    const l = levelFor(275);
    expect(l.next).toBe('Bud');
    expect(l.toNext).toBe(125);
    expect(l.progress).toBeCloseTo(0.5);
  });
  it('tops out at Blossom', () => expect(levelFor(9999).next).toBeNull());
});

describe('badge rules', () => {
  it('nothing for a blank user', () => expect(qualifyingBadges(base)).toEqual([]));
  it('onboarding earns Started + Founding Member', () => expect(qualifyingBadges({ ...base, onboarded: true })).toEqual(['started', 'founding-member']));
  it('wealth builder needs all five milestones', () => {
    const four = ['cash-flow-check', 'first-budget', 'saving-habit', 'investing-readiness'];
    expect(qualifyingBadges({ ...base, milestones: four })).not.toContain('wealth-builder');
    expect(qualifyingBadges({ ...base, milestones: [...four, 'wealth-milestone'] })).toContain('wealth-builder');
  });
  it('weekly streak badges', () => {
    expect(qualifyingBadges({ ...base, streakWeeks: 2 })).not.toContain('glow-3w');
    expect(qualifyingBadges({ ...base, streakWeeks: 3 })).toContain('glow-3w');
    expect(qualifyingBadges({ ...base, streakWeeks: 12 })).toContain('bloom-12w');
  });
  it('new tool badges', () => {
    const q = qualifyingBadges({ ...base, payslipDone: true, goalReached: true, glossaryTerms: 10, campusCup: true });
    expect(q).toEqual(expect.arrayContaining(['payslip-pro', 'goal-getter', 'plain-talker', 'campus-cup-champion']));
  });
});
