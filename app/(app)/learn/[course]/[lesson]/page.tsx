import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { LessonPlayer } from '@/components/lesson-player';
import { slugify, TERM_RE } from '@/lib/content/glossary';
import { startLesson } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function LessonPage({ params }: { params: Promise<{ course: string; lesson: string }> }) {
  const { course, lesson } = await params;
  const { supabase, user } = await requireUser();
  const { data: c } = await supabase.from('courses').select('id,topic').eq('slug', course).single();
  if (!c) notFound();
  const { data: l } = await supabase.from('lessons').select('id,title,cards,takeaway,duration_sec,format,video_url,transcript').eq('course_id', c.id).eq('slug', lesson).single();
  if (!l) notFound();
  const [{ data: questions }, { data: actions }, { data: progress }, { data: done }, { data: sources }, { data: review }, { data: prof }, { data: fb }] = await Promise.all([
    supabase.from('quiz_questions').select('id,prompt,options,correct_index,explanation').eq('lesson_id', l.id).order('id'),
    supabase.from('actions').select('id,title,description').eq('lesson_id', l.id),
    supabase.from('lesson_progress').select('status').eq('user_id', user.id).eq('lesson_id', l.id).maybeSingle(),
    supabase.from('action_completions').select('action_id').eq('user_id', user.id).eq('status', 'done'),
    supabase.from('lesson_sources').select('title,url').eq('lesson_id', l.id),
    supabase.from('lesson_reviews').select('reviewer_name,credential,reviewed_on').eq('lesson_id', l.id).order('reviewed_on', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('profiles').select('focus_mode').eq('id', user.id).single(),
    supabase.from('lesson_feedback').select('rating').eq('lesson_id', l.id).eq('user_id', user.id).maybeSingle(),
  ]);

  // glossary terms used in this lesson's cards
  const slugs = new Set<string>();
  for (const card of (l.cards ?? []) as { body: string }[]) for (const m of card.body.matchAll(TERM_RE)) slugs.add(slugify(m[1]));
  const { data: terms } = slugs.size ? await supabase.from('glossary_terms').select('slug,term,definition,money_example').in('slug', [...slugs]) : { data: [] };

  const doneIds = new Set((done ?? []).map((r) => r.action_id));
  const pendingAction = (actions ?? []).find((a) => !doneIds.has(a.id)) ?? null;
  if (progress?.status !== 'passed' && progress?.status !== 'completed') await startLesson(l.id);
  const stage = progress?.status === 'passed' ? (pendingAction ? 'action' : 'cards') : progress?.status === 'completed' ? 'quiz' : 'cards';

  return (
    <LessonPlayer
      lesson={l} questions={questions ?? []} action={pendingAction} initialStage={stage}
      topic={c.topic ?? ''} sources={sources ?? []} review={review ?? null} glossary={terms ?? []} focus={!!prof?.focus_mode} rated={!!fb}
    />
  );
}
