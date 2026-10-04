'use client';
import { useState } from 'react';
import Link from 'next/link';
import { fmtDateTime } from '@/lib/format';
import { ANSWER_TARGET_HOURS, CALL_WINDOWS, HELP_NOTICE, HELP_TOPICS, MAX_OPEN, cancelRequest, createRequest, hoursLeft, openRequests } from '@/lib/engine/help';
import { useMe, useSessionId, useWorld } from '@/lib/world/hooks';
import { update } from '@/lib/world/store';

export default function Talk() {
  const w = useWorld();
  const sid = useSessionId();
  const [kind, setKind] = useState<'question' | 'call'>('question');
  const [topic, setTopic] = useState(HELP_TOPICS[0]);
  const [body, setBody] = useState('');
  const [windows, setWindows] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const ctx = useMe();
  if (!w) return <main className="mx-auto max-w-md px-4 py-8" aria-busy="true"><div className="h-40 animate-pulse rounded-card bg-pink-100" /></main>;
  if (!ctx || !sid) return <main className="mx-auto max-w-md px-4 py-8"><h1 className="font-display text-3xl font-semibold">Talk to someone</h1><p className="mt-2 text-plum-500">Sign in to ask a question or request a call.</p><Link href="/login?next=/help/talk" className="mt-4 inline-block rounded-input bg-pink-600 px-5 py-3 font-semibold text-white">Sign in</Link></main>;
  const { me } = ctx;
  const now = new Date(Date.now() + w.clockOffsetMs);
  const mine = w.helpRequests.filter((h) => h.userId === me.id).sort((a, b) => b.at.localeCompare(a.at));
  const open = openRequests(w, me.id).length;
  const input = 'mt-1 w-full rounded-input border border-pink-300 bg-white px-3 py-3';

  function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSent(false);
    const r = update((x, n) => createRequest(x, me.id, { kind, topic, body, windows }, n));
    if (!r.ok) return setError(r.error);
    setBody(''); setWindows([]); setSent(true);
  }

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="font-display text-3xl font-semibold">Talk to someone</h1>
      <p className="mt-1 text-plum-500">Ask a real person. We aim to answer within {ANSWER_TARGET_HOURS} hours. No chatbot.</p>
      <p className="mt-3 rounded-input bg-pink-100 p-3 text-sm">{HELP_NOTICE}</p>
      <p className="mt-3 text-sm text-plum-500">Please do not include account numbers, ID numbers or exact amounts. If something feels unsafe, open <Link replace href="/help/support" className="font-semibold text-pink-700 underline">Support</Link>.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div role="radiogroup" aria-label="Type of request" className="flex gap-2">
          {([['question', 'Ask a question'], ['call', 'Request a 15-min call']] as const).map(([k, label]) => <button type="button" key={k} role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={`flex-1 rounded-input px-3 py-2 text-sm font-semibold ${kind === k ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-700'}`}>{label}</button>)}
        </div>
        <label className="block text-sm font-medium">Topic<select value={topic} onChange={(e) => setTopic(e.target.value)} className={input}>{HELP_TOPICS.map((t) => <option key={t}>{t}</option>)}</select></label>
        <label className="block text-sm font-medium">{kind === 'call' ? 'What would you like to talk about?' : 'Your question'}<textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={600} className={input} /></label>
        {kind === 'call' && (
          <fieldset><legend className="text-sm font-medium">Preferred times (pick up to 3)</legend>
            <div className="mt-2 flex flex-wrap gap-2">{CALL_WINDOWS.map((c) => { const on = windows.includes(c); return <button type="button" key={c} aria-pressed={on} onClick={() => setWindows(on ? windows.filter((x) => x !== c) : windows.length < 3 ? [...windows, c] : windows)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${on ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-700'}`}>{c}</button>; })}</div></fieldset>
        )}
        {error && <p role="alert" className="text-sm text-coral-600">{error}</p>}
        {sent && <p role="status" className="text-sm text-mint-700">Sent. You will get a notification when it is answered.</p>}
        <button disabled={open >= MAX_OPEN} className="w-full rounded-input bg-pink-600 py-3 font-semibold text-white disabled:opacity-50">Send</button>
        <p className="text-xs text-plum-500">{open} of {MAX_OPEN} open requests used.</p>
      </form>

      <h2 className="mt-8 font-display text-xl font-semibold">Your requests</h2>
      {!mine.length && <p className="mt-2 text-sm text-plum-500">Nothing yet.</p>}
      <ul className="mt-3 space-y-3">
        {mine.map((h) => (
          <li key={h.id} className="rounded-card bg-white p-4 ring-1 ring-pink-100" data-testid="help-request">
            <div className="flex items-start justify-between gap-2"><b>{h.kind === 'call' ? 'Call request' : 'Question'} · {h.topic}</b>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${h.status === 'answered' ? 'bg-mint-100 text-mint-700' : 'bg-pink-100 text-plum-500'}`}>{h.status === 'open' ? 'Waiting' : h.status === 'answered' ? 'Answered' : 'Cancelled'}</span></div>
            <p className="mt-1 text-sm">{h.body}</p>
            {h.windows.length > 0 && <p className="text-xs text-plum-500">Preferred: {h.windows.join(', ')}</p>}
            <p className="text-xs text-plum-500">Sent {fmtDateTime(h.at)}{h.status === 'open' ? ` · answer due in about ${hoursLeft(h, now)} h` : ''}</p>
            {h.status === 'answered' && <div className="mt-3 rounded-input bg-mint-100 p-3 text-sm"><b>{w.users[h.answeredBy ?? '']?.displayName ?? 'PPS educator'}:</b> {h.answer}<p className="mt-2 text-xs text-plum-500">{HELP_NOTICE}</p></div>}
            {h.status === 'open' && <button onClick={() => update((x) => cancelRequest(x, me.id, h.id))} className="mt-2 text-sm text-plum-500 underline">Cancel request</button>}
          </li>
        ))}
      </ul>
    </main>
  );
}
