'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Copy, Download, Mail, MessageCircle } from 'lucide-react';
import { Bloom } from '@/components/bloom';
import { encodeRun, totalMs } from '@/lib/pilot/analysis';
import { FEEDBACK_FORM_URL } from '@/lib/pilot/instruments';
import type { PilotRun } from '@/lib/world/types';

export function Done({ run }: { run: PilotRun }) {
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => { encodeRun(run).then(setCode).catch(() => setCode('')); }, [run]);
  const t = totalMs(run);
  const msg = `My Sisi pilot results code (anonymous, ${run.id}): ${code}`;
  const btn = 'flex items-center gap-2 rounded-input px-4 py-2 text-sm font-semibold';
  const file = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([code], { type: 'text/plain' })); a.download = `sisi-pilot-${run.id}.txt`; a.click(); URL.revokeObjectURL(a.href); };
  return (
    <main className="mx-auto max-w-md px-4 py-8 text-center">
      <div className="flex justify-center"><Bloom progress={5} size={110} /></div>
      <h1 className="mt-4 font-display text-3xl font-semibold">Thank you!</h1>
      <p className="mt-1 text-plum-500">You just helped make Sisi better for other young women.{t != null ? ` It took you ${Math.max(1, Math.round(t / 60000))} minutes.` : ''}</p>

      <section className="mt-6 rounded-card bg-white p-4 text-left ring-1 ring-pink-100" data-testid="participant-id">
        <h2 className="font-display text-lg font-semibold">Step 1: your feedback</h2>
        <p className="text-sm text-plum-500">Please fill in the short feedback form (4 to 5 minutes). It asks for your participant ID:</p>
        <p className="mt-2 font-mono text-2xl font-semibold text-pink-700">{run.id}</p>
        <p className="text-xs text-plum-500">Random, and nothing to do with your name.</p>
        {FEEDBACK_FORM_URL ? <a href={FEEDBACK_FORM_URL} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block rounded-input bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white">Open the feedback form</a> : <p className="mt-3 rounded-input bg-pink-100 px-3 py-2 text-xs">The person running the pilot will give you the feedback form link.</p>}
      </section>

      <details className="mt-4 rounded-card bg-lavender-100 p-4 text-left">
        <summary className="cursor-pointer font-display text-lg font-semibold">Step 2: results code (only if the person running the pilot asks)</summary>
        <p className="text-sm">What you did in the app is saved only in this browser. This code has no name or email in it. Hand it over only if the person running the pilot asks for it.</p>
        <p className="mt-2 max-h-24 overflow-auto break-all rounded-input bg-white p-2 text-[11px]" data-testid="results-code">{code || 'Preparing…'}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button disabled={!code} onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); }} className={`${btn} bg-pink-600 text-white disabled:opacity-50`}><Copy size={16} aria-hidden /> {copied ? 'Copied' : 'Copy code'}</button>
          <a href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer" className={`${btn} border border-pink-600 text-pink-700`}><MessageCircle size={16} aria-hidden /> WhatsApp</a>
          <a href={`mailto:?subject=${encodeURIComponent('Sisi pilot results')}&body=${encodeURIComponent(msg)}`} className={`${btn} border border-pink-600 text-pink-700`}><Mail size={16} aria-hidden /> Email</a>
          <button disabled={!code} onClick={file} className={`${btn} border border-pink-600 text-pink-700 disabled:opacity-50`}><Download size={16} aria-hidden /> Save file</button>
        </div>
        <p className="mt-2 text-xs text-plum-500">If you peek at more of the app afterwards, copy the code again.</p>
      </details>

      <div className="mt-6 space-y-2 text-sm">
        <Link href="/pilot?more=1" className="block rounded-input bg-white p-3 font-semibold text-pink-700 ring-1 ring-pink-100">Peek at more of the app</Link>
        <Link href="/home" className="block rounded-input bg-white p-3 font-semibold text-pink-700 ring-1 ring-pink-100">Keep exploring Sisi</Link>
      </div>
      <p className="mt-6 text-xs text-plum-500">To remove your data from this browser, open Profile and choose “Delete my account / reset my data”.</p>
    </main>
  );
}
