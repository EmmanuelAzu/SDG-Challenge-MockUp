'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Bloom } from '@/components/bloom';
import { REWARDS, PILOT_LABEL, eligibility } from '@/lib/engine/rewards';
import { chooseReward, markSeen, peek, react, startChapter, stepsDone } from '@/lib/engine/pilot';
import { CHAPTERS, GUIDED_MINUTES, PEEK, REACTIONS, REWARD_PREVIEW, type Chapter } from '@/lib/pilot/journey';
import { update } from '@/lib/world/store';
import type { PilotRun, World } from '@/lib/world/types';

export function SisiSays({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 rounded-full bg-white p-1 ring-1 ring-pink-100"><Bloom progress={5} size={44} /></div>
      <div className="min-w-0 flex-1 rounded-card rounded-tl-none bg-white p-4 ring-1 ring-pink-100">
        {label && <p className="text-[11px] font-semibold uppercase tracking-wide text-pink-700">{label}</p>}
        {children}
      </div>
    </div>
  );
}

const Header = ({ ch }: { ch: Chapter }) => (
  <div className="text-center">
    <div className="text-4xl" aria-hidden>{ch.emoji}</div>
    <p className="mt-1 text-xs font-semibold tracking-widest text-pink-700">CHAPTER {ch.n} OF {CHAPTERS.length} · {ch.label}</p>
    <div className="mt-2 flex justify-center gap-1.5" aria-hidden>{CHAPTERS.map((c) => <span key={c.id} className={`h-1.5 w-8 rounded-full ${c.n < ch.n ? 'bg-pink-600' : c.n === ch.n ? 'bg-pink-300' : 'bg-pink-100'}`} />)}</div>
  </div>
);
const shell = 'mx-auto flex max-w-md flex-col gap-5 px-4 py-8';
const primary = 'w-full rounded-input bg-pink-600 py-3.5 font-semibold text-white hover:bg-pink-700';

export function ChapterIntro({ ch, userId, go }: { ch: Chapter; userId: string; go: (href: string) => void }) {
  const begin = () => { update((x, now) => startChapter(x, userId, ch.id, now)); if (ch.href !== '/pilot') go(ch.href); };
  return (
    <main className={shell}>
      <Header ch={ch} />
      <h1 className="text-center font-display text-3xl font-semibold">{ch.title}</h1>
      <SisiSays label="Sisi says">
        <p className="font-display text-lg font-semibold">{ch.intro.headline}</p>
        {ch.intro.body.map((p) => <p key={p} className="mt-2 text-sm text-plum-500">{p}</p>)}
      </SisiSays>
      <p className="text-center text-xs text-plum-500">About {ch.minutes} minutes</p>
      <button onClick={begin} className={primary}>{ch.intro.cta}</button>
    </main>
  );
}

