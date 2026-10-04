import type { World } from '@/lib/world/types';
import { LESSONS, MILESTONES, TRACKS, lessonsForMilestone } from '@/lib/content';
import { lessonFinished, lessonKey } from './milestones';

export type NextStep = { kind: 'lesson' | 'action' | 'quiz'; title: string; href: string; cta: string };
export type MilestoneProgress = { slug: string; title: string; done: boolean; lessonsDone: number; lessonsTotal: number; next: NextStep | null };
export type Journey = { milestones: MilestoneProgress[]; doneCount: number; next: NextStep | null; lessonsCompleted: number };

function stepFor(w: World, userId: string, lessonId: string): NextStep | null {
  const l = LESSONS.find((x) => x.id === lessonId);
  if (!l) return null;
  if (lessonFinished(w, userId, l.id, l.action.id)) return null;
  const href = `/learn/${l.courseSlug}/${l.slug}`;
  const st = w.lessonProgress[lessonKey(userId, l.id)]?.status;
  if (st === 'passed') return { kind: 'action', title: l.action.title, href, cta: 'Do it now' };
  if (st === 'completed') return { kind: 'quiz', title: `Quiz: ${l.title}`, href, cta: 'Take the quiz' };
  return { kind: 'lesson', title: l.title, href, cta: st === 'started' ? 'Continue lesson' : 'Start lesson' };
}

/** Works out progress and the single next action, following the user's Life Track order when they have one. */
export function getJourney(w: World, userId: string): Journey {
  const done = w.milestonesDone[userId] ?? {};
  const milestones: MilestoneProgress[] = MILESTONES.map((m) => {
    const lessons = lessonsForMilestone(m.slug);
    const next = lessons.map((l) => stepFor(w, userId, l.id)).find(Boolean) ?? null;
    return { slug: m.slug, title: m.title, done: !!done[m.slug], lessonsDone: lessons.filter((l) => lessonFinished(w, userId, l.id, l.action.id)).length, lessonsTotal: lessons.length, next };
  });
  let next: NextStep | null = null;
  const track = TRACKS.find((t) => t.slug === w.users[userId]?.lifeTrack);
  for (const id of track?.lessons ?? []) {
    next = stepFor(w, userId, id);
    if (next) break;
  }
  next ??= milestones.find((m) => !m.done && m.next)?.next ?? null;
  return { milestones, doneCount: milestones.filter((m) => m.done).length, next, lessonsCompleted: LESSONS.filter((l) => lessonFinished(w, userId, l.id, l.action.id)).length };
}
