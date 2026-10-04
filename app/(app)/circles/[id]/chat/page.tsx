'use client';
import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ChatRoom } from '@/components/community/chat-room';
import { useApp } from '@/components/shell/app-context';
import { circleChannel, ensureChannel } from '@/lib/engine/chat';
import { isCircleMember } from '@/lib/engine/community';
import { update } from '@/lib/world/store';

export default function CircleChat() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { w, me } = useApp();
  const c = w.circles.find((x) => x.id === id);
  const ch = c && circleChannel(w, c.id);
  const member = !!c && isCircleMember(w, id, me.id);
  useEffect(() => { if (c && member && !ch) update((x) => { ensureChannel(x, 'circle', c.id); }); }, [c, member, ch]);
  useEffect(() => { if (c && !member) router.replace(`/circles/${id}`); }, [c, member, id, router]);
  if (!c) notFound();
  return (
    <div>
      <Link href={`/circles/${id}`} className="text-sm text-pink-700">← {c.name}</Link>
      {ch && member && <ChatRoom channelId={ch.id} />}
    </div>
  );
}
