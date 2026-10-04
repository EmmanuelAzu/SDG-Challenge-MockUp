'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Pin, Reply, Send, ShieldAlert } from 'lucide-react';
import { useApp } from '@/components/shell/app-context';
import { Avatar } from '@/components/community/avatar';
import { CHAT_EMOJI } from '@/lib/content/community-data';
import { acceptCircleRules, acceptCommunityGuidelines } from '@/lib/engine/community';
import { blockUser, canAccess, canModerateChannel, markRead, moderate, mutedUntil, needsAgreement, reportMessage, sendMessage, toggleReaction } from '@/lib/engine/chat';
import { planReplies } from '@/lib/sim/chat';
import { dayKey, fmtDate, fmtTime } from '@/lib/format';
import { update } from '@/lib/world/store';
import type { Message } from '@/lib/world/types';

const PAGE = 50;

export function ChatRoom({ channelId }: { channelId: string }) {
  const { w, me, now } = useApp();
  const ch = w.channels.find((c) => c.id === channelId)!;
  const [shown, setShown] = useState(PAGE);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [harm, setHarm] = useState(false);
  const [typing, setTyping] = useState<string[]>([]);
  const bottom = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const timers = useRef<number[]>([]);

  const blocked = useMemo(() => new Set(w.blocks.filter((b) => b.blockerId === me.id).map((b) => b.blockedId)), [w.blocks, me.id]);
  const all = useMemo(() => w.messages.filter((m) => m.channelId === channelId).sort((a, b) => a.at.localeCompare(b.at)), [w.messages, channelId]);
  const visible = all.filter((m) => !(m.userId && blocked.has(m.userId)));
  const page = visible.slice(Math.max(0, visible.length - shown));
  const byId = useMemo(() => new Map(all.map((m) => [m.id, m])), [all]);
  const pinned = visible.filter((m) => m.pinned && !m.deleted);
  const mod = canModerateChannel(w, me.id, ch);
  const muted = mutedUntil(w, me.id, channelId, now);
  const agreementNeeded = needsAgreement(w, me.id, ch);

  // mark read when opened and as new messages arrive while open
  useEffect(() => { if (visible.length) update((x, n) => markRead(x, me.id, channelId, n)); }, [visible.length, me.id, channelId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (stick.current) bottom.current?.scrollIntoView({ block: 'end' }); }, [visible.length, typing.length]);
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  useEffect(() => {
    const onScroll = () => { stick.current = document.documentElement.scrollHeight - window.scrollY - window.innerHeight < 160; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const nameOf = (id: string | null) => (id === me.id ? 'You' : id ? (w.users[id]?.nickname || w.users[id]?.displayName.split(' ')[0] || 'Someone') : 'Sisi');

  function send() {
    const body = text.trim();
    if (!body) return;
    setError(''); setHarm(false);
    const res = update((x, n) => sendMessage(x, me.id, channelId, body, replyTo?.id ?? null, n));
    if (!res.ok) return setError(res.error);
    setText(''); setReplyTo(null); stick.current = true;
    if (res.harm) setHarm(true);
    // simulated members answer after a short, human-feeling delay
    for (const r of planReplies(w, res.message)) {
      const name = nameOf(r.userId);
      timers.current.push(window.setTimeout(() => setTyping((t) => [...new Set([...t, name])]), Math.max(0, r.delayMs - r.typingMs)));
      timers.current.push(window.setTimeout(() => {
        setTyping((t) => t.filter((x) => x !== name));
        update((x, n) => {
          const id = `msg-sim-${n.getTime()}-${r.userId}`;
          x.messages.push({ id, channelId, userId: r.userId, body: r.body, replyTo: null, kind: 'user', pinned: false, deleted: false, at: n.toISOString() });
          if (r.reactWith) x.reactions.push({ messageId: res.message.id, userId: r.userId, emoji: r.reactWith });
        });
      }, r.delayMs));
    }
  }

  const react = (m: Message, e: string) => { setMenu(null); update((x) => toggleReaction(x, me.id, m.id, e)); };
  const report = (m: Message) => { setMenu(null); const reason = window.prompt('What is wrong with this message?'); if (reason?.trim()) { update((x, n) => reportMessage(x, me.id, m.id, reason, n)); setError('Thanks. A facilitator will take a look.'); } };
  const block = (m: Message) => { setMenu(null); if (m.userId && window.confirm(`Hide ${nameOf(m.userId)}'s messages from you?`)) update((x) => blockUser(x, me.id, m.userId!)); };
  const doMod = (m: Message, a: 'delete' | 'pin' | 'unpin' | 'mute') => { setMenu(null); update((x, n) => moderate(x, me.id, m.id, a, n)); };

  if (!canAccess(w, me.id, ch)) return <p className="mt-6 rounded-card bg-white p-6 text-center text-plum-500 ring-1 ring-pink-100">Join to chat with this group.</p>;

  let lastDay = '';
  return (
    <div className="mt-3 flex flex-col" style={{ minHeight: 'calc(100dvh - 12rem)' }}>
      <p className="rounded-input bg-gold-500/20 px-3 py-2 text-xs">Don’t share account numbers, ID numbers or exact amounts.</p>
      {pinned.length > 0 && <div className="mt-2 rounded-input bg-pink-100 p-2 text-xs" aria-label="Pinned messages">{pinned.map((m) => <p key={m.id} className="flex items-start gap-1"><Pin size={12} className="mt-0.5 shrink-0" /> {m.body}</p>)}</div>}

      <div className="mt-3 flex-1 space-y-2">
        {visible.length > shown && <button onClick={() => { stick.current = false; setShown(shown + PAGE); }} className="mx-auto block text-sm font-medium text-pink-700">Load earlier messages</button>}
        {page.map((m) => {
          const day = dayKey(m.at);
          const sep = day !== lastDay ? <p key={`d-${m.id}`} className="py-2 text-center text-xs font-semibold text-plum-500">{fmtDate(m.at)}</p> : null;
          lastDay = day;
          if (m.kind === 'system') return <div key={m.id}>{sep}<p className="text-center text-xs italic text-plum-500">{m.body}</p></div>;
          const mine = m.userId === me.id;
          const parent = m.replyTo ? byId.get(m.replyTo) : null;
          const rx = CHAT_EMOJI.map((e) => [e, w.reactions.filter((r) => r.messageId === m.id && r.emoji === e)] as const).filter(([, l]) => l.length);
          const u = m.userId ? w.users[m.userId] : null;
          return (
            <div key={m.id}>
              {sep}
              <div className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                {!mine && u && <Avatar name={nameOf(m.userId)} color={u.color} size={28} />}
                <div className={`relative max-w-[78%] rounded-card px-3 py-2 ${mine ? 'bg-pink-600 text-white' : 'bg-white ring-1 ring-pink-100'}`}>
                  {!mine && <b className="block text-xs text-pink-700">{nameOf(m.userId)}{u && u.role !== 'member' ? <span className="ml-1 rounded bg-lavender-100 px-1 text-[10px] text-lavender-600">{u.role === 'facilitator' ? 'Facilitator' : 'Staff'}</span> : null}</b>}
                  {parent && <p className={`mb-1 border-l-2 pl-2 text-xs ${mine ? 'border-white/60 text-white/80' : 'border-pink-300 text-plum-500'}`}>{nameOf(parent.userId)}: {parent.deleted ? 'Message removed' : parent.body.slice(0, 80)}</p>}
                  {m.deleted ? <i className="text-sm opacity-70">Message removed</i> : <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>}
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className={`text-[10px] ${mine ? 'text-white/70' : 'text-plum-500'}`}>{fmtTime(m.at)}</span>
                    {!m.deleted && <button aria-label="Message options" onClick={() => setMenu(menu === m.id ? null : m.id)} className="opacity-70"><MoreHorizontal size={16} /></button>}
                  </div>
                  {rx.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{rx.map(([e, l]) => <button key={e} onClick={() => react(m, e)} className={`rounded-full px-2 py-0.5 text-xs ${l.some((r) => r.userId === me.id) ? 'bg-pink-100 text-pink-700' : 'bg-pink-50 text-plum-900'}`}>{e} {l.length}</button>)}</div>}
                  {menu === m.id && (
                    <div className={`absolute top-full z-10 mt-1 w-52 rounded-card bg-white p-2 text-sm text-plum-900 shadow-lg ring-1 ring-pink-100 ${mine ? 'right-0' : 'left-0'}`}>
                      <div className="flex justify-between px-1 pb-1">{CHAT_EMOJI.map((e) => <button key={e} onClick={() => react(m, e)} aria-label={`React ${e}`} className="text-lg">{e}</button>)}</div>
                      <button onClick={() => { setReplyTo(m); setMenu(null); }} className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-pink-50"><Reply size={14} /> Reply</button>
                      {!mine && <button onClick={() => report(m)} className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-pink-50"><ShieldAlert size={14} /> Report</button>}
                      {!mine && <button onClick={() => block(m)} className="w-full rounded px-2 py-1.5 text-left hover:bg-pink-50">Block {nameOf(m.userId)}</button>}
                      {mod && (<>
                        <button onClick={() => doMod(m, m.pinned ? 'unpin' : 'pin')} className="w-full rounded px-2 py-1.5 text-left hover:bg-pink-50">{m.pinned ? 'Unpin' : 'Pin'}</button>
                        <button onClick={() => doMod(m, 'delete')} className="w-full rounded px-2 py-1.5 text-left text-coral-600 hover:bg-pink-50">Delete message</button>
                        {!mine && <button onClick={() => doMod(m, 'mute')} className="w-full rounded px-2 py-1.5 text-left text-coral-600 hover:bg-pink-50">Mute author 24h</button>}
                      </>)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {visible.length === 0 && <p className="py-10 text-center text-plum-500">Say hi. Someone has to go first.</p>}
        {typing.length > 0 && <p className="text-xs italic text-plum-500" aria-live="polite">{typing.join(' and ')} {typing.length > 1 ? 'are' : 'is'} typing…</p>}
        <div ref={bottom} />
      </div>

      {harm && <p role="status" className="mt-2 rounded-input bg-lavender-100 p-3 text-sm">That sounded heavy. Only you can see this. If you need support, there is a private page that can help. <Link replace href="/help/support" className="font-semibold text-pink-700 underline">Open Support</Link></p>}
      {error && <p role="alert" className="mt-2 text-sm text-coral-600">{error}</p>}
      {muted && <p className="mt-2 rounded-input bg-pink-100 p-2 text-sm">You are muted here for now. A facilitator can tell you more.</p>}
      {replyTo && <p className="mt-2 flex justify-between rounded-input bg-pink-100 px-3 py-1 text-xs">Replying to {nameOf(replyTo.userId)}: {replyTo.body.slice(0, 50)}<button onClick={() => setReplyTo(null)} aria-label="Cancel reply">✕</button></p>}
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="sticky bottom-20 mt-2 flex gap-2 bg-pink-50 py-2 md:bottom-0">
        <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} rows={1} maxLength={1000} placeholder="Message the group" aria-label="Message" className="flex-1 resize-none rounded-input border border-pink-300 bg-white px-3 py-3" />
        <button disabled={!text.trim() || !!muted} aria-label="Send" className="rounded-input bg-pink-600 px-4 text-white disabled:opacity-50"><Send size={20} /></button>
      </form>

      {agreementNeeded && (
        <div role="dialog" aria-modal="true" aria-label="Group agreement" className="fixed inset-0 z-40 flex items-center justify-center bg-plum-900/50 p-4">
          <div className="w-full max-w-sm rounded-card bg-white p-5">
            <h2 className="font-display text-2xl font-semibold">Our agreement</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              <li>Be kind. We are all learning.</li>
              <li>What is said here stays here.</li>
              <li>Never share account numbers, ID numbers or exact amounts.</li>
              <li>No financial advice from members. Ask your facilitator.</li>
            </ul>
            <button onClick={() => update((x, n) => (ch.kind === 'circle' ? acceptCircleRules(x, me.id, ch.refId, n) : acceptCommunityGuidelines(x, me.id, ch.refId, n)))} className="mt-5 w-full rounded-input bg-pink-600 py-3 font-semibold text-white hover:bg-pink-700">I agree</button>
            <Link href="/community" className="mt-2 block text-center text-sm text-pink-700">Not now</Link>
          </div>
        </div>
      )}
    </div>
  );
}
