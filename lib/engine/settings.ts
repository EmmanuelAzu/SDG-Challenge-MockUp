import type { World } from '@/lib/world/types';
import { DEFAULT_REMINDER_DAYS } from './actions';
import { track } from './helpers';

/** Changing the weekly target also resets reminder days to a sensible spread for that target. */
export function setWeeklyTargetAction(w: World, userId: string, target: 1 | 2 | 3, now: Date = new Date(Date.now() + w.clockOffsetMs)) {
  w.users[userId].weeklyTarget = target;
  w.users[userId].reminderDays = DEFAULT_REMINDER_DAYS[target];
  track(w, userId, 'weekly_target_set', { target }, now);
}
