'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/shell/app-context';
import { update } from '@/lib/world/store';

const LIKERT = [
  'I feel confident making everyday money decisions.',
  'I could build a monthly budget and stick to it.',
  'I know how to start saving for an emergency.',
  'I know how to start investing with a small amount.',
  'I feel comfortable talking about money with people I trust.',
];

export default function CheckIn() {
  const router = useRouter();
  const { me } = useApp();
  const [a, setA] = useState([0, 0, 0, 0, 0]);
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Your check-in</h1>
      <p className="text-plum-500">1 = not at all, 5 = completely. We compare this with how you felt when you joined.</p>
      <div className="mt-5 space-y-5">
        {LIKERT.map((q, qi) => (
          <fieldset key={q}><legend className="text-sm font-medium">{q}</legend>
            <div className="mt-2 flex gap-2">{[1, 2, 3, 4, 5].map((n) => <button key={n} aria-pressed={a[qi] === n} onClick={() => setA(a.map((v, i) => (i === qi ? n : v)))} className={`h-11 flex-1 rounded-input border font-semibold ${a[qi] === n ? 'border-pink-600 bg-pink-600 text-white' : 'border-pink-300 bg-white'}`}>{n}</button>)}</div>
          </fieldset>
        ))}
      </div>
      <button disabled={a.some((v) => !v)} onClick={() => { update((w, now) => { w.surveys.push({ userId: me.id, kind: 'post', answers: a, at: now.toISOString() }); }); router.replace('/home'); }} className="mt-6 w-full rounded-input bg-pink-600 py-3 font-semibold text-white hover:bg-pink-700 disabled:opacity-50">Save my check-in</button>
    </div>
  );
}
