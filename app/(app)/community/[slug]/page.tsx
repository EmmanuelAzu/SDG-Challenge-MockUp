import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Users } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { JoinButton, OptInToggle } from '@/components/circle-actions';
import { RefreshOnFocus } from '@/components/refresh-on-focus';
import { setLeaderboardOptIn } from '../../profile/actions';

export const dynamic = 'force-dynamic';
const ALL_TABS = ['circles', 'leaderboard', 'calendar', 'events', 'announcements'] as const;
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ tab?: string; view?: string; period?: string }> };

export default async function CommunityPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const { supabase, user } = await requireUser();
  const { data: community } = await supabase.from('communities').select('id,name,description').eq('slug', slug).single();
  if (!community) notFound();
  const { data: me } = await supabase.from('profiles').select('focus_mode').eq('id', user.id).single();
  const focus = !!me?.focus_mode;
  const { data: mine } = await supabase.from('community_members').select('communities(slug,name)').eq('user_id', user.id).eq('status', 'active');
  const switcher = (mine ?? []).map((m: any) => m.communities).filter(Boolean);
  const TABS = ALL_TABS.filter((t) => !(focus && t === 'leaderboard')); // Focus mode hides leaderboards
  const tab = (TABS as readonly string[]).includes(sp.tab ?? '') ? sp.tab! : 'circles';
  const base = `/community/${slug}`;

  return (
    <div>
      <RefreshOnFocus />
      {switcher.length > 1 && (
        <div className="mb-3 flex gap-2 overflow-x-auto">
          {switcher.map((c: any) => <Link key={c.slug} href={`/community/${c.slug}`} className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium ${c.slug === slug ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-700'}`}>{c.name}</Link>)}
        </div>
      )}
      <h1 className="font-display text-3xl font-semibold">{community.name}</h1>
      {community.description && <p className="text-plum-500">{community.description}</p>}
      <nav aria-label="Community sections" className="mt-4 flex gap-4 overflow-x-auto border-b border-pink-100">
        {TABS.map((t) => <Link key={t} href={`${base}?tab=${t}`} aria-current={t === tab ? 'page' : undefined} className={`whitespace-nowrap pb-2 text-sm font-semibold capitalize ${t === tab ? 'border-b-2 border-pink-600 text-pink-700' : 'text-plum-500'}`}>{t}</Link>)}
      </nav>

      {tab === 'circles' && <Circles communityId={community.id} supabase={supabase} />}
      {tab === 'leaderboard' && <Leaderboard communityId={community.id} supabase={supabase} userId={user.id} base={base} view={sp.view === 'individuals' ? 'individuals' : 'circles'} period={sp.period === 'all' ? 'all' : 'week'} />}
      {(tab === 'calendar' || tab === 'events' || tab === 'announcements') && (
        <p className="mt-8 rounded-card bg-white p-6 text-center text-plum-500 ring-1 ring-pink-100">The {tab} tab arrives in the next update.</p>
      )}
    </div>
  );
}

async function Circles({ communityId, supabase }: { communityId: string; supabase: any }) {
  const { data } = await supabase.rpc('circle_directory', { p_community: communityId });
  const circles = (data ?? []) as any[];
  if (!circles.length) return <p className="mt-8 text-plum-500">No Circles here yet. Ask your community admin to start one.</p>;
  return (
    <ul className="mt-5 space-y-3">
      {circles.map((c) => (
        <li key={c.circle_id} className="rounded-card bg-white p-4 ring-1 ring-pink-100">
          <div className="flex items-start justify-between gap-3">
            <Link href={`/circles/${c.circle_id}`} className="flex-1">
              <b className="font-display text-lg">{c.name}</b>
              <span className="block text-sm text-plum-500">{c.topic}</span>
              <span className="mt-1 block text-sm">{c.facilitator_name ? `with ${c.facilitator_name} · ` : ''}{c.weekday != null ? `${DAYS[c.weekday]} ${String(c.start_time).slice(0, 5)}` : 'Time to be set'}</span>
              <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-pink-700"><Users size={14} /> {c.members}/{c.capacity} seats</span>
            </Link>
            <JoinButton circleId={c.circle_id} isMember={c.is_member} full={Number(c.members) >= c.capacity} />
          </div>
        </li>
      ))}
    </ul>
  );
}

async function Leaderboard({ communityId, supabase, userId, base, view, period }: { communityId: string; supabase: any; userId: string; base: string; view: 'circles' | 'individuals'; period: 'week' | 'all' }) {
  const pill = (active: boolean) => `rounded-full px-3 py-1 text-sm font-medium ${active ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-700'}`;
  const link = (v: string, p: string) => `${base}?tab=leaderboard&view=${v}&period=${p}`;
  let body: React.ReactNode;

  if (view === 'circles') {
    const [{ data }, { data: mine }] = await Promise.all([
      supabase.rpc('leaderboard_circles', { p_community: communityId, p_period: period }),
      supabase.from('circle_members').select('circle_id').eq('user_id', userId),
    ]);
    const myCircles = new Set((mine ?? []).map((m: any) => m.circle_id));
    const rows = ((data ?? []) as any[]).sort((a, b) => a.rank - b.rank);
    body = (
      <ol className="mt-4 divide-y divide-pink-100 rounded-card bg-white ring-1 ring-pink-100">
        {rows.slice(0, 10).map((r) => (
          <li key={r.circle_id} className={`flex items-center gap-3 px-4 py-3 ${myCircles.has(r.circle_id) ? 'bg-pink-50' : ''}`}>
            <span className="w-6 font-display text-lg font-semibold text-pink-700">{r.rank}</span>
            <span className="flex-1"><b>{r.name}</b>{myCircles.has(r.circle_id) && <span className="ml-2 text-xs font-semibold text-pink-700">Your Circle</span>}<span className="block text-xs text-plum-500">{r.members} members</span></span>
            <span className="text-sm font-semibold">{Number(r.avg_points)} avg pts</span>
          </li>
        ))}
        {!rows.length && <li className="p-4 text-sm text-plum-500">No Circles to rank yet.</li>}
      </ol>
    );
  } else {
    const [{ data }, { data: me }] = await Promise.all([
      supabase.rpc('leaderboard_individual', { p_community: communityId, p_period: period }),
      supabase.from('profiles').select('show_on_leaderboard').eq('id', userId).single(),
    ]);
    const rows = ((data ?? []) as any[]).sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
    const mineRow = rows.find((r) => r.user_id === userId);
    const above = mineRow ? rows.filter((r) => Number(r.points) > Number(mineRow.points)).map((r) => Number(r.points)).sort((a, b) => a - b)[0] : undefined;
    const top = rows.slice(0, 10);
    body = (
      <>
        {!me?.show_on_leaderboard && (
          <div className="mt-4 rounded-card bg-pink-100 p-4 text-sm">
            <b>Want to be on the individual leaderboard?</b>
            <p className="text-plum-500">It is optional and off by default. You would appear by nickname (or first name), with effort points only.</p>
            <OptInToggle onSave={async () => { 'use server'; await setLeaderboardOptIn(true); }} />
          </div>
        )}
        <ol className="mt-4 divide-y divide-pink-100 rounded-card bg-white ring-1 ring-pink-100">
          {top.map((r) => (
            <li key={r.user_id} className={`flex items-center gap-3 px-4 py-3 ${r.user_id === userId ? 'bg-pink-50' : ''}`}>
              <span className="w-6 font-display text-lg font-semibold text-pink-700">{r.rank}</span>
              <span className="flex-1 font-medium">{r.name}{r.user_id === userId && <span className="ml-2 text-xs font-semibold text-pink-700">You</span>}</span>
              <span className="text-sm font-semibold">{Number(r.points)} pts</span>
            </li>
          ))}
          {!rows.length && <li className="p-4 text-sm text-plum-500">Nobody has opted in yet.</li>}
          {mineRow && !top.some((r) => r.user_id === userId) && (
            <li className="flex items-center gap-3 bg-pink-50 px-4 py-3"><span className="w-6 font-display text-lg font-semibold text-pink-700">{mineRow.rank}</span><span className="flex-1 font-medium">{mineRow.name}<span className="ml-2 text-xs font-semibold text-pink-700">You</span></span><span className="text-sm font-semibold">{Number(mineRow.points)} pts</span></li>
          )}
        </ol>
        {mineRow && above !== undefined && <p className="mt-2 text-sm text-pink-700">{above - Number(mineRow.points) + 1} pts to move up a place.</p>}
      </>
    );
  }

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-2">
        <Link href={link('circles', period)} className={pill(view === 'circles')}>Circle Cup</Link>
        <Link href={link('individuals', period)} className={pill(view === 'individuals')}>Individuals</Link>
        <span className="mx-1" />
        <Link href={link(view, 'week')} className={pill(period === 'week')}>This week</Link>
        <Link href={link(view, 'all')} className={pill(period === 'all')}>All time</Link>
      </div>
      {body}
      <p className="mt-4 text-xs text-plum-500">Rankings use effort points only: lessons, actions, streaks and sessions. Never money. Weeks reset Monday 00:00 SAST.</p>
    </div>
  );
}
