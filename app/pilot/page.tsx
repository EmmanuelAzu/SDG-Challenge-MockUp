'use client';
import { useEffect, useState } from 'react';
import { CheckForm } from '@/components/pilot/check-form';
import { Done } from '@/components/pilot/done';
import { Extras, Hub } from '@/components/pilot/hub';
import { Landing, clearPending, readPending } from '@/components/pilot/landing';
import { Survey } from '@/components/pilot/survey';
import { usePilotDetection } from '@/components/pilot/use-pilot';
import { startRun, submitCheck } from '@/lib/engine/pilot';
import { useSessionId, useWorld } from '@/lib/world/hooks';
import { update } from '@/lib/world/store';

export default function Pilot() {
  const w = useWorld();
  const sid = useSessionId();
  const [error, setError] = useState('');
  const [more, setMore] = useState(false);
  useEffect(() => { setMore(new URLSearchParams(window.location.search).get('more') === '1'); }, []);
  usePilotDetection();
  const me = w && sid ? w.users[sid] : undefined;
  const run = w && sid ? w.pilot[sid] : undefined;

  // Back from full sign-up: attach the consent given earlier to the new account
  useEffect(() => {
    if (!w || !me || run || !me.onboardedAt) return;
    const pending = readPending();
    if (!pending) return;
    update((x, n) => startRun(x, me.id, { path: 'full', profile: pending.profile, device: pending.device, signupMs: Date.now() - pending.startedAt }, n));
    clearPending();
  }, [w, me, run]);

  if (!w) return <main className="mx-auto max-w-md px-4 py-12" aria-busy="true"><div className="h-48 animate-pulse rounded-card bg-pink-100" /></main>;
  if (!run || !sid) return <Landing w={w} me={me} />;

  if (run.stage === 'pre' || run.stage === 'post') {
    return (
      <main className="mx-auto max-w-md px-4 py-6 pb-12">
        <h1 className="font-display text-3xl font-semibold">{run.stage === 'pre' ? 'A quick check first' : 'The final check'}</h1>
        <p className="text-plum-500">{run.stage === 'pre' ? 'Six questions and three statements, about a minute. Not a test of you. “I’m not sure” is fine.' : 'Same kind of questions again, so we can see what changed. Different wording on purpose.'}</p>
        <CheckForm key={run.stage} run={run} which={run.stage} error={error} onSubmit={(v) => { setError(''); const r = update((x, n) => submitCheck(x, sid, run.stage as 'pre' | 'post', v, n)); if (!r.ok) setError(r.error); }} />
      </main>
    );
  }
  if (run.stage === 'missions') return <Hub w={w} run={run} userId={sid} />;
  if (run.stage === 'feedback') return <Survey run={run} userId={sid} />;
  return more ? <Extras w={w} run={run} userId={sid} /> : <Done run={run} />;
}
