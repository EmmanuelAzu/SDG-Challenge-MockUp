'use client';
import { useState } from 'react';

const money = (n: number) => `R${Math.round(n).toLocaleString('en-ZA')}`;

/** 50/30/20 builder. Values stay in this component's state; nothing is sent anywhere. */
export function BudgetBuilder() {
  const [take, setTake] = useState(5000);
  const [needs, setNeeds] = useState(50);
  const [wants, setWants] = useState(30);
  const saving = Math.max(0, 100 - needs - wants);
  const rows = [['Needs', needs, 'bg-pink-600'], ['Wants', wants, 'bg-lavender-600'], ['Saving & debt', saving, 'bg-mint-700']] as const;
  return (
    <div className="rounded-card bg-white p-4 ring-1 ring-pink-100">
      <h3 className="font-display text-lg font-semibold">Budget builder</h3>
      <label className="mt-3 block text-sm font-medium">Monthly take-home (net)
        <input type="number" inputMode="numeric" min={0} value={take} onChange={(e) => setTake(Math.max(0, +e.target.value))} className="mt-1 w-full rounded-input border border-pink-300 px-3 py-2" />
      </label>
      <label className="mt-3 block text-sm font-medium">Needs: {needs}%
        <input type="range" min={20} max={80} value={needs} onChange={(e) => setNeeds(Math.min(+e.target.value, 100 - wants))} className="w-full accent-pink-600" />
      </label>
      <label className="mt-1 block text-sm font-medium">Wants: {wants}%
        <input type="range" min={0} max={60} value={wants} onChange={(e) => setWants(Math.min(+e.target.value, 100 - needs))} className="w-full accent-pink-600" />
      </label>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full">{rows.map(([n, p, c]) => <div key={n} className={c} style={{ width: `${p}%` }} />)}</div>
      <ul className="mt-3 space-y-1 text-sm">
        {rows.map(([n, p]) => <li key={n} className="flex justify-between"><span>{n} ({p}%)</span><b>{money((take * p) / 100)}</b></li>)}
      </ul>
      <p className="mt-3 text-xs text-plum-500">A guide, not a rule. Nothing you type here is saved.</p>
    </div>
  );
}

const IN = ['Allowance / NSFAS', 'Family support', 'Part-time work', 'Salary', 'Side hustle'];
const OUT = ['Rent / accommodation', 'Transport', 'Food', 'Data & airtime', 'Going out', 'Other'];

/** Cash-flow check: money in minus money out. Local state only. */
export function CashFlowCheck() {
  const [vals, setVals] = useState<Record<string, number>>({});
  const sum = (keys: string[]) => keys.reduce((a, k) => a + (vals[k] || 0), 0);
  const flow = sum(IN) - sum(OUT);
  const set = (k: string, v: string) => setVals((p) => ({ ...p, [k]: Math.max(0, +v || 0) }));
  const group = (title: string, keys: string[]) => (
    <div>
      <h4 className="mt-3 text-sm font-semibold">{title}</h4>
      {keys.map((k) => (
        <label key={k} className="mt-1 flex items-center justify-between gap-3 text-sm">{k}
          <input type="number" inputMode="numeric" min={0} value={vals[k] || ''} onChange={(e) => set(k, e.target.value)} placeholder="R0" className="w-28 rounded-input border border-pink-300 px-2 py-1 text-right" />
        </label>
      ))}
    </div>
  );
  return (
    <div className="rounded-card bg-white p-4 ring-1 ring-pink-100">
      <h3 className="font-display text-lg font-semibold">Cash-flow check</h3>
      {group('Money in', IN)}
      {group('Money out', OUT)}
      <p className={`mt-4 rounded-input p-3 text-sm font-semibold ${flow >= 0 ? 'bg-mint-100 text-mint-700' : 'bg-pink-100 text-pink-700'}`}>
        {flow >= 0 ? `You have ${money(flow)} of room this month.` : `You are ${money(-flow)} short this month. That is useful information, not a failure.`}
      </p>
      <p className="mt-2 text-xs text-plum-500">Nothing you type here is saved.</p>
    </div>
  );
}
