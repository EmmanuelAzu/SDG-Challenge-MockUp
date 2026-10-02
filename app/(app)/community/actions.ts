'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/admin';
import { awardPoints } from '@/lib/gamification/award';
import { afterEarn, type Earned } from '@/lib/gamification/evaluate';

export async function joinCircle(circleId: string): Promise<{ ok: boolean; message?: string }> {
  const id = z.string().uuid().parse(circleId);
  const { user } = await requireUser();
  const db = adminClient();
  const { data: c } = await db.from('circles').select('id,community_id,capacity,is_open,communities(requires_approval)').eq('id', id).single();
  if (!c) return { ok: false, message: 'Circle not found.' };
  if (!c.is_open) return { ok: false, message: 'This Circle is closed to new members.' };
  const { count } = await db.from('circle_members').select('*', { count: 'exact', head: true }).eq('circle_id', id);
  if ((count ?? 0) >= c.capacity) return { ok: false, message: 'This Circle is full. Try another one.' };
  await db.from('community_members').upsert(
    { community_id: c.community_id, user_id: user.id, status: (c as any).communities?.requires_approval ? 'pending' : 'active' },
    { onConflict: 'community_id,user_id', ignoreDuplicates: true },
  );
  await db.from('circle_members').upsert({ circle_id: id, user_id: user.id }, { onConflict: 'circle_id,user_id', ignoreDuplicates: true });
  revalidatePath('/community', 'layout');
  revalidatePath(`/circles/${id}`);
  return { ok: true };
}

export async function leaveCircle(circleId: string) {
  const id = z.string().uuid().parse(circleId);
  const { user } = await requireUser();
  await adminClient().from('circle_members').delete().eq('circle_id', id).eq('user_id', user.id);
  revalidatePath('/community', 'layout');
  revalidatePath(`/circles/${id}`);
}

export async function completeChallenge(challengeId: string): Promise<Earned & { points: number }> {
  const id = z.string().uuid().parse(challengeId);
  const { user } = await requireUser();
  const db = adminClient();
  const { data: ch } = await db.from('challenges').select('community_id,points').eq('id', id).single();
  if (!ch) throw new Error('Challenge not found');
  await db.from('challenge_completions').upsert({ challenge_id: id, user_id: user.id }, { onConflict: 'challenge_id,user_id', ignoreDuplicates: true });
  const fresh = await awardPoints({ userId: user.id, source: 'challenge', sourceId: id, communityId: ch.community_id, points: ch.points ?? 20 });
  revalidatePath('/community', 'layout');
  return { ...(await afterEarn(user.id)), points: fresh ? (ch.points ?? 20) : 0 };
}
