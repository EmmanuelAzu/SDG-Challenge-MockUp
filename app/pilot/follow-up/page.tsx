'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Likert } from '@/components/pilot/likert';
import { encodeRun } from '@/lib/pilot/analysis';
import { submitFollowUp } from '@/lib/engine/pilot';
import { CONFIDENCE, FOLLOW_DID } from '@/lib/pilot/instruments';
import { useSessionId, useWorld } from '@/lib/world/hooks';
import { update } from '@/lib/world/store';

export default function FollowUp() {
  const w = useWorld();
  const sid = useSessionId();
  const run = w && sid ? w.pilot[sid] : undefined;
  const [used, setUsed] = useState<'yes' | 'no' | ''>('');
  const [did, setDid] = useState<string[]>([]);
  const [c, setC] = useState<number[]>(CONFIDENCE.map(() => 0));
  const [changed, setChanged] = useState('');
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  useEffect(() => { if (run?.followUp) encodeRun(run).then(setCode); }, [run]);
  if (!w) return <main className="mx-auto max-w-md px-4 py-12" aria-busy="true" />;
  if (!run || run.stage !== 'done') return <main className="mx-auto max-w-md px-4 py-12 text-center"><h1 className="font-display text-2xl font-semibold">Finish the pilot first</h1><p className="mt-2 text-plum-500">The follow-up is for people who completed the pilot on this device.</p><Link href="/pilot" className="mt-4 inline-block text-pink-700 underline">Go to the pilot</Link></main>;
  if (run.followUp) return (
    <main className="mx-auto max-w-md px-4 py-10 text-center"><h1 className="font-display text-3xl font-semibold">Thank you again</h1>
      <p className="mt-2 text-plum-500">Send this updated code to the person running the pilot. It replaces your earlier one.</p>
      <p className="mt-3 max-h-24 overflow-auto break-all rounded-input bg-white p-2 text-[11px] ring-1 ring-pink-100" data-testid="results-code">{code || 'Preparing…'}</p>
      <button onClick={() => navigator.clipboard?.writeText(code)} className="mt-3 rounded-input bg-pink-600 px-5 py-2 font-semibold text-white">Copy code</button></main>
  );
  const missing = (used ? 0 : 1) + c.filter((v) => !v).length;
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (missing) return setError('Please answer each question.'); if (!update((x, n) => submitFollowUp(x, sid!, { usedAgain: used as 'yes', did, c, changed }, n))) setError('Could not save. Try again.'); };
  return (
    <main className="mx-auto max-w-md px-4 py-8 pb-12">
      <h1 className="font-display text-3xl font-semibold">A week later</h1>
      <p className="text-plum-500">Two minutes. We want to know whether anything actually changed, not just what you remember from the session.</p>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <section className="rounded-card bg-white p-4 ring-1 ring-pink-100">
          <fieldset><legend className="font-medium">Have you opened Sisi since the session?</legend>
            <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Opened again">{(['yes', 'no'] as const).map((o) => <button type="button" key={o} role="radio" aria-checked={used === o} onClick={() => setUsed(o)} className={`flex-1 rounded-input border py-2 text-sm font-semibold capitalize ${used === o ? 'border-pink-600 bg-pink-600 text-white' : 'border-pink-300'}`}>{o}</button>)}</div></fieldset>
          <fieldset className="mt-4"><legend className="font-medium">Since then, have you… <span className="text-xs font-normal text-plum-500">(tick any)</span></legend>
            {FOLLOW_DID.map((d) => <label key={d} className="mt-2 flex items-start gap-2 text-sm"><input type="checkbox" checked={did.includes(d)} onChange={(e) => setDid(e.target.checked ? [...did, d] : did.filter((x) => x !== d))} className="mt-0.5 h-4 w-4" /> {d}</label>)}</fieldset>
        </section>
        <section className="space-y-4 rounded-card bg-white p-4 ring-1 ring-pink-100">
          <h2 className="font-display text-lg font-semibold">How do you feel about money now?</h2>
          {CONFIDENCE.map((t, i) => <Likert key={t} legend={t} value={c[i] || null} onChange={(v) => setC(c.map((x, j) => (j === i ? v : x)))} low="Not at all" high="Completely" />)}
        </section>
        <label className="block rounded-card bg-white p-4 text-sm font-medium ring-1 ring-pink-100">What, if anything, changed for you? <span className="text-plum-500">(optional)</span><textarea value={changed} onChange={(e) => setChanged(e.target.value)} rows={2} maxLength={300} className="mt-1 w-full rounded-input border border-pink-300 px-3 py-2 text-sm" /></label>
        {error && <p role="alert" className="text-sm text-coral-600">{error}</p>}
        <button className="w-full rounded-input bg-pink-600 py-3 font-semibold text-white">Send</button>
      </form>
    </main>
  );
}
