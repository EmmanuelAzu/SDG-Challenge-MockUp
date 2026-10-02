'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { joinCircle, leaveCircle, completeChallenge } from '@/app/(app)/community/actions';
import { useCelebrate } from '@/components/celebration/provider';

export function JoinButton({ circleId, isMember, full }: { circleId: string; isMember: boolean; full: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = useState('');
  const [pending, start] = useTransition();
  if (isMember) {
    return (
      <button disabled={pending} onClick={() => start(async () => { await leaveCircle(circleId); router.refresh(); })} className="rounded-full px-4 py-1.5 text-sm font-semibold text-plum-500 ring-1 ring-pink-300">Leave</button>
    );
  }
  return (
    <div className="text-right">
      <button disabled={pending || full} onClick={() => start(async () => { const r = await joinCircle(circleId); if (!r.ok) setMsg(r.message ?? ''); else router.refresh(); })} className="rounded-full bg-pink-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50">{full ? 'Full' : 'Join Circle'}</button>
      {msg && <p role="alert" className="mt-1 text-xs text-coral-600">{msg}</p>}
    </div>
  );
}

export function ChallengeButton({ challengeId, done }: { challengeId: string; done: boolean }) {
  const celebrate = useCelebrate();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [ok, setOk] = useState(done);
  if (ok) return <p className="mt-2 text-sm font-semibold text-mint-700">Challenge done. Nice one.</p>;
  return <button disabled={pending} onClick={() => start(async () => { const r = await completeChallenge(challengeId); celebrate(r); setOk(true); router.refresh(); })} className="mt-3 rounded-full bg-pink-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-pink-700">I did this week’s challenge</button>;
}

export function OptInToggle({ onSave }: { onSave: () => Promise<void> }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return <button disabled={pending} onClick={() => start(async () => { await onSave(); router.refresh(); })} className="mt-2 rounded-full bg-pink-600 px-4 py-1.5 text-sm font-semibold text-white">Show me on the leaderboard</button>;
}
