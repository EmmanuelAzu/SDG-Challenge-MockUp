'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { suggestTopic, voteTopic } from '@/app/(app)/learn/actions';

export function SuggestForm() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const [pending, start] = useTransition();
  return (
    <form onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await suggestTopic(text); setMsg(r.ok ? 'Thanks! Added to the list.' : 'Write a few words about the topic.'); if (r.ok) { setText(''); router.refresh(); } }); }} className="mt-4">
      <label className="block text-sm font-medium">What should we teach next?
        <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={200} rows={2} className="mt-1 w-full rounded-input border border-pink-300 bg-white p-3" placeholder="e.g. How does a car loan work?" />
      </label>
      <button disabled={pending || text.trim().length < 3} className="mt-2 rounded-input bg-pink-600 px-5 py-3 font-semibold text-white hover:bg-pink-700 disabled:opacity-50">Suggest this topic</button>
      {msg && <p role="status" className="mt-2 text-sm text-mint-700">{msg}</p>}
    </form>
  );
}

export function VoteButton({ id, votes }: { id: string; votes: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return <button disabled={pending} onClick={() => start(async () => { await voteTopic(id); router.refresh(); })} aria-label={`Upvote, ${votes} votes`} className="rounded-full bg-pink-100 px-3 py-1 text-sm font-semibold text-pink-700">▲ {votes}</button>;
}
