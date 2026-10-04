'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TYPE_LABEL } from '@/components/community/event-card';
import { useApp } from '@/components/shell/app-context';
import { rsvp, rsvpOf, goingCount } from '@/lib/engine/sessions';
import { bookingOf } from '@/lib/engine/events';
import { isCircleMember } from '@/lib/engine/community';
import { dayKey, fmtDate, fmtTime } from '@/lib/format';
import { update } from '@/lib/world/store';

type Item = { id: string; kind: 'session' | 'event'; title: string; startsAt: string; endsAt: string; dot: string; chip: string; label: string; href?: string; sessionId?: string; status?: string };
const DOT = { circle: 'bg-pink-600', workshop: 'bg-lavender-600', expert_qa: 'bg-mint-700', oweek: 'bg-gold-500', meetup: 'bg-pink-300' } as const;

export default function Calendar() {
  const { w, me, now } = useApp();
  const [cursor, setCursor] = useState(() => { const d = new Date(now); return { y: d.getUTCFullYear(), m: d.getUTCMonth() }; });
  const [sel, setSel] = useState(dayKey(now.toISOString()));
  const items = useMemo<Item[]>(() => {
    const sessions = w.sessions.filter((s) => !s.cancelled && isCircleMember(w, s.circleId, me.id)).map<Item>((s) => ({ id: s.id, kind: 'session', title: s.title, startsAt: s.startsAt, endsAt: s.endsAt, dot: DOT.circle, chip: 'bg-pink-100 text-pink-700', label: 'Circle session', sessionId: s.id }));
    const events = w.events.filter((e) => e.published && bookingOf(w, e.id, me.id)).map<Item>((e) => ({ id: e.id, kind: 'event', title: e.title, startsAt: e.startsAt, endsAt: e.endsAt, dot: DOT[e.type], chip: e.type === 'workshop' ? 'bg-lavender-100 text-lavender-600' : e.type === 'expert_qa' ? 'bg-mint-100 text-mint-700' : e.type === 'oweek' ? 'bg-gold-500/25 text-plum-900' : 'bg-pink-100 text-pink-700', label: TYPE_LABEL[e.type], href: `/events/${e.id}`, status: bookingOf(w, e.id, me.id)?.status }));
    return [...sessions, ...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }, [w, me.id]);
  const byDay = useMemo(() => items.reduce<Record<string, Item[]>>((acc, i) => { (acc[dayKey(i.startsAt)] ??= []).push(i); return acc; }, {}), [items]);

  const first = new Date(Date.UTC(cursor.y, cursor.m, 1));
  const lead = (first.getUTCDay() + 6) % 7; // Monday first
  const days = new Date(Date.UTC(cursor.y, cursor.m + 1, 0)).getUTCDate();
  const cells = Array.from({ length: Math.ceil((lead + days) / 7) * 7 }, (_, i) => { const d = i - lead + 1; return d >= 1 && d <= days ? d : null; });
  const key = (d: number) => `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const today = dayKey(now.toISOString());
  const shift = (n: number) => setCursor(({ y, m }) => { const d = new Date(Date.UTC(y, m + n, 1)); return { y: d.getUTCFullYear(), m: d.getUTCMonth() }; });
  const agenda = (byDay[sel] ?? []);
  const next = items.filter((i) => i.startsAt >= now.toISOString()).slice(0, 6);

  const Row = ({ i }: { i: Item }) => {
    const r = i.sessionId ? rsvpOf(w, i.sessionId, me.id) : undefined;
    return (
      <li className="rounded-card bg-white p-3 ring-1 ring-pink-100">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${i.chip}`}>{i.label}</span>
        <b className="mt-1 block text-sm">{i.href ? <Link href={i.href} className="hover:underline">{i.title}</Link> : i.title}</b>
        <span className="text-xs text-plum-500">{fmtDate(i.startsAt)}, {fmtTime(i.startsAt)}{i.status === 'waitlisted' ? ' · waitlisted' : ''}{i.sessionId ? ` · ${goingCount(w, i.sessionId)} going` : ''}</span>
        {i.sessionId && <div className="mt-2 flex gap-1.5">{([['going', 'Going'], ['maybe', 'Maybe'], ['no', 'Can’t']] as const).map(([v, label]) => <button key={v} aria-pressed={r === v} onClick={() => update((x) => rsvp(x, me.id, i.sessionId!, v))} className={`rounded-full px-3 py-1 text-xs font-semibold ${r === v ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-700'}`}>{label}</button>)}</div>}
      </li>
    );
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Calendar</h1>
      <p className="text-plum-500">Your Circle sessions and booked events, in one place.</p>
      <div className="mt-4 flex items-center justify-between">
        <button onClick={() => shift(-1)} aria-label="Previous month" className="rounded-full p-2 ring-1 ring-pink-300"><ChevronLeft size={18} /></button>
        <b className="font-display text-xl">{new Intl.DateTimeFormat('en-ZA', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(first)}</b>
        <button onClick={() => shift(1)} aria-label="Next month" className="rounded-full p-2 ring-1 ring-pink-300"><ChevronRight size={18} /></button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-plum-500">{['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => <span key={d}>{d}</span>)}</div>
      <div className="mt-1 grid grid-cols-7 gap-1" role="grid" aria-label="Month">
        {cells.map((d, i) => d === null ? <span key={i} /> : (
          <button key={i} onClick={() => setSel(key(d))} aria-pressed={sel === key(d)} aria-label={`${d} ${byDay[key(d)]?.length ?? 0} items`} className={`flex h-12 flex-col items-center justify-start rounded-input pt-1 text-sm ${sel === key(d) ? 'bg-pink-600 text-white' : key(d) === today ? 'bg-pink-100 font-bold text-pink-700' : 'bg-white ring-1 ring-pink-100'}`}>
            {d}<span className="mt-0.5 flex gap-0.5">{(byDay[key(d)] ?? []).slice(0, 3).map((x) => <span key={x.id} className={`h-1.5 w-1.5 rounded-full ${sel === key(d) ? 'bg-white' : x.dot}`} />)}</span>
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-plum-500"><span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-pink-600" />Circle session</span><span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-lavender-600" />Workshop</span><span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-mint-700" />Expert Q&A</span><span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-gold-500" />O-Week</span></div>

      <h2 className="mt-6 font-display text-lg font-semibold">{fmtDate(`${sel}T12:00:00+02:00`)}</h2>
      <ul className="mt-2 space-y-2">{agenda.map((i) => <Row key={i.id} i={i} />)}{!agenda.length && <li className="rounded-card bg-white p-4 text-sm text-plum-500 ring-1 ring-pink-100">Nothing on this day. <Link href="/events" className="font-semibold text-pink-700">Find an event</Link></li>}</ul>

      <h2 className="mt-8 font-display text-lg font-semibold">Coming up</h2>
      <ul className="mt-2 space-y-2">{next.map((i) => <Row key={i.id} i={i} />)}{!next.length && <li className="rounded-card bg-white p-4 text-sm text-plum-500 ring-1 ring-pink-100">No upcoming sessions or bookings. Join a Circle or book an event.</li>}</ul>
    </div>
  );
}
