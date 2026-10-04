'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Clock } from 'lucide-react';
import { confirmMission, coreComplete, coreRated, goToPost, rateMission, startMission } from '@/lib/engine/pilot';
import { CORE, EXTRA, SEQ_PROMPT, TIME_BUDGET_MIN, type MissionDef } from '@/lib/pilot/instruments';
import { update } from '@/lib/world/store';
import type { PilotRun, World } from '@/lib/world/types';
import { Likert } from './likert';
import { mmss, useTick } from './use-pilot';

function Mission({ m, run, userId, n, w }: { m: MissionDef; run: PilotRun; userId: string; n?: number; w: World }) {
  const router = useRouter();
  const st = run.missions[m.id];
  const done = !!st?.doneAt;
  const myCommunity = w.communities.find((c) => w.communityMembers.some((cm) => cm.communityId === c.id && cm.userId === userId));
  const href = m.id === 'community' && myCommunity ? `/community/${myCommunity.slug}?tab=lounge` : m.href;
  const go = () => { update((x, now) => startMission(x, userId, m.id, now)); if (href !== '/pilot') router.push(href); };
  return (
    <li className={`rounded-card p-4 ring-1 ${done ? 'bg-mint-100 ring-mint-700/20' : 'bg-white ring-pink-100'}`} data-testid={`mission-${m.id}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-mint-700 text-white' : 'bg-pink-100 text-pink-700'}`}>{done ? <Check size={14} aria-label="Done" /> : n}</span>
        <div className="min-w-0 flex-1">
          <b className="font-display text-lg">{m.title}</b> <span className="text-xs text-plum-500">about {m.minutes} min</span>
          {!done && (
            <>
              <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm">{m.steps.map((s) => <li key={s}>{s}</li>)}</ol>
              {m.hint && <p className="mt-2 rounded-input bg-gold-100 px-3 py-2 text-xs">{m.hint}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button onClick={go} className="rounded-input bg-pink-600 px-4 py-2 text-sm font-semibold text-white">{st?.startedAt ? 'Open again' : 'Start'}</button>
                {!m.auto && st?.startedAt && <button onClick={() => update((x, now) => confirmMission(x, userId, m.id, now))} className="rounded-input border border-pink-600 px-4 py-2 text-sm font-semibold text-pink-700">I did this</button>}
                {m.auto && st?.startedAt && <span className="text-xs text-plum-500">It ticks off by itself when you finish.</span>}
              </div>
            </>
          )}
          {done && (
            <div className="mt-2">
              <p className="text-sm text-mint-700">{m.success}</p>
              <div className="mt-3"><Likert legend={SEQ_PROMPT} name={`${m.title} ease`} value={st?.seq ?? null} onChange={(v) => update((x) => rateMission(x, userId, m.id, v))} min={1} max={7} low="Very difficult" high="Very easy" /></div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

export function Extras({ w, run, userId }: { w: World; run: PilotRun; userId: string }) {
  return (
    <main className="mx-auto max-w-md px-4 py-6 pb-12">
      <Link href="/pilot" className="text-sm text-pink-700">← Back</Link>
      <h1 className="mt-2 font-display text-3xl font-semibold">Optional extras</h1>
      <p className="text-plum-500">Each takes a minute or two. Please rate the ones you try. After you finish, copy your results code again so it includes them.</p>
      <ul className="mt-4 space-y-3">{EXTRA.map((m) => <Mission key={m.id} m={m} run={run} userId={userId} w={w} />)}</ul>
    </main>
  );
}

export function Hub({ w, run, userId }: { w: World; run: PilotRun; userId: string }) {
  const [error, setError] = useState('');
  const tick = useTick(1000);
  const elapsed = tick + w.clockOffsetMs - new Date(run.startedAt).getTime();
  const done = CORE.filter((m) => run.missions[m.id]?.doneAt).length;
  const ready = coreComplete(run) && coreRated(run);
  return (
    <main className="mx-auto max-w-md px-4 py-6 pb-28">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">Your missions</h1>
        <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${elapsed > TIME_BUDGET_MIN * 60000 ? 'bg-coral-100 text-coral-600' : 'bg-lavender-100 text-lavender-600'}`}><Clock size={14} aria-hidden /> {mmss(elapsed)}</span>
      </div>
      <p className="text-plum-500">{done} of {CORE.length} done. Do them in order. Tap Start, do the task, then come back here to rate it.</p>
      <ul className="mt-4 space-y-3">{CORE.map((m, i) => <Mission key={m.id} m={m} run={run} userId={userId} n={i + 1} w={w} />)}</ul>

      <details className="mt-6 rounded-card bg-white p-4 ring-1 ring-pink-100">
        <summary className="cursor-pointer font-display text-lg font-semibold">Want to try more? (optional)</summary>
        <p className="mt-1 text-xs text-plum-500">Each one takes a minute or two. Please rate any you try. They are not part of the {TIME_BUDGET_MIN} minutes.</p>
        <ul className="mt-3 space-y-3">{EXTRA.map((m) => <Mission key={m.id} m={m} run={run} userId={userId} w={w} />)}</ul>
      </details>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-pink-100 bg-white p-3">
        <div className="mx-auto max-w-md">
          {error && <p role="alert" className="mb-2 text-sm text-coral-600">{error}</p>}
          <button onClick={() => { const r = update((x) => goToPost(x, userId)); if (!r.ok) setError(r.error); }} disabled={!ready} className="w-full rounded-input bg-pink-600 py-3 font-semibold text-white disabled:opacity-50">{!coreComplete(run) ? `Finish ${CORE.length - done} more mission${CORE.length - done === 1 ? '' : 's'}` : !coreRated(run) ? 'Rate each mission to continue' : 'Go to the final check'}</button>
          <p className="mt-1 text-center text-[11px] text-plum-500">Stuck? <Link href="/help/faq" className="underline">FAQ</Link> · tell the person running the session</p>
        </div>
      </div>
    </main>
  );
}
