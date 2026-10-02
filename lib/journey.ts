import type { SupabaseClient } from '@supabase/supabase-js';

export type NextStep = { kind: 'lesson' | 'action' | 'quiz'; title: string; href: string; cta: string };
export type MilestoneProgress = { id: string; slug: string; title: string; done: boolean; lessonsDone: number; lessonsTotal: number; next: NextStep | null };
export type Journey = { milestones: MilestoneProgress[]; doneCount: number; next: NextStep | null; lessonsCompleted: number };

type LessonInfo = { id: string; step: NextStep | null; finished: boolean };

/** Reads content + the caller's own progress (RLS-scoped client) and works out the single next action, following their Life Track order when they have one. */
export async function getJourney(db: SupabaseClient, userId: string): Promise<Journey> {
  const [{ data: ms }, { data: lp }, { data: ac }, { data: um }, { data: prof }] = await Promise.all([
    db.from('milestones').select('id,slug,title,sort,courses(slug,title,sort,lessons(id,slug,title,sort,actions(id,title)))').order('sort'),
    db.from('lesson_progress').select('lesson_id,status').eq('user_id', userId),
    db.from('action_completions').select('action_id').eq('user_id', userId).eq('status', 'done'),
    db.from('user_milestones').select('milestone_id').eq('user_id', userId),
    db.from('profiles').select('life_track').eq('id', userId).single(),
  ]);
  const status = new Map((lp ?? []).map((r) => [r.lesson_id, r.status as string]));
  const actionsDone = new Set((ac ?? []).map((r) => r.action_id));
  const milestonesDone = new Set((um ?? []).map((r) => r.milestone_id));
  const info = new Map<string, LessonInfo>();

  const milestones: MilestoneProgress[] = ((ms ?? []) as any[]).map((m) => {
    const lessons = (m.courses ?? [])
      .sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0))
      .flatMap((c: any) => (c.lessons ?? []).sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0)).map((l: any) => ({ ...l, course: c.slug })));
    let next: NextStep | null = null;
    let lessonsDone = 0;
    for (const l of lessons) {
      const st = status.get(l.id);
      const pending = (l.actions ?? []).filter((a: any) => !actionsDone.has(a.id));
      const href = `/learn/${l.course}/${l.slug}`;
      const finished = st === 'passed' && pending.length === 0;
      const step: NextStep | null = finished ? null
        : st === 'passed' ? { kind: 'action', title: pending[0].title, href, cta: 'Do it now' }
        : st === 'completed' ? { kind: 'quiz', title: `Quiz: ${l.title}`, href, cta: 'Take the quiz' }
        : { kind: 'lesson', title: l.title, href, cta: st === 'started' ? 'Continue lesson' : 'Start lesson' };
      info.set(l.id, { id: l.id, step, finished });
      if (finished) lessonsDone++;
      else if (!next) next = step;
    }
    return { id: m.id, slug: m.slug, title: m.title, done: milestonesDone.has(m.id), lessonsDone, lessonsTotal: lessons.length, next };
  });

  let next: NextStep | null = null;
  if (prof?.life_track) {
    const { data: track } = await db.from('life_tracks').select('lesson_ids').eq('slug', prof.life_track).maybeSingle();
    for (const id of (track?.lesson_ids ?? []) as string[]) {
      const l = info.get(id);
      if (l && !l.finished) { next = l.step; break; }
    }
  }
  next ??= milestones.find((m) => !m.done && m.next)?.next ?? null;
  return { milestones, doneCount: milestones.filter((m) => m.done).length, next, lessonsCompleted: [...info.values()].filter((l) => l.finished).length };
}
