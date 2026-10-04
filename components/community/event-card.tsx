'use client';
import Link from 'next/link';
import { MapPin, Users, Video } from 'lucide-react';
import { useApp } from '@/components/shell/app-context';
import { bookingOf, isPast, spotsLeft, waitlistSize } from '@/lib/engine/events';
import { fmtDateTime } from '@/lib/format';
import type { SisiEvent } from '@/lib/world/types';

export const TYPE_LABEL: Record<SisiEvent['type'], string> = { workshop: 'Workshop', expert_qa: 'Expert Q&A', oweek: 'O-Week', meetup: 'Meetup' };
export const TYPE_COLOR: Record<SisiEvent['type'], string> = { workshop: 'bg-lavender-100 text-lavender-600', expert_qa: 'bg-mint-100 text-mint-700', oweek: 'bg-gold-500/25 text-plum-900', meetup: 'bg-pink-100 text-pink-700' };

export function EventStatus({ e }: { e: SisiEvent }) {
  const { w, me, now } = useApp();
  const b = bookingOf(w, e.id, me.id);
  const left = spotsLeft(w, e);
  if (isPast(e, now)) return <span className="rounded-full bg-plum-500/10 px-2 py-0.5 text-xs font-semibold text-plum-500">{b?.status === 'checked_in' ? 'Attended' : 'Finished'}</span>;
  if (b?.status === 'booked') return <span className="rounded-full bg-mint-100 px-2 py-0.5 text-xs font-semibold text-mint-700">You’re booked ✓</span>;
  if (b?.status === 'waitlisted') return <span className="rounded-full bg-lavender-100 px-2 py-0.5 text-xs font-semibold text-lavender-600">Waitlist #{b.waitlistPosition}</span>;
  if (left === 0) return <span className="rounded-full bg-coral-600/10 px-2 py-0.5 text-xs font-semibold text-coral-600">Full · {waitlistSize(w, e.id)} waiting</span>;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${left <= 3 ? 'bg-gold-500/25 text-plum-900' : 'bg-pink-100 text-pink-700'}`}>{left <= 3 ? `Only ${left} left` : `${left} spots left`}</span>;
}

export function EventCard({ e }: { e: SisiEvent }) {
  const { w } = useApp();
  const community = e.communityId ? w.communities.find((c) => c.id === e.communityId) : null;
  return (
    <li>
      <Link href={`/events/${e.id}`} className="flex gap-3 rounded-card bg-white p-4 ring-1 ring-pink-100 hover:ring-pink-300">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-card bg-pink-50 text-2xl" aria-hidden>{e.emoji}</span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TYPE_COLOR[e.type]}`}>{TYPE_LABEL[e.type]}</span>{community && <span className="text-[11px] text-plum-500">{community.name}</span>}</span>
          <b className="mt-1 block font-display text-lg leading-snug">{e.title}</b>
          <span className="block text-sm text-plum-500">{fmtDateTime(e.startsAt)}</span>
          <span className="mt-1 flex items-center gap-3 text-xs text-plum-500">{e.online ? <span className="flex items-center gap-1"><Video size={12} /> Online</span> : <span className="flex items-center gap-1"><MapPin size={12} /> In person</span>}<span className="flex items-center gap-1"><Users size={12} /> {e.capacity} seats</span></span>
          <span className="mt-2 block"><EventStatus e={e} /></span>
        </span>
      </Link>
    </li>
  );
}
