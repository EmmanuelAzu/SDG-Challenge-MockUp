'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { useCelebrate } from '@/components/celebration/provider';
import { useApp } from '@/components/shell/app-context';
import { GOAL_EMOJI, addDeposit, createGoal, deleteGoal, goalsOf, progress, realResults } from '@/lib/engine/goals';
import { rand } from '@/lib/money';
import { update } from '@/lib/world/store';
import type { SavingsGoal } from '@/lib/world/types';

function Ring({ pct, emoji, reached }: { pct: number; emoji: string; reached: boolean }) {
  const R = 34, C = 2 * Math.PI * R;
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" role="img" aria-label={`${pct}% saved`}>
      <circle cx="42" cy="42" r={R} fill="none" stroke="#FCE4EF" strokeWidth="9" />
      <circle cx="42" cy="42" r={R} fill="none" stroke={reached ? '#0F7B5F' : '#D81B60'} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(C * pct) / 100} ${C}`} transform="rotate(-90 42 42)" />
      <text x="42" y="50" textAnchor="middle" fontSize="24">{emoji}</text>
    </svg>
  );
}

function GoalCard({ g }: { g: SavingsGoal }) {
  const { me, now } = useApp();
  const celebrate = useCelebrate();
  const [amt, setAmt] = useState('');
  const [err, setErr] = useState('');
  const p = progress(g, now);
  const deposit = (a: number) => {
    const r = update((x, n) => addDeposit(x, me.id, g.id, a, n));
    if (!r.ok) return setErr(r.error);
    setErr(''); setAmt(''); celebrate(r.earned);
  };
  return (
    <li className="rounded-card bg-white p-4 ring-1 ring-pink-100">
      <div className="flex items-center gap-4">
        <Ring pct={p.pct} emoji={g.emoji} reached={p.reached} />
        <div className="min-w-0 flex-1">
          <b className="block font-display text-lg leading-tight">{g.name}</b>
          <p className="text-sm">{rand(p.saved)} of {rand(g.target)} · <b>{p.pct}%</b></p>
          {p.reached ? <p className="text-sm font-semibold text-mint-700">Goal reached 🎉</p> : <p className="text-xs text-plum-500">{rand(p.remaining)} to go{p.perMonth ? ` · about ${rand(p.perMonth)} a month to finish by ${new Date(`${g.dueOn}T12:00:00Z`).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}` : ''}</p>}
        </div>
        <button onClick={() => { if (window.confirm(`Delete “${g.name}” and its deposits?`)) update((x) => deleteGoal(x, me.id, g.id)); }} aria-label={`Delete ${g.name}`} className="self-start text-plum-500"><Trash2 size={16} /></button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {[50, 100, 200].map((a) => <button key={a} onClick={() => deposit(a)} className="rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-700">+{rand(a)}</button>)}
        <form onSubmit={(e) => { e.preventDefault(); deposit(+amt); }} className="flex flex-1 gap-1">
          <input type="number" inputMode="decimal" min={0} value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="Other amount" aria-label={`Deposit amount for ${g.name}`} className="min-w-0 flex-1 rounded-input border border-pink-300 px-2 py-1 text-sm" />
          <button className="rounded-input bg-pink-600 px-3 text-xs font-semibold text-white">Add</button>
        </form>
      </div>
      {err && <p role="alert" className="mt-1 text-xs text-coral-600">{err}</p>}
      {g.deposits.length > 0 && <details className="mt-2 text-xs text-plum-500"><summary className="cursor-pointer">Deposits ({g.deposits.length})</summary><ul className="mt-1 space-y-0.5">{[...g.deposits].reverse().map((d) => <li key={d.id} className="flex justify-between"><span>{new Date(d.at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', timeZone: 'Africa/Johannesburg' })}</span><span>{rand(d.amount)}</span></li>)}</ul></details>}
    </li>
  );
}

export default function Goals() {
  const { w, me, now } = useApp();
  const [form, setForm] = useState({ name: '', emoji: GOAL_EMOJI[0], target: '', dueOn: '' });
  const [err, setErr] = useState('');
  const mine = goalsOf(w, me.id);
  const r = realResults(w, me.id);
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const res = update((x, n) => createGoal(x, me.id, { name: form.name, emoji: form.emoji, target: +form.target, dueOn: form.dueOn || null }, n));
    if (!res.ok) return setErr(res.error);
    setErr(''); setForm({ name: '', emoji: GOAL_EMOJI[0], target: '', dueOn: '' });
  };
  return (
    <div>
      <Link href="/tools" className="text-sm text-pink-700">← Money tools</Link>
      <h1 className="mt-2 font-display text-3xl font-semibold">Savings goals</h1>
      <p className="text-plum-500">Name it, fund it, watch it fill.</p>
      <p className="mt-2 rounded-input bg-mint-100 px-3 py-2 text-xs text-mint-700">Private to you. Amounts never appear on leaderboards, share cards or in anyone else’s view.</p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-card bg-white p-3 ring-1 ring-pink-100"><p className="text-xs text-plum-500">Saved so far</p><p className="font-display text-xl font-semibold text-pink-700">{rand(r.saved)}</p></div>
        <div className="rounded-card bg-white p-3 ring-1 ring-pink-100"><p className="text-xs text-plum-500">Goals</p><p className="font-display text-xl font-semibold text-pink-700">{r.goals}</p></div>
        <div className="rounded-card bg-white p-3 ring-1 ring-pink-100"><p className="text-xs text-plum-500">Reached</p><p className="font-display text-xl font-semibold text-pink-700">{r.reached}</p></div>
      </div>
      <ul className="mt-4 space-y-3">{mine.map((g) => <GoalCard key={g.id} g={g} />)}{!mine.length && <li className="rounded-card bg-white p-6 text-center text-plum-500 ring-1 ring-pink-100">No goals yet. What are you saving for?</li>}</ul>

      <form onSubmit={add} className="mt-6 space-y-3 rounded-card bg-white p-4 ring-1 ring-pink-100">
        <h2 className="font-display text-lg font-semibold">New goal</h2>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={40} placeholder="e.g. Laptop for varsity" aria-label="Goal name" className="w-full rounded-input border border-pink-300 px-3 py-2" />
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Emoji">{GOAL_EMOJI.map((e) => <button type="button" key={e} role="radio" aria-checked={form.emoji === e} onClick={() => setForm({ ...form, emoji: e })} className={`h-9 w-9 rounded-full text-lg ${form.emoji === e ? 'bg-pink-600' : 'bg-pink-100'}`}>{e}</button>)}</div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm">Target (R)<input type="number" inputMode="numeric" min={0} value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className="mt-1 w-full rounded-input border border-pink-300 px-3 py-2" /></label>
          <label className="text-sm">By when <span className="text-plum-500">(optional)</span><input type="date" value={form.dueOn} min={now.toISOString().slice(0, 10)} onChange={(e) => setForm({ ...form, dueOn: e.target.value })} className="mt-1 w-full rounded-input border border-pink-300 px-3 py-2" /></label>
        </div>
        {err && <p role="alert" className="text-sm text-coral-600">{err}</p>}
        <button className="w-full rounded-input bg-pink-600 py-3 font-semibold text-white hover:bg-pink-700">Add goal</button>
      </form>
      <footer className="mt-8 text-xs text-plum-500">Sisi provides financial education, not financial advice. Nothing here moves real money.</footer>
    </div>
  );
}
