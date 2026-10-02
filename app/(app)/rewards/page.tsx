import Link from 'next/link';
import { Check } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { getPlayer } from '@/lib/player';
import { getJourney } from '@/lib/journey';
import { BadgeArt } from '@/components/badge-art';
import { TargetPicker } from '@/components/target-picker';

export const dynamic = 'force-dynamic';

export default async function Rewards() {
  const { supabase, user } = await requireUser();
  const [me, journey, { data: badges }, { data: mine }, { data: events }] = await Promise.all([
    getPlayer(supabase, user.id),
    getJourney(supabase, user.id),
    supabase.from('badges').select('slug,name,description,meaning_line,rarity,sort').order('sort'),
    supabase.from('user_badges').select('badge_slug,earned_at').eq('user_id', user.id),
    supabase.from('point_events').select('source,points,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(15),
  ]);
  const earned = new Map((mine ?? []).map((r) => [r.badge_slug, r.earned_at]));
  const label: Record<string, string> = { lesson: 'Lesson', quiz: 'Quiz passed', action: 'Action done', weekly_target: 'Weekly target hit', onboarding: 'Welcome', session: 'Session', event: 'Event check-in', challenge: 'Challenge', buddy: 'Buddy week', feedback: 'Feedback' };
  const dot = (h: { days: number; hit: boolean }, current: boolean) => `h-5 w-5 rounded-full ${h.hit ? 'bg-pink-600' : h.days > 0 ? 'bg-pink-300' : 'bg-pink-100'} ${current ? 'ring-2 ring-pink-700 ring-offset-1' : ''}`;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Rewards</h1>

      {me.focus ? (
        <>
          <p className="text-plum-500">Focus mode is on. Your progress still counts.</p>
          <h2 className="mt-6 font-display text-xl font-semibold">Milestones</h2>
          <ol className="mt-3 divide-y divide-pink-100 rounded-card bg-white ring-1 ring-pink-100">
            {journey.milestones.map((m) => <li key={m.id} className="flex items-center gap-3 px-4 py-3 text-sm"><span className={`flex h-6 w-6 items-center justify-center rounded-full ${m.done ? 'bg-pink-600 text-white' : 'bg-pink-100'}`}>{m.done && <Check size={14} aria-label="Done" />}</span>{m.title}</li>)}
          </ol>
        </>
      ) : (
        <>
          <p className="text-plum-500">{earned.size} of {badges?.length ?? 0} badges</p>

          <section className="mt-5 rounded-card bg-white p-4 ring-1 ring-pink-100">
            <div className="flex items-baseline justify-between"><b className="font-display text-xl text-pink-700">{me.level.name}</b><span className="text-sm text-plum-500">{me.xp} XP</span></div>
            <div className="mt-2 h-2 rounded-full bg-pink-100"><div className="h-2 rounded-full bg-pink-300" style={{ width: `${me.level.progress * 100}%` }} /></div>
            <p className="mt-1 text-xs text-plum-500">{me.level.next ? `${me.level.toNext} points to ${me.level.next}` : 'You are at the top level.'}</p>
          </section>

          <h2 className="mt-8 font-display text-xl font-semibold">Weekly streak</h2>
          <p className="text-sm text-plum-500">{me.weekly.streakWeeks} {me.weekly.streakWeeks === 1 ? 'week' : 'weeks'} in a row · this week {Math.min(me.weekly.thisWeek.days, me.weeklyTarget)} of {me.weeklyTarget} days</p>
          <div className="mt-3 flex gap-2" role="img" aria-label="Last 12 weeks: target hit, partly hit or missed">
            {me.weekly.history.map((h, i) => <span key={h.weekKey} title={h.weekKey} className={dot(h, i === me.weekly.history.length - 1)} />)}
          </div>
          <p className="mt-2 text-xs text-plum-500">Dark = target hit · light = some days · pale = a quiet week. Missing a day never resets anything.</p>
          <TargetPicker current={me.weeklyTarget} />

          <h2 className="mt-8 font-display text-xl font-semibold">Badges</h2>
          <ul className="mt-3 grid grid-cols-3 gap-3">
            {(badges ?? []).map((b) => (
              <li key={b.slug} className="rounded-card bg-white p-3 text-center ring-1 ring-pink-100">
                <div className="flex justify-center"><BadgeArt slug={b.slug} rarity={b.rarity} size={72} locked={!earned.has(b.slug)} /></div>
                <b className="mt-1 block text-xs">{b.name}</b>
                <span className="block text-[11px] text-plum-500">{earned.has(b.slug) ? new Date(earned.get(b.slug)!).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', timeZone: 'Africa/Johannesburg' }) : b.description}</span>
              </li>
            ))}
          </ul>

          <h2 className="mt-8 font-display text-xl font-semibold">Points history</h2>
          <ul className="mt-3 divide-y divide-pink-100 rounded-card bg-white ring-1 ring-pink-100">
            {(events ?? []).map((e, i) => <li key={i} className="flex justify-between px-4 py-2 text-sm"><span>{label[e.source] ?? e.source}</span><b className="text-pink-700">+{e.points}</b></li>)}
            {!events?.length && <li className="px-4 py-3 text-sm text-plum-500">Complete a lesson to earn your first points.</li>}
          </ul>
        </>
      )}
      <p className="mt-6 text-xs text-plum-500">Cash and investment-credit rewards arrive in the next phase. Pilot reward — subject to PPS approval. <Link href="/profile" className="underline">Focus mode and targets live in Profile.</Link></p>
    </div>
  );
}
