'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { Copy, MessageCircle, Search, UserCheck, UserPlus } from 'lucide-react';
import { Avatar } from '@/components/community/avatar';
import { PostCard } from '@/components/community/post-card';
import { useApp } from '@/components/shell/app-context';
import { blockUser } from '@/lib/engine/chat';
import { displayNameOf } from '@/lib/engine/feed';
import { acceptFriend, cancelRequest, declineFriend, findPeople, friendIds, incoming, letterboxFeed, outgoing, relation, removeFriend, requestFriend } from '@/lib/engine/friends';
import { update } from '@/lib/world/store';

export default function Letterbox() {
  const { w, me } = useApp();
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState('');
  const link = typeof window !== 'undefined' ? `${window.location.origin}/friends/${me.referralCode}` : '';
  useEffect(() => { if (link) QRCode.toDataURL(link, { width: 220, margin: 1, color: { dark: '#2A1433' } }).then(setQr).catch(() => {}); }, [link]);

  const friends = friendIds(w, me.id);
  const requests = incoming(w, me.id);
  const sent = outgoing(w, me.id);
  const results = findPeople(w, me.id, q);
  const feed = letterboxFeed(w, me.id).slice(0, 20);
  const text = `Be my friend on Sisi, the money-confidence app. Join my Letterbox: ${link}`;
  const card = 'rounded-card bg-white p-4 ring-1 ring-pink-100';

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Letterbox</h1>
      <p className="text-plum-500">Your friends’ wins, in one place. Friends only see milestones you choose to share. Never amounts.</p>

      {!me.shareMilestones && (
        <div className="mt-4 rounded-card bg-pink-100 p-4 text-sm">
          <b>Your friends can’t see your wins yet.</b>
          <p className="text-plum-500">Turn on milestone sharing to post badges and levels to your friends and communities. You can switch it off any time in Profile.</p>
          <button onClick={() => update((x) => { x.users[me.id].shareMilestones = true; x.askedShare[me.id] = true; })} className="mt-2 rounded-full bg-pink-600 px-4 py-1.5 font-semibold text-white">Share my milestones</button>
        </div>
      )}

      {requests.length > 0 && (
        <section className="mt-6"><h2 className="font-display text-xl font-semibold">Friend requests</h2>
          <ul className="mt-2 space-y-2">{requests.map((r) => (
            <li key={r.id} className={`${card} flex items-center gap-3`} data-testid="request">
              <Avatar name={displayNameOf(w, r.fromId)} color={w.users[r.fromId]?.color ?? '#D81B60'} size={36} />
              <b className="flex-1">{displayNameOf(w, r.fromId)}</b>
              <button onClick={() => update((x, n) => acceptFriend(x, me.id, r.id, n))} className="rounded-input bg-pink-600 px-3 py-1.5 text-sm font-semibold text-white">Accept</button>
              <button onClick={() => update((x) => declineFriend(x, me.id, r.id))} className="rounded-input border border-pink-300 px-3 py-1.5 text-sm font-semibold text-pink-700">Decline</button>
            </li>))}</ul></section>
      )}

      <h2 className="mt-8 font-display text-xl font-semibold">Friends’ wins</h2>
      <ul className="mt-3 space-y-3">
        {feed.map((p) => <PostCard key={p.id} p={p} />)}
        {!feed.length && <li className="rounded-card bg-white p-6 text-center text-plum-500 ring-1 ring-pink-100">{friends.length ? 'Nothing shared yet. Finish a lesson and be the first.' : 'Add a friend to see their wins here.'}</li>}
      </ul>

      <h2 className="mt-8 font-display text-xl font-semibold">Add friends</h2>
      <div className={`mt-3 ${card}`}>
        <label className="flex items-center gap-2 rounded-input border border-pink-300 px-3"><Search size={18} aria-hidden className="text-plum-500" />
          <input aria-label="Find by nickname" value={q} onChange={(e) => { setQ(e.target.value); setMsg(''); }} placeholder="Find by nickname" className="w-full bg-transparent py-3" /></label>
        <ul className="mt-2 divide-y divide-pink-100">
          {results.map((id) => { const rel = relation(w, me.id, id); return (
            <li key={id} className="flex items-center gap-3 py-2" data-testid="result">
              <Avatar name={displayNameOf(w, id)} color={w.users[id].color} size={32} /><span className="flex-1 font-medium">{displayNameOf(w, id)}</span>
              {rel === 'none' && <button onClick={() => { const r = update((x, n) => requestFriend(x, me.id, id, n)); if (!r.ok) setMsg(r.error); }} className="flex items-center gap-1 rounded-input bg-pink-600 px-3 py-1.5 text-sm font-semibold text-white"><UserPlus size={14} aria-hidden /> Add</button>}
              {rel === 'sent' && <span className="text-xs text-plum-500">Request sent</span>}
              {rel === 'friends' && <span className="flex items-center gap-1 text-xs font-semibold text-mint-700"><UserCheck size={14} aria-hidden /> Friends</span>}
              {rel === 'received' && <span className="text-xs text-plum-500">Answer their request above</span>}
            </li>); })}
          {q.trim().length >= 2 && !results.length && <li className="py-2 text-sm text-plum-500">No one found. Try the invite link below.</li>}
        </ul>
        {msg && <p role="alert" className="mt-2 text-sm text-coral-600">{msg}</p>}
        {sent.length > 0 && <p className="mt-3 text-xs text-plum-500">Waiting for: {sent.map((s) => displayNameOf(w, s.toId)).join(', ')} <button onClick={() => sent.forEach((s) => update((x) => cancelRequest(x, me.id, s.id)))} className="underline">cancel</button></p>}
      </div>
      <div className={`mt-3 ${card}`}>
        <b>Invite with a link or QR</b>
        <p className="text-sm text-plum-500">Anyone who opens your link can accept to become your friend.</p>
        <p className="mt-2 break-all rounded-input bg-pink-50 px-3 py-2 text-sm" data-testid="friend-link">{link}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-input bg-pink-600 px-4 py-2 text-sm font-semibold text-white"><MessageCircle size={16} /> WhatsApp</a>
          <button onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); }} className="flex items-center gap-2 rounded-input border border-pink-600 px-4 py-2 text-sm font-semibold text-pink-700"><Copy size={16} /> {copied ? 'Copied' : 'Copy link'}</button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {qr && <img src={qr} alt="QR code for your friend link" width={160} height={160} className="mt-3 rounded-input ring-1 ring-pink-100" />}
        <p className="mt-2 text-xs text-plum-500">Demo tip: open the link in a second tab signed in as another demo account.</p>
      </div>

      <h2 className="mt-8 font-display text-xl font-semibold">Your friends ({friends.length})</h2>
      <ul className="mt-3 divide-y divide-pink-100 rounded-card bg-white ring-1 ring-pink-100">
        {friends.map((id) => (
          <li key={id} className="flex items-center gap-3 px-4 py-2" data-testid="friend">
            <Avatar name={displayNameOf(w, id)} color={w.users[id]?.color ?? '#D81B60'} size={32} /><span className="flex-1 font-medium">{displayNameOf(w, id)}</span>
            <button onClick={() => update((x) => removeFriend(x, me.id, id))} className="text-xs text-plum-500 underline">Remove</button>
            <button onClick={() => { if (confirm(`Block ${displayNameOf(w, id)}? They will be removed and hidden.`)) update((x) => blockUser(x, me.id, id)); }} className="text-xs text-coral-600 underline">Block</button>
          </li>))}
        {!friends.length && <li className="px-4 py-3 text-sm text-plum-500">No friends yet.</li>}
      </ul>
      <p className="mt-4 text-xs text-plum-500">Be kind: see something unkind in a note? Block the person. <Link href="/help/faq" className="underline">How safety works</Link>.</p>
    </div>
  );
}
