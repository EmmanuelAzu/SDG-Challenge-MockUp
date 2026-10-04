import type { Circle, Community, CommunityMember, World } from '@/lib/world/types';
import { notify } from './helpers';

const TRACK_TAGS: Record<string, string[]> = {
  student: ['campus', 'NSFAS', 'student-life', 'saving', 'allowance'],
  'first-payslip': ['first-salary', 'payslip', 'career', 'budgeting'],
  'rent-independence': ['rent', 'moving-out', 'first-flat', 'budgeting', 'family'],
  'invest-small': ['investing', 'TFSA', 'small-amounts', 'unit-trusts'],
};
const GOAL_TAGS: Record<string, string[]> = { budget: ['budgeting'], 'emergency-fund': ['saving'], 'save-for-something': ['saving'], investing: ['investing', 'TFSA'], 'first-salary': ['first-salary', 'payslip'] };

export const membershipOf = (w: World, communityId: string, userId: string): CommunityMember | undefined => w.communityMembers.find((m) => m.communityId === communityId && m.userId === userId);
export const isActiveMember = (w: World, communityId: string, userId: string) => membershipOf(w, communityId, userId)?.status === 'active';
export const memberCount = (w: World, communityId: string) => w.communityMembers.filter((m) => m.communityId === communityId && m.status === 'active').length;
export const myCommunities = (w: World, userId: string): Community[] => w.communities.filter((c) => isActiveMember(w, c.id, userId));
export const circlesOf = (w: World, communityId: string): Circle[] => w.circles.filter((c) => c.communityId === communityId);
export const circleMemberCount = (w: World, circleId: string) => w.circleMembers.filter((m) => m.circleId === circleId).length;
export const isCircleMember = (w: World, circleId: string, userId: string) => w.circleMembers.some((m) => m.circleId === circleId && m.userId === userId);

/** Staff = global staff roles, or a facilitator/admin of the community. */
export function canModerateCommunity(w: World, userId: string, communityId: string): boolean {
  const u = w.users[userId];
  if (!u) return false;
  if (u.role === 'pps_admin' || u.role === 'community_admin') return true;
  const m = membershipOf(w, communityId, userId);
  return !!m && m.status === 'active' && m.role !== 'member';
}

export type Suggestion = { community: Community; score: number; reasons: string[] };

/** Likeminded communities for this user, based on their Life Track and goals (and what their Circles already cover). */
export function suggestedCommunities(w: World, userId: string): Suggestion[] {
  const u = w.users[userId];
  const wanted = new Set([...(TRACK_TAGS[u.lifeTrack ?? ''] ?? []), ...u.goals.flatMap((g) => GOAL_TAGS[g] ?? [])].map((t) => t.toLowerCase()));
  return w.communities
    .filter((c) => !membershipOf(w, c.id, userId))
    .map((community) => {
      const hits = community.tags.filter((t) => wanted.has(t.toLowerCase()));
      const reasons = hits.length ? [`Matches your interest in ${hits.slice(0, 2).join(' and ')}`] : [];
      // friends-of-friends signal: people from your communities are also here
      const shared = w.communityMembers.filter((m) => m.communityId === community.id && m.status === 'active' && isSharedCommunityPeer(w, userId, m.userId)).length;
      if (shared >= 3) reasons.push(`${shared} people from your communities are here`);
      return { community, score: hits.length * 3 + Math.min(shared, 6) / 2, reasons };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
}
function isSharedCommunityPeer(w: World, a: string, b: string) {
  if (a === b) return false;
  const mine = new Set(w.communityMembers.filter((m) => m.userId === a && m.status === 'active').map((m) => m.communityId));
  return w.communityMembers.some((m) => m.userId === b && m.status === 'active' && mine.has(m.communityId));
}

export type Filters = { q?: string; kind?: string; tag?: string };
/** Search by name, description, tags and kind. Name matches rank first. */
export function searchCommunities(w: World, f: Filters): Community[] {
  const q = (f.q ?? '').trim().toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);
  return w.communities
    .filter((c) => (!f.kind || c.kind === f.kind) && (!f.tag || c.tags.some((t) => t.toLowerCase() === f.tag!.toLowerCase())))
    .map((c) => {
      const name = c.name.toLowerCase();
      const hay = `${name} ${c.description.toLowerCase()} ${c.tags.join(' ').toLowerCase()} ${c.kind}`;
      if (!terms.every((t) => hay.includes(t))) return null;
      return { c, score: terms.reduce((a, t) => a + (name.includes(t) ? 5 : 0) + (c.tags.some((x) => x.toLowerCase().includes(t)) ? 2 : 0) + 1, 0) };
    })
    .filter((x): x is { c: Community; score: number } => !!x)
    .sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name))
    .map((x) => x.c);
}

