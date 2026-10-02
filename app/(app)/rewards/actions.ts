'use server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/admin';
import { track } from '@/lib/analytics';

/** Creates (or reuses) a public share link for one of the caller's badges. Sharing never earns points. */
export async function createShare(userBadgeId: string): Promise<{ code: string }> {
  const id = z.string().uuid().parse(userBadgeId);
  const { user } = await requireUser();
  const db = adminClient();
  const { data: ub } = await db.from('user_badges').select('id').eq('id', id).eq('user_id', user.id).single();
  if (!ub) throw new Error('Badge not found');
  const { data: profile } = await db.from('profiles').select('share_name_mode').eq('id', user.id).single();
  const { data: existing } = await db.from('badge_shares').select('code').eq('user_badge_id', id).is('revoked_at', null).limit(1).maybeSingle();
  let code = existing?.code;
  if (!code) {
    const { data, error } = await db.from('badge_shares').insert({ user_badge_id: id, name_mode: profile?.share_name_mode ?? 'first' }).select('code').single();
    if (error) throw error;
    code = data.code;
  }
  await track(user.id, 'share_clicked', { badge: id });
  return { code: code! };
}

export async function revokeShare(code: string) {
  const { user } = await requireUser();
  const db = adminClient();
  const { data } = await db.from('badge_shares').select('id,user_badges!inner(user_id)').eq('code', code).eq('user_badges.user_id', user.id).single();
  if (data) await db.from('badge_shares').update({ revoked_at: new Date().toISOString() }).eq('id', data.id);
}
