import type { CampusSeason, World } from '@/lib/world/types';
import { formatInTimeZone } from 'date-fns-tz';
import { sastDate } from '@/lib/time';
import { circleMemberCount, circlesOf } from './community';
import { firstName } from './helpers';

export type Period = 'week' | 'all';

/** Monday 00:00 SAST of the current week, as an ISO instant. */
export function weekStart(now: Date): string {
  const d = sastDate(now);
  const dow = (new Date(`${d}T12:00:00Z`).getUTCDay() + 6) % 7;
  const monday = new Date(new Date(`${d}T00:00:00+02:00`).getTime() - dow * 86400_000);
  return monday.toISOString();
}
export const periodStart = (p: Period, now: Date) => (p === 'week' ? weekStart(now) : null);

/** Points that count in a community: personal points (no community) count everywhere; community-tied points count only there. */
export function pointsIn(w: World, userId: string, communityId: string, since: string | null, until: string | null = null): number {
  return w.pointEvents
    .filter((p) => p.userId === userId && (p.communityId === null || p.communityId === communityId) && (!since || p.at >= since) && (!until || p.at <= until))
    .reduce((a, p) => a + p.points, 0);
}

export type Row = { id: string; name: string; points: number; rank: number; sub?: string };
const rank = <T extends { points: number }>(rows: T[]) => { let r = 0, prev = Infinity; return rows.map((x, i) => { if (x.points < prev) { r = i + 1; prev = x.points; } return { ...x, rank: r }; }); };

/** Individuals: only members who opted in, by nickname (else first name). Effort points only. */
export function individualBoard(w: World, communityId: string, period: Period, now: Date): Row[] {
  const since = periodStart(period, now);
  const rows = w.communityMembers
    .filter((m) => m.communityId === communityId && m.status === 'active' && w.users[m.userId]?.showOnLeaderboard)
    .map((m) => ({ id: m.userId, name: w.users[m.userId].nickname || firstName(w.users[m.userId].displayName), points: pointsIn(w, m.userId, communityId, since) }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  return rank(rows);
}

/** Circle Cup: Circles ranked by average points per member. */
export function circleBoard(w: World, communityId: string, period: Period, now: Date): (Row & { members: number })[] {
  const since = periodStart(period, now);
  const rows = circlesOf(w, communityId).map((c) => {
    const ids = w.circleMembers.filter((m) => m.circleId === c.id).map((m) => m.userId);
    const total = ids.reduce((a, u) => a + pointsIn(w, u, communityId, since), 0);
    return { id: c.id, name: c.name, members: circleMemberCount(w, c.id), points: ids.length ? Math.round((total / ids.length) * 10) / 10 : 0 };
  }).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  return rank(rows);
}

export function gapToNext(rows: Row[], myId: string): { rank: number; pointsToPass: number } | null {
  const me = rows.find((r) => r.id === myId);
  if (!me || me.rank === 1) return null;
  const above = rows.filter((r) => r.points > me.points).map((r) => r.points).sort((a, b) => a - b)[0];
  return above === undefined ? null : { rank: me.rank - 1, pointsToPass: above - me.points + 1 };
}

export const activeSeason = (w: World, now: Date): CampusSeason | undefined => {
  const d = sastDate(now);
  return w.seasons.find((s) => s.startsOn <= d && d <= s.endsOn) ?? w.seasons.find((s) => s.startsOn > d) ?? w.seasons[w.seasons.length - 1];
};

/** Campus Cup: communities ranked by average weekly points per active member over the season so far. */
export function campusBoard(w: World, season: CampusSeason, now: Date): (Row & { active: number; started: boolean })[] {
  const from = new Date(`${season.startsOn}T00:00:00+02:00`).toISOString();
  const to = new Date(`${season.endsOn}T23:59:59+02:00`).toISOString();
  const started = now.toISOString() >= from;
  const weeks = Math.max(1, Math.ceil((Math.min(now.getTime(), new Date(to).getTime()) - new Date(from).getTime()) / (7 * 86400_000)));
  const rows = season.communityIds.map((cid) => {
    const c = w.communities.find((x) => x.id === cid)!;
    const members = w.communityMembers.filter((m) => m.communityId === cid && m.status === 'active').map((m) => m.userId);
    const per = members.map((u) => pointsIn(w, u, cid, from, to < now.toISOString() ? to : now.toISOString()));
    const active = per.filter((x) => x > 0).length;
    const total = per.reduce((a, b) => a + b, 0);
    return { id: cid, name: c.name, active, started, points: started && active ? Math.round((total / active / weeks) * 10) / 10 : 0 };
  }).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  return rank(rows).map((r) => ({ ...r }));
}

export const fmtWeek = (now: Date) => formatInTimeZone(new Date(weekStart(now)), 'Africa/Johannesburg', 'd MMM');
