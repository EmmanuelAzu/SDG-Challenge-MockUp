import type { Earned, Session, World } from '@/lib/world/types';
import { nextWeekdayAt } from '@/lib/world/seed';
import { award } from './award';
import { earning } from './actions';
import { circleMemberCount } from './community';
import { notify, uid } from './helpers';

export const rsvpOf = (w: World, sessionId: string, userId: string) => w.rsvps[`${sessionId}:${userId}`];
export const goingCount = (w: World, sessionId: string) => Object.entries(w.rsvps).filter(([k, v]) => k.startsWith(`${sessionId}:`) && v === 'going').length;
export const rsvp = (w: World, userId: string, sessionId: string, status: 'going' | 'maybe' | 'no') => { w.rsvps[`${sessionId}:${userId}`] = status; };

export function canRunCircle(w: World, userId: string, circleId: string): boolean {
  const u = w.users[userId];
  const c = w.circles.find((x) => x.id === circleId);
  return !!u && !!c && (u.role === 'pps_admin' || u.role === 'community_admin' || c.facilitatorId === userId);
}

/** One-off or weekly (8 concrete rows sharing a series id). */
export function createSessions(w: World, userId: string, o: { circleId: string; title: string; startsAt: string; weekly: boolean; minutes?: number; location?: string }): Session[] {
  if (!canRunCircle(w, userId, o.circleId)) return [];
  const c = w.circles.find((x) => x.id === o.circleId)!;
  const seriesId = uid('series');
  const count = o.weekly ? 8 : 1;
  const out: Session[] = [];
  for (let i = 0; i < count; i++) {
    const start = new Date(new Date(o.startsAt).getTime() + i * 7 * 86400_000);
    out.push({ id: uid('session'), communityId: c.communityId, circleId: c.id, title: o.title, startsAt: start.toISOString(), endsAt: new Date(start.getTime() + (o.minutes ?? 35) * 60_000).toISOString(), location: o.location ?? 'Online (link in the Circle chat)', seriesId, cancelled: false });
  }
  w.sessions.push(...out);
  return out;
}

/** Cancel this session or all future ones in its series; RSVPs are notified. */
export function cancelSession(w: World, userId: string, sessionId: string, scope: 'one' | 'future', now: Date): number {
  const s = w.sessions.find((x) => x.id === sessionId);
  if (!s || !canRunCircle(w, userId, s.circleId)) return 0;
  const targets = w.sessions.filter((x) => !x.cancelled && (x.id === s.id || (scope === 'future' && x.seriesId === s.seriesId && x.startsAt >= s.startsAt)));
  targets.forEach((t) => {
    t.cancelled = true;
    Object.keys(w.rsvps).filter((k) => k.startsWith(`${t.id}:`) && w.rsvps[k] !== 'no').forEach((k) => notify(w, k.split(':')[1], { kind: 'session', title: `Cancelled: ${t.title}`, body: 'Your facilitator cancelled this session.', href: '/calendar', key: `cancel-${t.id}` }, now));
  });
  return targets.length;
}

/** Facilitator attendance: +25 points (community-tied), Circle Starter / Show-Up Sisi. Returns each attendee's earnings. */
export function markAttendance(w: World, staffId: string, sessionId: string, userIds: string[], now: Date): Record<string, Earned> {
  const s = w.sessions.find((x) => x.id === sessionId);
  const out: Record<string, Earned> = {};
  if (!s || !canRunCircle(w, staffId, s.circleId)) return out;
  for (const userId of userIds) {
    if (w.attendance.some((a) => a.sessionId === sessionId && a.userId === userId)) continue;
    w.attendance.push({ sessionId, userId, rating: null });
    out[userId] = earning(w, userId, now, () => { award(w, { userId, source: 'session', sourceId: sessionId, communityId: s.communityId, now }); });
    notify(w, userId, { kind: 'session', title: 'Thanks for coming', body: `${s.title}. +25 points. How was it?`, href: '/calendar', key: `attended-${sessionId}` }, now);
  }
  return out;
}

export function rateSession(w: World, userId: string, sessionId: string, rating: number) {
  const a = w.attendance.find((x) => x.sessionId === sessionId && x.userId === userId);
  if (a) a.rating = Math.min(5, Math.max(1, Math.round(rating)));
}

export const upcomingFor = (w: World, circleId: string, now: Date) => w.sessions.filter((s) => s.circleId === circleId && !s.cancelled && s.endsAt >= now.toISOString()).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
export { circleMemberCount, nextWeekdayAt };
