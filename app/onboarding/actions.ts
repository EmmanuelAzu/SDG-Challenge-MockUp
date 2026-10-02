'use server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/admin';
import { awardPoints } from '@/lib/gamification/award';
import { afterEarn, evaluateBadges, type Earned } from '@/lib/gamification/evaluate';
import { track } from '@/lib/analytics';
import { assignTrack } from '@/lib/content/life-tracks';


const input = z.object({
  displayName: z.string().trim().min(1).max(40),
  nickname: z.string().trim().max(20).optional(),
  communityId: z.string().uuid().nullable(),
  joinCode: z.string().trim().max(20).optional(),
  quiz: z.object({
    source: z.enum(['allowance', 'nsfas', 'part-time', 'salary', 'none']),
    goal: z.enum(['budget', 'emergency-fund', 'save-for-something', 'investing', 'first-salary']),
    timeframe: z.enum(['month', 'year', 'longer']),
    obligations: z.enum(['none', 'debt', 'family', 'both']),
    checkins: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  }),
  confidence: z.array(z.number().int().min(1).max(5)).length(5),
  consent: z.literal(true),
});

export async function completeOnboarding(raw: z.infer<typeof input>): Promise<Earned & { track: string }> {
  const v = input.parse(raw);
  const { user } = await requireUser();
  const db = adminClient();

  let communityId = v.communityId;
  if (v.joinCode) {
    const { data } = await db.from('communities').select('id').ilike('join_code', v.joinCode).maybeSingle();
    if (data) communityId = data.id;
  }
  if (communityId) {
    const { data: c } = await db.from('communities').select('requires_approval').eq('id', communityId).single();
    await db.from('community_members').upsert(
      { community_id: communityId, user_id: user.id, status: c?.requires_approval ? 'pending' : 'active' },
      { onConflict: 'community_id,user_id', ignoreDuplicates: true },
    );
  }

  const { data: prof } = await db.from('profiles').select('onboarded_at,referred_by').eq('id', user.id).single();
  const first = !prof?.onboarded_at;
  const plan = assignTrack(v.quiz);
  await db.from('profiles').update({
    display_name: v.displayName, nickname: v.nickname || null, goals: [v.quiz.goal], life_track: plan.track, weekly_target: plan.weeklyTarget,
    consented_at: new Date().toISOString(), onboarded_at: prof?.onboarded_at ?? new Date().toISOString(),
  }).eq('id', user.id);
  if (first) await db.from('confidence_surveys').insert({ user_id: user.id, kind: 'pre', answers: v.confidence });

  await awardPoints({ userId: user.id, source: 'onboarding', sourceId: 'onboarding' });
  const earned = await afterEarn(user.id);

  if (first && prof?.referred_by) {
    await evaluateBadges(prof.referred_by);
    await db.from('notifications').insert({ user_id: prof.referred_by, kind: 'referral', title: 'A friend joined Sisi', body: `${v.displayName} joined through your link.`, href: '/rewards' });
  }
  await track(user.id, 'onboarding_completed', { community: communityId, track: plan.track, target: plan.weeklyTarget });
  return { ...earned, track: plan.track };
}
