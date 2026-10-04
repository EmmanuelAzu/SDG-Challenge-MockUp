'use client';
import Link from 'next/link';
import { useApp } from '@/components/shell/app-context';
import { canAnswer, canEditSafety } from '@/lib/engine/help';
import { canAdminister } from '@/lib/engine/rewards';

export default function Admin() {
  const { w, me } = useApp();
  if (me.role === 'member') return <div><h1 className="font-display text-2xl font-semibold">Staff only</h1><Link href="/home" className="text-pink-700 underline">Back home</Link></div>;
  const pending = w.claims.filter((c) => c.status === 'claimed').length;
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Staff console</h1>
      <p className="text-plum-500">Signed in as {me.displayName} ({me.role.replace('_', ' ')}). More tools arrive in a later step.</p>
      <ul className="mt-6 space-y-3">
        {canAdminister(w, me.id)
          ? <li><Link href="/admin/claims" className="block rounded-card bg-white p-4 ring-1 ring-pink-100 hover:ring-pink-300"><b className="font-display text-lg">Reward claims</b><span className="block text-sm text-plum-500">{pending} waiting for review</span></Link></li>
          : <li className="rounded-card bg-pink-100 p-4 text-sm">Reward claims are reviewed by PPS admins only.</li>}
        {canAnswer(w, me.id) && <li><Link href="/admin/help" className="block rounded-card bg-white p-4 ring-1 ring-pink-100 hover:ring-pink-300"><b className="font-display text-lg">Help requests</b><span className="block text-sm text-plum-500">{w.helpRequests.filter((h) => h.status === 'open').length} open</span></Link></li>}
        {canEditSafety(w, me.id) && <li><Link href="/admin/safety" className="block rounded-card bg-white p-4 ring-1 ring-pink-100 hover:ring-pink-300"><b className="font-display text-lg">Safety resources</b><span className="block text-sm text-plum-500">{w.safety.filter((r) => !r.verified).length} numbers still unverified</span></Link></li>}
        <li><Link href="/admin/pilot" className="block rounded-card bg-white p-4 ring-1 ring-pink-100 hover:ring-pink-300"><b className="font-display text-lg">Pilot results</b><span className="block text-sm text-plum-500">Import tester codes, see the evidence dashboard, export CSV</span></Link></li>
        <li><Link href="/admin/poster" className="block rounded-card bg-white p-4 ring-1 ring-pink-100 hover:ring-pink-300"><b className="font-display text-lg">O-Week QR poster</b><span className="block text-sm text-plum-500">Printable A4 poster with a join QR code</span></Link></li>
      </ul>
    </div>
  );
}
