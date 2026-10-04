import type { FeedPost, Friendship, World } from '@/lib/world/types';
import { displayNameOf } from './feed';
import { notify, uid } from './helpers';

export const MAX_FRIENDS = 100;
export type Relation = 'friends' | 'sent' | 'received' | 'none';

const between = (f: Friendship, a: string, b: string) => (f.fromId === a && f.toId === b) || (f.fromId === b && f.toId === a);
export const friendshipOf = (w: World, a: string, b: string) => w.friendships.find((f) => between(f, a, b));
export const relation = (w: World, me: string, other: string): Relation => {
  const f = friendshipOf(w, me, other);
  return !f ? 'none' : f.status === 'accepted' ? 'friends' : f.fromId === me ? 'sent' : 'received';
};
export const friendIds = (w: World, userId: string) => w.friendships.filter((f) => f.status === 'accepted' && (f.fromId === userId || f.toId === userId)).map((f) => (f.fromId === userId ? f.toId : f.fromId));
export const incoming = (w: World, userId: string) => w.friendships.filter((f) => f.status === 'pending' && f.toId === userId);
export const outgoing = (w: World, userId: string) => w.friendships.filter((f) => f.status === 'pending' && f.fromId === userId);
const isBlocked = (w: World, a: string, b: string) => w.blocks.some((x) => (x.blockerId === a && x.blockedId === b) || (x.blockerId === b && x.blockedId === a));

/** Search by nickname or first name (2+ letters). Only members are findable, never amounts or emails. */
export function findPeople(w: World, userId: string, query: string): string[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return Object.values(w.users)
    .filter((u) => u.id !== userId && (u.sim || (u.role === 'member' && u.onboardedAt)) && !isBlocked(w, userId, u.id) && ((u.nickname || '').toLowerCase().includes(q) || u.displayName.split(' ')[0].toLowerCase().startsWith(q)))
    .map((u) => u.id).slice(0, 8);
}

type R = { ok: true; status: 'pending' | 'accepted' } | { ok: false; error: string };

export function requestFriend(w: World, fromId: string, toId: string, now: Date): R {
  const to = w.users[toId];
  if (!to || fromId === toId) return { ok: false, error: 'Pick someone else.' };
  if (isBlocked(w, fromId, toId)) return { ok: false, error: 'You can’t send a request to this person.' };
  const existing = friendshipOf(w, fromId, toId);
  if (existing?.status === 'accepted') return { ok: false, error: 'You are already friends.' };
  if (existing) {
    if (existing.toId === fromId) { acceptFriend(w, fromId, existing.id, now); return { ok: true, status: 'accepted' }; }
    return { ok: false, error: 'Request already sent.' };
  }
  if (friendIds(w, fromId).length >= MAX_FRIENDS) return { ok: false, error: 'Your Letterbox is full.' };
  const f: Friendship = { id: uid('fr'), fromId, toId, status: to.sim ? 'accepted' : 'pending', at: now.toISOString() };
  w.friendships.push(f);
  if (!to.sim) notify(w, toId, { kind: 'friend', title: 'New friend request', body: `${displayNameOf(w, fromId)} would like to be Letterbox friends.`, href: '/letterbox', key: `friend-req-${f.id}` }, now);
  return { ok: true, status: f.status };
}

export function acceptFriend(w: World, userId: string, friendshipId: string, now: Date): boolean {
  const f = w.friendships.find((x) => x.id === friendshipId && x.toId === userId && x.status === 'pending');
  if (!f) return false;
  f.status = 'accepted';
  if (!w.users[f.fromId]?.sim) notify(w, f.fromId, { kind: 'friend', title: 'You are now friends', body: `${displayNameOf(w, userId)} accepted your request.`, href: '/letterbox', key: `friend-ok-${f.id}` }, now);
  return true;
}
export function declineFriend(w: World, userId: string, friendshipId: string) {
  w.friendships = w.friendships.filter((f) => !(f.id === friendshipId && f.toId === userId && f.status === 'pending'));
}
export function removeFriend(w: World, userId: string, otherId: string) {
  w.friendships = w.friendships.filter((f) => !between(f, userId, otherId));
}
export function cancelRequest(w: World, userId: string, friendshipId: string) {
  w.friendships = w.friendships.filter((f) => !(f.id === friendshipId && f.fromId === userId && f.status === 'pending'));
}

