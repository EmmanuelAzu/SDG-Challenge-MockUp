'use client';
import { useState } from 'react';
import { useApp } from '@/components/shell/app-context';
import { PostCard } from '@/components/community/post-card';
import { canModerateCommunity, isActiveMember } from '@/lib/engine/community';
import { feedFor, postAnnouncement } from '@/lib/engine/feed';
import { update } from '@/lib/world/store';


export function FeedTab({ communityId }: { communityId: string }) {
  const { w, me } = useApp();
  const [announce, setAnnounce] = useState('');
  const member = isActiveMember(w, communityId, me.id);
  const staff = canModerateCommunity(w, me.id, communityId);
  const items = feedFor(w, communityId);

  if (!member) return <p className="mt-6 rounded-card bg-white p-6 text-center text-plum-500 ring-1 ring-pink-100">Join this community to see what members are sharing.</p>;

  return (
    <div className="mt-4">
      {!me.shareMilestones && (
        <div className="rounded-card bg-pink-100 p-4 text-sm">
          <b>Want to share your wins here?</b>
          <p className="text-plum-500">Turn on milestone sharing and your badges and progress show up in your communities’ feeds. Never amounts. You can switch it off any time.</p>
          <button onClick={() => update((x) => { x.users[me.id].shareMilestones = true; x.askedShare[me.id] = true; })} className="mt-2 rounded-full bg-pink-600 px-4 py-1.5 text-sm font-semibold text-white">Share my milestones</button>
        </div>
      )}
      {staff && (
        <form onSubmit={(e) => { e.preventDefault(); update((x, n) => postAnnouncement(x, me.id, communityId, announce, n, true)); setAnnounce(''); }} className="mt-3 flex gap-2">
          <input value={announce} onChange={(e) => setAnnounce(e.target.value)} maxLength={300} placeholder="Post an announcement" aria-label="Post an announcement" className="flex-1 rounded-input border border-pink-300 bg-white px-3 py-2 text-sm" />
          <button disabled={!announce.trim()} className="rounded-input bg-lavender-600 px-4 text-sm font-semibold text-white disabled:opacity-50">Post</button>
        </form>
      )}
      <ul className="mt-4 space-y-3">
        {items.map((p) => <PostCard key={p.id} p={p} />)}
        {items.length === 0 && <li className="rounded-card bg-white p-6 text-center text-plum-500 ring-1 ring-pink-100">Nothing shared yet. Finish a lesson and be the first.</li>}
      </ul>
    </div>
  );
}
