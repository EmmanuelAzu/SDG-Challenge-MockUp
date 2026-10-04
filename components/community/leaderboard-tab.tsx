'use client';
import { useState } from 'react';
import { useApp } from '@/components/shell/app-context';
import { activeSeason, campusBoard, circleBoard, fmtWeek, gapToNext, individualBoard, type Period } from '@/lib/engine/leaderboard';
import { isCircleMember } from '@/lib/engine/community';
import { fmtDay } from '@/lib/format';
import { update } from '@/lib/world/store';

type View = 'circles' | 'individuals' | 'campus';

export function LeaderboardTab({ communityId }: { communityId: string }) {
  const { w, me, now } = useApp();
  const [view, setView] = useState<View>('circles');
  const [period, setPeriod] = useState<Period>('week');
  const pill = (on: boolean) => `rounded-full px-3 py-1 text-sm font-medium ${on ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-700'}`;
  const rowCls = (mine: boolean) => `flex items-center gap-3 px-4 py-3 ${mine ? 'bg-pink-50' : ''}`;
  const rankCls = 'w-7 font-display text-lg font-semibold text-pink-700';

  let body: React.ReactNode;
  if (view === 'circles') {
    const rows = circleBoard(w, communityId, period, now);
    body = (
      <ol className="mt-4 divide-y divide-pink-100 rounded-card bg-white ring-1 ring-pink-100">
        {rows.slice(0, 10).map((r) => { const mine = isCircleMember(w, r.id, me.id); return (
          <li key={r.id} className={rowCls(mine)}><span className={rankCls}>{r.rank}</span><span className="flex-1"><b>{r.name}</b>{mine && <span className="ml-2 text-xs font-semibold text-pink-700">Your Circle</span>}<span className="block text-xs text-plum-500">{r.members} members</span></span><span className="text-sm font-semibold">{r.points} avg pts</span></li>
        ); })}
        {!rows.length && <li className="p-4 text-sm text-plum-500">No Circles to rank yet.</li>}
      </ol>
    );
  } else if (view === 'individuals') {
    const rows = individualBoard(w, communityId, period, now);
    const mineRow = rows.find((r) => r.id === me.id);
    const top = rows.slice(0, 10);
    const gap = gapToNext(rows, me.id);
    body = (
      <>
        {!me.showOnLeaderboard && (
          <div className="mt-4 rounded-card bg-pink-100 p-4 text-sm">
            <b>Want to be on the individual leaderboard?</b>
            <p className="text-plum-500">It is optional and off by default. You would appear by nickname (or first name), with effort points only.</p>
            <button onClick={() => update((x) => { x.users[me.id].showOnLeaderboard = true; })} className="mt-2 rounded-full bg-pink-600 px-4 py-1.5 text-sm font-semibold text-white">Show me on the leaderboard</button>
          </div>
        )}
        <ol className="mt-4 divide-y divide-pink-100 rounded-card bg-white ring-1 ring-pink-100">
          {top.map((r) => <li key={r.id} className={rowCls(r.id === me.id)}><span className={rankCls}>{r.rank}</span><span className="flex-1 font-medium">{r.name}{r.id === me.id && <span className="ml-2 text-xs font-semibold text-pink-700">You</span>}</span><span className="text-sm font-semibold">{r.points} pts</span></li>)}
          {mineRow && !top.some((r) => r.id === me.id) && <li className={rowCls(true)}><span className={rankCls}>{mineRow.rank}</span><span className="flex-1 font-medium">{mineRow.name}<span className="ml-2 text-xs font-semibold text-pink-700">You</span></span><span className="text-sm font-semibold">{mineRow.points} pts</span></li>}
          {!rows.length && <li className="p-4 text-sm text-plum-500">Nobody has opted in yet.</li>}
        </ol>
        {gap && <p className="mt-2 text-sm text-pink-700">{gap.pointsToPass} pts to pass #{gap.rank}.</p>}
      </>
    );
  } else {
    const season = activeSeason(w, now);
    if (!season) body = <p className="mt-4 text-plum-500">No Campus Cup season right now.</p>;
    else {
      const rows = campusBoard(w, season, now);
      const started = rows[0]?.started;
      body = (
        <>
          <div className="mt-4 rounded-card bg-lavender-100 p-4 text-sm">
            <b className="font-display text-lg text-lavender-600">{season.name}</b>
            <p>{fmtDay(`${season.startsOn}T12:00:00Z`)} to {fmtDay(`${season.endsOn}T12:00:00Z`)} · {season.communityIds.length} communities competing</p>
            <p className="mt-1 text-plum-500">{season.prizeText}</p>
            {!started && <p className="mt-2 font-semibold">The season starts {fmtDay(`${season.startsOn}T12:00:00Z`)}. Use the demo clock to jump ahead.</p>}
          </div>
          <ol className="mt-3 divide-y divide-pink-100 rounded-card bg-white ring-1 ring-pink-100">
            {rows.map((r) => <li key={r.id} className={rowCls(r.id === communityId)}><span className={rankCls}>{started ? r.rank : '–'}</span><span className="flex-1"><b>{r.name}</b>{r.id === communityId && <span className="ml-2 text-xs font-semibold text-pink-700">This community</span>}<span className="block text-xs text-plum-500">{r.active} active members</span></span><span className="text-sm font-semibold">{r.points} avg pts / week</span></li>)}
          </ol>
          {!season.communityIds.includes(communityId) && <p className="mt-2 text-xs text-plum-500">This community has not entered the season. A community admin can opt in.</p>}
          <p className="mt-2 text-xs text-plum-500">Ranked by average weekly points per active member, so small and large communities compete fairly.</p>
        </>
      );
    }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setView('circles')} className={pill(view === 'circles')}>Circle Cup</button>
        <button onClick={() => setView('individuals')} className={pill(view === 'individuals')}>Individuals</button>
        <button onClick={() => setView('campus')} className={pill(view === 'campus')}>Campus Cup</button>
        {view !== 'campus' && <><span className="mx-1" /><button onClick={() => setPeriod('week')} className={pill(period === 'week')}>This week</button><button onClick={() => setPeriod('all')} className={pill(period === 'all')}>All time</button></>}
      </div>
      {view !== 'campus' && period === 'week' && <p className="mt-2 text-xs text-plum-500">Week of {fmtWeek(now)}. Resets Monday 00:00 SAST.</p>}
      {body}
      <p className="mt-4 text-xs text-plum-500">Rankings use effort points only: lessons, actions, weekly targets and sessions. Never money. Competing is always optional, and Focus mode hides this tab.</p>
    </div>
  );
}
