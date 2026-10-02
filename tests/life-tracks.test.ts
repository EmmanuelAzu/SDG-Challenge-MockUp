import { describe, expect, it } from 'vitest';
import { assignTrack, TRACKS } from '@/lib/content/life-tracks';

const base = { source: 'allowance', goal: 'budget', timeframe: 'month', obligations: 'none', checkins: 2 } as const;

describe('assignTrack', () => {
  it('defaults to student life', () => expect(assignTrack(base).track).toBe('student'));
  it('wanting to invest goes to invest-small and Invest HER', () => {
    const r = assignTrack({ ...base, goal: 'investing' });
    expect(r.track).toBe('invest-small');
    expect(r.firstPathway).toBe('invest-her');
  });
  it('a salary goes to first-payslip', () => expect(assignTrack({ ...base, source: 'salary' }).track).toBe('first-payslip'));
  it('part-time work with family obligations goes to rent-independence', () => expect(assignTrack({ ...base, source: 'part-time', obligations: 'family' }).track).toBe('rent-independence'));
  it('the weekly target follows the check-ins answer', () => expect(assignTrack({ ...base, checkins: 3 }).weeklyTarget).toBe(3));
  it('every track has an ordered lesson list', () => TRACKS.forEach((t) => expect(t.lessons.length).toBeGreaterThanOrEqual(5)));
});
