import { adminClient } from '@/lib/supabase/admin';
import { sastDate } from '@/lib/time';
import { evaluateBadges } from '@/lib/gamification/evaluate';
import { pickWinner, previousMonth, type CupRow } from './winners';

/** Circle Cup for one community and month: the Circle with the best average points per member wins. */
export async function awardCircleCup(communityId: string, month: { key: string; from: string; to: string }) {
  const db = adminClient();
  const { data: circles } = await db.from('circles').select('id,name,circle_members(user_id)').eq('community_id', communityId);
  const rows: (CupRow & { members: string[] })[] = [];
  for (const c of (circles ?? []) as any[]) {
    const members: string[] = (c.circle_members ?? []).map((m: any) => m.user_id);
    if (!members.length) continue;
    const [{ data: pts }, { data: ch }] = await Promise.all([
      db.from('point_events').select('points,community_id').in('user_id', members).gte('created_at', month.from).lt('created_at', month.to),
      db.from('challenge_completions').select('user_id').in('user_id', members).gte('completed_at', month.from).lt('completed_at', month.to),
    ]);
    const total = (pts ?? []).filter((p) => !p.community_id || p.community_id === communityId).reduce((a, p) => a + p.points, 0);
    rows.push({ id: c.id, name: c.name, score: total / members.length, challengeCompletions: ch?.length ?? 0, members });
  }
  const winner = pickWinner(rows) as (CupRow & { members: string[] }) | null;
  if (!winner || winner.score <= 0) return null;
  for (const userId of winner.members) {
    // flag event the badge rules read (0 points)
    await adminClient().from('point_events').upsert({ user_id: userId, source: 'circle_cup', source_id: `${communityId}-${month.key}`, points: 0, community_id: communityId }, { onConflict: 'user_id,source,source_id', ignoreDuplicates: true });
    await evaluateBadges(userId);
  }
  return { circle: winner.name, members: winner.members.length };
}

export async function awardMonthlyCircleCups(todaySast = sastDate(), force = false) {
  if (!force && todaySast.slice(8) !== '01') return { skipped: 'not the 1st' };
  const month = previousMonth(todaySast);
  const { data: communities } = await adminClient().from('communities').select('id,name');
  const out: Record<string, unknown> = {};
  for (const c of communities ?? []) out[c.name] = await awardCircleCup(c.id, month);
  return out;
}

/** Campus Cup: at season end, the community with the highest average points per active member wins. */
export async function awardCampusCups(todaySast = sastDate()) {
  const db = adminClient();
  const { data: seasons } = await db.from('campus_cup_seasons').select('id,name,starts_on,ends_on').is('awarded_at', null).lt('ends_on', todaySast);
  const out: Record<string, unknown> = {};
  for (const s of seasons ?? []) {
    const { data: entries } = await db.from('campus_cup_entries').select('community_id,communities(name)').eq('season_id', s.id);
    const from = new Date(`${s.starts_on}T00:00:00+02:00`).toISOString();
    const to = new Date(`${s.ends_on}T23:59:59+02:00`).toISOString();
    const rows: (CupRow & { members: string[] })[] = [];
    for (const e of (entries ?? []) as any[]) {
      const { data: cm } = await db.from('community_members').select('user_id').eq('community_id', e.community_id).eq('status', 'active');
      const members = (cm ?? []).map((m) => m.user_id);
      if (!members.length) continue;
      const { data: pts } = await db.from('point_events').select('user_id,points,community_id').in('user_id', members).gte('created_at', from).lte('created_at', to);
      const mine = (pts ?? []).filter((p) => !p.community_id || p.community_id === e.community_id);
      const active = new Set(mine.map((p) => p.user_id));
      const weeks = Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / (7 * 86400_000)));
      rows.push({ id: e.community_id, name: e.communities?.name ?? '', score: active.size ? mine.reduce((a, p) => a + p.points, 0) / active.size / weeks : 0, challengeCompletions: 0, members });
    }
    const winner = pickWinner(rows) as (CupRow & { members: string[] }) | null;
    if (winner && winner.score > 0) {
      for (const userId of winner.members) {
        await db.from('point_events').upsert({ user_id: userId, source: 'campus_cup', source_id: s.id, points: 0 }, { onConflict: 'user_id,source,source_id', ignoreDuplicates: true });
        await evaluateBadges(userId);
      }
    }
    await db.from('campus_cup_seasons').update({ awarded_at: new Date().toISOString() }).eq('id', s.id);
    out[s.name] = winner?.name ?? 'no winner';
  }
  return out;
}
