'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Check } from 'lucide-react';
import { useCelebrate } from '@/components/celebration/provider';
import { useApp } from '@/components/shell/app-context';
import { AFFORDABILITY, BANNER, CHECKLIST, CHECKLIST_REQUIRED, EXPLAINERS, MAX_MONTHLY, MAX_YEARS, MIN_MONTHLY, MIN_YEARS, RATE_PRESETS, compound, emptyInvest, ensureInvest, finishInvest, readiness, runSimulator, seeExplainer, setAnswer, setPlan, steps, stepsDone, toggleChecklist } from '@/lib/engine/invest';
import { rand } from '@/lib/money';
import { update } from '@/lib/world/store';

const STEP_NAMES = ['Readiness', 'Your amount', 'Explainers', 'Simulator', 'First steps'] as const;

export default function InvestHer() {
  const { w, me, now } = useApp();
  const celebrate = useCelebrate();
  const s = w.invest[me.id] ?? emptyInvest(now);
  const done = steps(s);
  const doneFlags = [done.affordability, !!w.invest[me.id], done.explainers, done.simulator, done.checklist];
  const firstOpen = Math.max(0, doneFlags.findIndex((d) => !d));
  const [step, setStep] = useState(w.invest[me.id]?.finishedAt ? 4 : firstOpen === -1 ? 4 : firstOpen);
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const act = (fn: Parameters<typeof update>[0]) => update(fn);
  useEffect(() => { if (!w.invest[me.id]) update((x, n) => { ensureInvest(x, me.id, n); }); }, [w.invest, me.id]);

  const series = useMemo(() => compound(s.monthly, s.years, s.rate), [s.monthly, s.years, s.rate]);
  const end = series[series.length - 1];
  const guide = readiness(s.affordability);
  const chip = (on: boolean) => `rounded-full px-3 py-1.5 text-sm font-semibold ${on ? 'bg-mint-700 text-white' : 'bg-mint-100 text-mint-700'}`;

  const finish = () => {
    const r = update((x, n) => finishInvest(x, me.id, n));
    if (!r.ok) return setMsg(r.error);
    setMsg(''); celebrate(r.earned);
  };

  return (
    <div>
      <div className="rounded-card bg-mint-700 p-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Pathway</p>
        <h1 className="font-display text-3xl font-semibold">Invest HER</h1>
        <p className="text-sm opacity-90">A guided first step into investing, with small rand amounts. Nothing here is real money.</p>
      </div>
      <p role="note" className="mt-2 rounded-input border-2 border-mint-700 bg-mint-100 px-3 py-2 text-xs font-bold text-mint-700">{BANNER}</p>

      <ol className="mt-4 flex gap-1 overflow-x-auto" aria-label="Steps">
        {STEP_NAMES.map((n, i) => (
          <li key={n}><button onClick={() => setStep(i)} aria-current={step === i ? 'step' : undefined} className={`flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${step === i ? 'bg-mint-700 text-white' : doneFlags[i] ? 'bg-mint-100 text-mint-700' : 'bg-white text-plum-500 ring-1 ring-pink-100'}`}>{doneFlags[i] && step !== i ? <Check size={12} aria-hidden /> : <span>{i + 1}</span>} {n}</button></li>
        ))}
      </ol>
      <p className="mt-1 text-xs text-plum-500">{stepsDone(s)} of 4 required steps done{s.finishedAt ? ' · finished 🎉' : ''}</p>

      {step === 0 && (
        <section className="mt-5">
          <h2 className="font-display text-xl font-semibold">Are you ready for a first step?</h2>
          <p className="text-sm text-plum-500">Four quick questions. We do not ask for amounts and nothing is judged.</p>
          <div className="mt-4 space-y-4">
            {AFFORDABILITY.map((q) => (
              <fieldset key={q.id}><legend className="text-sm font-medium">{q.q}</legend>
                <div className="mt-2 flex flex-wrap gap-2">{q.options.map(([v, label]) => <button key={v} aria-pressed={s.affordability[q.id] === v} onClick={() => act((x, n) => setAnswer(x, me.id, q.id, v, n))} className={chip(s.affordability[q.id] === v)}>{label}</button>)}</div>
              </fieldset>
            ))}
          </div>
          {done.affordability && (
            <div className={`mt-5 rounded-card p-4 text-sm ${guide.level === 'ready' ? 'bg-mint-100' : 'bg-pink-100'}`}>
              <b>{guide.message}</b>
              {guide.tips.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5">{guide.tips.map((t) => <li key={t}>{t}</li>)}</ul>}
              <p className="mt-2 text-xs text-plum-500">A friendly guide, not financial advice.</p>
            </div>
          )}
          <button disabled={!done.affordability} onClick={() => setStep(1)} className="mt-5 w-full rounded-input bg-mint-700 py-3 font-semibold text-white disabled:opacity-50">Continue</button>
        </section>
      )}

      {step === 1 && (
        <section className="mt-5">
          <h2 className="font-display text-xl font-semibold">Pick a small monthly amount</h2>
          <p className="text-sm text-plum-500">This is a pretend amount for the simulator. Small is fine: R50 to R500.</p>
          <p className="mt-6 text-center font-display text-5xl font-semibold text-mint-700">{rand(s.monthly)}<span className="text-lg text-plum-500"> a month</span></p>
          <input type="range" min={MIN_MONTHLY} max={MAX_MONTHLY} step={10} value={s.monthly} onChange={(e) => act((x, n) => setPlan(x, me.id, { monthly: +e.target.value }, n))} aria-label="Monthly amount" className="mt-4 w-full accent-mint-700" />
          <div className="flex justify-between text-xs text-plum-500"><span>{rand(MIN_MONTHLY)}</span><span>{rand(MAX_MONTHLY)}</span></div>
          <div className="mt-3 flex justify-center gap-2">{[100, 200, 300, 500].map((v) => <button key={v} onClick={() => act((x, n) => setPlan(x, me.id, { monthly: v }, n))} className={chip(s.monthly === v)}>{rand(v)}</button>)}</div>
          <button onClick={() => setStep(2)} className="mt-6 w-full rounded-input bg-mint-700 py-3 font-semibold text-white">Continue</button>
        </section>
      )}

      {step === 2 && (
        <section className="mt-5">
          <h2 className="font-display text-xl font-semibold">Three things worth knowing</h2>
          <p className="text-sm text-plum-500">Open each one. A line, a plain explanation, and what to watch for.</p>
          <ul className="mt-4 space-y-3">
            {EXPLAINERS.map((e) => {
              const seen = s.explainersSeen.includes(e.id);
              return (
                <li key={e.id} className="rounded-card bg-white p-4 ring-1 ring-pink-100">
                  <button onClick={() => { setOpen(open === e.id ? null : e.id); act((x, n) => seeExplainer(x, me.id, e.id, n)); }} aria-expanded={open === e.id} className="flex w-full items-center justify-between text-left"><span><b className="font-display text-lg">{e.title}</b><span className="block text-sm text-plum-500">{e.line}</span></span>{seen && <Check size={18} className="text-mint-700" aria-label="Read" />}</button>
                  {open === e.id && <div className="mt-3 space-y-2 text-sm"><p>{e.body}</p><p className="rounded-input bg-mint-100 p-2"><b>Suits:</b> {e.good}</p><p className="rounded-input bg-pink-100 p-2"><b>Watch for:</b> {e.watch}</p></div>}
                </li>
              );
            })}
          </ul>
          <aside className="mt-4 rounded-card bg-pink-100 p-3 text-sm"><b className="text-pink-700">Spot the scam:</b> promises of high, fixed returns with “no risk”, pressure to decide today, or anyone not on the FSCA register.</aside>
          <button disabled={!done.explainers} onClick={() => setStep(3)} className="mt-5 w-full rounded-input bg-mint-700 py-3 font-semibold text-white disabled:opacity-50">{done.explainers ? 'Continue' : `Open all ${EXPLAINERS.length} to continue`}</button>
        </section>
      )}

      {step === 3 && (
        <section className="mt-5">
          <h2 className="font-display text-xl font-semibold">See compound growth</h2>
          <p className="text-sm text-plum-500">Same {rand(s.monthly)} a month. Slide the years, try a return. Illustrations only.</p>
          <label className="mt-4 block text-sm font-medium">Years: <b>{s.years}</b>
            <input type="range" min={MIN_YEARS} max={MAX_YEARS} step={1} value={s.years} onChange={(e) => act((x, n) => setPlan(x, me.id, { years: +e.target.value }, n))} aria-label="Years" className="w-full accent-mint-700" /></label>
          <div className="mt-2 flex items-center gap-2"><span className="text-sm font-medium">Illustrative return a year:</span>{RATE_PRESETS.map((r) => <button key={r} onClick={() => act((x, n) => setPlan(x, me.id, { rate: r }, n))} aria-pressed={s.rate === r} className={chip(s.rate === r)}>{r}%</button>)}</div>

          <div className="mt-4 h-60 rounded-card bg-white p-2 ring-1 ring-pink-100" role="img" aria-label={`Chart. After ${s.years} years you would put in ${rand(end.contributions)} and the illustration shows ${rand(end.total)}, of which ${rand(end.growth)} is growth.`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FCE4EF" />
                <XAxis dataKey="year" tickFormatter={(v) => `${v}y`} fontSize={11} />
                <YAxis tickFormatter={(v) => (v >= 1000 ? `R${Math.round(v / 1000)}k` : `R${v}`)} fontSize={11} width={44} />
                <Tooltip formatter={(v, name) => [rand(Number(v)), name === 'contributions' ? 'You put in' : 'Growth']} labelFormatter={(l) => `Year ${l}`} />
                <Area type="monotone" dataKey="contributions" stackId="1" stroke="#0F7B5F" fill="#34B38A" fillOpacity={0.55} />
                <Area type="monotone" dataKey="growth" stackId="1" stroke="#F2B33D" fill="#F2B33D" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 flex gap-4 text-xs text-plum-500"><span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#34B38A]" />You put in</span><span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-gold-500" />Illustrated growth</span></p>

          <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-card bg-white p-3 ring-1 ring-pink-100"><dt className="text-xs text-plum-500">You put in</dt><dd className="font-display text-lg font-semibold text-mint-700">{rand(end.contributions)}</dd></div>
            <div className="rounded-card bg-white p-3 ring-1 ring-pink-100"><dt className="text-xs text-plum-500">Growth</dt><dd className="font-display text-lg font-semibold text-plum-900">{rand(end.growth)}</dd></div>
            <div className="rounded-card bg-mint-100 p-3"><dt className="text-xs text-mint-700">Illustration</dt><dd className="font-display text-lg font-semibold text-mint-700">{rand(end.total)}</dd></div>
          </dl>
          <p className="mt-2 text-xs text-plum-500">Not a forecast. Real returns vary and can be negative in some years. Fees also reduce growth.</p>
          <details className="mt-2 text-xs"><summary className="cursor-pointer text-plum-500">View as a table</summary><table className="mt-1 w-full text-left"><thead><tr><th>Year</th><th>Put in</th><th>Growth</th><th>Total</th></tr></thead><tbody>{series.filter((r) => r.year % 5 === 0 || r.year === s.years).map((r) => <tr key={r.year}><td>{r.year}</td><td>{rand(r.contributions)}</td><td>{rand(r.growth)}</td><td>{rand(r.total)}</td></tr>)}</tbody></table></details>

          <button onClick={() => { act((x, n) => { runSimulator(x, me.id, n); }); setStep(4); }} className="mt-5 w-full rounded-input bg-mint-700 py-3 font-semibold text-white">{s.simulated ? 'Save this scenario and continue' : 'I have explored this. Continue'}</button>
        </section>
      )}

      {step === 4 && (
        <section className="mt-5">
          <h2 className="font-display text-xl font-semibold">Your first steps (no money needed)</h2>
          <p className="text-sm text-plum-500">Tick at least {CHECKLIST_REQUIRED} of 4 as you do them.</p>
          <ul className="mt-4 space-y-2">
            {CHECKLIST.map((c) => { const on = s.checklist.includes(c.id); return (
              <li key={c.id}><label className={`flex items-start gap-3 rounded-card p-3 text-sm ring-1 ${on ? 'bg-mint-100 ring-mint-700' : 'bg-white ring-pink-100'}`}><input type="checkbox" checked={on} onChange={() => act((x, n) => toggleChecklist(x, me.id, c.id, n))} className="mt-0.5 h-5 w-5 accent-mint-700" /><span>{c.label}</span></label></li>
            ); })}
          </ul>
          <div className="mt-5 rounded-card bg-white p-4 text-sm ring-1 ring-pink-100"><b>Your checklist</b>
            <ul className="mt-1 space-y-1">{[['Readiness check', done.affordability], ['Three explainers', done.explainers], ['Simulator', done.simulator], [`Checklist (${s.checklist.length}/${CHECKLIST_REQUIRED})`, done.checklist]].map(([l, ok]) => <li key={String(l)} className="flex items-center gap-2"><span className={`flex h-4 w-4 items-center justify-center rounded-full text-white ${ok ? 'bg-mint-700' : 'bg-pink-300'}`}>{ok && <Check size={10} aria-hidden />}</span>{l}</li>)}</ul></div>
          {s.finishedAt ? (
            <div className="mt-5 rounded-card bg-mint-100 p-4 text-center"><p className="font-display text-xl font-semibold text-mint-700">Investor Ready 🌱</p><p className="text-sm">You finished Invest HER. Real investing is a decision for later, on your terms.</p><Link href="/rewards" className="mt-2 inline-block text-sm font-semibold text-mint-700 underline">See your badge</Link></div>
          ) : (
            <button onClick={finish} className="mt-5 w-full rounded-input bg-mint-700 py-3 font-semibold text-white">Finish Invest HER</button>
          )}
          {msg && <p role="alert" className="mt-2 text-sm text-coral-600">{msg}</p>}
        </section>
      )}
      <footer className="mt-10 text-xs text-plum-500">Sisi provides financial education, not financial advice.</footer>
    </div>
  );
}
