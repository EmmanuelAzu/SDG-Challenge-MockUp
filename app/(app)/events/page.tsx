'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Search, Ticket } from 'lucide-react';
import { EventCard, TYPE_LABEL } from '@/components/community/event-card';
import { useApp } from '@/components/shell/app-context';
import { bookingOf, isPast } from '@/lib/engine/events';
import type { EventType } from '@/lib/world/types';

const TYPES: [EventType | '', string][] = [['', 'All'], ['workshop', 'Workshops'], ['expert_qa', 'Expert Q&A'], ['oweek', 'O-Week'], ['meetup', 'Meetups']];

export default function Events() {
  const { w, me, now } = useApp();
  const [q, setQ] = useState('');
  const [type, setType] = useState<EventType | ''>('');
  const [mine, setMine] = useState(false);
  const term = q.trim().toLowerCase();
  const list = w.events.filter((e) => e.published && (!type || e.type === type) && (!mine || bookingOf(w, e.id, me.id)) && (!term || `${e.title} ${e.description} ${e.hostName} ${w.communities.find((c) => c.id === e.communityId)?.name ?? ''} ${TYPE_LABEL[e.type]}`.toLowerCase().includes(term))).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const upcoming = list.filter((e) => !isPast(e, now));
  const past = list.filter((e) => isPast(e, now)).reverse();
  const tickets = w.bookings.filter((b) => b.userId === me.id && (b.status === 'booked' || b.status === 'waitlisted') && !isPast(w.events.find((e) => e.id === b.eventId)!, now)).length;
  const chip = (on: boolean) => `whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium ${on ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-700'}`;
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Events</h1>
      <p className="text-plum-500">Free workshops, expert Q&As and meetups. Book in two taps.</p>
      <div className="relative mt-4"><Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-plum-500" aria-hidden /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events, hosts or communities" aria-label="Search events" className="w-full rounded-input border border-pink-300 bg-white py-3 pl-10 pr-3" /></div>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {TYPES.map(([t, label]) => <button key={t} onClick={() => setType(t)} aria-pressed={type === t} className={chip(type === t)}>{label}</button>)}
        <button onClick={() => setMine(!mine)} aria-pressed={mine} className={chip(mine)}><Ticket size={13} className="mr-1 inline" />My bookings{tickets ? ` (${tickets})` : ''}</button>
      </div>
      <ul className="mt-4 space-y-3">{upcoming.map((e) => <EventCard key={e.id} e={e} />)}</ul>
      {!upcoming.length && <p className="mt-6 rounded-card bg-white p-6 text-center text-plum-500 ring-1 ring-pink-100">{mine ? 'You have no upcoming bookings yet. Book an event and your ticket shows up here.' : 'No events match. Try a different search.'}</p>}
      {past.length > 0 && <details className="mt-6"><summary className="cursor-pointer text-sm font-semibold text-plum-500">Past events ({past.length})</summary><ul className="mt-3 space-y-3">{past.map((e) => <EventCard key={e.id} e={e} />)}</ul></details>}
      <p className="mt-6 text-sm"><Link href="/calendar" className="font-semibold text-pink-700">See everything on the calendar →</Link></p>
    </div>
  );
}
