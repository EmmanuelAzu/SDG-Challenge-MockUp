import type { Channel, Message, World } from '@/lib/world/types';
import { maskProfanity, mentionsHarm } from '@/lib/moderation/filter';
import { CHAT_EMOJI } from '@/lib/content/community-data';
import { canModerateCommunity, isActiveMember, isCircleMember, membershipOf } from './community';
import { uid } from './helpers';

export const RATE_LIMIT_PER_MINUTE = 10;
export const MAX_LENGTH = 1000;

export const circleChannel = (w: World, circleId: string): Channel | undefined => w.channels.find((c) => c.kind === 'circle' && c.refId === circleId);
export const communityChannel = (w: World, communityId: string): Channel | undefined => w.channels.find((c) => c.kind === 'community' && c.refId === communityId);

/** Creates the channel on first use (a Circle or community created after the seed has none yet). */
export function ensureChannel(w: World, kind: Channel['kind'], refId: string): Channel {
  let ch = w.channels.find((c) => c.kind === kind && c.refId === refId);
  if (!ch) { ch = { id: `chan-${refId}`, kind, refId }; w.channels.push(ch); }
  return ch;
}

export function canAccess(w: World, userId: string, ch: Channel): boolean {
  if (ch.kind === 'circle') return isCircleMember(w, ch.refId, userId);
  if (ch.kind === 'community') return isActiveMember(w, ch.refId, userId);
  return w.buddies.some((p) => p.id === ch.refId && p.status === 'active' && (p.inviterId === userId || p.inviteeId === userId));
}

/** The agreement everyone accepts before their first message in a Circle (or the community lounge). */
export function needsAgreement(w: World, userId: string, ch: Channel): boolean {
  if (ch.kind === 'circle') return !w.circleMembers.find((m) => m.circleId === ch.refId && m.userId === userId)?.agreedAt;
  if (ch.kind === 'community') return !membershipOf(w, ch.refId, userId)?.agreedAt;
  return false;
}

export function canModerateChannel(w: World, userId: string, ch: Channel): boolean {
  const u = w.users[userId];
  if (!u) return false;
  if (u.role === 'pps_admin' || u.role === 'community_admin') return true;
  if (ch.kind === 'circle') return w.circles.find((c) => c.id === ch.refId)?.facilitatorId === userId;
  if (ch.kind === 'community') return canModerateCommunity(w, userId, ch.refId);
  return false;
}

export const mutedUntil = (w: World, userId: string, channelId: string, now: Date) => w.mutes.find((m) => m.userId === userId && m.channelId === channelId && m.until > now.toISOString())?.until ?? null;

export type SendResult = { ok: true; message: Message; harm: boolean } | { ok: false; error: string };

export function sendMessage(w: World, userId: string, channelId: string, body: string, replyTo: string | null, now: Date): SendResult {
  const ch = w.channels.find((c) => c.id === channelId);
  const text = body.trim();
  if (!ch || !canAccess(w, userId, ch)) return { ok: false, error: 'You are not in this chat.' };
  if (!text) return { ok: false, error: 'Write a message first.' };
  if (text.length > MAX_LENGTH) return { ok: false, error: `Keep it under ${MAX_LENGTH} characters.` };
  if (needsAgreement(w, userId, ch)) return { ok: false, error: 'Please accept the agreement first.' };
  if (mutedUntil(w, userId, channelId, now)) return { ok: false, error: 'You are muted in this chat for now. A facilitator can tell you more.' };
  const recent = w.messages.filter((m) => m.userId === userId && m.kind === 'user' && new Date(m.at).getTime() > now.getTime() - 60_000).length;
  if (recent >= RATE_LIMIT_PER_MINUTE) return { ok: false, error: `Slow down a little. You can send ${RATE_LIMIT_PER_MINUTE} messages a minute.` };
  const message: Message = { id: uid('msg'), channelId, userId, body: maskProfanity(text), replyTo: replyTo && w.messages.some((m) => m.id === replyTo && m.channelId === channelId) ? replyTo : null, kind: 'user', pinned: false, deleted: false, at: now.toISOString() };
  w.messages.push(message);
  w.reads[`${userId}:${channelId}`] = now.toISOString();
  return { ok: true, message, harm: mentionsHarm(text) };
}

