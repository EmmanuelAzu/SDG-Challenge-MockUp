'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/shell/app-context';
import { HELP_NOTICE, answerRequest, canAnswer, hoursLeft } from '@/lib/engine/help';
import { fmtDateTime } from '@/lib/format';
import { update } from '@/lib/world/store';

export default function AdminHelp() {
  const { w, me, now } = useApp();
  const [text, setText] = useState<Record<string, string>>({});
  if (!canAnswer(w, me.id)) return <div><h1 className="font-display text-2xl font-semibold">Educators and PPS admins only</h1><Link href="/admin" className="text-pink-700 underline">Back</Link></div>;
  const list = [...w.helpRequests].sort((a, b) => (a.status === 'open' ? 0 : 1) - (b.status === 'open' ? 0 : 1) || b.at.localeCompare(a.at));
  return (
    <div>
      <Link href="/admin" className="text-sm text-pink-700 underline">Staff console</Link>
      <h1 className="font-display text-3xl font-semibold">Help requests</h1>
      <p className="text-xs text-plum-500">{HELP_NOTICE}</p>
      <ul className="mt-4 space-y-3">
        {list.map((h) => (
          <li key={h.id} className="rounded-card bg-white p-4 ring-1 ring-pink-100" data-testid="help-item">
            <div className="flex justify-between gap-2"><b>{w.users[h.userId]?.displayName ?? 'Member'} · {h.kind === 'call' ? 'Call' : 'Question'} · {h.topic}</b><span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-semibold capitalize">{h.status}</span></div>
            <p className="mt-1 text-sm">{h.body}</p>
            {h.windows.length > 0 && <p className="text-xs text-plum-500">Preferred: {h.windows.join(', ')}</p>}
            <p className="text-xs text-plum-500">{fmtDateTime(h.at)}{h.status === 'open' ? ` · ${hoursLeft(h, now)} h to target` : ''}</p>
            {h.status === 'answered' && <p className="mt-2 rounded-input bg-mint-100 p-2 text-sm">{h.answer}</p>}
            {h.status === 'open' && <div className="mt-3">
              <textarea aria-label="Answer" rows={3} value={text[h.id] ?? ''} onChange={(e) => setText({ ...text, [h.id]: e.target.value })} className="w-full rounded-input border border-pink-300 px-3 py-2 text-sm" placeholder={h.kind === 'call' ? 'Confirm a time or suggest another…' : 'Write a general, educational answer…'} />
              <button onClick={() => update((x, n) => answerRequest(x, me.id, h.id, text[h.id] ?? '', n))} className="mt-2 rounded-input bg-pink-600 px-4 py-2 text-sm font-semibold text-white">Send answer</button></div>}
          </li>
        ))}
        {!list.length && <li className="text-plum-500">No requests yet.</li>}
      </ul>
    </div>
  );
}
