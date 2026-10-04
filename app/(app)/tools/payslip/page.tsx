'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useCelebrate } from '@/components/celebration/provider';
import { GlossaryTerm } from '@/components/glossary-sheet';
import { useApp } from '@/components/shell/app-context';
import { TAX_ZA } from '@/config/tax-za';
import { CATEGORIES } from '@/lib/engine/budget';
import { PRESETS, calcPayslip, leftToAllocate, savePayslipRun, startingAllocation } from '@/lib/engine/payslip';
import { clampNum, rand } from '@/lib/money';
import { update } from '@/lib/world/store';
import type { BudgetCategory } from '@/lib/world/types';

const COLORS: Record<BudgetCategory, string> = { rent: '#D81B60', transport: '#7E57C2', groceries: '#0F7B5F', utilities: '#F2B33D', family: '#F48FB1', emergency: '#34B38A', investing: '#6E5A7A', fun: '#AD1457' };

export default function Payslip() {
  const { w, me } = useApp();
  const celebrate = useCelebrate();
  const last = w.payslipRuns[me.id]?.[0];
  const [gross, setGross] = useState<number>(last?.gross ?? 12000);
  const [custom, setCustom] = useState(false);
  const [pct, setPct] = useState(last?.retirementPct ?? 0);
  const p = useMemo(() => calcPayslip(gross, pct), [gross, pct]);
  const [alloc, setAlloc] = useState<Record<BudgetCategory, number>>(() => last?.allocation ?? startingAllocation(calcPayslip(12000, 0).net));
  const [msg, setMsg] = useState('');
  const left = leftToAllocate(p.net, alloc);
  const net = Math.round(p.net);

  const reset = (g: number, r: number) => { setGross(g); setPct(r); setAlloc(startingAllocation(calcPayslip(g, r).net)); setMsg(''); };
  const setLine = (id: BudgetCategory, v: number) => { setAlloc({ ...alloc, [id]: Math.round(clampNum(v, 0, 10_000_000)) }); setMsg(''); };
  const save = () => {
    const r = update((x, n) => savePayslipRun(x, me.id, { gross, retirementPct: pct, allocation: alloc }, n));
    if (!r.ok) return setMsg(r.error);
    setMsg(`Scenario saved.${r.earned.points > 0 && !me.focusMode ? ` +${r.earned.points} points.` : ''} Only you can see it.`);
    celebrate(r.earned);
  };

  const rows: [React.ReactNode, number, string?][] = [
    [<GlossaryTerm key="g" slug="gross-pay">Gross pay</GlossaryTerm>, p.gross],
    [<GlossaryTerm key="p" slug="paye">PAYE (income tax)</GlossaryTerm>, -p.paye],
    [<GlossaryTerm key="u" slug="uif">UIF</GlossaryTerm>, -p.uif],
    ...(p.retirement > 0 ? [[<GlossaryTerm key="r" slug="retirement-annuity">Retirement contribution</GlossaryTerm>, -p.retirement] as [React.ReactNode, number]] : []),
  ];

  return (
    <div>
      <Link href="/tools" className="text-sm text-pink-700">← Money tools</Link>
      <h1 className="mt-2 font-display text-3xl font-semibold">First payslip simulator</h1>
      <p className="text-plum-500">See what really lands in your account, then give every rand a job.</p>
      <p role="note" className="mt-2 rounded-input border-2 border-lavender-600 bg-lavender-100 px-3 py-2 text-xs font-bold text-lavender-600">SIMULATION. Illustrative tax figures, not tax advice.</p>
      {!TAX_ZA.verified && <p className="mt-1 rounded-input bg-gold-500/25 px-3 py-1.5 text-xs">Illustrative figures: the team has not yet checked these tax tables against the current SARS tables. Check <a href={TAX_ZA.source} target="_blank" rel="noopener noreferrer" className="underline">sars.gov.za</a> for real numbers.</p>}

      <h2 className="mt-6 font-display text-lg font-semibold">1. Your gross monthly salary</h2>
      <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Salary presets">
        {PRESETS.map((v) => <button key={v} role="radio" aria-checked={!custom && gross === v} onClick={() => { setCustom(false); reset(v, pct); }} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${!custom && gross === v ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-700'}`}>{rand(v)}</button>)}
        <button role="radio" aria-checked={custom} onClick={() => setCustom(true)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${custom ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-700'}`}>Custom</button>
      </div>
      {custom && <label className="mt-2 block text-sm font-medium">Gross per month<div className="mt-1 flex items-center rounded-input border border-pink-300 bg-white px-3"><span className="text-plum-500">R</span><input type="number" inputMode="numeric" min={0} step={500} value={gross || ''} onChange={(e) => reset(clampNum(e.target.value, 0, 10_000_000), pct)} className="w-full bg-transparent px-2 py-3" aria-label="Custom gross monthly salary" /></div></label>}

      <label className="mt-4 block text-sm font-medium">Retirement contribution: <b>{pct}%</b> of gross
        <input type="range" min={0} max={TAX_ZA.retirement.sliderMaxPct} step={1} value={pct} onChange={(e) => reset(gross, +e.target.value)} aria-label="Retirement contribution percent" className="w-full accent-pink-600" /></label>

      <h2 className="mt-6 font-display text-lg font-semibold">2. What comes off</h2>
      <div className="mt-2 divide-y divide-pink-100 rounded-card bg-white ring-1 ring-pink-100">
        {rows.map(([label, amount], i) => <div key={i} className="flex justify-between px-4 py-2.5 text-sm"><span>{label}</span><b className={amount < 0 ? 'text-coral-600' : ''}>{rand(amount)}</b></div>)}
        <div className="flex justify-between bg-mint-100 px-4 py-3"><span className="font-semibold text-mint-700"><GlossaryTerm slug="net-pay">Net pay</GlossaryTerm> (what you get)</span><b className="font-display text-xl text-mint-700">{rand(p.net)}</b></div>
      </div>
      <p className="mt-1 text-xs text-plum-500">That is {p.gross > 0 ? Math.round((p.deductions / p.gross) * 100) : 0}% taken off before it reaches you. Budget with net pay, never gross.</p>

      <h2 className="mt-6 font-display text-lg font-semibold">3. Give every rand a job</h2>
      <div className="mt-2 flex h-5 overflow-hidden rounded-full bg-pink-100" role="img" aria-label="Allocation of net pay">{CATEGORIES.map((c) => <div key={c.id} style={{ width: `${net > 0 ? Math.min(100, (alloc[c.id] / net) * 100) : 0}%`, background: COLORS[c.id] }} title={`${c.label} ${rand(alloc[c.id])}`} />)}</div>
      <div className={`mt-3 rounded-card p-3 text-center ${left === 0 ? 'bg-mint-100' : left < 0 ? 'bg-coral-600/10' : 'bg-white ring-1 ring-pink-100'}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-plum-500">{left < 0 ? 'Over by' : 'Left to allocate'}</p>
        <p className={`font-display text-3xl font-semibold ${left === 0 ? 'text-mint-700' : left < 0 ? 'text-coral-600' : 'text-pink-700'}`}>{rand(Math.abs(left))}</p>
        <p className="text-xs text-plum-500">{left === 0 ? 'Every rand has a job. You can save this scenario.' : 'Get this to R0 to save.'}</p>
        {left > 0 && <button onClick={() => setLine('emergency', alloc.emergency + left)} className="mt-2 rounded-full bg-mint-700 px-3 py-1 text-xs font-semibold text-white">Put the rest in emergency savings</button>}
      </div>
      <ul className="mt-3 space-y-2">
        {CATEGORIES.map((c) => (
          <li key={c.id} className="rounded-card bg-white p-3 ring-1 ring-pink-100">
            <div className="flex items-center gap-3"><span aria-hidden>{c.emoji}</span><label htmlFor={`p-${c.id}`} className="flex-1 text-sm font-medium">{c.label}</label>
              <div className="flex items-center rounded-input border border-pink-300 px-2"><span className="text-xs text-plum-500">R</span><input id={`p-${c.id}`} type="number" inputMode="numeric" min={0} step={10} value={alloc[c.id] || ''} placeholder="0" onChange={(e) => setLine(c.id, +e.target.value)} className="w-20 bg-transparent px-1 py-1.5 text-right text-sm" /></div></div>
            <input type="range" min={0} max={Math.max(net, 100)} step={10} value={alloc[c.id]} onChange={(e) => setLine(c.id, +e.target.value)} aria-label={`${c.label} slider`} className="mt-1 w-full" style={{ accentColor: COLORS[c.id] }} />
          </li>
        ))}
      </ul>
      <button onClick={save} disabled={left !== 0} className="mt-4 w-full rounded-input bg-pink-600 py-3 font-semibold text-white hover:bg-pink-700 disabled:opacity-50">Save this scenario</button>
      {msg && <p role="status" className={`mt-2 text-sm ${msg.startsWith('Scenario') ? 'text-mint-700' : 'text-coral-600'}`}>{msg}</p>}

      {(w.payslipRuns[me.id]?.length ?? 0) > 0 && (
        <details className="mt-6 text-sm"><summary className="cursor-pointer font-semibold">Saved scenarios ({w.payslipRuns[me.id].length})</summary>
          <ul className="mt-2 space-y-1">{w.payslipRuns[me.id].map((r) => <li key={r.id} className="flex items-center justify-between rounded-input bg-white px-3 py-2 ring-1 ring-pink-100"><span>{new Date(r.at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', timeZone: 'Africa/Johannesburg' })} · gross {rand(r.gross)}{r.retirementPct ? ` · ${r.retirementPct}% retirement` : ''}</span><button onClick={() => { setGross(r.gross); setCustom(!PRESETS.includes(r.gross as never)); setPct(r.retirementPct); setAlloc(r.allocation); setMsg(''); }} className="text-xs font-semibold text-pink-700">Load</button></li>)}</ul></details>
      )}
      <p className="mt-6 text-xs text-plum-500">Sisi provides financial education, not financial advice. Nothing here is saved to a real account, and your amounts are private to you.</p>
    </div>
  );
}
