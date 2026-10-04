'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Mail, Search, Ticket, Users } from 'lucide-react';
import { JoinCommunityButton } from '@/components/community/join-button';
import { useApp } from '@/components/shell/app-context';
import { allTags, memberCount, membershipOf, myCommunities, searchCommunities, suggestedCommunities } from '@/lib/engine/community';
import { incoming } from '@/lib/engine/friends';
import { unreadCount, communityChannel } from '@/lib/engine/chat';
import type { Community } from '@/lib/world/types';

const KINDS = [['', 'All'], ['university', 'Campus'], ['workplace', 'Workplace'], ['community', 'Interest']] as const;

function Card({ c, reason }: { c: Community; reason?: string }) {
  const { w, me } = useApp();
  const m = membershipOf(w, c.id, me.id);
  return (
    <li className="rounded-card bg-white p-4 ring-1 ring-pink-100">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-card text-2xl" style={{ background: `${c.color}22` }} aria-hidden>{c.emoji}</span>
        <div className="min-w-0 flex-1">
          <Link href={`/community/${c.slug}`} className="font-display text-lg font-semibold hover:underline">{c.name}</Link>
          <p className="text-xs text-plum-500">{c.kind === 'university' ? 'Campus' : c.kind === 'workplace' ? 'Workplace' : 'Interest'} · <Users size={11} className="inline" /> {memberCount(w, c.id)} members{c.requiresApproval ? ' · approval needed' : ''}</p>
          <p className="mt-1 line-clamp-2 text-sm">{c.description}</p>
          <div className="mt-2 flex flex-wrap gap-1">{c.tags.map((t) => <Link key={t} href={`/community?tag=${encodeURIComponent(t)}`} className="rounded-full bg-pink-100 px-2 py-0.5 text-[11px] font-medium text-pink-700">#{t}</Link>)}</div>
          {reason && <p className="mt-2 text-xs font-medium text-mint-700">✨ {reason}</p>}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Link href={`/community/${c.slug}`} className="text-sm font-semibold text-pink-700">{m?.status === 'active' ? 'Open' : 'Take a look'}</Link>
        <JoinCommunityButton communityId={c.id} compact />
      </div>
    </li>
  );
}

export default function CommunityHome() {
  const { w, me } = useApp();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('');
  const [tag, setTag] = useState('');
  const mine = myCommunities(w, me.id);
  const suggestions = useMemo(() => suggestedCommunities(w, me.id).slice(0, 3), [w, me.id]);
  const results = searchCommunities(w, { q, kind, tag }).filter((c) => !mine.some((m) => m.id === c.id));
  const searching = !!(q || kind || tag);
  const tags = allTags(w);
  const chip = (on: boolean) => `whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium ${on ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-700'}`;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Community</h1>
      <p className="text-plum-500">Find women like you. Join a community, then a Circle.</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold">
        <Link href="/events" className="flex items-center justify-center gap-2 rounded-card bg-lavender-100 p-3 text-lavender-600"><Ticket size={18} /> Events</Link>
        <Link href="/calendar" className="flex items-center justify-center gap-2 rounded-card bg-mint-100 p-3 text-mint-700"><CalendarDays size={18} /> Calendar</Link>
        <Link href="/letterbox" className="col-span-2 flex items-center justify-center gap-2 rounded-card bg-pink-100 p-3 text-pink-700"><Mail size={18} /> Letterbox{incoming(w, me.id).length > 0 && <span className="rounded-full bg-pink-600 px-2 text-xs text-white">{incoming(w, me.id).length}</span>}</Link>
      </div>

      {mine.length > 0 && (
        <section className="mt-6" aria-label="My communities">
          <h2 className="font-display text-xl font-semibold">My communities</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {mine.map((c) => {
              const ch = communityChannel(w, c.id);
              const unread = ch ? unreadCount(w, me.id, ch) : 0;
              return (
                <li key={c.id}><Link href={`/community/${c.slug}`} className="flex items-center gap-3 rounded-card bg-white p-3 ring-1 ring-pink-100 hover:ring-pink-300">
                  <span className="flex h-10 w-10 items-center justify-center rounded-card text-xl" style={{ background: `${c.color}22` }} aria-hidden>{c.emoji}</span>
                  <span className="flex-1"><b className="block text-sm">{c.name}</b><span className="text-xs text-plum-500">{memberCount(w, c.id)} members</span></span>
                  {unread > 0 && <span className="rounded-full bg-pink-600 px-2 py-0.5 text-xs font-bold text-white" aria-label={`${unread} unread in the lounge`}>{unread > 99 ? '99+' : unread}</span>}
                </Link></li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-8" aria-label="Find a community">
        <h2 className="font-display text-xl font-semibold">Find your people</h2>
        <div className="relative mt-3">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-plum-500" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, topic or #tag (try “TFSA”, “rent”, “Cape Town”)" aria-label="Search communities" className="w-full rounded-input border border-pink-300 bg-white py-3 pl-10 pr-3" />
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1" aria-label="Community type">{KINDS.map(([k, label]) => <button key={k} onClick={() => setKind(k)} aria-pressed={kind === k} className={chip(kind === k)}>{label}</button>)}</div>
        <div className="mt-1 flex gap-2 overflow-x-auto pb-1" aria-label="Tags">
          {tag && <button onClick={() => setTag('')} className={chip(true)}>#{tag} ✕</button>}
          {tags.filter((t) => t !== tag).slice(0, 18).map((t) => <button key={t} onClick={() => setTag(t)} className={chip(false)}>#{t}</button>)}
        </div>

        {!searching && suggestions.length > 0 && (
          <>
            <h3 className="mt-5 font-display text-lg font-semibold">Suggested for you</h3>
            <p className="text-xs text-plum-500">Based on your Life Track and goals.</p>
            <ul className="mt-2 space-y-3">{suggestions.map((s) => <Card key={s.community.id} c={s.community} reason={s.reasons[0]} />)}</ul>
          </>
        )}

        <h3 className="mt-6 font-display text-lg font-semibold">{searching ? `${results.length} ${results.length === 1 ? 'community' : 'communities'} found` : 'All communities'}</h3>
        <ul className="mt-2 space-y-3">{(searching ? results : results.filter((c) => !suggestions.some((s) => s.community.id === c.id))).map((c) => <Card key={c.id} c={c} />)}</ul>
        {searching && results.length === 0 && <p className="mt-4 rounded-card bg-white p-4 text-sm text-plum-500 ring-1 ring-pink-100">Nothing matches that yet. Try a broader word, or clear the filters.</p>}
      </section>
    </div>
  );
}
