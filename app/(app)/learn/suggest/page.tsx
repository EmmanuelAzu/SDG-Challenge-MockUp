'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/shell/app-context';
import { suggestTopic, voteTopic } from '@/lib/engine/actions';
import { update } from '@/lib/world/store';

export default function Suggest() {
  const { w, me } = useApp();
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const list = [...w.topicSuggestions].sort((a, b) => b.voters.length - a.voters.length);
  return (
    <div>
      <Link href="/learn" className="text-sm text-pink-700">← Learn</Link>
      <h1 className="mt-2 font-display text-3xl font-semibold">Suggest a topic</h1>
      <p className="text-plum-500">Tell us what would help you most. The most-voted topics get made first.</p>
      <form onSubmit={(e) => { e.preventDefault(); const pts = update((x, now) => suggestTopic(x, me.id, text, now)); setMsg(text.trim().length < 3 ? 'Write a few words about the topic.' : `Thanks! Added to the list.${pts && !me.focusMode ? ` +${pts} points` : ''}`); if (text.trim().length >= 3) setText(''); }} className="mt-4">
        <label className="block text-sm font-medium">What should we teach next?<textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={200} rows={2} className="mt-1 w-full rounded-input border border-pink-300 bg-white p-3" placeholder="e.g. How does a car loan work?" /></label>
        <button className="mt-2 rounded-input bg-pink-600 px-5 py-3 font-semibold text-white hover:bg-pink-700">Suggest this topic</button>
        {msg && <p role="status" className="mt-2 text-sm text-mint-700">{msg}</p>}
      </form>
      <ul className="mt-6 divide-y divide-pink-100 rounded-card bg-white ring-1 ring-pink-100">
        {list.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm"><span>{s.body}</span>
            <button disabled={s.voters.includes(me.id)} onClick={() => update((x) => voteTopic(x, me.id, s.id))} aria-label={`Upvote, ${s.voters.length} votes`} className="rounded-full bg-pink-100 px-3 py-1 font-semibold text-pink-700 disabled:opacity-60">▲ {s.voters.length}</button></li>
        ))}
      </ul>
    </div>
  );
}
