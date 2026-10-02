import type { SupabaseClient } from '@supabase/supabase-js';
import { getWeekly } from '@/lib/gamification/evaluate';
import { levelFor } from '@/lib/gamification/levels';

/** Everything the game layer needs about a user in one read. */
export async function getPlayer(db: SupabaseClient, userId: string) {
  const { data: p } = await db.from('profiles').select('display_name,focus_mode,weekly_target,life_track,xp').eq('id', userId).single();
  const [weekly, { data: surveys }] = await Promise.all([
    getWeekly(userId),
    db.from('confidence_surveys').select('kind,answers,created_at').eq('user_id', userId).order('created_at'),
  ]);
  const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const pre = surveys?.find((s) => s.kind === 'pre');
  const post = [...(surveys ?? [])].reverse().find((s) => s.kind === 'post');
  const preMean = pre ? mean(pre.answers as number[]) : null;
  const postMean = post ? mean(post.answers as number[]) : null;
  return {
    name: (p?.display_name as string) ?? '',
    focus: !!p?.focus_mode,
    weeklyTarget: (p?.weekly_target as number) ?? 2,
    lifeTrack: (p?.life_track as string | null) ?? null,
    xp: (p?.xp as number) ?? 0,
    level: levelFor((p?.xp as number) ?? 0),
    weekly,
    confidenceChange: preMean !== null && postMean !== null ? postMean - preMean : null,
  };
}
