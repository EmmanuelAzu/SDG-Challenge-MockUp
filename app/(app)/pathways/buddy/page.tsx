'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, HandHeart, MessageCircle } from 'lucide-react';
import { ChatRoom } from '@/components/community/chat-room';
import { useApp } from '@/components/shell/app-context';
import { acceptInvite, createInvite, endPair, ensureBuddyChannel, JOINT_WEEKS_NEEDED, currentPlan, weekKeyOf, itemDone, jointWeeks, markManual, nudge, nudgedToday, pairOf, partnerId, planProgress, simRespond, startSimBuddy } from '@/lib/engine/buddy';
import { firstName } from '@/lib/engine/helpers';
import { LESSONS } from '@/lib/content';
import { update } from '@/lib/world/store';

const lessonHref = (id: string) => { const l = LESSONS.find((x) => x.id === id); return l ? `/learn/${l.courseSlug}/${l.slug}` : '/learn'; };

export default function Buddy() {
  const { w, me, now } = useApp();
  const pair = pairOf(w, me.id);
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState('');
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => { if (pair?.status === 'active') update((x, n) => { ensureBuddyChannel(x, pair.id); currentPlan(x, x.buddies.find((b) => b.id === pair.id)!, n); }); }, [pair?.id, pair?.status]);

  const header = (
    <>
      <h1 className="font-display text-3xl font-semibold">Money Buddy</h1>
      <p className="text-plum-500">Pair up with a friend, do three small money things a week, and finish them together. Only completion shows. Never amounts.</p>
    </>
  );

  if (!pair) {
    const invite = () => { const r = update((x, n) => createInvite(x, me.id, n)); if (!r.ok) setMsg(r.error); };
    return (
      <div>{header}
        <section className="mt-6 rounded-card bg-lavender-100 p-5">
          <HandHeart className="text-lavender-600" aria-hidden />
          <h2 className="mt-2 font-display text-xl font-semibold">Invite a friend</h2>
          <p className="mt-1 text-sm">You get a private link. When she joins, you both get a weekly plan and +20 points each time you both finish it.</p>
          <button onClick={invite} className="mt-4 rounded-input bg-pink-600 px-5 py-3 font-semibold text-white hover:bg-pink-700">Create invite link</button>
        </section>
        <section className="mt-4 rounded-card bg-white p-5 ring-1 ring-pink-100">
          <h2 className="font-display text-lg font-semibold">Have an invite code?</h2>
          <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); const r = update((x, n) => acceptInvite(x, me.id, code.trim(), n)); if (!r.ok) setMsg(r.error); }}>
            <input aria-label="Invite code" value={code} onChange={(e) => setCode(e.target.value)} className="flex-1 rounded-input border border-pink-300 px-3 py-2" placeholder="e.g. k3j9x2ab" />
            <button className="rounded-input border border-pink-600 px-4 py-2 font-semibold text-pink-700">Join</button>
          </form>
        </section>
        <section className="mt-4 rounded-card bg-white p-5 ring-1 ring-pink-100">
          <h2 className="font-display text-lg font-semibold">Just exploring?</h2>
          <p className="mt-1 text-sm text-plum-500">Try the whole thing with a practice buddy. She is simulated, and labelled that way.</p>
          <button onClick={() => update((x, n) => startSimBuddy(x, me.id, n))} className="mt-3 rounded-input border border-pink-600 px-4 py-2 font-semibold text-pink-700">Try with a practice buddy</button>
        </section>
        {msg && <p role="alert" className="mt-3 text-sm text-coral-600">{msg}</p>}
      </div>
    );
  }

  if (pair.status === 'pending') {
    const link = `${window.location.origin}/buddy/invite/${pair.code}`;
    const text = `I’m doing a money-confidence challenge on Sisi and want you as my Money Buddy. Join me: ${link}`;
    return (
      <div>{header}
        <section className="mt-6 rounded-card bg-lavender-100 p-5">
          <h2 className="font-display text-xl font-semibold">Waiting for your buddy</h2>
          <p className="mt-1 text-sm">Send her this link. It works once.</p>
          <p className="mt-3 break-all rounded-input bg-white px-3 py-2 text-sm" data-testid="invite-link">{link}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-input bg-pink-600 px-4 py-2 text-sm font-semibold text-white"><MessageCircle size={16} /> WhatsApp</a>
            <button onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); }} className="flex items-center gap-2 rounded-input border border-pink-600 px-4 py-2 text-sm font-semibold text-pink-700"><Copy size={16} /> {copied ? 'Copied' : 'Copy link'}</button>
          </div>
          <p className="mt-3 text-xs text-plum-500">Demo tip: open the link in a second tab and sign in as another demo account.</p>
        </section>
        <button onClick={() => update((x) => endPair(x, me.id, pair.id))} className="mt-4 text-sm text-plum-500 underline">Cancel invite</button>
        <section className="mt-4 rounded-card bg-white p-5 ring-1 ring-pink-100">
          <p className="text-sm text-plum-500">Rather not wait?</p>
          <button onClick={() => update((x, n) => startSimBuddy(x, me.id, n))} className="mt-2 rounded-input border border-pink-600 px-4 py-2 font-semibold text-pink-700">Try with a practice buddy</button>
        </section>
      </div>
    );
  }

  const otherId = partnerId(pair, me.id)!;
  const other = w.users[otherId];
  const plan = pair.plans.find((p) => p.weekKey === weekKeyOf(now)) ?? pair.plans[pair.plans.length - 1];
  if (!plan) return <div>{header}</div>;
  const mine = planProgress(w, plan, me.id);
  const theirs = planProgress(w, plan, otherId);
  const weeks = jointWeeks(w, pair, now);
  const ch = w.channels.find((c) => c.kind === 'buddy' && c.refId === pair.id);
  const nudged = nudgedToday(pair, me.id, now);

  const doNudge = () => {
    const r = update((x, n) => nudge(x, me.id, pair.id, n));
    if (!r.ok) return setMsg(r.error);
    setMsg('');
    if (pair.sim) timer.current = window.setTimeout(() => update((x, n) => simRespond(x, me.id, pair.id, n)), 2500);
  };

  return (
    <div>{header}
      <section className="mt-6 flex items-center gap-3 rounded-card bg-lavender-100 p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white font-display text-xl text-lavender-600">{firstName(other.displayName)[0]}</div>
        <div className="flex-1"><b>{firstName(other.displayName)}</b>{pair.sim && <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-plum-500">Practice buddy (simulated)</span>}
          <p className="text-sm text-plum-500">{weeks} of {JOINT_WEEKS_NEEDED} joint weeks{pair.jointAt ? ' · Better Together unlocked 💗' : ''}</p></div>
      </section>

      <h2 className="mt-6 font-display text-xl font-semibold">This week’s plan</h2>
      <p className="text-sm text-plum-500">You: {mine.done}/{mine.total} · {firstName(other.displayName)}: {theirs.done}/{theirs.total}. Finish all three each to earn +20 points together.</p>
      <ul className="mt-3 divide-y divide-pink-100 rounded-card bg-white ring-1 ring-pink-100">
        {plan.items.map((it) => {
          const a = itemDone(w, plan, me.id, it); const b = itemDone(w, plan, otherId, it);
          return (
            <li key={it.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${a ? 'bg-pink-600 text-white' : 'bg-pink-100'}`}>{a && <Check size={14} aria-label="You did this" />}</span>
              <span className="flex-1">{it.title}
                {it.kind === 'action' && it.lessonId && !a && <Link href={lessonHref(it.lessonId)} className="ml-2 text-pink-700 underline">Open lesson</Link>}</span>
              {it.kind === 'manual' && !a && <button onClick={() => update((x, n) => markManual(x, me.id, pair.id, it.id, n))} className="rounded-full border border-pink-600 px-3 py-1 text-xs font-semibold text-pink-700">Done</button>}
              <span className={`text-xs ${b ? 'font-semibold text-mint-700' : 'text-plum-500'}`}>{b ? `${firstName(other.displayName)} ✓` : `${firstName(other.displayName)} not yet`}</span>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={doNudge} disabled={nudged} className="rounded-input bg-pink-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{nudged ? 'Nudged today' : `Nudge ${firstName(other.displayName)}`}</button>
        <span className="text-xs text-plum-500">One friendly nudge a day.</span>
      </div>
      {msg && <p role="alert" className="mt-2 text-sm text-coral-600">{msg}</p>}

      {ch && <><h2 className="mt-8 font-display text-xl font-semibold">Buddy chat</h2><div className="mt-3 h-[28rem] overflow-hidden rounded-card ring-1 ring-pink-100"><ChatRoom channelId={ch.id} /></div></>}
      <button onClick={() => { if (confirm('End this pairing? Your joint progress stays in your history.')) update((x) => endPair(x, me.id, pair.id)); }} className="mt-8 text-sm text-plum-500 underline">End pairing</button>
    </div>
  );
}
