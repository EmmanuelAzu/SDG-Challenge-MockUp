import type { World } from '@/lib/world/types';
import { POINTS } from './points';
import { uid } from './helpers';

/** Awards points once per (user, source, sourceId). Returns the points actually awarded (0 for a repeat). */
export function award(w: World, o: { userId: string; source: string; sourceId: string; points?: number; communityId?: string | null; now: Date }): number {
  if (w.pointEvents.some((p) => p.userId === o.userId && p.source === o.source && p.sourceId === o.sourceId)) return 0;
  const points = o.points ?? (POINTS as Record<string, number>)[o.source] ?? 0;
  w.pointEvents.push({ id: uid('p'), userId: o.userId, communityId: o.communityId ?? null, source: o.source, sourceId: o.sourceId, points, at: o.now.toISOString() });
  return points;
}

export const xpOf = (w: World, userId: string) => w.pointEvents.filter((p) => p.userId === userId).reduce((a, p) => a + p.points, 0);
