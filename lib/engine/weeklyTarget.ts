import type { World } from '@/lib/world/types';
import { sastDate } from '@/lib/time';
import { award } from './award';
import { NON_ACTIVITY_SOURCES } from './points';
import { weeklyProgress, type WeeklyProgress } from './weekly';

/** SAST days on which the user earned effort points (the "active days" of Weekly Target Mode). */
export function activeDates(w: World, userId: string): string[] {
  const skip = new Set<string>(NON_ACTIVITY_SOURCES);
  return w.pointEvents.filter((p) => p.userId === userId && !skip.has(p.source) && p.points > 0).map((p) => sastDate(new Date(p.at)));
}

export function weeklyFor(w: World, userId: string, now: Date): WeeklyProgress {
  return weeklyProgress(activeDates(w, userId), w.users[userId]?.weeklyTarget ?? 2, sastDate(now));
}

/** +25 the first time the target is met in an ISO week. */
export function checkWeeklyTarget(w: World, userId: string, now: Date): WeeklyProgress {
  const wp = weeklyFor(w, userId, now);
  if (wp.thisWeek.hit) award(w, { userId, source: 'weekly_target', sourceId: wp.thisWeek.weekKey, now });
  return wp;
}
