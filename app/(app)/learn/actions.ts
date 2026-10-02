'use server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { awardPoints } from '@/lib/gamification/award';
import { POINTS, FEEDBACK_PER_WEEK } from '@/lib/gamification/points';
import { afterEarn, evaluateBadges, type Earned } from '@/lib/gamification/evaluate';
import { track } from '@/lib/analytics';

const id = z.string().uuid();

export async function startLesson(lessonId: string) {
  const { user } = await requireUser();
  const lid = id.parse(lessonId);
  await adminClient().from('lesson_progress').upsert({ user_id: user.id, lesson_id: lid, status: 'started' }, { onConflict: 'user_id,lesson_id', ignoreDuplicates: true });
  await track(user.id, 'lesson_started', { lesson: lid });
}

/** Called when the cards are finished: marks the lesson complete (+10, once). */
export async function completeLesson(lessonId: string): Promise<Earned & { points: number }> {
  const { user } = await requireUser();
  const lid = id.parse(lessonId);
  const db = adminClient();
  const { data: prev } = await db.from('lesson_progress').select('status,completed_at').eq('user_id', user.id).eq('lesson_id', lid).maybeSingle();
  await db.from('lesson_progress').upsert(
    { user_id: user.id, lesson_id: lid, status: prev?.status === 'passed' ? 'passed' : 'completed', completed_at: prev?.completed_at ?? new Date().toISOString() },
    { onConflict: 'user_id,lesson_id' },
  );
  const fresh = await awardPoints({ userId: user.id, source: 'lesson', sourceId: lid });
  await track(user.id, 'lesson_completed', { lesson: lid });
  return { ...(await afterEarn(user.id)), points: fresh ? 10 : 0 };
}

const quizInput = z.object({ lessonId: id, answers: z.array(z.number().int().min(0).max(5)).min(1).max(10) });

/** Grades server-side. Pass = at least min(2, n) correct. Unlimited retries; points only on first pass. */
export async function submitQuiz(input: z.infer<typeof quizInput>): Promise<Earned & { passed: boolean; correct: number; total: number; points: number }> {
  const { lessonId, answers } = quizInput.parse(input);
  const { user } = await requireUser();
  const db = adminClient();
  const { data: qs } = await db.from('quiz_questions').select('id,correct_index').eq('lesson_id', lessonId).order('id');
  const questions = qs ?? [];
  if (questions.length !== answers.length) throw new Error('Answer every question first');
  const correct = questions.filter((q, i) => q.correct_index === answers[i]).length;
  const passed = correct >= Math.min(2, questions.length);
  const score = Math.round((correct / questions.length) * 100);
  const { data: prev } = await db.from('lesson_progress').select('status,completed_at').eq('user_id', user.id).eq('lesson_id', lessonId).maybeSingle();
  await db.from('lesson_progress').upsert(
    { user_id: user.id, lesson_id: lessonId, quiz_score: score, status: passed || prev?.status === 'passed' ? 'passed' : (prev?.status ?? 'completed'), completed_at: prev?.completed_at ?? new Date().toISOString() },
    { onConflict: 'user_id,lesson_id' },
  );
  let points = 0;
  if (passed && (await awardPoints({ userId: user.id, source: 'quiz', sourceId: lessonId }))) points = 5;
  await track(user.id, 'quiz_submitted', { lesson: lessonId, correct, passed });
  const earned = passed ? await afterEarn(user.id) : { badges: [], milestones: [] };
  return { ...earned, passed, correct, total: questions.length, points };
}

export async function completeAction(input: { actionId: string; status: 'done' | 'skipped' }): Promise<Earned & { points: number }> {
  const parsed = z.object({ actionId: id, status: z.enum(['done', 'skipped']) }).parse(input);
  const { user } = await requireUser();
  const db = adminClient();
  await db.from('action_completions').upsert({ user_id: user.id, action_id: parsed.actionId, status: parsed.status, completed_at: new Date().toISOString() }, { onConflict: 'user_id,action_id' });
  if (parsed.status === 'skipped') return { badges: [], milestones: [], points: 0 };
  const fresh = await awardPoints({ userId: user.id, source: 'action', sourceId: parsed.actionId });
  await track(user.id, 'action_done', { action: parsed.actionId });
  return { ...(await afterEarn(user.id)), points: fresh ? 15 : 0 };
}

/** Opening a glossary term counts toward the Word Wise badge (10 distinct terms). */
export async function recordLookup(slug: string): Promise<Earned> {
  const s = z.string().min(1).max(80).parse(slug);
  const { user } = await requireUser();
  const db = adminClient();
  await db.from('glossary_lookups').upsert({ user_id: user.id, term_slug: s }, { onConflict: 'user_id,term_slug', ignoreDuplicates: true });
  return { badges: await evaluateBadges(user.id), milestones: [] };
}

async function feedbackPoints(userId: string, sourceId: string): Promise<number> {
  const db = adminClient();
  const since = new Date(Date.now() - 7 * 86400_000).toISOString();
  const { count } = await db.from('point_events').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('source', 'feedback').gte('created_at', since);
  if ((count ?? 0) >= FEEDBACK_PER_WEEK) return 0;
  return (await awardPoints({ userId, source: 'feedback', sourceId })) ? POINTS.feedback : 0;
}

export async function submitFeedback(input: { lessonId: string; rating: number; confusing?: string }): Promise<{ points: number }> {
  const v = z.object({ lessonId: id, rating: z.number().int().min(1).max(5), confusing: z.string().trim().max(300).optional() }).parse(input);
  const { user } = await requireUser();
  await adminClient().from('lesson_feedback').upsert({ lesson_id: v.lessonId, user_id: user.id, rating: v.rating, confusing_text: v.confusing || null }, { onConflict: 'lesson_id,user_id' });
  await track(user.id, 'lesson_rated', { lesson: v.lessonId, rating: v.rating });
  return { points: await feedbackPoints(user.id, `lesson-${v.lessonId}`) };
}

export async function suggestTopic(body: string): Promise<{ ok: boolean; points: number }> {
  const text = z.string().trim().min(3).max(200).safeParse(body);
  if (!text.success) return { ok: false, points: 0 };
  const { user } = await requireUser();
  const { data } = await adminClient().from('topic_suggestions').insert({ user_id: user.id, body: text.data, votes: 1 }).select('id').single();
  if (data) await adminClient().from('topic_votes').insert({ suggestion_id: data.id, user_id: user.id });
  revalidatePath('/learn/suggest');
  return { ok: true, points: data ? await feedbackPoints(user.id, `suggest-${data.id}`) : 0 };
}

export async function voteTopic(suggestionId: string) {
  const sid = id.parse(suggestionId);
  const { user } = await requireUser();
  const db = adminClient();
  const { error } = await db.from('topic_votes').insert({ suggestion_id: sid, user_id: user.id });
  if (error) return; // already voted
  const { data } = await db.from('topic_suggestions').select('votes').eq('id', sid).single();
  await db.from('topic_suggestions').update({ votes: (data?.votes ?? 0) + 1 }).eq('id', sid);
  revalidatePath('/learn/suggest');
}
