'use client';
import { useState } from 'react';
import { Award, Flame, Megaphone, Sprout, Trophy } from 'lucide-react';
import { useApp } from '@/components/shell/app-context';
import { Avatar } from '@/components/community/avatar';
import { NOTE_PRESETS, REACTIONS } from '@/lib/content/community-data';
import { canModerateCommunity, isActiveMember } from '@/lib/engine/community';
import { addNote, displayNameOf, feedFor, postAnnouncement, reactToPost } from '@/lib/engine/feed';
import { ago } from '@/lib/format';
import { update } from '@/lib/world/store';

const ICON = { badge: Award, milestone: Trophy, level: Sprout, weekly: Flame, announcement: Megaphone } as const;

export function FeedTab({ communityId }: { communityId: string }) {
  const { w, me, now } = useApp();
  const [open, setOpen] = useState<string | null>(null);
  const [custom, setCustom] = useState('');
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
        {items.map((p) => {
          const Icon = ICON[p.kind];
          const u = w.users[p.userId];
          const notes = p.notes;
          return (
            <li key={p.id} className={`rounded-card p-4 ring-1 ${p.kind === 'announcement' ? 'bg-lavender-100 ring-lavender-600/20' : 'bg-white ring-pink-100'}`}>
              <div className="flex items-start gap-3">
                {p.kind === 'announcement' ? <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lavender-600 text-white"><Icon size={18} aria-hidden /></span> : <Avatar name={displayNameOf(w, p.userId)} color={u?.color ?? '#D81B60'} size={36} />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm"><Icon size={14} className="mr-1 inline text-pink-600" aria-hidden />{p.kind === 'announcement' ? <><b>{displayNameOf(w, p.userId)}</b>{p.pinned ? ' · pinned' : ''}<span className="block">{p.text}</span></> : <b>{p.text}</b>}</p>
                  <p className="text-xs text-plum-500">{ago(p.at, now)}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {REACTIONS.map((e) => {
                  const who = p.reactions[e] ?? [];
                  const mine = who.includes(me.id);
                  return <button key={e} onClick={() => update((x, n) => reactToPost(x, me.id, p.id, e, n))} aria-pressed={mine} aria-label={`React ${e}`} className={`rounded-full px-2.5 py-1 text-sm ${mine ? 'bg-pink-600 text-white' : 'bg-pink-100 text-plum-900'}`}>{e}{who.length > 0 && <span className="ml-1 text-xs">{who.length}</span>}</button>;
                })}
                <button onClick={() => setOpen(open === p.id ? null : p.id)} className="ml-auto text-xs font-semibold text-pink-700">{open === p.id ? 'Close' : `Leave a note${notes.length ? ` (${notes.length})` : ''}`}</button>
              </div>
              {notes.length > 0 && (
                <ul className="mt-2 space-y-1">{notes.map((n) => <li key={n.id} className="rounded-input bg-pink-50 px-3 py-1.5 text-sm"><b>{n.userId === me.id ? 'You' : displayNameOf(w, n.userId)}:</b> {n.body}</li>)}</ul>
              )}
              {open === p.id && (
                <div className="mt-2">
                  <div className="flex flex-wrap gap-1.5">{NOTE_PRESETS.map((t) => <button key={t} onClick={() => { update((x, n) => addNote(x, me.id, p.id, t, n)); setOpen(null); }} className="rounded-full border border-pink-300 px-2.5 py-1 text-xs text-pink-700 hover:bg-pink-100">{t}</button>)}</div>
                  <form onSubmit={(e) => { e.preventDefault(); update((x, n) => addNote(x, me.id, p.id, custom, n)); setCustom(''); setOpen(null); }} className="mt-2 flex gap-2">
                    <input value={custom} onChange={(e) => setCustom(e.target.value)} maxLength={140} placeholder="Or write your own (140 characters)" className="flex-1 rounded-input border border-pink-300 px-3 py-1.5 text-sm" />
                    <button disabled={!custom.trim()} className="rounded-input bg-pink-600 px-3 text-sm font-semibold text-white disabled:opacity-50">Send</button>
                  </form>
                </div>
              )}
            </li>
          );
        })}
        {items.length === 0 && <li className="rounded-card bg-white p-6 text-center text-plum-500 ring-1 ring-pink-100">Nothing shared yet. Finish a lesson and be the first.</li>}
      </ul>
    </div>
  );
}
