'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { useApp } from '@/components/shell/app-context';
import { decodeRun, round, summarize, toCsv } from '@/lib/pilot/analysis';
import { simulatedRuns } from '@/lib/pilot/sample';
import { allRuns, importRuns } from '@/lib/engine/pilot';
import { update } from '@/lib/world/store';

const pct = (x: number) => (Number.isFinite(x) ? `${Math.round(x * 100)}%` : '–');
const num = (x: number, d = 1) => (Number.isFinite(x) ? String(round(x, d)) : '–');
const chip = (p: boolean | null) => p === null ? 'bg-pink-100 text-plum-500' : p ? 'bg-mint-100 text-mint-700' : 'bg-coral-100 text-coral-600';

export default function PilotDashboard() {
  const { w, me, now } = useApp();
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const [useSim, setUseSim] = useState(false);
  const all = allRuns(w);
  const sims = all.filter((r) => r.simulated).length;
  const runs = useMemo(() => all.filter((r) => useSim || !r.simulated), [all, useSim]);
  const s = useMemo(() => summarize(runs), [runs]);
  if (me.role === 'member') return <div><h1 className="font-display text-2xl font-semibold">Staff only</h1><Link href="/home" className="text-pink-700 underline">Back home</Link></div>;

  async function doImport() {
    const lines = text.split(/\s+/).map((l) => l.trim()).filter(Boolean);
    const decoded = await Promise.all(lines.map(decodeRun));
    const good = decoded.filter((r): r is NonNullable<typeof r> => !!r);
    const r = update((x) => importRuns(x, good));
    setMsg(`${r.added} added, ${r.duplicates} already imported, ${lines.length - good.length} not recognised.`);
    if (good.length) setText('');
  }
  const csv = () => { const real = runs.filter((r) => !r.simulated); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([toCsv(real)], { type: 'text/csv' })); a.download = `sisi-pilot-${now.toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href); };
  const card = 'rounded-card bg-white p-4 ring-1 ring-pink-100';
  const th = 'border-b border-pink-100 px-2 py-1 text-left text-xs font-semibold text-plum-500';
  const td = 'border-b border-pink-50 px-2 py-1';

  return (
    <div>
      <Link href="/admin" className="text-sm text-pink-700 underline">Staff console</Link>
      <h1 className="font-display text-3xl font-semibold">Pilot results</h1>
      <p className="text-sm text-plum-500">Paste testers’ results codes here. Everything is anonymous. Numbers are descriptive and exploratory until you have enough testers.</p>

      <section className={`mt-4 ${card}`}>
        <label className="block text-sm font-medium">Results codes (one per line or separated by spaces)<textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="mt-1 w-full rounded-input border border-pink-300 px-3 py-2 font-mono text-xs" placeholder="SISI2...." /></label>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button onClick={doImport} disabled={!text.trim()} className="rounded-input bg-pink-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Import</button>
          <button onClick={csv} disabled={!runs.some((r) => !r.simulated)} className="flex items-center gap-1 rounded-input border border-pink-600 px-4 py-2 text-sm font-semibold text-pink-700 disabled:opacity-50"><Download size={14} aria-hidden /> Download CSV</button>
          <button onClick={() => { if (confirm('Remove all imported codes from this browser?')) update((x) => { x.pilotImports = []; }); }} className="text-xs text-plum-500 underline">Clear imported</button>
        </div>
        {msg && <p role="status" className="mt-2 text-sm">{msg}</p>}
        <p className="mt-2 text-xs text-plum-500">{all.filter((r) => !r.simulated).length} real participants ({Object.keys(w.pilot).length} on this device, {w.pilotImports.filter((r) => !r.simulated).length} imported). The CSV never includes simulated rows.</p>
      </section>

      <section className={`mt-3 ${card}`}>
        <b className="text-sm">Preview with simulated data</b>
        <p className="text-xs text-plum-500">Fills the dashboard with made-up responses so you can see how it reads. They are not evidence and are labelled everywhere.</p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <button onClick={() => { update((x, n) => { x.pilotImports = [...x.pilotImports.filter((r) => !r.simulated), ...simulatedRuns(40, n)]; }); setUseSim(true); }} className="rounded-input border border-pink-600 px-3 py-1.5 font-semibold text-pink-700">Load 40 simulated</button>
          {sims > 0 && <button onClick={() => { update((x) => { x.pilotImports = x.pilotImports.filter((r) => !r.simulated); }); setUseSim(false); }} className="text-plum-500 underline">Remove simulated</button>}
          <label className="flex items-center gap-1"><input type="checkbox" checked={useSim} onChange={(e) => setUseSim(e.target.checked)} /> Include simulated in the numbers</label>
        </div>
      </section>

      {useSim && sims > 0 && <p role="alert" className="mt-3 rounded-input bg-gold-100 p-3 text-sm font-semibold">SIMULATED DATA IS INCLUDED. These numbers are not evidence.</p>}
      {s.n === 0 ? <p className="mt-6 text-plum-500">No participants yet.</p> : (
        <>
          {s.exploratory && <p className="mt-3 rounded-input bg-pink-100 p-3 text-xs">n = {s.n}. Under 30 testers, treat everything below as exploratory: look at patterns and quotes, not at precise numbers or p-values.</p>}

          <h2 className="mt-6 font-display text-xl font-semibold">Did it meet the bar?</h2>
          <p className="text-xs text-plum-500">Proposed decision rules, written before the data. Edit them in lib/pilot/analysis.ts if PPS agrees different ones.</p>
          <ul className="mt-2 space-y-2">{s.verdicts.map((v) => <li key={v.id} className={`${card} flex items-start justify-between gap-3`} data-testid={`verdict-${v.id}`}><div><b className="text-sm">{v.label}</b><span className="block text-xs text-plum-500">Target: {v.target}</span><span className="block text-sm">{v.value}</span></div><span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${chip(v.pass)}`}>{v.pass === null ? 'Not enough data' : v.pass ? 'Met' : 'Not met'}</span></li>)}</ul>

          <h2 className="mt-8 font-display text-xl font-semibold">Time and completion</h2>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div className={card}><div className="font-display text-2xl">{s.n}</div><div className="text-xs text-plum-500">started</div></div>
            <div className={card}><div className="font-display text-2xl">{s.finishedCore}</div><div className="text-xs text-plum-500">finished</div></div>
            <div className={card}><div className="font-display text-2xl">{num(s.time.median)}<span className="text-sm"> min</span></div><div className="text-xs text-plum-500">median total</div></div>
          </div>
          <p className="mt-1 text-xs text-plum-500">{pct(s.time.within)} of finishers took 10 minutes or less (from agreeing to the last screen).</p>

          <h2 className="mt-8 font-display text-xl font-semibold">Knowledge (6 questions)</h2>
          <div className={`mt-2 ${card}`}>
            <p className="text-sm">Before <b>{num(s.knowledge.preMean, 2)}</b> → after <b>{num(s.knowledge.postMean, 2)}</b> · gain <b>{num(s.knowledge.mean, 2)}</b> (95% CI {num(s.knowledge.ci[0], 2)} to {num(s.knowledge.ci[1], 2)}) · effect size dz {num(s.knowledge.dz, 2)}</p>
            <p className="text-xs text-plum-500">{s.knowledge.improved} improved, {s.knowledge.same} same, {s.knowledge.declined} lower. “Not sure” averaged {num(s.knowledge.notSurePre, 1)} before and {num(s.knowledge.notSurePost, 1)} after.</p>
            <table className="mt-3 w-full text-sm"><thead><tr><th className={th}>Concept</th><th className={th}>Taught in</th><th className={th}>Before</th><th className={th}>After</th><th className={th}>Change</th></tr></thead>
              <tbody>{s.knowledge.byItem.map((i) => <tr key={i.id}><td className={td}>{i.concept}</td><td className={`${td} text-xs text-plum-500`}>{i.taughtIn}</td><td className={td}>{pct(i.pre)}</td><td className={td}>{pct(i.post)}</td><td className={`${td} font-semibold ${i.gain > 0.05 ? 'text-mint-700' : i.gain < -0.05 ? 'text-coral-600' : ''}`}>{Number.isFinite(i.gain) ? `${i.gain > 0 ? '+' : ''}${Math.round(i.gain * 100)} pts` : '–'}</td></tr>)}</tbody></table>
            <p className="mt-3 text-xs text-plum-500"><b>Form check.</b> {s.knowledge.byForm.map((f) => `Form ${f.form}: before ${num(f.preMean, 2)} (n=${f.preN}), after ${num(f.postMean, 2)} (n=${f.postN})`).join(' · ')}. Big gaps between forms mean one form is easier and the gain is partly a form effect.</p>
          </div>

          <h2 className="mt-8 font-display text-xl font-semibold">Confidence (1–5)</h2>
          <div className={`mt-2 ${card}`}>
            <p className="text-sm">Before <b>{num(s.confidence.preMean, 2)}</b> → after <b>{num(s.confidence.postMean, 2)}</b> · change <b>{num(s.confidence.mean, 2)}</b> (95% CI {num(s.confidence.ci[0], 2)} to {num(s.confidence.ci[1], 2)})</p>
            <ul className="mt-2 text-xs text-plum-500">{s.confidence.items.map((i) => <li key={i.text}>{i.text} {num(i.pre, 2)} → {num(i.post, 2)}</li>)}</ul>
          </div>

          <h2 className="mt-8 font-display text-xl font-semibold">Tasks</h2>
          <div className={`mt-2 overflow-x-auto ${card}`}><table className="w-full text-sm"><thead><tr><th className={th}>Mission</th><th className={th}>Tried</th><th className={th}>Success</th><th className={th}>Median time</th><th className={th}>Ease (1–7)</th></tr></thead>
            <tbody>{s.missions.filter((m) => m.attempted || m.core).map((m) => <tr key={m.id}><td className={td}>{m.title}{m.core ? '' : ' (extra)'}</td><td className={td}>{m.attempted}</td><td className={td}>{pct(m.successRate)}</td><td className={td}>{Number.isFinite(m.medianSec) ? `${Math.round(m.medianSec)} s` : '–'}</td><td className={`${td} font-semibold ${Number.isFinite(m.seqMean) && m.seqMean < 5 ? 'text-coral-600' : ''}`}>{num(m.seqMean)} <span className="text-xs font-normal text-plum-500">(n={m.seqN})</span></td></tr>)}</tbody></table>
            <p className="mt-2 text-xs text-plum-500">Success is observed from what the tester actually did, not self-reported (Support and Rewards are the exceptions, by design).</p></div>

          <h2 className="mt-8 font-display text-xl font-semibold">Usability and trust</h2>
          <div className={`mt-2 space-y-1 text-sm ${card}`}>
            <p>UMUX-Lite <b>{num(s.usability.umuxMean)}</b> / 100 {s.usability.umuxItems.map((i) => `· ${num(i.mean, 1)} “${i.text}”`).join(' ')}</p>
            <p>Would recommend (0–10): NPS <b>{Number.isFinite(s.usability.nps.score) ? s.usability.nps.score : '–'}</b> ({s.usability.nps.promoters} promoters, {s.usability.nps.passives} passive, {s.usability.nps.detractors} detractors) <span className="text-xs text-plum-500">· indicative only for small samples</span></p>
            <p>Comfortable in the community: <b>{num(s.usability.safetyMean)}</b> / 5 (n={s.usability.safetyN}) · understood “education, not advice”: <b>{pct(s.usability.understoodPct)}</b></p>
            <p>Use again: {s.usability.againYes} yes, {s.usability.againMaybe} maybe, {s.usability.againNo} no · most useful: {Object.entries(s.usability.useful).map(([k, v]) => `${k} (${v})`).join(', ') || '–'}</p>
          </div>

          {s.followUp.n > 0 && (
            <>
              <h2 className="mt-8 font-display text-xl font-semibold">Day-7 follow-up</h2>
              <div className={`mt-2 text-sm ${card}`}><p>{s.followUp.n} responded · {s.followUp.usedAgain} opened Sisi again</p><ul className="mt-1 text-xs text-plum-500">{Object.entries(s.followUp.did).map(([k, v]) => <li key={k}>{k}: {v}</li>)}</ul></div>
            </>
          )}

          <h2 className="mt-8 font-display text-xl font-semibold">In their words</h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div className={card}><b className="text-sm">What got in the way</b><ul className="mt-1 list-disc pl-4 text-sm">{s.usability.confusing.length ? s.usability.confusing.map((t, i) => <li key={i}>{t}</li>) : <li className="text-plum-500">Nothing yet</li>}</ul></div>
            <div className={card}><b className="text-sm">What they liked</b><ul className="mt-1 list-disc pl-4 text-sm">{s.usability.liked.length ? s.usability.liked.map((t, i) => <li key={i}>{t}</li>) : <li className="text-plum-500">Nothing yet</li>}</ul></div>
          </div>
        </>
      )}
    </div>
  );
}