export function ChapterActive({ ch, w, run, userId, go }: { ch: Chapter; w: World; run: PilotRun; userId: string; go: (href: string) => void }) {
  const steps = stepsDone(w, userId, run, ch.id);
  return (
    <main className={shell}>
      <Header ch={ch} />
      <h1 className="text-center font-display text-2xl font-semibold">{ch.title}</h1>
      <SisiSays label="Where you are">
        <ul className="space-y-2">
          {ch.steps.map((s) => (
            <li key={s.id} className="flex items-start gap-2 text-sm"><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${steps[s.id] ? 'bg-mint-700 text-white' : 'bg-pink-100'}`}>{steps[s.id] && <Check size={12} aria-label="Done" />}</span><span className={steps[s.id] ? 'text-plum-500 line-through' : ''}>{s.tip}</span></li>
          ))}
        </ul>
      </SisiSays>
      <button onClick={() => go((ch.steps.find((s) => !steps[s.id]) ?? ch.steps[0]).href ?? ch.href)} className={primary}>Back to it</button>
    </main>
  );
}

export function ChapterOutro({ ch, w, run, userId, isLast }: { ch: Chapter; w: World; run: PilotRun; userId: string; isLast: boolean }) {
  const f = run.facts;
  const quizN = typeof f.quizScore === 'number' ? Math.round((f.quizScore / 100) * 3) : null;
  const b = w.budgets[userId];
  const saving = b ? b.lines.emergency + b.lines.investing : 0;
  const months = saving > 0 ? Math.ceil(1500 / saving) : null;
  const extra: Record<string, string | null> = {
    learn: quizN != null ? `You got ${quizN} of 3 on the quiz${(f.points ?? 0) > 0 ? ` and have ${f.points} points so far` : ''}.` : null,
    do: months ? `Your version saves R${saving} a month, so the laptop is ${months} month${months === 1 ? '' : 's'} away with no interest.` : null,
    progress: f.weeklyTarget ? `You chose ${f.weeklyTarget} day${f.weeklyTarget === 1 ? '' : 's'} a week.` : null,
    reward: f.rewardChoice ? `You chose ${f.rewardChoice === 'cash' ? 'cash' : 'investment credit'}.` : null,
    connect: null,
  };
  const cur = run.chapters[ch.id]?.reaction;
  return (
    <main className={shell}>
      <Header ch={ch} />
      <SisiSays label="Sisi says">
        <p className="font-display text-lg font-semibold">{ch.outro.headline}</p>
        {extra[ch.id] && <p className="mt-2 rounded-input bg-mint-100 px-3 py-2 text-sm font-medium text-mint-700">{extra[ch.id]}</p>}
        {ch.outro.body.map((p) => <p key={p} className="mt-2 text-sm text-plum-500">{p}</p>)}
      </SisiSays>
      <div className="text-center">
        <p className="text-sm font-medium">How did that feel?</p>
        <div className="mt-2 flex justify-center gap-2" role="radiogroup" aria-label="How did that feel?">
          {REACTIONS.map((r) => <button key={r.v} role="radio" aria-checked={cur === r.v} onClick={() => update((x) => react(x, userId, ch.id, r.v))} className={`flex w-24 flex-col items-center rounded-card border px-2 py-2 text-xs ${cur === r.v ? 'border-pink-600 bg-pink-100 font-semibold' : 'border-pink-300 bg-white'}`}><span className="text-2xl" aria-hidden>{r.emoji}</span>{r.label}</button>)}
        </div>
        <p className="mt-1 text-[11px] text-plum-500">One tap, optional.</p>
      </div>
      <button onClick={() => update((x) => markSeen(x, userId, ch.id))} className={primary}>{isLast ? 'See my first week' : `Next: ${CHAPTERS[ch.n].label}`}</button>
    </main>
  );
}

/** Chapter 4 happens right here: the reward ladder, a choice, and a simulated claim. Nothing is real money. */
export function RewardChapter({ w, userId, onPlaying, onFinished }: { w: World; userId: string; onPlaying: (v: boolean) => void; onFinished: () => void }) {
  const [now] = useState(() => new Date(Date.now() + w.clockOffsetMs));
  const draw = eligibility(w, userId, now).find((v) => v.def.kind === 'draw');
  const [choice, setChoice] = useState<'cash' | 'credit' | null>(null);
  const [stage, setStage] = useState(0);
  useEffect(() => { if (!choice) return; const t = [window.setTimeout(() => setStage(1), 900), window.setTimeout(() => setStage(2), 1900), window.setTimeout(() => setStage(3), 2900)]; return () => t.forEach(window.clearTimeout); }, [choice]);
  const ch = CHAPTERS[3];
  const pick = (c: 'cash' | 'credit') => { onPlaying(true); setChoice(c); update((x, n) => chooseReward(x, userId, c, n)); };
  const timeline = ['Claimed', 'Approved by PPS', 'Paid'];
  return (
    <main className={shell}>
      <Header ch={ch} />
      <h1 className="text-center font-display text-2xl font-semibold">{ch.title}</h1>
      <SisiSays label="The reward ladder">
        <ul className="space-y-2 text-sm">
          {REWARDS.map((r) => <li key={r.slug}><b>{r.title}</b><span className="block text-xs text-plum-500">{r.short}</span></li>)}
        </ul>
        {draw && <p className="mt-3 rounded-input bg-pink-100 px-3 py-2 text-xs">This week {draw.entrants} {draw.entrants === 1 ? 'woman has' : 'women have'} entered the draw for {draw.prizes} prizes of R25.</p>}
        <p className="mt-2 text-xs text-plum-500">{PILOT_LABEL}</p>
      </SisiSays>
      {!choice ? (
        <section className="rounded-card bg-white p-4 ring-1 ring-pink-100">
          <h2 className="font-display text-lg font-semibold">Imagine you finished three milestones</h2>
          <p className="text-sm text-plum-500">That earns R{REWARD_PREVIEW.cash}. How would you like it?</p>
          <button onClick={() => pick('cash')} className="mt-3 block w-full rounded-input border border-pink-300 px-4 py-3 text-left text-sm font-semibold hover:border-pink-600">Take cash: R{REWARD_PREVIEW.cash}<span className="block text-xs font-normal text-plum-500">Money you can use straight away.</span></button>
          <button onClick={() => pick('credit')} className="mt-2 block w-full rounded-input border border-pink-300 px-4 py-3 text-left text-sm font-semibold hover:border-pink-600">Take investment credit: R{REWARD_PREVIEW.credit}<span className="block text-xs font-normal text-plum-500">10% more than the cash amount. Vouchers expire, investments don’t.</span></button>
        </section>
      ) : (
        <section className="rounded-card bg-white p-4 ring-1 ring-pink-100" data-testid="claim-timeline" aria-live="polite">
          <h2 className="font-display text-lg font-semibold">Your practice claim</h2>
          <ol className="mt-3 space-y-2">
            {timeline.map((t, i) => <li key={t} className={`flex items-center gap-2 text-sm transition-opacity ${stage > i ? 'opacity-100' : 'opacity-30'}`}><span className={`flex h-6 w-6 items-center justify-center rounded-full ${stage > i ? 'bg-mint-700 text-white' : 'bg-pink-100'}`}>{stage > i && <Check size={14} aria-hidden />}</span>{t}</li>)}
          </ol>
          <p className="mt-3 text-xs text-plum-500">Simulated for the pilot. Real claims are reviewed by PPS.</p>
          {stage >= 3 && <button onClick={onFinished} className={`${primary} mt-4`}>Continue</button>}
        </section>
      )}
    </main>
  );
}

export function Epilogue({ w, run, userId, onFinish, error }: { w: World; run: PilotRun; userId: string; onFinish: () => void; error: string }) {
  const f = run.facts;
  const quizN = typeof f.quizScore === 'number' ? Math.round((f.quizScore / 100) * 3) : null;
  const b = w.budgets[userId];
  const saving = b ? b.lines.emergency + b.lines.investing : 0;
  const rows: [string, string][] = [
    ['Learned', quizN != null ? `One lesson, ${quizN} of 3 on the quiz` : 'One lesson'],
    ['Did', saving ? `Fixed a budget and saved R${saving} a month in the scenario` : 'Fixed a budget'],
    ['Progress', `${f.points ?? 0} points, level ${f.level ?? 'Seed'}${f.weeklyTarget ? `, ${f.weeklyTarget} day${f.weeklyTarget === 1 ? '' : 's'} a week` : ''}`],
    ['Reward', f.rewardChoice ? `You would take ${f.rewardChoice === 'cash' ? 'cash' : 'investment credit'}` : 'Previewed'],
    ['Connected', `${f.messageSent ? 'Said hello' : 'Looked around'}${f.buddyStarted ? ', met a practice Money Buddy' : ''}`],
  ];
  return (
    <main className={shell}>
      <div className="flex justify-center"><Bloom progress={5} size={110} /></div>
      <h1 className="text-center font-display text-3xl font-semibold">That was your first week</h1>
      <SisiSays label="Sisi says">
        <p className="text-sm">You learned something, put it to work, saw your progress, picked a reward and said hello. That took about {GUIDED_MINUTES} minutes. In the real app it happens a little at a time across the week.</p>
      </SisiSays>
      <ul className="divide-y divide-pink-100 rounded-card bg-white ring-1 ring-pink-100" data-testid="summary">
        {rows.map(([k, v]) => <li key={k} className="flex gap-3 px-4 py-2.5 text-sm"><b className="w-24 shrink-0 text-pink-700">{k}</b><span>{v}</span></li>)}
      </ul>
      <section>
        <h2 className="font-display text-lg font-semibold">And there is more in the full app</h2>
        <p className="text-sm text-plum-500">Peek at any of these if you like. A purple strip will bring you back here.</p>
        <ul className="mt-2 grid grid-cols-2 gap-2">
          {PEEK.map((p) => (
            <li key={p.id}><Link href={p.href} onClick={() => update((x) => peek(x, userId, p.id))} className="block h-full rounded-card bg-white p-3 text-sm ring-1 ring-pink-100 hover:ring-pink-300"><b>{p.title}</b><span className="mt-0.5 block text-xs text-plum-500">{p.blurb}</span>{run.peeked.includes(p.id) && <span className="mt-1 block text-[11px] font-semibold text-mint-700">Peeked ✓</span>}</Link></li>
          ))}
        </ul>
      </section>
      {error && <p role="alert" className="text-sm text-coral-600">{error}</p>}
      <button onClick={onFinish} className={primary}>I’m done: send my results</button>
    </main>
  );
}
