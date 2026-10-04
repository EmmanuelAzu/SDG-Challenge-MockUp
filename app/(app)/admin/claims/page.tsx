'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/shell/app-context';
import { REWARDS, canAdminister, reviewClaim } from '@/lib/engine/rewards';
import { fmtDateTime } from '@/lib/format';
import { update } from '@/lib/world/store';

export default function Claims() {
  const { w, me } = useApp();
  const [notes, setNotes] = useState<Record<string, string>>({});
  if (!canAdminister(w, me.id)) return <div><h1 className="font-display text-2xl font-semibold">PPS admins only</h1><Link href="/admin" className="text-pink-700 underline">Back</Link></div>;
  const claims = [...w.claims].sort((a, b) => (a.status === 'claimed' ? 0 : 1) - (b.status === 'claimed' ? 0 : 1) || b.at.localeCompare(a.at));
  const act = (id: string, a: 'approve' | 'reject' | 'paid') => update((x, n) => reviewClaim(x, me.id, id, a, notes[id] ?? '', n));
  const btn = 'rounded-input px-3 py-1.5 text-sm font-semibold';
  return (
    <div>
      <Link href="/admin" className="text-sm text-pink-700 underline">Staff console</Link>
      <h1 className="font-display text-3xl font-semibold">Reward claims</h1>
      <p className="text-xs text-plum-500">Mock: approving or paying moves no money. It only updates what the member sees.</p>
      {!claims.length && <p className="mt-6 text-plum-500">No claims yet. Claim one as a member first.</p>}
      <ul className="mt-4 space-y-3">
        {claims.map((c) => { const def = REWARDS.find((r) => r.slug === c.rewardSlug)!; return (
          <li key={c.id} className="rounded-card bg-white p-4 ring-1 ring-pink-100" data-testid="claim">
            <div className="flex justify-between gap-2"><b>{w.users[c.userId]?.displayName ?? 'Member'}</b><span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-semibold capitalize">{c.status}</span></div>
            <p className="text-sm">{def.title} · {c.choice === 'cash' ? 'cash' : 'investment credit'}: {c.cash ? `R${c.cash} cash` : ''}{c.cash && c.credit ? ' + ' : ''}{c.credit ? `R${c.credit} credit` : ''}</p>
            <p className="text-xs text-plum-500">Claimed {fmtDateTime(c.at)}{c.note ? ` · Note: ${c.note}` : ''}</p>
            {c.status === 'claimed' && <div className="mt-3 flex flex-wrap items-center gap-2">
              <input aria-label="Note" placeholder="Optional note" value={notes[c.id] ?? ''} onChange={(e) => setNotes({ ...notes, [c.id]: e.target.value })} className="min-w-0 flex-1 rounded-input border border-pink-300 px-3 py-1.5 text-sm" />
              <button onClick={() => act(c.id, 'approve')} className={`${btn} bg-pink-600 text-white`}>Approve</button>
              <button onClick={() => act(c.id, 'reject')} className={`${btn} border border-pink-600 text-pink-700`}>Reject</button></div>}
            {c.status === 'approved' && <button onClick={() => act(c.id, 'paid')} className={`${btn} mt-3 bg-pink-600 text-white`}>Mark as paid</button>}
          </li>); })}
      </ul>
    </div>
  );
}
