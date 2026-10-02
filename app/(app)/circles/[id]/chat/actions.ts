'use server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/admin';
import { maskProfanity, mentionsHarm } from '@/lib/moderation/filter';

const MSG_COLUMNS = 'id,channel_id,user_id,body,reply_to,kind,pinned,deleted_at,created_at';
const uuid = z.string().uuid();

export async function acceptRules(circleId: string) {
  const { user } = await requireUser();
  await adminClient().from('circle_members').update({ agreed_rules_at: new Date().toISOString() }).eq('circle_id', uuid.parse(circleId)).eq('user_id', user.id);
}

export type SendResult = { ok: true; message: any; harm: boolean } | { ok: false; error: string };

export async function sendMessage(raw: { channelId: string; body: string; replyTo?: string | null }): Promise<SendResult> {
  const v = z.object({ channelId: uuid, body: z.string().trim().min(1).max(1000), replyTo: uuid.nullish() }).safeParse(raw);
  if (!v.success) return { ok: false, error: 'Write a message first (up to 1000 characters).' };
  const { supabase, user } = await requireUser();
  const db = adminClient();

  // membership is enforced by RLS on this read
  const { data: ch } = await supabase.from('channels').select('id,kind,circle_id').eq('id', v.data.channelId).maybeSingle();
  if (!ch) return { ok: false, error: 'You are not in this chat.' };
  if (ch.kind === 'circle') {
    const { data: m } = await db.from('circle_members').select('agreed_rules_at').eq('circle_id', ch.circle_id).eq('user_id', user.id).maybeSingle();
    if (!m?.agreed_rules_at) return { ok: false, error: 'Please accept the Circle agreement first.' };
  }
  const { data: mute } = await db.from('mutes').select('until').eq('channel_id', ch.id).eq('user_id', user.id).gt('until', new Date().toISOString()).maybeSingle();
  if (mute) return { ok: false, error: 'You are muted in this chat for now. A facilitator can tell you more.' };
  const { count } = await db.from('messages').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', new Date(Date.now() - 60_000).toISOString());
  if ((count ?? 0) >= 10) return { ok: false, error: 'Slow down a little. You can send 10 messages a minute.' };

  const { data, error } = await db.from('messages').insert({ channel_id: ch.id, user_id: user.id, body: maskProfanity(v.data.body), reply_to: v.data.replyTo ?? null }).select(MSG_COLUMNS).single();
  if (error) return { ok: false, error: 'Could not send that. Try again.' };
  return { ok: true, message: data, harm: mentionsHarm(v.data.body) };
}

export async function toggleReaction(messageId: string, emoji: string): Promise<boolean> {
  const id = uuid.parse(messageId);
  const e = z.enum(['👍', '💗', '🔥', '👏', '😂']).parse(emoji);
  const { supabase, user } = await requireUser();
  const { data: msg } = await supabase.from('messages').select('id').eq('id', id).maybeSingle(); // RLS: must be in channel
  if (!msg) return false;
  const db = adminClient();
  const { data: had } = await db.from('message_reactions').select('emoji').eq('message_id', id).eq('user_id', user.id).eq('emoji', e).maybeSingle();
  if (had) await db.from('message_reactions').delete().eq('message_id', id).eq('user_id', user.id).eq('emoji', e);
  else await db.from('message_reactions').insert({ message_id: id, user_id: user.id, emoji: e });
  return !had;
}

export async function reportMessage(messageId: string, reason: string) {
  const { supabase, user } = await requireUser();
  const id = uuid.parse(messageId);
  const { data: msg } = await supabase.from('messages').select('id').eq('id', id).maybeSingle();
  if (!msg) return;
  await adminClient().from('message_reports').insert({ message_id: id, reporter_id: user.id, reason: z.string().trim().min(1).max(300).parse(reason) });
}

export async function blockUser(blockedId: string) {
  const { user } = await requireUser();
  const id = uuid.parse(blockedId);
  if (id === user.id) return;
  await adminClient().from('user_blocks').upsert({ blocker_id: user.id, blocked_id: id }, { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true });
}

async function canModerate(userId: string, channelId: string) {
  const db = adminClient();
  const [{ data: p }, { data: ch }] = await Promise.all([
    db.from('profiles').select('role').eq('id', userId).single(),
    db.from('channels').select('circle_id,circles(facilitator_id,community_id)').eq('id', channelId).single(),
  ]);
  if (p && ['pps_admin', 'community_admin', 'facilitator'].includes(p.role)) return true;
  return (ch as any)?.circles?.facilitator_id === userId;
}

/** Facilitator tools: delete, pin/unpin, and a 24h mute of the message's author. */
export async function moderate(raw: { messageId: string; action: 'delete' | 'pin' | 'unpin' | 'mute' }) {
  const v = z.object({ messageId: uuid, action: z.enum(['delete', 'pin', 'unpin', 'mute']) }).parse(raw);
  const { user } = await requireUser();
  const db = adminClient();
  const { data: msg } = await db.from('messages').select('id,channel_id,user_id').eq('id', v.messageId).single();
  if (!msg || !(await canModerate(user.id, msg.channel_id))) throw new Error('Not allowed');
  if (v.action === 'delete') await db.from('messages').update({ deleted_at: new Date().toISOString() }).eq('id', msg.id);
  if (v.action === 'pin' || v.action === 'unpin') await db.from('messages').update({ pinned: v.action === 'pin' }).eq('id', msg.id);
  if (v.action === 'mute' && msg.user_id) await db.from('mutes').upsert({ channel_id: msg.channel_id, user_id: msg.user_id, until: new Date(Date.now() + 24 * 3600_000).toISOString() });
}

export async function loadPeople(channelId: string): Promise<{ user_id: string; name: string }[]> {
  const { supabase } = await requireUser();
  const { data } = await supabase.rpc('channel_people', { p_channel: uuid.parse(channelId) });
  return (data ?? []) as any;
}
