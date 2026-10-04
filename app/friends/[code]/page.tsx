'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Bloom } from '@/components/bloom';
import { displayNameOf } from '@/lib/engine/feed';
import { acceptByCode, friendshipOf, inviterByCode } from '@/lib/engine/friends';
import { useSessionId, useWorld } from '@/lib/world/hooks';
import { update } from '@/lib/world/store';

export default function FriendInvite() {
  const { code } = useParams<{ code: string }>();
  const w = useWorld();
  const sid = useSessionId();
  const router = useRouter();
  const [error, setError] = useState('');
  if (!w) return <main className="mx-auto max-w-sm px-4 py-12" aria-busy="true"><div className="h-40 animate-pulse rounded-card bg-pink-100" /></main>;
  const inviter = inviterByCode(w, code);
  const me = sid ? w.users[sid] : undefined;
  const next = encodeURIComponent(`/friends/${code}`);
  if (!inviter) return <main className="mx-auto max-w-sm px-4 py-12 text-center"><h1 className="font-display text-2xl font-semibold">This link is no longer valid</h1><Link href="/" className="mt-4 inline-block text-pink-700 underline">Meet Sisi</Link></main>;
  const name = displayNameOf(w, inviter.id);
  const already = me ? friendshipOf(w, me.id, inviter.id)?.status === 'accepted' : false;
  return (
    <main className="mx-auto max-w-sm px-4 py-12 text-center">
      <div className="flex justify-center"><Bloom progress={4} size={110} /></div>
      <h1 className="mt-6 font-display text-3xl font-semibold">{name} invited you to her Letterbox</h1>
      <p className="mt-3 text-plum-500">Friends see each other’s shared milestones and cheer each other on. Never amounts.</p>
      {me && me.onboardedAt && me.role === 'member' ? (
        already ? <Link href="/letterbox" className="mt-8 block rounded-input bg-pink-600 py-3 font-semibold text-white">You are already friends. Open Letterbox</Link> : (
          <>
            <button onClick={() => { const r = update((x, n) => acceptByCode(x, me.id, code, n)); if (r.ok) router.replace('/letterbox'); else setError(r.error); }} className="mt-8 w-full rounded-input bg-pink-600 py-3 font-semibold text-white hover:bg-pink-700">Become friends with {name}</button>
            {error && <p role="alert" className="mt-3 text-sm text-coral-600">{error}</p>}
          </>)
      ) : (
        <>
          <Link href={`/login?mode=up&next=${next}`} className="mt-8 block rounded-input bg-pink-600 py-3 font-semibold text-white hover:bg-pink-700">Join Sisi and say yes</Link>
          <Link href={`/login?next=${next}`} className="mt-3 block text-sm font-medium text-pink-700">I already have an account</Link>
          <p className="mt-3 text-xs text-plum-500">Demo: <Link href="/demo" className="underline">pick a demo account</Link>, then come back to this link.</p>
        </>
      )}
    </main>
  );
}
