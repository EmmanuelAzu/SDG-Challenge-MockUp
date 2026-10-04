'use client';
import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Users } from 'lucide-react';
import { useApp } from '@/components/shell/app-context';
import { Avatar } from '@/components/community/avatar';
import { circleChannel, unreadCount } from '@/lib/engine/chat';
import { circleMemberCount, circlesOf, isActiveMember, isCircleMember, joinCircle, leaveCircle } from '@/lib/engine/community';
import { WEEKDAYS } from '@/lib/format';
import { update } from '@/lib/world/store';

export function CirclesTab({ communityId }: { communityId: string }) {
  const { w, me } = useApp();
  const [msg, setMsg] = useState<Record<string, string>>({});
  const circles = circlesOf(w, communityId);
  const member = isActiveMember(w, communityId, me.id);
  if (!circles.length) return <p className="mt-6 rounded-card bg-white p-6 text-center text-plum-500 ring-1 ring-pink-100">No Circles here yet. Ask a community admin to start one.</p>;
  return (
    <ul className="mt-4 space-y-3">
      {circles.map((c) => {
        const count = circleMemberCount(w, c.id);
        const full = count >= c.capacity;
        const mine = isCircleMember(w, c.id, me.id);
        const fac = w.users[c.facilitatorId];
        const ch = circleChannel(w, c.id);
        const unread = ch && mine ? unreadCount(w, me.id, ch) : 0;
        return (
          <li key={c.id} className="rounded-card bg-white p-4 ring-1 ring-pink-100">
            <div className="flex items-start gap-3">
              <Avatar name={fac?.displayName ?? '?'} color={fac?.color ?? '#D81B60'} size={40} />
              <div className="min-w-0 flex-1">
                <Link href={`/circles/${c.id}`} className="font-display text-lg font-semibold hover:underline">{c.name}</Link>
                <p className="text-sm text-plum-500">{c.topic}</p>
                <p className="mt-1 text-sm">with {fac?.nickname || fac?.displayName.split(' ')[0]} · {WEEKDAYS[c.weekday]}s {c.startTime}</p>
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-pink-700"><Users size={13} /> {count}/{c.capacity} seats{full ? ' · full' : ` · ${c.capacity - count} left`}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              {mine ? <Link href={`/circles/${c.id}/chat`} className="flex items-center gap-1 text-sm font-semibold text-pink-700"><MessageCircle size={16} /> Open chat{unread > 0 && <span className="ml-1 rounded-full bg-pink-600 px-2 py-0.5 text-xs text-white">{unread}</span>}</Link> : <Link href={`/circles/${c.id}`} className="text-sm font-semibold text-pink-700">See details</Link>}
              {mine ? (
                <button onClick={() => update((x) => leaveCircle(x, me.id, c.id))} className="rounded-full px-3 py-1 text-xs font-semibold text-plum-500 ring-1 ring-pink-300">Leave</button>
              ) : (
                <button disabled={!member || full} onClick={() => { const r = update((x, n) => joinCircle(x, me.id, c.id, n)); setMsg((m) => ({ ...m, [c.id]: r.ok ? '' : r.error })); }} className="rounded-full bg-pink-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">{full ? 'Full' : 'Join Circle'}</button>
              )}
            </div>
            {!member && !mine && <p className="mt-2 text-xs text-plum-500">Join the community first to join a Circle.</p>}
            {msg[c.id] && <p role="alert" className="mt-2 text-xs text-coral-600">{msg[c.id]}</p>}
          </li>
        );
      })}
    </ul>
  );
}
