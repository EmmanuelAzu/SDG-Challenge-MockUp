'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Copy, Download, Mail, MessageCircle } from 'lucide-react';
import { Bloom } from '@/components/bloom';
import { encodeRun } from '@/lib/pilot/analysis';
import { scoreCheck, totalMs } from '@/lib/pilot/analysis';
import { KNOWLEDGE } from '@/lib/pilot/instruments';
import type { PilotRun } from '@/lib/world/types';
import { mmss } from './use-pilot';

export function Done({ run }: { run: PilotRun }) {
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => { encodeRun(run).then(setCode).catch(() => setCode('')); }, [run]);
  const pre = scoreCheck(run, 'pre', run.pre); const post = scoreCheck(run, 'post', run.post); const t = totalMs(run);
  const msg = `My Sisi pilot results code (anonymous, ${run.id}): ${code}`;
  const btn = 'flex items-center gap-2 rounded-input px-4 py-2 text-sm font-semibold';
  const file = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([code], { type: 'text/plain' })); a.download = `sisi-pilot-${run.id}.txt`; a.click(); URL.revokeObjectURL(a.href); };
  return (
    <main className="mx-auto max-w-md px-4 py-8 text-center">
      <div className="flex justify-center"><Bloom progress={5} size={110} /></div>
      <h1 className="mt-4 font-display text-3xl font-semibold">Thank you!</h1>
      <p className="mt-1 text-plum-500">You just helped make Sisi better for other young women.</p>

      <section className="mt-6 rounded-card bg-white p-4 text-left ring-1 ring-pink-100" data-testid="my-results">
        <h2 className="font-display text-lg font-semibold">Your results</h2>
        <p className="text-sm">Money check: <b>{pre?.score ?? '–'}/{KNOWLEDGE.length}</b> before, <b>{post?.score ?? '–'}/{KNOWLEDGE.length}</b> after.</p>
        {t != null && <p className="text-sm">Time: <b>{mmss(t)}</b></p>}
        <p className="mt-1 text-xs text-plum-500">A short session only shows what you picked up today, not how you will do later.</p>
      </section>

      <section className="mt-4 rounded-card bg-lavender-100 p-4 text-left">
        <h2 className="font-display text-lg font-semibold">One last step: send your code</h2>
        <p className="text-sm">Your answers are only in this browser. To share them, send this code to the person running the pilot. It has no name or email in it.</p>
        <p className="mt-2 max-h-24 overflow-auto break-all rounded-input bg-white p-2 text-[11px]" data-testid="results-code">{code || 'Preparing…'}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button disabled={!code} onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); }} className={`${btn} bg-pink-600 text-white disabled:opacity-50`}><Copy size={16} aria-hidden /> {copied ? 'Copied' : 'Copy code'}</button>
          <a href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer" className={`${btn} border border-pink-600 text-pink-700`}><MessageCircle size={16} aria-hidden /> WhatsApp</a>
          <a href={`mailto:?subject=${encodeURIComponent('Sisi pilot results')}&body=${encodeURIComponent(msg)}`} className={`${btn} border border-pink-600 text-pink-700`}><Mail size={16} aria-hidden /> Email</a>
          <button disabled={!code} onClick={file} className={`${btn} border border-pink-600 text-pink-700 disabled:opacity-50`}><Download size={16} aria-hidden /> Save file</button>
        </div>
      </section>

      <div className="mt-6 space-y-2 text-sm">
        <Link href="/pilot?more=1" className="block rounded-input bg-white p-3 font-semibold text-pink-700 ring-1 ring-pink-100">Try the optional extras</Link>
        <Link href="/home" className="block rounded-input bg-white p-3 font-semibold text-pink-700 ring-1 ring-pink-100">Keep exploring Sisi</Link>
        <Link href="/pilot/follow-up" className="block rounded-input bg-white p-3 font-semibold text-pink-700 ring-1 ring-pink-100">Day-7 follow-up (come back in a week)</Link>
      </div>
      <p className="mt-6 text-xs text-plum-500">To remove your data from this browser, open Profile and choose “Delete my account / reset my data”.</p>
    </main>
  );
}
