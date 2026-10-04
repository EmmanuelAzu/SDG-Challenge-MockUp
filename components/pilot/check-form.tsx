'use client';
import { useMemo, useRef, useState } from 'react';
import { formAt } from '@/lib/pilot/analysis';
import { CONFIDENCE, KNOWLEDGE, NOT_SURE, optionOrder } from '@/lib/pilot/instruments';
import { Likert } from './likert';
import type { PilotRun } from '@/lib/world/types';

/** Six short questions and three confidence statements. The same form is used before and after, with the parallel version at the end. */
export function CheckForm({ run, which, onSubmit, error }: { run: PilotRun; which: 'pre' | 'post'; onSubmit: (v: { k: Record<string, number>; c: number[]; ms: number }) => void; error: string }) {
  const form = formAt(run, which);
  const started = useRef(Date.now());
  const [k, setK] = useState<Record<string, number>>({});
  const [c, setC] = useState<number[]>(CONFIDENCE.map(() => 0));
  const orders = useMemo(() => Object.fromEntries(KNOWLEDGE.map((i) => [i.id, optionOrder(run.id, i.id, which, 4)])), [run.id, which]);
  const missing = KNOWLEDGE.filter((i) => k[i.id] === undefined).length + c.filter((v) => !v).length;

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!missing) onSubmit({ k, c, ms: Date.now() - started.current }); }} className="mt-4 space-y-6">
      {KNOWLEDGE.map((item, n) => {
        const q = item.forms[form];
        return (
          <fieldset key={item.id} className="rounded-card bg-white p-4 ring-1 ring-pink-100">
            <legend className="px-1 text-xs font-semibold text-plum-500">Question {n + 1} of {KNOWLEDGE.length}</legend>
            <p className="font-medium">{q.prompt}</p>
            <div className="mt-3 space-y-2" role="radiogroup" aria-label={q.prompt}>
              {orders[item.id].map((idx) => (
                <button key={idx} type="button" role="radio" aria-checked={k[item.id] === idx} onClick={() => setK({ ...k, [item.id]: idx })} className={`block w-full rounded-input border px-3 py-2.5 text-left text-sm ${k[item.id] === idx ? 'border-pink-600 bg-pink-100 font-semibold' : 'border-pink-300 bg-white'}`}>{q.options[idx]}</button>
              ))}
              <button type="button" role="radio" aria-checked={k[item.id] === NOT_SURE} onClick={() => setK({ ...k, [item.id]: NOT_SURE })} className={`block w-full rounded-input border border-dashed px-3 py-2.5 text-left text-sm ${k[item.id] === NOT_SURE ? 'border-plum-500 bg-pink-50 font-semibold' : 'border-pink-300 text-plum-500'}`}>I’m not sure</button>
            </div>
          </fieldset>
        );
      })}
      <section className="rounded-card bg-white p-4 ring-1 ring-pink-100">
        <h2 className="font-display text-lg font-semibold">How do you feel about money right now?</h2>
        <p className="text-xs text-plum-500">1 = not at all, 5 = completely</p>
        <div className="mt-3 space-y-4">
          {CONFIDENCE.map((text, i) => <Likert key={text} legend={text} value={c[i] || null} onChange={(v) => setC(c.map((x, j) => (j === i ? v : x)))} low="Not at all" high="Completely" />)}
        </div>
      </section>
      {error && <p role="alert" className="text-sm text-coral-600">{error}</p>}
      <button disabled={missing > 0} className="w-full rounded-input bg-pink-600 py-3 font-semibold text-white disabled:opacity-50">{missing > 0 ? `${missing} left to answer` : which === 'pre' ? 'Start the missions' : 'Continue to feedback'}</button>
    </form>
  );
}
