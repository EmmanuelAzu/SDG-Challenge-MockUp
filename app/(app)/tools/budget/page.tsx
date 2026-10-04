'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useCelebrate } from '@/components/celebration/provider';
import { useApp } from '@/components/shell/app-context';
import { CATEGORIES, TEMPLATES, linesFromTemplate, saveBudget, totals, emptyLines } from '@/lib/engine/budget';
import { clampNum, rand } from '@/lib/money';
import { update } from '@/lib/world/store';
import type { BudgetCategory } from '@/lib/world/types';

const COLORS: Record<BudgetCategory, string> = { rent: '#D81B60', transport: '#7E57C2', groceries: '#0F7B5F', utilities: '#F2B33D', family: '#F48FB1', emergency: '#34B38A', investing: '#6E5A7A', fun: '#AD1457' };

export default function BudgetPage() {
  const { w, me } = useApp();
  const celebrate = useCelebrate();
  const saved = w.budgets[me.id];
  const [template, setTemplate] = useState(saved?.template ?? 'allowance');
  const [income, setIncome] = useState(saved?.income ?? TEMPLATES[0].income);
  const [lines, setLines] = useState(saved?.lines ?? linesFromTemplate(TEMPLATES[0], TEMPLATES[0].income));
  const [msg, setMsg] = useState('');
  const t = totals(income, lines);
  const data = useMemo(() => [...CATEGORIES.filter((c) => lines[c.id] > 0).map((c) => ({ name: c.label, value: lines[c.id], color: COLORS[c.id] })), ...(t.left > 0 ? [{ name: 'Left to allocate', value: t.left, color: '#E2F4EC' }] : [])], [lines, t.left]);

  const pick = (id: string) => { const tpl = TEMPLATES.find((x) => x.id === id)!; setTemplate(id); setIncome(tpl.income); setLines(linesFromTemplate(tpl, tpl.income)); setMsg(''); };
  const changeIncome = (v: number) => { const next = clampNum(v, 0, 10_000_000); const tpl = TEMPLATES.find((x) => x.id === template); setIncome(next); if (tpl) setLines(linesFromTemplate(tpl, next)); setMsg(''); };
  const setLine = (id: BudgetCategory, v: number) => { setLines({ ...lines, [id]: clampNum(v, 0, 10_000_000) }); setMsg(''); };
  const save = () => {
    const r = update((x, now) => saveBudget(x, me.id, { template, income, lines }, now));
    if (!r.ok) return setMsg(r.error);
    setMsg(r.earned.points > 0 ? `Saved. +${me.focusMode ? '' : r.earned.points + ' points. '}Only you can see this budget.` : 'Saved. Only you can see this budget.');
    celebrate(r.earned);
  };
  const bar = (label: string, amount: number, target: number, color: string) => (
    <div><div className="flex justify-between text-xs"><span>{label}</span><span>{t.pct(amount)}% <span className="text-plum-500">(guide {target}%)</span></span></div><div className="mt-1 h-2 rounded-full bg-pink-100"><div className="h-2 rounded-full" style={{ width: `${Math.min(100, t.pct(amount))}%`, background: color }} /></div></div>
  );

  return (
    <div>
      <Link href="/tools" className="text-sm text-pink-700">← Money tools</Link>
      <h1 className="mt-2 font-display text-3xl font-semibold">Budget builder</h1>
      <p className="text-plum-500">Give every rand a job. Start from a template, then make it yours.</p>
      <p className="mt-2 rounded-input bg-mint-100 px-3 py-2 text-xs text-mint-700">Private to you. Never shared, ranked or sent anywhere.</p>

      <div className="mt-4 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Template">
        {TEMPLATES.map((x) => <button key={x.id} role="radio" aria-checked={template === x.id} onClick={() => pick(x.id)} className={`rounded-card p-3 text-left ring-1 ${template === x.id ? 'bg-pink-100 ring-pink-600' : 'bg-white ring-pink-100'}`}><b className="block text-sm">{x.name}</b><span className="text-xs text-plum-500">{x.blurb}</span></button>)}
      </div>

      <label className="mt-4 block text-sm font-medium">Monthly take-home (net) <span className="text-plum-500">· example amounts, change to yours</span>
        <div className="mt-1 flex items-center rounded-input border border-pink-300 bg-white px-3"><span className="text-plum-500">R</span><input type="number" inputMode="numeric" min={0} step={100} value={income || ''} onChange={(e) => changeIncome(+e.target.value)} className="w-full bg-transparent px-2 py-3" aria-label="Monthly take-home" /></div>
      </label>

      <div className="mt-5 grid items-center gap-4 sm:grid-cols-2">
        <div className="h-56" role="img" aria-label={`Budget chart. ${rand(t.spent)} planned of ${rand(income)}. ${t.left >= 0 ? `${rand(t.left)} left` : `${rand(-t.left)} over`}.`}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart><Pie data={data} dataKey="value" innerRadius={62} outerRadius={92} paddingAngle={2} stroke="none" isAnimationActive={false}>{data.map((d) => <Cell key={d.name} fill={d.color} />)}</Pie><Tooltip formatter={(v) => rand(Number(v))} /></PieChart>
          </ResponsiveContainer>
        </div>
        <div className={`rounded-card p-4 text-center ${t.over ? 'bg-coral-600/10' : t.left === 0 ? 'bg-mint-100' : 'bg-white ring-1 ring-pink-100'}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-plum-500">{t.over ? 'Over by' : 'Left to allocate'}</p>
          <p className={`font-display text-4xl font-semibold ${t.over ? 'text-coral-600' : 'text-mint-700'}`}>{rand(Math.abs(t.left))}</p>
          <p className="mt-1 text-xs text-plum-500">{t.over ? 'Trim a category or two until this reaches R0.' : t.left === 0 ? 'Every rand has a job.' : 'Give the rest a job: savings, a goal or fun.'}</p>
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {CATEGORIES.map((c) => (
          <li key={c.id} className="rounded-card bg-white p-3 ring-1 ring-pink-100">
            <div className="flex items-center gap-3">
              <span aria-hidden className="text-xl">{c.emoji}</span>
              <label className="flex-1 text-sm font-medium" htmlFor={`b-${c.id}`}>{c.label}<span className="block text-xs text-plum-500">{t.pct(lines[c.id])}% of take-home · {c.group}</span></label>
              <div className="flex items-center rounded-input border border-pink-300 px-2"><span className="text-xs text-plum-500">R</span><input id={`b-${c.id}`} type="number" inputMode="numeric" min={0} step={10} value={lines[c.id] || ''} placeholder="0" onChange={(e) => setLine(c.id, +e.target.value)} className="w-20 bg-transparent px-1 py-1.5 text-right text-sm" /></div>
            </div>
            <input type="range" min={0} max={Math.max(income, 1000)} step={10} value={lines[c.id]} onChange={(e) => setLine(c.id, +e.target.value)} aria-label={`${c.label} slider`} className="mt-2 w-full" style={{ accentColor: COLORS[c.id] }} />
          </li>
        ))}
      </ul>

      <section className="mt-5 space-y-2 rounded-card bg-white p-4 ring-1 ring-pink-100" aria-label="50/30/20 check">
        <h2 className="font-display text-lg font-semibold">How it compares to 50/30/20</h2>
        {bar('Needs', t.needs, 50, '#D81B60')}{bar('Wants', t.wants, 30, '#7E57C2')}{bar('Saving', t.saving, 20, '#0F7B5F')}
        <p className="text-xs text-plum-500">A guide, not a rule. If rent is high, adjust the split to fit your life.</p>
      </section>

      <div className="mt-5 flex gap-2">
        <button onClick={save} className="flex-1 rounded-input bg-pink-600 py-3 font-semibold text-white hover:bg-pink-700">{saved ? 'Update my budget' : 'Save my budget'}</button>
        <button onClick={() => { setLines(emptyLines()); setMsg(''); }} className="rounded-input px-4 text-sm font-semibold text-plum-500 ring-1 ring-pink-300">Clear</button>
      </div>
      {msg && <p role="status" className="mt-2 text-sm text-mint-700">{msg}</p>}
      {saved && <p className="mt-1 text-xs text-plum-500">Last saved {new Date(saved.savedAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', timeZone: 'Africa/Johannesburg' })}.</p>}
      {t.left > 0 && <p className="mt-3 text-sm"><Link href="/tools/goals" className="font-semibold text-pink-700">Put some of the {rand(t.left)} towards a savings goal →</Link></p>}
      <footer className="mt-8 text-xs text-plum-500">Sisi provides financial education, not financial advice.</footer>
    </div>
  );
}
