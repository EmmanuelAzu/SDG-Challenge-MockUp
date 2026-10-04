'use client';
import { useState } from 'react';
import { useApp } from '@/components/shell/app-context';
import { joinCommunity } from '@/lib/engine/actions';
import { leaveCommunity, membershipOf } from '@/lib/engine/community';
import { update } from '@/lib/world/store';

/** Join / Request to join / Pending / Leave, for one community. */
export function JoinCommunityButton({ communityId, compact = false }: { communityId: string; compact?: boolean }) {
  const { w, me } = useApp();
  const [confirm, setConfirm] = useState(false);
  const c = w.communities.find((x) => x.id === communityId)!;
  const m = membershipOf(w, communityId, me.id);
  const base = `rounded-full font-semibold ${compact ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'}`;
  if (m?.status === 'pending') return <span className={`${base} bg-lavender-100 text-lavender-600`}>Request pending</span>;
  if (m) {
    return confirm ? (
      <span className="flex items-center gap-2 text-xs"><button onClick={() => { update((x) => leaveCommunity(x, me.id, communityId)); setConfirm(false); }} className="font-semibold text-coral-600">Leave {c.name}?</button><button onClick={() => setConfirm(false)} className="text-plum-500">Cancel</button></span>
    ) : <button onClick={() => setConfirm(true)} className={`${base} text-plum-500 ring-1 ring-pink-300`}>Joined ✓</button>;
  }
  return <button onClick={() => update((x, now) => joinCommunity(x, me.id, communityId, now))} className={`${base} bg-pink-600 text-white hover:bg-pink-700`}>{c.requiresApproval ? 'Request to join' : 'Join'}</button>;
}
