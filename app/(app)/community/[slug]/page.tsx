'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { notFound, useParams, useSearchParams } from 'next/navigation';
import { Users } from 'lucide-react';
import { ChatRoom } from '@/components/community/chat-room';
import { CirclesTab } from '@/components/community/circles-tab';
import { EventCard } from '@/components/community/event-card';
import { FeedTab } from '@/components/community/feed-tab';
import { JoinCommunityButton } from '@/components/community/join-button';
import { LeaderboardTab } from '@/components/community/leaderboard-tab';
import { Avatar } from '@/components/community/avatar';
import { useApp } from '@/components/shell/app-context';
import { communityChannel, ensureChannel, unreadCount } from '@/lib/engine/chat';
import { approveMember, canModerateCommunity, isActiveMember, memberCount, myCommunities } from '@/lib/engine/community';
import { isPast } from '@/lib/engine/events';
import { activeSeason } from '@/lib/engine/leaderboard';
import { update } from '@/lib/world/store';

type Tab = 'feed' | 'circles' | 'leaderboard' | 'events' | 'lounge' | 'manage';

function Inner() {
  const { slug } = useParams<{ slug: string }>();
  const sp = useSearchParams();
  const { w, me, now } = useApp();
  const c = w.communities.find((x) => x.slug === slug);
  if (!c) notFound();
  const member = isActiveMember(w, c.id, me.id);
  const staff = canModerateCommunity(w, me.id, c.id);
  const pending = w.communityMembers.filter((m) => m.communityId === c.id && m.status === 'pending');
  const ch = communityChannel(w, c.id);
  const unread = ch && member ? unreadCount(w, me.id, ch) : 0;
  const tabs: { id: Tab; label: string; hidden?: boolean; badge?: number }[] = [
    { id: 'feed', label: 'Feed' }, { id: 'circles', label: 'Circles' }, { id: 'leaderboard', label: 'Leaderboard', hidden: me.focusMode }, { id: 'events', label: 'Events' },
    { id: 'lounge', label: 'Lounge', badge: unread }, { id: 'manage', label: 'Manage', hidden: !staff, badge: pending.length },
  ];
  const visible = tabs.filter((t) => !t.hidden);
  const requested = sp.get('tab') as Tab | null;
  const tab: Tab = visible.some((t) => t.id === requested) ? requested! : 'feed';
  const switcher = myCommunities(w, me.id);
  const events = w.events.filter((e) => e.published && (e.communityId === c.id || e.communityId === null)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const upcoming = events.filter((e) => !isPast(e, now));
  const past = events.filter((e) => isPast(e, now)).reverse();
  const season = activeSeason(w, now);

  return (
    <div>
      {switcher.length > 1 && member && <div className="mb-3 flex gap-2 overflow-x-auto">{switcher.map((m) => <Link key={m.id} href={`/community/${m.slug}`} className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium ${m.id === c.id ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-700'}`}>{m.emoji} {m.name}</Link>)}</div>}
      <Link href="/community" className="text-sm text-pink-700">← All communities</Link>
      <div className="mt-2 flex items-start gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-card text-3xl" style={{ background: `${c.color}22` }} aria-hidden>{c.emoji}</span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-semibold leading-tight">{c.name}</h1>
          <p className="flex items-center gap-1 text-xs text-plum-500"><Users size={12} /> {memberCount(w, c.id)} members{c.requiresApproval ? ' · approval needed' : ''}</p>
        </div>
        <JoinCommunityButton communityId={c.id} />
      </div>
      <p className="mt-2 text-sm">{c.description}</p>
      <div className="mt-2 flex flex-wrap gap-1">{c.tags.map((t) => <Link key={t} href={`/community?tag=${encodeURIComponent(t)}`} className="rounded-full bg-pink-100 px-2 py-0.5 text-[11px] font-medium text-pink-700">#{t}</Link>)}</div>

      <nav aria-label="Community sections" className="mt-4 flex gap-4 overflow-x-auto border-b border-pink-100">
        {visible.map((t) => (
          <Link key={t.id} href={`/community/${c.slug}?tab=${t.id}`} aria-current={t.id === tab ? 'page' : undefined} className={`flex items-center gap-1 whitespace-nowrap pb-2 text-sm font-semibold ${t.id === tab ? 'border-b-2 border-pink-600 text-pink-700' : 'text-plum-500'}`}>
            {t.label}{!!t.badge && <span className="rounded-full bg-pink-600 px-1.5 text-[10px] font-bold text-white">{t.badge}</span>}
          </Link>
        ))}
      </nav>

      {tab === 'feed' && <FeedTab communityId={c.id} />}
      {tab === 'circles' && <CirclesTab communityId={c.id} />}
      {tab === 'leaderboard' && <LeaderboardTab communityId={c.id} />}
      {tab === 'events' && (
        <div className="mt-4">
          <ul className="space-y-3">{upcoming.map((e) => <EventCard key={e.id} e={e} />)}</ul>
          {!upcoming.length && <p className="rounded-card bg-white p-6 text-center text-plum-500 ring-1 ring-pink-100">No upcoming events yet.</p>}
          {past.length > 0 && <details className="mt-5"><summary className="cursor-pointer text-sm font-semibold text-plum-500">Past events ({past.length})</summary><ul className="mt-3 space-y-3">{past.map((e) => <EventCard key={e.id} e={e} />)}</ul></details>}
          <Link href="/events" className="mt-4 inline-block text-sm font-semibold text-pink-700">Browse all events →</Link>
        </div>
      )}
      {tab === 'lounge' && (member ? <LoungeRoom communityId={c.id} /> : <p className="mt-6 rounded-card bg-white p-6 text-center text-plum-500 ring-1 ring-pink-100">Join this community to chat in the lounge.</p>)}
      {tab === 'manage' && staff && (
        <div className="mt-4 space-y-5">
          <section><h2 className="font-display text-lg font-semibold">Requests to join {pending.length ? `(${pending.length})` : ''}</h2>
            <ul className="mt-2 divide-y divide-pink-100 rounded-card bg-white ring-1 ring-pink-100">
              {pending.map((m) => (
                <li key={m.userId} className="flex items-center gap-3 px-4 py-3"><Avatar name={w.users[m.userId].displayName} color={w.users[m.userId].color} /><span className="flex-1 text-sm font-medium">{w.users[m.userId].displayName}</span>
                  <button onClick={() => update((x, n) => approveMember(x, me.id, c.id, m.userId, true, n))} className="rounded-full bg-mint-700 px-3 py-1 text-xs font-semibold text-white">Approve</button>
                  <button onClick={() => update((x, n) => approveMember(x, me.id, c.id, m.userId, false, n))} className="rounded-full px-3 py-1 text-xs font-semibold text-coral-600 ring-1 ring-coral-600">Decline</button></li>
              ))}
              {!pending.length && <li className="px-4 py-3 text-sm text-plum-500">No requests waiting.</li>}
            </ul>
          </section>
          {season && (
            <section><h2 className="font-display text-lg font-semibold">Campus Cup</h2>
              <p className="text-sm text-plum-500">{season.name}</p>
              <button onClick={() => update((x) => { const s = x.seasons.find((y) => y.id === season.id)!; s.communityIds = s.communityIds.includes(c.id) ? s.communityIds.filter((i) => i !== c.id) : [...s.communityIds, c.id]; })} className="mt-2 rounded-input border border-pink-300 px-4 py-2 text-sm font-semibold text-pink-700">{season.communityIds.includes(c.id) ? 'Withdraw from the Campus Cup' : 'Enter the Campus Cup'}</button>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function LoungeRoom({ communityId }: { communityId: string }) {
  const { w } = useApp();
  const ch = communityChannel(w, communityId);
  if (!ch) { queueMicrotask(() => update((x) => { ensureChannel(x, 'community', communityId); })); return null; }
  return <ChatRoom channelId={ch.id} />;
}

export default function CommunityPage() { return <Suspense><Inner /></Suspense>; }