/** Invite link: opening it and accepting makes you friends straight away (the link is the inviter's consent). */
export const inviterByCode = (w: World, code: string) => Object.values(w.users).find((u) => u.referralCode === code && !u.sim);
export function acceptByCode(w: World, userId: string, code: string, now: Date): R {
  const inviter = inviterByCode(w, code);
  if (!inviter) return { ok: false, error: 'This link is no longer valid.' };
  if (inviter.id === userId) return { ok: false, error: 'This is your own link. Send it to a friend.' };
  if (isBlocked(w, userId, inviter.id)) return { ok: false, error: 'You can’t connect with this person.' };
  const existing = friendshipOf(w, userId, inviter.id);
  if (existing?.status === 'accepted') return { ok: false, error: 'You are already friends.' };
  if (existing) existing.status = 'accepted';
  else w.friendships.push({ id: uid('fr'), fromId: inviter.id, toId: userId, status: 'accepted', at: now.toISOString() });
  notify(w, inviter.id, { kind: 'friend', title: 'A friend joined your Letterbox', body: `${displayNameOf(w, userId)} used your link.`, href: '/letterbox', key: `friend-link-${userId}` }, now);
  return { ok: true, status: 'accepted' };
}

/** Friends' (and your own) shared milestones, newest first. Posts only exist for authors who opted in. Never any amounts. */
export function letterboxFeed(w: World, userId: string) {
  const ids = new Set([userId, ...friendIds(w, userId)]);
  const blocked = new Set(w.blocks.filter((b) => b.blockerId === userId).map((b) => b.blockedId));
  return w.feed
    .filter((p) => p.communityId === null && p.kind !== 'announcement' && ids.has(p.userId))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 60)
    .map((p: FeedPost) => ({
      ...p,
      reactions: w.feedReactions.filter((r) => r.postId === p.id).reduce<Record<string, string[]>>((acc, r) => { (acc[r.emoji] ??= []).push(r.userId); return acc; }, {}),
      notes: w.feedNotes.filter((n) => n.postId === p.id && !blocked.has(n.userId)).sort((a, b) => a.at.localeCompare(b.at)),
    }));
}

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
const EMOJI = ['💗', '👏', '🔥', '🌱'];
const NOTES = ['So proud of you!', 'Love this 💗', 'Go girl!', 'Keep going, sisi!'];

/** Simulated friends react to a person's new posts (once per post per friend, deterministic). */
export function simFriendActivity(w: World, now: Date) {
  const day = 86400_000;
  for (const p of w.feed) {
    const author = w.users[p.userId];
    if (!author || author.sim || p.communityId !== null || p.kind === 'announcement') continue;
    if (now.getTime() - new Date(p.at).getTime() > 3 * day) continue;
    for (const fid of friendIds(w, p.userId)) {
      if (!w.users[fid]?.sim || hash(`${p.id}:${fid}`) % 3 !== 0) continue;
      if (w.feedReactions.some((r) => r.postId === p.id && r.userId === fid)) continue;
      const emoji = EMOJI[hash(`${p.id}:${fid}:e`) % EMOJI.length];
      w.feedReactions.push({ postId: p.id, userId: fid, emoji });
      notify(w, p.userId, { kind: 'reaction', title: `${displayNameOf(w, fid)} reacted ${emoji}`, body: p.text, href: '/letterbox', key: `react-${p.id}-${fid}-${emoji}` }, now);
      if (hash(`${p.id}:${fid}:n`) % 2 === 0) { w.feedNotes.push({ id: uid('fn'), postId: p.id, userId: fid, body: NOTES[hash(`${p.id}:${fid}:t`) % NOTES.length], at: now.toISOString() }); }
    }
  }
}
