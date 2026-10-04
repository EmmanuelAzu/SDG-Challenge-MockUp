'use client';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { BadgeArt } from '@/components/badge-art';
import { useApp } from '@/components/shell/app-context';
import { playerFor } from '@/lib/engine/player';
import { setWeeklyTargetAction } from '@/lib/engine/settings';
import { BADGES } from '@/lib/content';
import { update } from '@/lib/world/store';

const LABEL: Record<string, string> = { lesson: 'Lesson', quiz: 'Quiz passed', action: 'Action done', weekly_target: 'Weekly target hit', onboarding: 'Welcome', session: 'Session', event: 'Event check-in', challenge: 'Challenge', buddy: 'Buddy week', feedback: 'Feedback' };

export default function Rewards() {
  const { w, me, now } = useApp();
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
      <p className="mt-6 text-xs text-plum-500">Cash and investment-credit rewards arrive in a later step. Pilot reward — subject to PPS approval. <Link href="/profile" className="underline">Focus mode and targets live in Profile.</Link></p>
    </div>
  );
}
