import type { World } from '@/lib/world/types';
import { MILESTONES, lessonsForMilestone } from '@/lib/content';

export const lessonKey = (userId: string, lessonId: string) => `${userId}:${lessonId}`;

export function lessonFinished(w: World, userId: string, lessonId: string, actionId: string) {
  return w.lessonProgress[lessonKey(userId, lessonId)]?.status === 'passed' && w.actionCompletions[`${userId}:${actionId}`]?.status === 'done';
}

/** A milestone is complete when all its lessons are passed and their actions done. Returns titles newly completed. */
export function syncMilestones(w: World, userId: string, now: Date): string[] {
  const done = (w.milestonesDone[userId] ??= {});
  const out: string[] = [];
  for (const m of MILESTONES) {
    if (done[m.slug]) continue;
    const lessons = lessonsForMilestone(m.slug);
    if (lessons.length && lessons.every((l) => lessonFinished(w, userId, l.id, l.action.id))) {
      done[m.slug] = now.toISOString();
      out.push(m.title);
    }
  }
  return out;
}
