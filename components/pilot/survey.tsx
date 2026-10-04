'use client';
import { useState } from 'react';
import { AGAIN, NPS_PROMPT, SAFETY_PROMPT, UMUX, UNDERSTOOD, USEFUL } from '@/lib/pilot/instruments';
import { submitSurvey } from '@/lib/engine/pilot';
import { update } from '@/lib/world/store';
import type { PilotRun } from '@/lib/world/types';
import { Likert } from './likert';

export function Survey({ run, userId }: { run: PilotRun; userId: string }) {
  const [umux, setUmux] = useState<(number | null)[]>([null, null]);
  const [nps, setNps] = useState<number | null>(null);
  const [safety, setSafety] = useState<number | null>(null);
  const [understood, setUnderstood] = useState<number | null>(null);
  const [useful, setUseful] = useState('');
  const [again, setAgain] = useState<'yes' | 'maybe' | 'no' | ''>('');
  const [liked, setLiked] = useState('');
  const [confusing, setConfusing] = useState('');
  const [error, setError] = useState('');
  const talked = !!run.missions.community?.doneAt;
  const missing = [umux[0], umux[1], nps, understood, useful || null, again || null, talked ? safety : 1].filter((v) => v === null).length;
  const card = 'rounded-card bg-white p-4 ring-1 ring-pink-100';
  const area = 'mt-1 w-full rounded-input border border-pink-300 bg-white px-3 py-2 text-sm';

  function submit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (missing) return setError('Please answer the rating questions. The two comment boxes are optional.');
    const r = update((x, n) => submitSurvey(x, userId, { umux: [umux[0]!, umux[1]!], nps: nps!, safety: talked ? safety : null, understood: understood!, useful, again: again as 'yes', liked, confusing }, n));
    if (!r.ok) setError(r.error);
  }

  return (
    <main className="mx-auto max-w-md px-4 py-6 pb-12">
      <h1 className="font-display text-3xl font-semibold">Tell us how it went</h1>
      <p className="text-plum-500">About a minute. Honest answers help most, including the unflattering ones.</p>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <section className={`${card} space-y-4`}>
          <h2 className="font-display text-lg font-semibold">Using Sisi</h2>
          {UMUX.map((t, i) => <Likert key={t} legend={t} value={umux[i]} onChange={(v) => setUmux(umux.map((x, j) => (j === i ? v : x)))} min={1} max={7} low="Strongly disagree" high="Strongly agree" />)}
          <Likert legend={NPS_PROMPT} value={nps} onChange={setNps} min={0} max={10} low="Not at all likely" high="Extremely likely" />
          {talked && <Likert legend={SAFETY_PROMPT} value={safety} onChange={setSafety} low="Strongly disagree" high="Strongly agree" />}
        </section>
        <section className={card}>
          <fieldset><legend className="font-medium">{UNDERSTOOD.prompt}</legend>
            <div className="mt-2 space-y-1.5" role="radiogroup" aria-label={UNDERSTOOD.prompt}>
              {UNDERSTOOD.options.map((o, i) => <button type="button" key={o} role="radio" aria-checked={understood === i} onClick={() => setUnderstood(i)} className={`block w-full rounded-input border px-3 py-2 text-left text-sm ${understood === i ? 'border-pink-600 bg-pink-100 font-semibold' : 'border-pink-300'}`}>{o}</button>)}
            </div></fieldset>
          <fieldset className="mt-4"><legend className="font-medium">What was most useful?</legend>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Most useful">
              {USEFUL.map((o) => <button type="button" key={o} role="radio" aria-checked={useful === o} onClick={() => setUseful(o)} className={`rounded-full border px-3 py-1.5 text-sm ${useful === o ? 'border-pink-600 bg-pink-600 font-semibold text-white' : 'border-pink-300'}`}>{o}</button>)}
            </div></fieldset>
          <fieldset className="mt-4"><legend className="font-medium">Would you use Sisi again next week?</legend>
            <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Use again">
              {AGAIN.map((o) => <button type="button" key={o.id} role="radio" aria-checked={again === o.id} onClick={() => setAgain(o.id)} className={`flex-1 rounded-input border py-2 text-sm font-semibold ${again === o.id ? 'border-pink-600 bg-pink-600 text-white' : 'border-pink-300'}`}>{o.label}</button>)}
            </div></fieldset>
        </section>
        <section className={card}>
          <label className="block text-sm font-medium">What confused you or got in your way? <span className="text-plum-500">(optional)</span><textarea value={confusing} onChange={(e) => setConfusing(e.target.value)} rows={2} maxLength={300} className={area} /></label>
          <label className="mt-3 block text-sm font-medium">What did you like most? <span className="text-plum-500">(optional)</span><textarea value={liked} onChange={(e) => setLiked(e.target.value)} rows={2} maxLength={300} className={area} /></label>
          <p className="mt-2 text-xs text-plum-500">Please do not write your name, contact details or any amounts.</p>
        </section>
        {error && <p role="alert" className="text-sm text-coral-600">{error}</p>}
        <button disabled={missing > 0} className="w-full rounded-input bg-pink-600 py-3 font-semibold text-white disabled:opacity-50">{missing ? `${missing} to go` : 'Finish'}</button>
      </form>
    </main>
  );
}
