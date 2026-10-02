import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/admin';
import { ChatRoom } from '@/components/chat-room';

export const dynamic = 'force-dynamic';

export default async function CircleChat({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data: member } = await supabase.from('circle_members').select('agreed_rules_at').eq('circle_id', id).eq('user_id', user.id).maybeSingle();
  if (!member) redirect(`/circles/${id}`);

  // one channel per Circle, created on first visit
  const db = adminClient();
  let { data: channel } = await db.from('channels').select('id').eq('circle_id', id).eq('kind', 'circle').maybeSingle();
  if (!channel) ({ data: channel } = await db.from('channels').insert({ kind: 'circle', circle_id: id }).select('id').single());
  const channelId = channel!.id;

  const [{ data: circle }, { data: messages }, { data: people }, { data: prof }] = await Promise.all([
    supabase.from('circles').select('name,facilitator_id').eq('id', id).single(),
    supabase.from('messages').select('id,channel_id,user_id,body,reply_to,kind,pinned,deleted_at,created_at').eq('channel_id', channelId).order('created_at', { ascending: false }).limit(50),
    supabase.rpc('channel_people', { p_channel: channelId }),
    supabase.from('profiles').select('role').eq('id', user.id).single(),
  ]);
  const ids = (messages ?? []).map((m) => m.id);
  const { data: reactions } = ids.length ? await supabase.from('message_reactions').select('message_id,user_id,emoji').in('message_id', ids) : { data: [] };
  const canModerate = ['pps_admin', 'community_admin', 'facilitator'].includes(prof?.role ?? '') || circle?.facilitator_id === user.id;

  return (
    <div>
      <Link href={`/circles/${id}`} className="text-sm text-pink-700">← {circle?.name}</Link>
      <ChatRoom
        channelId={channelId} circleId={id} userId={user.id} agreed={!!member.agreed_rules_at} canModerate={canModerate}
        initialMessages={(messages ?? []).reverse()} initialReactions={reactions ?? []} people={(people ?? []) as any}
      />
    </div>
  );
}
