import type { EarnedBadge, FeedPost, World } from '@/lib/world/types';
import { FEED_TEMPLATES } from '@/lib/content/community-data';
import { maskProfanity } from '@/lib/moderation/filter';
import { isActiveMember, myCommunities } from './community';
import { firstName, notify, uid } from './helpers';

/** The name a user is shown by: nickname if they set one, else first name. */
export const displayNameOf = (w: World, userId: string) => w.users[userId]?.nickname || firstName(w.users[userId]?.displayName ?? 'Someone');

/** Auto-posts milestones, only when the author opted in to sharing. Never includes amounts. */
export function postMilestones(w: World, userId: string, o: { badges: EarnedBadge[]; milestones: string[]; level: string | null; weeklyStreak: number | null }, now: Date) {
  const u = w.users[userId];
  if (!u?.shareMilestones) return;
  const name = displayNameOf(w, userId);
  const add = (kind: FeedPost['kind'], text: string, refSlug?: string) => w.feed.push({ id: uid('fp'), userId, communityId: null, kind, text, refSlug, at: now.toISOString() });
  o.badges.filter((b) => !['started', 'founding-member'].includes(b.slug)).forEach((b) => add('badge', FEED_TEMPLATES.badge(name, b.name), b.slug));
  o.milestones.forEach((m) => add('milestone', FEED_TEMPLATES.milestone(name, m)));
  if (o.level) add('level', FEED_TEMPLATES.level(name, o.level), o.level.toLowerCase());
  if (o.weeklyStreak && o.weeklyStreak >= 2) add('weekly', FEED_TEMPLATES.weekly(name, o.weeklyStreak));
}

export type FeedItem = FeedPost & { reactions: Record<string, string[]>; notes: { id: string; userId: string; body: string; at: string }[] };

/** A community's feed: its announcements plus milestones shared by its active members. */
export function feedFor(w: World, communityId: string): FeedItem[] {
  return w.feed
    .filter((p) => (p.communityId === communityId) || (p.communityId === null && p.kind !== 'announcement' && isActiveMember(w, communityId, p.userId)))
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.at.localeCompare(a.at))
    .map((p) => ({
      ...p,
      reactions: w.feedReactions.filter((r) => r.postId === p.id).reduce<Record<string, string[]>>((acc, r) => { (acc[r.emoji] ??= []).push(r.userId); return acc; }, {}),
      notes: w.feedNotes.filter((n) => n.postId === p.id).sort((a, b) => a.at.localeCompare(b.at)),
    }));
}

export function reactToPost(w: World, userId: string, postId: string, emoji: string, now: Date) {
  const i = w.feedReactions.findIndex((r) => r.postId === postId && r.userId === userId && r.emoji === emoji);
  if (i >= 0) { w.feedReactions.splice(i, 1); return; }
  w.feedReactions.push({ postId, userId, emoji });
  const post = w.feed.find((p) => p.id === postId);
  if (post && post.userId !== userId && !w.users[post.userId]?.sim) notify(w, post.userId, { kind: 'reaction', title: `${displayNameOf(w, userId)} reacted ${emoji}`, body: post.text, href: '/community', key: `react-${postId}-${userId}-${emoji}` }, now);
}

export function addNote(w: World, userId: string, postId: string, body: string, now: Date): boolean {
  const text = maskProfanity(body.trim().slice(0, 140));
  if (!text) return false;
  w.feedNotes.push({ id: uid('fn'), postId, userId, body: text, at: now.toISOString() });
  const post = w.feed.find((p) => p.id === postId);
  if (post && post.userId !== userId && !w.users[post.userId]?.sim) notify(w, post.userId, { kind: 'note', title: `${displayNameOf(w, userId)} left you a note`, body: text, href: '/community', key: `note-${postId}-${userId}-${text}` }, now);
  return true;
}

/** Staff announcement pinned to a community feed. */
export function postAnnouncement(w: World, userId: string, communityId: string, text: string, now: Date, pinned = false) {
  const t = text.trim().slice(0, 300);
  if (t) w.feed.push({ id: uid('fp'), userId, communityId, kind: 'announcement', text: t, pinned, at: now.toISOString() });
}

/** The one-time "Share your milestones?" prompt shows after the first badge. */
export const shouldAskShare = (w: World, userId: string) => !w.users[userId].shareMilestones && !w.askedShare[userId] && w.userBadges.some((b) => b.userId === userId);
export const communitiesWithFeed = (w: World, userId: string) => myCommunities(w, userId);
