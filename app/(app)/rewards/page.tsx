'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Check } from 'lucide-react';
import { BadgeArt } from '@/components/badge-art';
import { useApp } from '@/components/shell/app-context';
import { playerFor } from '@/lib/engine/player';
import { setWeeklyTargetAction } from '@/lib/engine/settings';
import { CREDIT_BONUS, PILOT_LABEL, amounts, claimReward, eligibility, REWARDS, type RewardView } from '@/lib/engine/rewards';
import { BADGES } from '@/lib/content';
import { update } from '@/lib/world/store';

const REWARDS_TITLE: Record<string, string> = Object.fromEntries(REWARDS.map((r) => [r.slug, r.title]));
const LABEL: Record<string, string> = { lesson: 'Lesson', quiz: 'Quiz passed', action: 'Action done', weekly_target: 'Weekly target hit', onboarding: 'Welcome', session: 'Session', event: 'Event check-in', challenge: 'Challenge', buddy: 'Buddy week', feedback: 'Feedback' };

export default function Rewards() {
  const { w, me, now } = useApp();
  const [claiming, setClaiming] = useState<RewardView | null>(null);
  const [error, setError] = useState('');
  const views = eligibility(w, me.id, now);
  const myClaims = w.claims.filter((c) => c.userId === me.id).sort((a, b) => b.at.localeCompare(a.at));
  const lastDraw = [...w.draws].sort((a, b) => b.at.localeCompare(a.at))[0];
  const p = playerFor(w, me.id, now);
  const earned = new Map(w.userBadges.filter((b) => b.userId === me.id).map((b) => [b.slug, b.earnedAt]));
  const events = w.pointEvents.filter((e) => e.userId === me.id && e.points > 0).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 15);
  const dot = (h: { days: number; hit: boolean }, current: boolean) => `h-5 w-5 rounded-full ${h.hit ? 'bg-pink-600' : h.days > 0 ? 'bg-pink-300' : 'bg-pink-100'} ${current ? 'ring-2 ring-pink-700 ring-offset-1' : ''}`;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Rewards</h1>
      {me.focusMode ? (
        <>
          <p className="text-plum-500">Focus mode is on. Your progress still counts.</p>
          <h2 className="mt-6 font-display text-xl font-semibold">Milestones</h2>
          <ol className="mt-3 divide-y divide-pink-100 rounded-card bg-white ring-1 ring-pink-100">
            {p.journey.milestones.map((m) => <li key={m.slug} className="flex items-center gap-3 px-4 py-3 text-sm"><span className={`flex h-6 w-6 items-center justify-center rounded-full ${m.done ? 'bg-pink-600 text-white' : 'bg-pink-100'}`}>{m.done && <Check size={14} aria-label="Done" />}</span>{m.title}</li>)}
          </ol>
        </>
      ) : (
        <>
          <p className="text-plum-500">{earned.size} of {BADGES.length} badges</p>
          <section className="mt-5 rounded-card bg-white p-4 ring-1 ring-pink-100">
            <div className="flex items-baseline justify-between"><b className="font-display text-xl text-pink-700">{p.level.name}</b><span className="text-sm text-plum-500">{p.xp} XP</span></div>
            <div className="mt-2 h-2 rounded-full bg-pink-100"><div className="h-2 rounded-full bg-pink-300" style={{ width: `${p.level.progress * 100}%` }} /></div>
            <p className="mt-1 text-xs text-plum-500">{p.level.next ? `${p.level.toNext} points to ${p.level.next}` : 'You are at the top level.'}</p>
          </section>

          <h2 className="mt-8 font-display text-xl font-semibold">Weekly streak</h2>
          <p className="text-sm text-plum-500">{p.weekly.streakWeeks} {p.weekly.streakWeeks === 1 ? 'week' : 'weeks'} in a row · this week {Math.min(p.weekly.thisWeek.days, me.weeklyTarget)} of {me.weeklyTarget} days</p>
          <div className="mt-3 flex gap-2" role="img" aria-label="Last 12 weeks: target hit, partly hit or missed">{p.weekly.history.map((h, i) => <span key={h.weekKey} title={h.weekKey} className={dot(h, i === p.weekly.history.length - 1)} />)}</div>
          <p className="mt-2 text-xs text-plum-500">Dark = target hit · light = some days · pale = a quiet week. Missing a day never resets anything.</p>
          <div className="mt-3 flex items-center gap-2 text-sm"><span className="font-medium">My weekly target:</span>
            {[1, 2, 3].map((n) => <button key={n} aria-pressed={me.weeklyTarget === n} onClick={() => update((x) => setWeeklyTargetAction(x, me.id, n as 1 | 2 | 3))} className={`h-9 w-9 rounded-full border font-semibold ${me.weeklyTarget === n ? 'border-pink-600 bg-pink-600 text-white' : 'border-pink-300 bg-white'}`}>{n}</button>)}
            <span className="text-plum-500">days a week</span></div>

          <h2 className="mt-8 font-display text-xl font-semibold">Badges</h2>
          <ul className="mt-3 grid grid-cols-3 gap-3">
            {BADGES.map((b) => (
              <li key={b.slug} className="rounded-card bg-white p-3 text-center ring-1 ring-pink-100">
                <div className="flex justify-center"><BadgeArt slug={b.slug} rarity={b.rarity} size={72} locked={!earned.has(b.slug)} /></div>
                <b className="mt-1 block text-xs">{b.name}</b>
                <span className="block text-[11px] text-plum-500">{earned.has(b.slug) ? new Date(earned.get(b.slug)!).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', timeZone: 'Africa/Johannesburg' }) : b.description}</span>
              </li>
            ))}
          </ul>

          <h2 className="mt-8 font-display text-xl font-semibold">Points history</h2>
          <ul className="mt-3 divide-y divide-pink-100 rounded-card bg-white ring-1 ring-pink-100">
            {events.map((e) => <li key={e.id} className="flex justify-between px-4 py-2 text-sm"><span>{LABEL[e.source] ?? e.source}</span><b className="text-pink-700">+{e.points}</b></li>)}
            {!events.length && <li className="px-4 py-3 text-sm text-plum-500">Complete a lesson to earn your first points.</li>}
          </ul>
        </>
      )}
            <h2 className="mt-8 font-display text-xl font-semibold">Pilot rewards</h2>
      <p className="text-xs text-plum-500">{PILOT_LABEL} Nothing here is real money in this mock.</p>
      <ul className="mt-3 space-y-3">
        {views.map((v) => (
          <li key={v.def.slug} className="rounded-card bg-white p-4 ring-1 ring-pink-100" data-testid={`reward-${v.def.slug}`}>
            <div className="flex items-start justify-between gap-2"><b className="font-display text-lg">{v.def.title}</b>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${v.state === 'eligible' ? 'bg-pink-600 text-white' : v.state === 'paid' || v.state === 'approved' ? 'bg-mint-100 text-mint-700' : v.state === 'rejected' ? 'bg-coral-100 text-coral-600' : 'bg-pink-100 text-plum-500'}`}>{{ locked: 'Locked', eligible: 'Eligible', claimed: 'Claimed', approved: 'Approved', rejected: 'Not approved', paid: 'Paid' }[v.state]}</span></div>
            <p className="text-sm text-plum-500">{v.def.how}</p>
            {v.def.kind === 'draw' ? (
              <p className="mt-2 text-sm">{v.entrants} {v.entrants === 1 ? 'person has' : 'people have'} entered this week for {v.prizes} prizes of R{v.def.cash}. {v.entered ? 'You are in. ' : 'You are not in yet. '}<Link href="/community" className="underline">See the challenge</Link>
                {lastDraw && <span className="mt-1 block text-xs text-plum-500">Last draw: {lastDraw.entrants.length} entrants, {lastDraw.winners.length} winners{lastDraw.winners.includes(me.id) ? ', including you 🎉' : ''}.</span>}</p>
            ) : (
              <><div className="mt-2 h-2 rounded-full bg-pink-100"><div className="h-2 rounded-full bg-pink-400" style={{ width: `${(v.done / v.total) * 100}%` }} /></div><p className="mt-1 text-xs text-plum-500">{v.label}</p></>
            )}
            {v.state === 'eligible' && <button onClick={() => { setError(''); setClaiming(v); }} className="mt-3 rounded-input bg-pink-600 px-4 py-2 text-sm font-semibold text-white">Claim</button>}
          </li>
        ))}
      </ul>
      {claiming && (
        <div role="dialog" aria-modal="true" aria-label={`Claim ${claiming.def.title}`} className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setClaiming(null)}>
          <div className="w-full max-w-md rounded-t-card bg-white p-5 sm:rounded-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-semibold">Claim {claiming.def.title}</h3>
            <p className="mt-1 text-sm text-plum-500">Choose how you would like it. Vouchers expire, investments don’t.</p>
            {(['cash', 'credit'] as const).map((c) => { const a = amounts(claiming.def, c); const label = c === 'cash' ? `Take cash: R${a.cash}${a.credit ? ` + R${a.credit} investment credit` : ''}` : `Take investment credit: R${a.credit}${a.cash ? ` + R${a.cash} cash` : ''}`; return (
              <button key={c} onClick={() => { const r = update((x, n) => claimReward(x, me.id, claiming.def.slug, c, n)); if (r.ok) setClaiming(null); else setError(r.error); }} className="mt-3 block w-full rounded-input border border-pink-300 px-4 py-3 text-left text-sm font-semibold hover:border-pink-600">{label}{c === 'credit' && <span className="block text-xs font-normal text-plum-500">+{Math.round(CREDIT_BONUS * 100)}% more than the cash amount</span>}</button>); })}
            {error && <p role="alert" className="mt-2 text-sm text-coral-600">{error}</p>}
            <p className="mt-3 text-xs text-plum-500">{PILOT_LABEL}</p>
            <button onClick={() => setClaiming(null)} className="mt-2 text-sm text-plum-500 underline">Cancel</button>
          </div>
        </div>
      )}
      {myClaims.length > 0 && (<><h3 className="mt-6 font-display text-lg font-semibold">Your claims</h3>
        <ul className="mt-2 divide-y divide-pink-100 rounded-card bg-white ring-1 ring-pink-100">{myClaims.map((c) => <li key={c.id} className="flex justify-between px-4 py-2 text-sm"><span>{REWARDS_TITLE[c.rewardSlug]} · {c.choice === 'cash' ? 'cash' : 'credit'}</span><b className="capitalize">{c.status}</b></li>)}</ul></>)}
      <p className="mt-6 text-xs text-plum-500"><Link href="/profile" className="underline">Focus mode and targets live in Profile.</Link></p>
    </div>
  );
}
