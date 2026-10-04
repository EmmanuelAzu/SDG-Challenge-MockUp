'use client';
import { useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { CalendarPlus, MessageCircle } from 'lucide-react';
import { useCelebrate } from '@/components/celebration/provider';
import { Avatar } from '@/components/community/avatar';
import { useApp } from '@/components/shell/app-context';
import { circleChannel, unreadCount } from '@/lib/engine/chat';
import { circleMemberCount, isActiveMember, isCircleMember, joinCircle, leaveCircle } from '@/lib/engine/community';
import { award } from '@/lib/engine/award';
import { earning } from '@/lib/engine/actions';
import { cancelSession, canRunCircle, createSessions, goingCount, markAttendance, rateSession, rsvp, rsvpOf, upcomingFor } from '@/lib/engine/sessions';
import { fmtDateTime, WEEKDAYS } from '@/lib/format';
import { sastDate } from '@/lib/time';
import { update } from '@/lib/world/store';
import { weekStart } from '@/lib/engine/leaderboard';

const AGENDA = [['LEARN', 10], ['DO', 10], ['TALK', 10], ['CHALLENGE', 5]] as const;

export default function CirclePage() {
  const { id } = useParams<{ id: string }>();
  const celebrate = useCelebrate();
  const { w, me, now } = useApp();
  const c = w.circles.find((x) => x.id === id);
  const [err, setErr] = useState('');
  const [sched, setSched] = useState({ title: '', when: '', weekly: false });
  if (!c) notFound();
  const community = w.communities.find((x) => x.id === c.communityId)!;
  const fac = w.users[c.facilitatorId];
  const mine = isCircleMember(w, c.id, me.id);
  const count = circleMemberCount(w, c.id);
  const ch = circleChannel(w, c.id);
  const unread = ch && mine ? unreadCount(w, me.id, ch) : 0;
  const run = canRunCircle(w, me.id, c.id);
  const sessions = upcomingFor(w, c.id, now);
  const past = w.sessions.filter((s) => s.circleId === c.id && s.endsAt < now.toISOString() && !s.cancelled).sort((a, b) => b.startsAt.localeCompare(a.startsAt)).slice(0, 3);

  // weekly progress ring: members who earned action points this week (counts only, never names)
  const since = weekStart(now);
  const ids = w.circleMembers.filter((m) => m.circleId === c.id).map((m) => m.userId);
  const done = ids.filter((u) => w.pointEvents.some((p) => p.userId === u && p.source === 'action' && p.at >= since)).length;
  const pct = ids.length ? done / ids.length : 0;
  const R = 34, C = 2 * Math.PI * R;
  const today = sastDate(now);
  const challenge = [...w.challenges].filter((x) => x.weekStart <= today && (!x.communityId || x.communityId === c.communityId)).sort((a, b) => b.weekStart.localeCompare(a.weekStart))[0];
  const challengeDone = challenge && w.challengeDone.some((d) => d.challengeId === challenge.id && d.userId === me.id);

  return (
    <div>
      <Link href={`/community/${community.slug}?tab=circles`} className="text-sm text-pink-700">← {community.name}</Link>
      <h1 className="mt-2 font-display text-3xl font-semibold">{c.name}</h1>
      <p className="text-plum-500">{c.topic}</p>
      <div className="mt-3 flex items-center gap-3"><Avatar name={fac.displayName} color={fac.color} size={40} /><div className="text-sm"><b>{fac.displayName}</b><span className="block text-plum-500">Facilitator · {WEEKDAYS[c.weekday]}s at {c.startTime} · {count}/{c.capacity} seats</span></div></div>

      <div className="mt-4 flex gap-2">
        {mine ? (
          <>
            <Link href={`/circles/${c.id}/chat`} className="flex flex-1 items-center justify-center gap-2 rounded-input bg-pink-600 py-3 font-semibold text-white hover:bg-pink-700"><MessageCircle size={18} /> Open chat{unread > 0 && <span className="rounded-full bg-white px-2 text-xs text-pink-700">{unread}</span>}</Link>
            <button onClick={() => update((x) => leaveCircle(x, me.id, c.id))} className="rounded-input px-4 text-sm font-semibold text-plum-500 ring-1 ring-pink-300">Leave</button>
          </>
        ) : (
          <button disabled={!isActiveMember(w, c.communityId, me.id) || count >= c.capacity} onClick={() => { const r = update((x, n) => joinCircle(x, me.id, c.id, n)); setErr(r.ok ? '' : r.error); }} className="flex-1 rounded-input bg-pink-600 py-3 font-semibold text-white hover:bg-pink-700 disabled:opacity-50">{count >= c.capacity ? 'Circle is full' : 'Join this Circle'}</button>
        )}
      </div>
      {!isActiveMember(w, c.communityId, me.id) && <p className="mt-2 text-sm text-plum-500">Join {community.name} first to join this Circle.</p>}
      {err && <p role="alert" className="mt-2 text-sm text-coral-600">{err}</p>}

      <section className="mt-6 rounded-card bg-white p-4 ring-1 ring-pink-100"><h2 className="font-display text-lg font-semibold">Session agenda (35 min)</h2>
        <ol className="mt-3 grid grid-cols-4 gap-2 text-center">{AGENDA.map(([n, m]) => <li key={n} className="rounded-input bg-pink-100 p-2"><b className="block text-xs text-pink-700">{n}</b><span className="text-sm">{m} min</span></li>)}</ol>
      </section>

      <section className="mt-4 flex items-center gap-4 rounded-card bg-white p-4 ring-1 ring-pink-100">
        <svg width="84" height="84" viewBox="0 0 84 84" role="img" aria-label={`${done} of ${ids.length} members completed this week's action`}>
          <circle cx="42" cy="42" r={R} fill="none" stroke="#FCE4EF" strokeWidth="9" />
          <circle cx="42" cy="42" r={R} fill="none" stroke="#D81B60" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${C * pct} ${C}`} transform="rotate(-90 42 42)" />
        </svg>
        <div><b className="font-display text-lg">{done} of {ids.length}</b><p className="text-sm text-plum-500">completed this week’s action</p></div>
      </section>

      {challenge && (
        <section className="mt-4 rounded-card bg-lavender-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-lavender-600">This week’s challenge · +{challenge.points} pts</p>
          <b className="mt-1 block font-display text-lg">{challenge.title}</b><p className="text-sm">{challenge.description}</p>
          {mine && (challengeDone ? <p className="mt-2 text-sm font-semibold text-mint-700">Challenge done. Nice one.</p> : (
            <button onClick={() => { const e = update((x, n) => { x.challengeDone.push({ challengeId: challenge.id, userId: me.id, at: n.toISOString() }); return earning(x, me.id, n, () => { award(x, { userId: me.id, source: 'challenge', sourceId: challenge.id, points: challenge.points, communityId: c.communityId, now: n }); }); }); celebrate(e); }} className="mt-3 rounded-full bg-pink-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-pink-700">I did this week’s challenge</button>
          ))}
        </section>
      )}

      <section className="mt-6"><h2 className="font-display text-xl font-semibold">Upcoming sessions</h2>
        <ul className="mt-3 space-y-2">
          {sessions.slice(0, 4).map((s) => { const r = rsvpOf(w, s.id, me.id); return (
            <li key={s.id} className="rounded-card bg-white p-3 ring-1 ring-pink-100">
              <b className="block text-sm">{fmtDateTime(s.startsAt)}</b><span className="text-xs text-plum-500">{s.location} · {goingCount(w, s.id)} going</span>
              {mine && <div className="mt-2 flex flex-wrap gap-1.5">
                {([['going', 'Going'], ['maybe', 'Maybe'], ['no', 'Can’t']] as const).map(([v, label]) => <button key={v} aria-pressed={r === v} onClick={() => update((x) => rsvp(x, me.id, s.id, v))} className={`rounded-full px-3 py-1 text-xs font-semibold ${r === v ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-700'}`}>{label}</button>)}
                <a href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(s.title)}&dates=${s.startsAt.replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${s.endsAt.replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-lavender-600 ring-1 ring-lavender-600"><CalendarPlus size={12} /> Add to Google</a>
              </div>}
              {run && <button onClick={() => update((x, n) => cancelSession(x, me.id, s.id, 'one', n))} className="mt-2 text-xs font-semibold text-coral-600">Cancel this session</button>}
            </li>
          ); })}
          {!sessions.length && <li className="rounded-card bg-white p-4 text-sm text-plum-500 ring-1 ring-pink-100">No sessions scheduled yet.</li>}
        </ul>
      </section>

      {run && (
        <section className="mt-6 rounded-card bg-white p-4 ring-1 ring-pink-100"><h2 className="font-display text-lg font-semibold">Facilitator tools</h2>
          <form onSubmit={(e) => { e.preventDefault(); if (!sched.when) return; update((x) => createSessions(x, me.id, { circleId: c.id, title: sched.title || `${c.name} session`, startsAt: new Date(sched.when).toISOString(), weekly: sched.weekly })); setSched({ title: '', when: '', weekly: false }); }} className="mt-3 space-y-2">
            <input value={sched.title} onChange={(e) => setSched({ ...sched, title: e.target.value })} placeholder="Session title (optional)" className="w-full rounded-input border border-pink-300 px-3 py-2 text-sm" />
            <input type="datetime-local" value={sched.when} onChange={(e) => setSched({ ...sched, when: e.target.value })} aria-label="Session start" className="w-full rounded-input border border-pink-300 px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sched.weekly} onChange={(e) => setSched({ ...sched, weekly: e.target.checked })} className="accent-pink-600" /> Repeat weekly for 8 weeks</label>
            <button disabled={!sched.when} className="rounded-input bg-pink-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Schedule</button>
          </form>
          <h3 className="mt-5 text-sm font-semibold">Take attendance (recent sessions)</h3>
          {past.map((s) => (
            <div key={s.id} className="mt-2 rounded-input bg-pink-50 p-3"><b className="text-sm">{fmtDateTime(s.startsAt)}</b>
              <ul className="mt-1 space-y-1">{w.circleMembers.filter((m) => m.circleId === c.id).map((m) => { const there = w.attendance.some((a) => a.sessionId === s.id && a.userId === m.userId); return (
                <li key={m.userId} className="flex items-center justify-between text-sm"><span>{w.users[m.userId].displayName}</span>
                  <button disabled={there} onClick={() => celebrate(Object.values(update((x, n) => markAttendance(x, me.id, s.id, [m.userId], n)))[0] ?? { badges: [], milestones: [] })} className="rounded-full bg-mint-700 px-3 py-0.5 text-xs font-semibold text-white disabled:bg-plum-500/30">{there ? 'Here ✓' : 'Mark here'}</button></li>
              ); })}</ul>
            </div>
          ))}
          {!past.length && <p className="mt-2 text-sm text-plum-500">No finished sessions yet.</p>}
        </section>
      )}

      {mine && past.some((s) => w.attendance.some((a) => a.sessionId === s.id && a.userId === me.id)) && (
        <section className="mt-6 rounded-card bg-white p-4 ring-1 ring-pink-100"><h2 className="font-display text-lg font-semibold">How was your last session?</h2>
          <div className="mt-2 flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => update((x) => rateSession(x, me.id, past.find((s) => x.attendance.some((a) => a.sessionId === s.id && a.userId === me.id))!.id, n))} aria-label={`${n} stars`} className="text-2xl">⭐</button>)}</div>
        </section>
      )}
    </div>
  );
}
