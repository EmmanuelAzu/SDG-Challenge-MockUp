import { describe, expect, it } from 'vitest';
import { pickWinner, previousMonth } from '@/lib/jobs/winners';

describe('pickWinner', () => {
  it('highest average wins', () => expect(pickWinner([{ id: 'a', name: 'A', score: 10, challengeCompletions: 0 }, { id: 'b', name: 'B', score: 20, challengeCompletions: 0 }])?.id).toBe('b'));
  it('ties go to more completed challenges', () => expect(pickWinner([{ id: 'a', name: 'A', score: 10, challengeCompletions: 1 }, { id: 'b', name: 'B', score: 10, challengeCompletions: 4 }])?.id).toBe('b'));
  it('then alphabetical', () => expect(pickWinner([{ id: 'z', name: 'Zed', score: 5, challengeCompletions: 2 }, { id: 'a', name: 'Alpha', score: 5, challengeCompletions: 2 }])?.id).toBe('a'));
  it('empty is null', () => expect(pickWinner([])).toBeNull());
});

describe('previousMonth', () => {
  it('works mid-year', () => expect(previousMonth('2026-11-01')).toMatchObject({ key: '2026-10', from: '2026-09-30T22:00:00.000Z', to: '2026-10-31T22:00:00.000Z' }));
  it('wraps the year', () => expect(previousMonth('2027-01-01').key).toBe('2026-12'));
});
