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
const chip = (p: boolean | null) => p === null ? 'bg-pink-100 text-plum-500' : p ? 'bg-mint-100 text-mint-700' : 'bg-coral-100 text-coral-600';
const mmss = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}` : '–');

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
    setMsg(`${r.added} added, ${r.duplicates} already imported, ${lines.length - good.length} not recognised (codes from the earlier checklist pilot start with SISI2 and are not accepted).`);
    if (good.length) setText('');
  }
  const csv = () => { const real = runs.filter((r) => !r.simulated); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([toCsv(real)], { type: 'text/csv' })); a.download = `sisi-pilot-${now.toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href); };
  const card = 'rounded-card bg-white p-4 ring-1 ring-pink-100';
  const th = 'border-b border-pink-100 px-2 py-1 text-left text-xs font-semibold text-plum-500';
  const td = 'border-b border-pink-50 px-2 py-1';
  const f = s.facts;

  return (
    <div>
      <Link href="/admin" className="text-sm text-pink-700 underline">Staff console</Link>
      <h1 className="font-display text-3xl font-semibold">Pilot results</h1>
      <p className="text-sm text-plum-500">What testers actually did in the guided pilot, recorded passively. Opinions, satisfaction and the SDG questions live in the Google Form: join the two on the participant ID.</p>

      <section className={`mt-4 ${card}`}>
        <label className="block text-sm font-medium">Results codes (one per line or separated by spaces)<textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="mt-1 w-full rounded-input border border-pink-300 px-3 py-2 font-mono text-xs" placeholder="SISI3...." /></label>
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
        <p className="text-xs text-plum-500">Fills the dashboard with made-up responses so you can see how it reads. They are not evidence.</p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <button onClick={() => { update((x, n) => { x.pilotImports = [...x.pilotImports.filter((r) => !r.simulated), ...simulatedRuns(40, n)]; }); setUseSim(true); }} className="rounded-input border border-pink-600 px-3 py-1.5 font-semibold text-pink-700">Load 40 simulated</button>
          {sims > 0 && <button onClick={() => { update((x) => { x.pilotImports = x.pilotImports.filter((r) => !r.simulated); }); setUseSim(false); }} className="text-plum-500 underline">Remove simulated</button>}
          <label className="flex items-center gap-1"><input type="checkbox" checked={useSim} onChange={(e) => setUseSim(e.target.checked)} /> Include simulated in the numbers</label>
        </div>
      </section>

      {useSim && sims > 0 && <p role="alert" className="mt-3 rounded-input bg-gold-100 p-3 text-sm font-semibold">SIMULATED DATA IS INCLUDED. These numbers are not evidence.</p>}
      {s.n === 0 ? <p className="mt-6 text-plum-500">No participants yet.</p> : (
        <>
          {s.exploratory && <p className="mt-3 rounded-input bg-pink-100 p-3 text-xs">n = {s.n}. Under 30 testers, treat everything below as exploratory: look at patterns and quotes, not precise numbers.</p>}

          <h2 className="mt-6 font-display text-xl font-semibold">Did the experience work?</h2>
          <p className="text-xs text-plum-500">Proposed targets, written before the data. Edit them in lib/pilot/analysis.ts if PPS agrees different ones.</p>
          <ul className="mt-2 space-y-2">{s.verdicts.map((v) => <li key={v.id} className={`${card} flex items-start justify-between gap-3`} data-testid={`verdict-${v.id}`}><div><b className="text-sm">{v.label}</b><span className="block text-xs text-plum-500">Target: {v.target}</span><span className="block text-sm">{v.value}</span></div><span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${chip(v.pass)}`}>{v.pass === null ? 'Not enough data' : v.pass ? 'Met' : 'Not met'}</span></li>)}</ul>

          <h2 className="mt-8 font-display text-xl font-semibold">Chapter by chapter</h2>
          <div className={`mt-2 overflow-x-auto ${card}`}><table className="w-full text-sm"><thead><tr><th className={th}>Chapter</th><th className={th}>Started</th><th className={th}>Finished</th><th className={th}>Median time</th><th className={th}>😍</th><th className={th}>🙂</th><th className={th}>🙁</th></tr></thead>
            <tbody>{s.chapters.map((c) => <tr key={c.id}><td className={td}>{c.label}</td><td className={td}>{c.started}</td><td className={td}>{c.finished} <span className="text-xs text-plum-500">({pct(c.completion)})</span></td><td className={td}>{mmss(c.medianSec)}</td><td className={td}>{c.reactions.loved}</td><td className={td}>{c.reactions.okay}</td><td className={td}>{c.reactions.notForMe}</td></tr>)}</tbody></table>
            <p className="mt-2 text-xs text-plum-500">Time runs from tapping “start” on a chapter to finishing it. Total median: {Number.isFinite(s.time.median) ? `${round(s.time.median, 1)} min` : '–'} (from agreeing to the last screen). Reactions are one optional tap after each chapter.</p></div>

          <h2 className="mt-8 font-display text-xl font-semibold">What they did and chose</h2>
          <div className={`mt-2 space-y-1 text-sm ${card}`}>
            <p><b>Lesson quiz:</b> mean {Number.isFinite(f.quiz.mean) ? `${round(f.quiz.mean, 0)}%` : '–'}, {pct(f.quiz.passRate)} passed (2 of 3 or better), {f.quiz.retried} retried. <span className="text-xs text-plum-500">A score shows what people knew after the lesson, not how much they gained.</span></p>
            <p><b>Budget:</b> {f.budget.ok} of {f.budget.tried} fixed the scenario ({pct(f.budget.rate)}).</p>
            <p><b>Weekly target:</b> {Object.entries(f.targets).sort().map(([k, v]) => `${k} day${k === '1' ? '' : 's'}: ${v}`).join(' · ') || '–'}. <b>Average points:</b> {Number.isFinite(f.pointsMean) ? round(f.pointsMean, 0) : '–'}.</p>
            <p><b>Reward preference:</b> investment credit {f.reward.credit} · cash {f.reward.cash}. <span className="text-xs text-plum-500">Credit was shown as worth 10% more.</span></p>
            <p><b>Community:</b> {f.connect.message} said hello · {f.connect.buddy} started a Money Buddy · {f.connect.nudged} sent a nudge (of {f.connect.tried} who tried).</p>
            <p><b>Peeked at:</b> {f.peeked.map((p) => `${p.title} (${p.n})`).join(' · ')}</p>
            <p><b>Device:</b> {f.device.mobile} phone · {f.device.desktop} computer</p>
          </div>
        </>
      )}
    </div>
  );
}
