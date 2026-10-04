import type { World } from '@/lib/world/types';
import { award } from './award';
import { notify } from './helpers';

export const OWEEK_COURSE = 'oweek-starter';
export const OWEEK_LESSONS = ['first-month-plan', 'scam-smart', 'student-accounts'];

export const oweekProgress = (w: World, userId: string) => {
  const done = OWEEK_LESSONS.filter((id) => ['completed', 'passed'].includes(w.lessonProgress[`${userId}:${id}`]?.status ?? ''));
  return { done: done.length, total: OWEEK_LESSONS.length };
};

/** Finishing all three O-Week lessons records the (0-point) flag the O-Week Starter badge is based on. */
export function syncOweek(w: World, userId: string, now: Date) {
  const p = oweekProgress(w, userId);
  if (p.done < p.total || w.users[userId]?.sim) return;
  if (w.pointEvents.some((e) => e.userId === userId && e.source === 'oweek_done')) return;
  award(w, { userId, source: 'oweek_done', sourceId: OWEEK_COURSE, points: 0, now });
  notify(w, userId, { kind: 'badge', title: 'O-Week Starter complete', body: 'You finished the three O-Week lessons.', href: '/rewards', key: 'oweek-done' }, now);
}
