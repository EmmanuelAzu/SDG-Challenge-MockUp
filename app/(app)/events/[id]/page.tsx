'use client';
import { useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { CalendarPlus, Download, MapPin, Video } from 'lucide-react';
import { useCelebrate } from '@/components/celebration/provider';
import { EventStatus, TYPE_COLOR, TYPE_LABEL } from '@/components/community/event-card';
import { Scanner } from '@/components/community/scanner';
import { useApp } from '@/components/shell/app-context';
import { bookEvent, bookingOf, cancelBooking, canManageEvent, checkIn, findBookingByCode, googleCalendarUrl, icsFile, isPast, spotsLeft, takenSeats, waitlistSize } from '@/lib/engine/events';
import { fmtDate, fmtTime } from '@/lib/format';
import { update } from '@/lib/world/store';

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const { w, me, now } = useApp();
  const celebrate = useCelebrate();
  const [msg, setMsg] = useState('');
  const [code, setCode] = useState('');
  const e = w.events.find((x) => x.id === id);
  if (!e) notFound();
  const community = e.communityId ? w.communities.find((c) => c.id === e.communityId) : null;
  const b = bookingOf(w, e.id, me.id);
  const past = isPast(e, now);
  const taken = takenSeats(w, e.id);
  const left = spotsLeft(w, e);
  const manage = canManageEvent(w, me.id);
  const roster = w.bookings.filter((x) => x.eventId === e.id && x.status !== 'cancelled').sort((p, q) => Number(p.status === 'waitlisted') - Number(q.status === 'waitlisted') || (p.waitlistPosition ?? 0) - (q.waitlistPosition ?? 0));

  const book = () => { const r = update((x, n) => bookEvent(x, me.id, e.id, n)); setMsg(r.ok ? (r.status === 'booked' ? 'Booked! Your ticket is ready.' : `You are on the waitlist (#${r.booking.waitlistPosition}). We will tell you if a seat opens.`) : r.error); };
  const doCheckIn = (bookingId: string) => { const r = update((x, n) => checkIn(x, me.id, bookingId, n)); if (r.ok) { setMsg(`Checked in ${r.who}.`); celebrate(r.earned); } else setMsg(r.error); };
  const byCode = (c: string) => { const f = findBookingByCode(w, c); if (f) doCheckIn(f.id); else setMsg('No booking with that ticket code.'); };
  const downloadIcs = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([icsFile(e)], { type: 'text/calendar' })); a.download = `${e.id}.ics`; a.click(); };

  return (
    <div>
      <Link href="/events" className="text-sm text-pink-700">← All events</Link>
      <div className="mt-3 flex items-start gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-card bg-pink-50 text-3xl" aria-hidden>{e.emoji}</span>
        <div><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TYPE_COLOR[e.type]}`}>{TYPE_LABEL[e.type]}</span><h1 className="mt-1 font-display text-2xl font-semibold leading-tight">{e.title}</h1>{community && <Link href={`/community/${community.slug}?tab=events`} className="text-sm text-pink-700">{community.emoji} {community.name}</Link>}</div>
      </div>

      <dl className="mt-4 space-y-2 rounded-card bg-white p-4 text-sm ring-1 ring-pink-100">
        <div><dt className="text-xs font-semibold uppercase tracking-wide text-plum-500">When</dt><dd>{fmtDate(e.startsAt)}, {fmtTime(e.startsAt)} to {fmtTime(e.endsAt)} SAST</dd></div>
        <div><dt className="text-xs font-semibold uppercase tracking-wide text-plum-500">Where</dt><dd className="flex items-center gap-1">{e.online ? <Video size={14} /> : <MapPin size={14} />}{e.location}</dd></div>
        <div><dt className="text-xs font-semibold uppercase tracking-wide text-plum-500">Host</dt><dd>{e.hostName}, {e.hostRole}</dd></div>
        <div><dt className="text-xs font-semibold uppercase tracking-wide text-plum-500">Seats</dt><dd>{taken} of {e.capacity} taken · <EventStatus e={e} />
          <span className="mt-1 block h-2 rounded-full bg-pink-100" role="progressbar" aria-valuenow={taken} aria-valuemax={e.capacity}><span className="block h-2 rounded-full bg-pink-300" style={{ width: `${Math.min(100, (taken / e.capacity) * 100)}%` }} /></span></dd></div>
      </dl>

      <section className="mt-5"><h2 className="font-display text-lg font-semibold">About</h2><p className="mt-1 text-sm">{e.description}</p>
        <h3 className="mt-4 text-sm font-semibold">Agenda</h3><ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">{e.agenda.map((a) => <li key={a}>{a}</li>)}</ol></section>

      <div className="mt-6 space-y-2">
        {past ? <p className="rounded-card bg-white p-4 text-sm text-plum-500 ring-1 ring-pink-100">This event has finished.{b?.status === 'checked_in' ? ' You attended. Thank you!' : ''}</p>
          : !b ? <button onClick={book} className="w-full rounded-input bg-pink-600 py-3 font-semibold text-white hover:bg-pink-700">{left === 0 ? `Join the waitlist (${waitlistSize(w, e.id)} waiting)` : 'Book my seat'}</button>
          : (
            <>
              {b.status === 'waitlisted' ? <p className="rounded-card bg-lavender-100 p-4 text-sm"><b>You are #{b.waitlistPosition} on the waitlist.</b> If someone cancels, you move up automatically and we notify you.</p>
                : <Link href={`/tickets/${b.id}`} className="block w-full rounded-input bg-pink-600 py-3 text-center font-semibold text-white hover:bg-pink-700">View my ticket</Link>}
              {b.status !== 'checked_in' && <button onClick={() => { update((x, n) => cancelBooking(x, me.id, b.id, n)); setMsg('Your booking was cancelled.'); }} className="w-full rounded-input py-2 text-sm font-semibold text-coral-600">{b.status === 'waitlisted' ? 'Leave the waitlist' : 'Cancel my booking'}</button>}
            </>
          )}
        {msg && <p role="status" className="text-sm text-mint-700">{msg}</p>}
        {!past && <div className="flex gap-2">
          <a href={googleCalendarUrl(e)} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-input border border-pink-300 py-2 text-sm font-semibold text-pink-700"><CalendarPlus size={16} /> Google Calendar</a>
          <button onClick={downloadIcs} className="flex flex-1 items-center justify-center gap-2 rounded-input border border-pink-300 py-2 text-sm font-semibold text-pink-700"><Download size={16} /> Download .ics</button>
        </div>}
      </div>

      {manage && (
        <section className="mt-8 rounded-card bg-white p-4 ring-1 ring-pink-100" aria-label="Host check-in">
          <h2 className="font-display text-lg font-semibold">Host check-in</h2>
          <p className="text-xs text-plum-500">Staff and hosts only. Checking someone in gives them 30 points and the Workshop Goer badge.</p>
          <form onSubmit={(ev) => { ev.preventDefault(); byCode(code); setCode(''); }} className="mt-3 flex gap-2"><input value={code} onChange={(ev) => setCode(ev.target.value)} placeholder="Ticket code" aria-label="Ticket code" className="flex-1 rounded-input border border-pink-300 px-3 py-2 text-sm uppercase" /><button disabled={!code.trim()} className="rounded-input bg-mint-700 px-4 text-sm font-semibold text-white disabled:opacity-50">Check in</button></form>
          <Scanner onCode={byCode} />
          <ul className="mt-4 divide-y divide-pink-100">
            {roster.map((x) => (
              <li key={x.id} className="flex items-center gap-2 py-2 text-sm"><span className="flex-1">{w.users[x.userId]?.displayName}<span className="ml-2 text-xs text-plum-500">{x.status === 'waitlisted' ? `waitlist #${x.waitlistPosition}` : x.ticketCode}</span></span>
                {x.status === 'booked' && <button onClick={() => doCheckIn(x.id)} className="rounded-full bg-mint-700 px-3 py-1 text-xs font-semibold text-white">Check in</button>}
                {x.status === 'checked_in' && <span className="text-xs font-semibold text-mint-700">Checked in ✓</span>}</li>
            ))}
            {!roster.length && <li className="py-2 text-sm text-plum-500">No bookings yet.</li>}
          </ul>
        </section>
      )}
    </div>
  );
}
