'use client';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Pin, Reply, Send, ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { acceptRules, blockUser, loadPeople, moderate, reportMessage, sendMessage, toggleReaction } from '@/app/(app)/circles/[id]/chat/actions';

type Msg = { id: string; channel_id: string; user_id: string | null; body: string; reply_to: string | null; kind: 'user' | 'system'; pinned: boolean; deleted_at: string | null; created_at: string };
type Reaction = { message_id: string; user_id: string; emoji: string };
type Person = { user_id: string; name: string };
type Props = { channelId: string; circleId: string; userId: string; agreed: boolean; canModerate: boolean; initialMessages: Msg[]; initialReactions: Reaction[]; people: Person[] };

const EMOJI = ['👍', '💗', '🔥', '👏', '😂'];
const PAGE = 50;
const fmtDay = (iso: string) => new Intl.DateTimeFormat('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Johannesburg' }).format(new Date(iso));
const fmtTime = (iso: string) => new Intl.DateTimeFormat('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Johannesburg' }).format(new Date(iso));
const dayKey = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(new Date(iso));

export function ChatRoom({ channelId, circleId, userId, agreed: agreedInit, canModerate, initialMessages, initialReactions, people: initialPeople }: Props) {
  const sb = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [reactions, setReactions] = useState<Reaction[]>(initialReactions);
  const [people, setPeople] = useState<Map<string, string>>(new Map(initialPeople.map((p) => [p.user_id, p.name])));
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [hasMore, setHasMore] = useState(initialMessages.length >= PAGE);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(agreedInit);
  const [error, setError] = useState('');
  const [harm, setHarm] = useState(false);
  const [pending, start] = useTransition();
  const bottom = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const known = useRef(people);
  known.current = people;

  const refreshPeople = useCallback(async () => setPeople(new Map((await loadPeople(channelId)).map((p) => [p.user_id, p.name]))), [channelId]);

  const upsert = useCallback((m: Msg) => {
    setMessages((cur) => (cur.some((x) => x.id === m.id) ? cur.map((x) => (x.id === m.id ? m : x)) : [...cur, m].sort((a, b) => a.created_at.localeCompare(b.created_at))));
    if (m.user_id && !known.current.has(m.user_id)) void refreshPeople();
  }, [refreshPeople]);

  useEffect(() => {
    const ch = sb
      .channel(`chat:${channelId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` }, (p) => upsert(p.new as Msg))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` }, (p) => upsert(p.new as Msg))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_reactions' }, (p) => setReactions((r) => (r.some((x) => x.message_id === p.new.message_id && x.user_id === p.new.user_id && x.emoji === p.new.emoji) ? r : [...r, p.new as Reaction])))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'message_reactions' }, (p) => setReactions((r) => r.filter((x) => !(x.message_id === p.old.message_id && x.user_id === p.old.user_id && x.emoji === p.old.emoji))))
      .subscribe();
    return () => { void sb.removeChannel(ch); };
  }, [sb, channelId, upsert]);

  useEffect(() => { if (stick.current) bottom.current?.scrollIntoView({ block: 'end' }); }, [messages.length]);

  async function loadOlder() {
    stick.current = false;
    const oldest = messages.find((m) => !m.id.startsWith('tmp-'))?.created_at;
    const { data } = await sb.from('messages').select('id,channel_id,user_id,body,reply_to,kind,pinned,deleted_at,created_at').eq('channel_id', channelId).lt('created_at', oldest ?? new Date().toISOString()).order('created_at', { ascending: false }).limit(PAGE);
    const older = ((data ?? []) as Msg[]).reverse();
    setHasMore((data?.length ?? 0) >= PAGE);
    setMessages((cur) => [...older, ...cur]);
    const ids = older.map((m) => m.id);
    if (ids.length) { const { data: rx } = await sb.from('message_reactions').select('message_id,user_id,emoji').in('message_id', ids); setReactions((r) => [...r, ...((rx ?? []) as Reaction[])]); }
    if (older.some((m) => m.user_id && !known.current.has(m.user_id))) void refreshPeople();
  }

  function send() {
    const body = text.trim();
    if (!body) return;
    setError(''); setHarm(false);
    const tmp: Msg = { id: `tmp-${Date.now()}`, channel_id: channelId, user_id: userId, body, reply_to: replyTo?.id ?? null, kind: 'user', pinned: false, deleted_at: null, created_at: new Date().toISOString() };
    stick.current = true;
    setMessages((m) => [...m, tmp]);
    const reply = replyTo;
    setText(''); setReplyTo(null);
    start(async () => {
      const r = await sendMessage({ channelId, body, replyTo: reply?.id ?? null });
      if (!r.ok) { setMessages((m) => m.filter((x) => x.id !== tmp.id)); setText(body); setError(r.error); return; }
      setMessages((m) => { const without = m.filter((x) => x.id !== tmp.id); return without.some((x) => x.id === r.message.id) ? without : [...without, r.message].sort((a, b) => a.created_at.localeCompare(b.created_at)); });
      if (r.harm) setHarm(true);
    });
  }

  const visible = messages.filter((m) => !(m.user_id && blocked.has(m.user_id)));
  const byId = new Map(messages.map((m) => [m.id, m]));
  const pinned = visible.filter((m) => m.pinned && !m.deleted_at);
  const nameOf = (id: string | null) => (id === userId ? 'You' : id ? people.get(id) ?? 'Someone' : 'Sisi');

  function react(m: Msg, emoji: string) {
    setMenu(null);
    const mine = reactions.some((r) => r.message_id === m.id && r.user_id === userId && r.emoji === emoji);
    setReactions((r) => (mine ? r.filter((x) => !(x.message_id === m.id && x.user_id === userId && x.emoji === emoji)) : [...r, { message_id: m.id, user_id: userId, emoji }]));
    void toggleReaction(m.id, emoji);
  }
  async function report(m: Msg) {
    const reason = window.prompt('What is wrong with this message?');
    setMenu(null);
    if (reason?.trim()) { await reportMessage(m.id, reason); setError('Thanks. A facilitator will take a look.'); }
  }
  async function block(m: Msg) {
    setMenu(null);
    if (m.user_id && window.confirm(`Hide ${nameOf(m.user_id)}'s messages from you?`)) { setBlocked((b) => new Set(b).add(m.user_id!)); await blockUser(m.user_id); }
  }
  async function mod(m: Msg, action: 'delete' | 'pin' | 'unpin' | 'mute') {
    setMenu(null);
    await moderate({ messageId: m.id, action });
    if (action === 'delete') upsert({ ...m, deleted_at: new Date().toISOString() });
    if (action === 'pin' || action === 'unpin') upsert({ ...m, pinned: action === 'pin' });
  }

  let lastDay = '';
  return (
    <div className="mt-3 flex flex-col" style={{ minHeight: 'calc(100dvh - 11rem)' }}>
      <p className="rounded-input bg-gold-500/20 px-3 py-2 text-xs">Don’t share account numbers, ID numbers or exact amounts.</p>
      {pinned.length > 0 && (
        <div className="mt-2 rounded-input bg-pink-100 p-2 text-xs" aria-label="Pinned messages">
          {pinned.map((m) => <p key={m.id} className="flex items-start gap-1"><Pin size={12} className="mt-0.5 shrink-0" /> {m.body}</p>)}
        </div>
      )}

      <div className="mt-3 flex-1 space-y-2" onScroll={(e) => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }}>
        {hasMore && <button onClick={loadOlder} className="mx-auto block text-sm font-medium text-pink-700">Load earlier messages</button>}
        {visible.map((m) => {
          const day = dayKey(m.created_at);
          const sep = day !== lastDay ? <p key={`d-${m.id}`} className="py-2 text-center text-xs font-semibold text-plum-500">{fmtDay(m.created_at)}</p> : null;
          lastDay = day;
          if (m.kind === 'system') return <div key={m.id}>{sep}<p className="text-center text-xs italic text-plum-500">{m.body}</p></div>;
          const mine = m.user_id === userId;
          const parent = m.reply_to ? byId.get(m.reply_to) : null;
          const rx = EMOJI.map((e) => [e, reactions.filter((r) => r.message_id === m.id && r.emoji === e)] as const).filter(([, l]) => l.length);
          return (
            <div key={m.id}>
              {sep}
              <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`relative max-w-[82%] rounded-card px-3 py-2 ${mine ? 'bg-pink-600 text-white' : 'bg-white ring-1 ring-pink-100'} ${m.id.startsWith('tmp-') ? 'opacity-60' : ''}`}>
                  {!mine && <b className="block text-xs text-pink-700">{nameOf(m.user_id)}</b>}
                  {parent && <p className={`mb-1 border-l-2 pl-2 text-xs ${mine ? 'border-white/60 text-white/80' : 'border-pink-300 text-plum-500'}`}>{nameOf(parent.user_id)}: {parent.deleted_at ? 'Message removed' : parent.body.slice(0, 80)}</p>}
                  {m.deleted_at ? <i className="text-sm opacity-70">Message removed</i> : <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>}
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className={`text-[10px] ${mine ? 'text-white/70' : 'text-plum-500'}`}>{fmtTime(m.created_at)}</span>
                    {!m.deleted_at && !m.id.startsWith('tmp-') && <button aria-label="Message options" onClick={() => setMenu(menu === m.id ? null : m.id)} className="opacity-70"><MoreHorizontal size={16} /></button>}
                  </div>
                  {rx.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{rx.map(([e, l]) => <button key={e} onClick={() => react(m, e)} className={`rounded-full px-2 py-0.5 text-xs ${l.some((r) => r.user_id === userId) ? 'bg-pink-100 text-pink-700' : 'bg-pink-50 text-plum-900'}`}>{e} {l.length}</button>)}</div>}
                  {menu === m.id && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-52 rounded-card bg-white p-2 text-sm text-plum-900 shadow-lg ring-1 ring-pink-100">
                      <div className="flex justify-between px-1 pb-1">{EMOJI.map((e) => <button key={e} onClick={() => react(m, e)} aria-label={`React ${e}`} className="text-lg">{e}</button>)}</div>
                      <button onClick={() => { setReplyTo(m); setMenu(null); }} className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-pink-50"><Reply size={14} /> Reply</button>
                      {!mine && <button onClick={() => report(m)} className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-pink-50"><ShieldAlert size={14} /> Report</button>}
                      {!mine && <button onClick={() => block(m)} className="w-full rounded px-2 py-1.5 text-left hover:bg-pink-50">Block {nameOf(m.user_id)}</button>}
                      {canModerate && (<>
                        <button onClick={() => mod(m, m.pinned ? 'unpin' : 'pin')} className="w-full rounded px-2 py-1.5 text-left hover:bg-pink-50">{m.pinned ? 'Unpin' : 'Pin'}</button>
                        <button onClick={() => mod(m, 'delete')} className="w-full rounded px-2 py-1.5 text-left text-coral-600 hover:bg-pink-50">Delete message</button>
                        {!mine && <button onClick={() => mod(m, 'mute')} className="w-full rounded px-2 py-1.5 text-left text-coral-600 hover:bg-pink-50">Mute author 24h</button>}
                      </>)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {visible.length === 0 && <p className="py-10 text-center text-plum-500">Say hi to your Circle. Someone has to go first.</p>}
        <div ref={bottom} />
      </div>

      {harm && (
        <p role="status" className="mt-2 rounded-input bg-lavender-100 p-3 text-sm">
          That sounded heavy. Only you can see this. If you need support, there is a private page that can help. <Link replace href="/help/support" className="font-semibold text-pink-700 underline">Open Support</Link>
        </p>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-coral-600">{error}</p>}
      {replyTo && <p className="mt-2 flex justify-between rounded-input bg-pink-100 px-3 py-1 text-xs">Replying to {nameOf(replyTo.user_id)}: {replyTo.body.slice(0, 50)}<button onClick={() => setReplyTo(null)} aria-label="Cancel reply">✕</button></p>}
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="sticky bottom-20 mt-2 flex gap-2 bg-pink-50 py-2 md:bottom-0">
        <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} rows={1} maxLength={1000} placeholder="Message your Circle" aria-label="Message" className="flex-1 resize-none rounded-input border border-pink-300 bg-white px-3 py-3" />
        <button disabled={pending || !text.trim()} aria-label="Send" className="rounded-input bg-pink-600 px-4 text-white disabled:opacity-50"><Send size={20} /></button>
      </form>

      {!agreed && (
        <div role="dialog" aria-modal="true" aria-label="Circle agreement" className="fixed inset-0 z-40 flex items-center justify-center bg-plum-900/50 p-4">
          <div className="w-full max-w-sm rounded-card bg-white p-5">
            <h2 className="font-display text-2xl font-semibold">Our Circle agreement</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              <li>Be kind. We are all learning.</li>
              <li>What is said in the Circle stays in the Circle.</li>
              <li>Never share account numbers, ID numbers or exact amounts.</li>
              <li>No financial advice from members. Ask your facilitator.</li>
            </ul>
            <button onClick={() => start(async () => { await acceptRules(circleId); setAgreed(true); })} className="mt-5 w-full rounded-input bg-pink-600 py-3 font-semibold text-white hover:bg-pink-700">I agree</button>
            <Link href={`/circles/${circleId}`} className="mt-2 block text-center text-sm text-pink-700">Not now</Link>
          </div>
        </div>
      )}
    </div>
  );
}
