'use client';
import Link from 'next/link';
import { Flame, Sparkles, Sprout } from 'lucide-react';
import { Bloom } from '@/components/bloom';
import { useApp } from '@/components/shell/app-context';
import { playerFor } from '@/lib/engine/player';
import { firstName } from '@/lib/engine/helpers';
import { shouldAskShare } from '@/lib/engine/feed';
import { realResults } from '@/lib/engine/goals';
import { JOINT_WEEKS_NEEDED, jointWeeks, pairOf } from '@/lib/engine/buddy';
import { stepsDone } from '@/lib/engine/invest';
import { rand } from '@/lib/money';
import { update } from '@/lib/world/store';

export default function HomePage() {
  const { w, me, now } = useApp();
  const p = playerFor(w, me.id, now);
  const { journey, weekly, level } = p;
  const toReward = Math.min(journey.doneCount, 3);
  const money = realResults(w, me.id);
  const inv = w.invest[me.id];
  const buddyPair = pairOf(w, me.id);
  const buddyLine = !buddyPair ? 'Pair up with a friend' : buddyPair.status === 'pending' ? 'Waiting for your buddy' : `${jointWeeks(w, buddyPair, now)} of ${JOINT_WEEKS_NEEDED} joint weeks`;
  const chip = 'flex items-center gap-1 rounded-full bg-pink-100 px-3 py-1 text-sm font-semibold text-pink-700';

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Hi {firstName(me.displayName) || 'Sisi'}</h1>
      <p className="font-display italic text-pink-700">Small steps. Big future.</p>

      <div className="mt-5 flex items-center gap-4">
        <Bloom progress={journey.doneCount} size={110} />
        {!me.focusMode && (
          <div className="flex flex-wrap gap-2">
            <span className={chip}><Sparkles size={14} /> {p.xp} pts</span>
            <span className={chip}><Sprout size={14} /> {level.name}</span>
            {weekly.streakWeeks > 0 && <span className={chip}><Flame size={14} /> {weekly.streakWeeks}-week streak</span>}
          </div>
        )}
      </div>

      {!me.focusMode && (
        <div className="mt-4 rounded-card bg-white p-4 ring-1 ring-pink-100">
          <div className="flex justify-between text-sm font-semibold"><span>This week</span><span>{Math.min(weekly.thisWeek.days, me.weeklyTarget)} of {me.weeklyTarget} days</span></div>
          <div className="mt-2 flex gap-1" role="progressbar" aria-valuenow={weekly.thisWeek.days} aria-valuemin={0} aria-valuemax={me.weeklyTarget} aria-label="Weekly target">
            {Array.from({ length: me.weeklyTarget }, (_, i) => <span key={i} className={`h-2 flex-1 rounded-full ${i < weekly.thisWeek.days ? 'bg-pink-600' : 'bg-pink-100'}`} />)}
          </div>
          {level.next && (
            <>
              <div className="mt-3 flex justify-between text-xs text-plum-500"><span>{level.name}</span><span>{level.toNext} pts to {level.next}</span></div>
              <div className="mt-1 h-2 rounded-full bg-pink-100"><div className="h-2 rounded-full bg-pink-300" style={{ width: `${level.progress * 100}%` }} /></div>
            </>
          )}
        </div>
      )}

      {shouldAskShare(w, me.id) && (
        <div className="mt-4 rounded-card bg-pink-100 p-4 text-sm">
          <b>Share your milestones with friends?</b>
          <p className="text-plum-500">Your badges and progress would appear in your communities’ feeds, never amounts. Off by default; you can change it any time in Profile.</p>
          <div className="mt-2 flex gap-2">
            <button onClick={() => update((x) => { x.users[me.id].shareMilestones = true; x.askedShare[me.id] = true; })} className="rounded-full bg-pink-600 px-4 py-1.5 font-semibold text-white">Yes, share</button>
            <button onClick={() => update((x) => { x.askedShare[me.id] = true; })} className="rounded-full px-4 py-1.5 font-semibold text-pink-700 ring-1 ring-pink-300">Not now</button>
          </div>
        </div>
      )}

      {p.checkInDue && (
        <Link href="/check-in" className="mt-4 block rounded-card bg-lavender-100 p-4 text-sm"><b className="text-lavender-600">Time for your 4-week check-in</b><span className="block text-plum-500">Five quick questions to see how far you have come.</span></Link>
      )}

      {journey.next ? (
        <Link href={journey.next.href} className="mt-6 block rounded-card bg-pink-600 p-5 text-white hover:bg-pink-700">
          <span className="text-xs font-semibold uppercase tracking-wide opacity-80">Your next action</span>
          <span className="mt-1 block font-display text-xl font-semibold">{journey.next.title}</span>
          <span className="mt-3 inline-block rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-pink-700">{journey.next.cta}</span>
        </Link>
      ) : (
        <div className="mt-6 rounded-card bg-mint-100 p-5 text-mint-700"><p className="font-display text-xl font-semibold">You have bloomed all five petals.</p><p className="text-sm">Revisit any lesson, or join a Circle to keep going.</p></div>
      )}

      <section className="mt-6 rounded-card bg-white p-4 ring-1 ring-pink-100" aria-label="Real results">
        <h2 className="font-display text-lg font-semibold">Your real results</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          <div><dt className="text-xs text-plum-500">Lessons done</dt><dd className="font-display text-2xl font-semibold text-pink-700">{journey.lessonsCompleted}</dd></div>
          <div><dt className="text-xs text-plum-500">Milestones</dt><dd className="font-display text-2xl font-semibold text-pink-700">{journey.doneCount}/5</dd></div>
          <div><dt className="text-xs text-plum-500">Confidence</dt><dd className="font-display text-2xl font-semibold text-pink-700">{p.confidenceChange === null ? '–' : `${p.confidenceChange >= 0 ? '+' : ''}${p.confidenceChange.toFixed(1)}`}</dd></div>
          <div><dt className="text-xs text-plum-500">Saved so far</dt><dd className="font-display text-2xl font-semibold text-pink-700">{money.goals ? rand(money.saved) : '–'}</dd></div>
        </dl>
        {money.goals > 0 && <p className="mt-2 text-center text-xs text-plum-500">{money.reached} of {money.goals} savings {money.goals === 1 ? 'goal' : 'goals'} reached. Only you see these amounts.</p>}
        {p.confidenceChange === null && <p className="mt-2 text-xs text-plum-500">Your confidence change appears after your 4-week check-in.</p>}
      </section>

      <h2 className="mt-8 font-display text-xl font-semibold">Your pathways</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-3">
        <li><Link href="/pathways/milestones" className="block rounded-card bg-pink-100 p-4"><b className="font-display text-pink-700">Money Milestones</b><span className="mt-1 block text-sm">{journey.doneCount} of 5 done</span></Link></li>
        <li><Link href="/pathways/buddy" className="block rounded-card bg-lavender-100 p-4"><b className="font-display text-lavender-600">Money Buddy</b><span className="mt-1 block text-sm">{buddyLine}</span></Link></li>
        <li><Link href="/pathways/invest-her" className="block rounded-card bg-mint-100 p-4"><b className="font-display text-mint-700">Invest HER</b><span className="mt-1 block text-sm">{inv?.finishedAt ? 'Finished 🎉' : inv ? `${stepsDone(inv)} of 4 steps` : 'Start a guided, simulated first step'}</span></Link></li>
      </ul>

      <h2 className="mt-8 font-display text-xl font-semibold">Money tools</h2>
      <ul className="mt-3 grid grid-cols-2 gap-3 text-sm font-semibold">
        <li><Link href="/tools/budget" className="block rounded-card bg-white p-4 ring-1 ring-pink-100 hover:ring-pink-300">💰 Budget builder<span className="block text-xs font-normal text-plum-500">{w.budgets[me.id] ? 'Update your budget' : 'Plan your month'}</span></Link></li>
        <li><Link href="/tools/goals" className="block rounded-card bg-white p-4 ring-1 ring-pink-100 hover:ring-pink-300">🎯 Savings goals<span className="block text-xs font-normal text-plum-500">{money.goals ? `${money.goals} active` : 'Set your first goal'}</span></Link></li>
      </ul>

      <div className="mt-8 rounded-card bg-white p-4 ring-1 ring-pink-100">
        <p className="text-sm font-semibold">Your next reward: R50 cash at 3 milestones</p>
        <div className="mt-2 h-2 rounded-full bg-pink-100" role="progressbar" aria-valuenow={toReward} aria-valuemin={0} aria-valuemax={3}><div className="h-2 rounded-full bg-pink-300" style={{ width: `${(toReward / 3) * 100}%` }} /></div>
        <p className="mt-2 text-xs text-plum-500">Pilot reward — subject to PPS approval.</p>
      </div>
      <footer className="mt-10 text-xs text-plum-500">Sisi provides financial education, not financial advice.</footer>
    </div>
  );
}
