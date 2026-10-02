'use server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/admin';

const input = z.object({
  nickname: z.string().trim().max(20),
  shareNameMode: z.enum(['first', 'nickname']),
  showOnLeaderboard: z.boolean(),
  weeklyTarget: z.number().int().min(1).max(3),
  focusMode: z.boolean(),
  lifeTrack: z.enum(['student', 'first-payslip', 'rent-independence', 'invest-small']).nullable(),
});

export async function saveSettings(raw: z.infer<typeof input>) {
  const v = input.parse(raw);
  const { user } = await requireUser();
  await adminClient().from('profiles').update({
    nickname: v.nickname || null,
    share_name_mode: v.shareNameMode === 'nickname' && !v.nickname ? 'first' : v.shareNameMode,
    show_on_leaderboard: v.showOnLeaderboard, weekly_target: v.weeklyTarget, focus_mode: v.focusMode, life_track: v.lifeTrack,
  }).eq('id', user.id);
  // Celebrations are client-side, so Focus mode is mirrored in a cookie they can read.
  (await cookies()).set('sisi_focus', v.focusMode ? '1' : '0', { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  revalidatePath('/', 'layout');
}

export async function setWeeklyTarget(n: number) {
  const target = z.number().int().min(1).max(3).parse(n);
  const { user } = await requireUser();
  await adminClient().from('profiles').update({ weekly_target: target }).eq('id', user.id);
  revalidatePath('/', 'layout');
}

export async function setLeaderboardOptIn(on: boolean) {
  const { user } = await requireUser();
  await adminClient().from('profiles').update({ show_on_leaderboard: z.boolean().parse(on) }).eq('id', user.id);
  revalidatePath('/community', 'layout');
  revalidatePath('/profile');
}

export async function signOut() {
  const { supabase } = await requireUser();
  await supabase.auth.signOut();
}