export function toggleReaction(w: World, userId: string, messageId: string, emoji: string): boolean {
  const m = w.messages.find((x) => x.id === messageId);
  const ch = m && w.channels.find((c) => c.id === m.channelId);
  if (!m || !ch || !canAccess(w, userId, ch) || !(CHAT_EMOJI as readonly string[]).includes(emoji)) return false;
  const i = w.reactions.findIndex((r) => r.messageId === messageId && r.userId === userId && r.emoji === emoji);
  if (i >= 0) w.reactions.splice(i, 1); else w.reactions.push({ messageId, userId, emoji });
  return true;
}

export function reportMessage(w: World, userId: string, messageId: string, reason: string, now: Date): boolean {
  const m = w.messages.find((x) => x.id === messageId);
  const ch = m && w.channels.find((c) => c.id === m.channelId);
  if (!m || !ch || !canAccess(w, userId, ch) || !reason.trim()) return false;
  w.reports.push({ id: uid('rep'), messageId, reporterId: userId, reason: reason.trim().slice(0, 300), status: 'open', at: now.toISOString() });
  return true;
}

export function blockUser(w: World, blockerId: string, blockedId: string) {
  if (blockerId !== blockedId && !w.blocks.some((b) => b.blockerId === blockerId && b.blockedId === blockedId)) w.blocks.push({ blockerId, blockedId });
  w.friendships = w.friendships.filter((f) => !((f.fromId === blockerId && f.toId === blockedId) || (f.fromId === blockedId && f.toId === blockerId)));
}
export const unblockUser = (w: World, blockerId: string, blockedId: string) => { w.blocks = w.blocks.filter((b) => !(b.blockerId === blockerId && b.blockedId === blockedId)); };

/** Facilitator tools: delete, pin/unpin, and a 24 hour mute of the author. */
export function moderate(w: World, staffId: string, messageId: string, action: 'delete' | 'pin' | 'unpin' | 'mute', now: Date): boolean {
  const m = w.messages.find((x) => x.id === messageId);
  const ch = m && w.channels.find((c) => c.id === m.channelId);
  if (!m || !ch || !canModerateChannel(w, staffId, ch)) return false;
  if (action === 'delete') m.deleted = true;
  if (action === 'pin') m.pinned = true;
  if (action === 'unpin') m.pinned = false;
  if (action === 'mute' && m.userId) {
    w.mutes = w.mutes.filter((x) => !(x.channelId === ch.id && x.userId === m.userId));
    w.mutes.push({ channelId: ch.id, userId: m.userId, until: new Date(now.getTime() + 24 * 3600_000).toISOString() });
  }
  return true;
}

export function resolveReport(w: World, staffId: string, reportId: string, action: 'dismiss' | 'delete' | 'mute', now: Date): boolean {
  const r = w.reports.find((x) => x.id === reportId);
  if (!r) return false;
  const ok = action === 'dismiss' ? (() => { const m = w.messages.find((x) => x.id === r.messageId); const ch = m && w.channels.find((c) => c.id === m.channelId); return !!ch && canModerateChannel(w, staffId, ch); })() : moderate(w, staffId, r.messageId, action, now);
  if (ok) r.status = action === 'dismiss' ? 'dismissed' : 'actioned';
  return ok;
}

export const markRead = (w: World, userId: string, channelId: string, now: Date) => { w.reads[`${userId}:${channelId}`] = now.toISOString(); };
export function unreadCount(w: World, userId: string, ch: Channel): number {
  // before they ever open a chat, only messages since they joined count as unread
  const joined = ch.kind === 'circle' ? w.circleMembers.find((m) => m.circleId === ch.refId && m.userId === userId)?.joinedAt : membershipOf(w, ch.refId, userId)?.joinedAt;
  const since = w.reads[`${userId}:${ch.id}`] ?? joined ?? '';
  const blocked = new Set(w.blocks.filter((b) => b.blockerId === userId).map((b) => b.blockedId));
  return w.messages.filter((m) => m.channelId === ch.id && m.userId !== userId && m.at > since && !m.deleted && !(m.userId && blocked.has(m.userId))).length;
}
