import { subDays } from 'date-fns';
import { isoWeekKey } from '@/lib/time';

export type WeekRow = { weekKey: string; days: number; hit: boolean };
export type WeeklyProgress = {
  target: number;
  thisWeek: WeekRow;
  /** Consecutive weeks that hit the target. The current week counts once hit; while still in progress it never breaks the run. */
  streakWeeks: number;
  /** Oldest to newest, ending with the current week. */
  history: WeekRow[];
};

const step = (today: string, weeksBack: number) => subDays(new Date(`${today}T12:00:00Z`), 7 * weeksBack).toISOString().slice(0, 10);

/**
 * Weekly Target Mode. `activeDates` are SAST dates (yyyy-MM-dd) with effort activity.
 * Nothing resets on a missed day; only a whole missed week ends the streak.
 */
export function weeklyProgress(activeDates: string[], target: number, today: string, historyWeeks = 12): WeeklyProgress {
  const byWeek = new Map<string, Set<string>>();
  for (const d of activeDates) {
    const k = isoWeekKey(d);
    (byWeek.get(k) ?? byWeek.set(k, new Set()).get(k)!).add(d);
  }
  const history: WeekRow[] = [];
  for (let i = historyWeeks - 1; i >= 0; i--) {
    const weekKey = isoWeekKey(step(today, i));
    const days = byWeek.get(weekKey)?.size ?? 0;
    history.push({ weekKey, days, hit: days >= target });
  }
  const thisWeek = history[history.length - 1];
  let streakWeeks = 0;
  let i = history.length - 1;
  if (!thisWeek.hit) i--; // week still in progress
  for (; i >= 0 && history[i].hit; i--) streakWeeks++;
  return { target, thisWeek, streakWeeks, history };
}