export const allTags = (w: World) => [...new Set(w.communities.flatMap((c) => c.tags))].sort((a, b) => a.localeCompare(b));

export function leaveCommunity(w: World, userId: string, communityId: string) {
  w.communityMembers = w.communityMembers.filter((m) => !(m.communityId === communityId && m.userId === userId));
  const circleIds = new Set(circlesOf(w, communityId).map((c) => c.id));
  w.circleMembers = w.circleMembers.filter((m) => !(m.userId === userId && circleIds.has(m.circleId)));
}

export function approveMember(w: World, staffId: string, communityId: string, userId: string, approve: boolean, now: Date): boolean {
  if (!canModerateCommunity(w, staffId, communityId)) return false;
  const m = membershipOf(w, communityId, userId);
  if (!m || m.status !== 'pending') return false;
  const c = w.communities.find((x) => x.id === communityId)!;
  if (approve) {
    m.status = 'active';
    notify(w, userId, { kind: 'community', title: `You're in: ${c.name}`, body: 'Your request was approved. Say hi in the lounge.', href: `/community/${c.slug}`, key: `approved-${communityId}` }, now);
  } else {
    w.communityMembers = w.communityMembers.filter((x) => x !== m);
    notify(w, userId, { kind: 'community', title: `${c.name}: request not approved`, body: 'This one is not a fit right now. Try another community.', href: '/community', key: `declined-${communityId}-${now.getTime()}` }, now);
  }
  return true;
}

export function acceptCommunityGuidelines(w: World, userId: string, communityId: string, now: Date) {
  const m = membershipOf(w, communityId, userId);
  if (m) m.agreedAt = now.toISOString();
}

/** Join a Circle (needs an active community membership, an open Circle and a free seat). */
export function joinCircle(w: World, userId: string, circleId: string, now: Date): { ok: true } | { ok: false; error: string } {
  const c = w.circles.find((x) => x.id === circleId);
  if (!c) return { ok: false, error: 'Circle not found.' };
  if (isCircleMember(w, circleId, userId)) return { ok: true };
  if (!isActiveMember(w, c.communityId, userId)) return { ok: false, error: 'Join the community first (or wait for your request to be approved).' };
  if (!c.isOpen) return { ok: false, error: 'This Circle is closed to new members.' };
  if (circleMemberCount(w, circleId) >= c.capacity) return { ok: false, error: 'This Circle is full. Try another one.' };
  w.circleMembers.push({ circleId, userId, agreedAt: null, joinedAt: now.toISOString() });
  const ch = w.channels.find((x) => x.kind === 'circle' && x.refId === circleId);
  if (ch) w.messages.push({ id: `msg-${now.getTime()}-${userId}`, channelId: ch.id, userId: null, body: `${w.users[userId].displayName.split(' ')[0]} joined the Circle`, replyTo: null, kind: 'system', pinned: false, deleted: false, at: now.toISOString() });
  return { ok: true };
}

export function leaveCircle(w: World, userId: string, circleId: string) {
  w.circleMembers = w.circleMembers.filter((m) => !(m.circleId === circleId && m.userId === userId));
}

export function acceptCircleRules(w: World, userId: string, circleId: string, now: Date) {
  const m = w.circleMembers.find((x) => x.circleId === circleId && x.userId === userId);
  if (m) m.agreedAt = now.toISOString();
}
