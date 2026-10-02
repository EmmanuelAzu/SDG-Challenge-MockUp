import { adminClient } from '@/lib/supabase/admin';
import { POINTS, type PointSource } from './points';

/** Awards points once per (user, source, sourceId). Returns true when newly awarded. */
export async function awardPoints(o: {
  userId: string;
  source: PointSource;
  sourceId: string;
  communityId?: string | null;
  points?: number;
}): Promise<boolean> {
  const { data, error } = await adminClient()
    .from('point_events')
    .upsert(
      { user_id: o.userId, community_id: o.communityId ?? null, source: o.source, source_id: o.sourceId, points: o.points ?? POINTS[o.source] },
      { onConflict: 'user_id,source,source_id', ignoreDuplicates: true },
    )
    .select('id');
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}
