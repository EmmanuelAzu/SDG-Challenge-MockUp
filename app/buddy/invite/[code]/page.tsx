'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Bloom } from '@/components/bloom';
import { acceptInvite } from '@/lib/engine/buddy';
import { useSessionId, useWorld } from '@/lib/world/hooks';
import { update } from '@/lib/world/store';

export default function BuddyInvite() {
  const { code } = useParams<{ code: string }>();
  const w = useWorld();
  const sid = useSessionId();
  const router = useRouter();
  const [error, setError] = useState('');
  if (!w) return <main className="mx-auto max-w-sm px-4 py-12" aria-busy="true"><div className="h-40 animate-pulse rounded-card bg-pink-100" /></main>;
  const pair = w.buddies.find((p) => p.code === code);
  const inviter = pair && w.users[pair.inviterId];
  const me = sid ? w.users[sid] : undefined;
  const next = encodeURIComponent(`/buddy/invite/${code}`);
  if (!pair || pair.status !== 'pending' || !inviter) return <main className="mx-auto max-w-sm px-4 py-12 text-center"><h1 className="font-display text-2xl font-semibold">This invite is no longer available</h1><p className="mt-2 text-plum-500">It may have been used or cancelled. Ask your friend for a new one.</p><Link href="/" className="mt-4 inline-block text-pink-700 underline">Meet Sisi</Link></main>;
  const first = inviter.displayName.split(' ')[0];
  return (
    <main className="mx-auto max-w-sm px-4 py-12 text-center">
      <div className="flex justify-center"><Bloom progress={3} size={110} /></div>
      <h1 className="mt-6 font-display text-3xl font-semibold">{first} wants you as her Money Buddy</h1>
      <p className="mt-3 text-plum-500">Each week you each do three small money things and cheer each other on. Only whether you finished is shared. Never amounts.</p>
      {me && me.role === 'member' && me.onboardedAt ? (
        <>
          <button onClick={() => { const r = update((x, n) => acceptInvite(x, me.id, code, n)); if (r.ok) router.replace('/pathways/buddy'); else setError(r.error); }} className="mt-8 w-full rounded-input bg-pink-600 py-3 font-semibold text-white hover:bg-pink-700">Accept as {me.displayName.split(' ')[0]}</button>
          {error && <p role="alert" className="mt-3 text-sm text-coral-600">{error}</p>}
        </>
      ) : (
        <>
          <Link href={`/login?mode=up&next=${next}`} className="mt-8 block rounded-input bg-pink-600 py-3 font-semibold text-white hover:bg-pink-700">Join Sisi and accept</Link>
          <Link href={`/login?next=${next}`} className="mt-3 block text-sm font-medium text-pink-700">I already have an account</Link>
          <p className="mt-3 text-xs text-plum-500">Demo: <Link href="/demo" className="underline">pick a demo account</Link>, then come back to this link.</p>
        </>
      )}
    </main>
  );
}
