import type { World } from '@/lib/world/types';
import { xpOf } from './award';
import { getJourney } from './journey';
import { levelFor } from './levels';
import { weeklyFor } from './weeklyTarget';

/** Everything the game layer shows about a user, derived from the world in one call. */
export function playerFor(w: World, userId: string, now: Date) {
  const u = w.users[userId];
  const xp = xpOf(w, userId);
  const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
  const pre = w.surveys.find((s) => s.userId === userId && s.kind === 'pre');
  const post = [...w.surveys].reverse().find((s) => s.userId === userId && s.kind === 'post');
  const daysSinceOnboarding = u.onboardedAt ? Math.floor((now.getTime() - new Date(u.onboardedAt).getTime()) / 86400_000) : 0;
  return {
    xp, level: levelFor(xp), weekly: weeklyFor(w, userId, now), journey: getJourney(w, userId),
    confidenceChange: pre && post ? mean(post.answers) - mean(pre.answers) : null,
    checkInDue: !!pre && !post && daysSinceOnboarding >= 28,
  };
}
