'use client';
import Link from 'next/link';
import { CheckCircle2, ClipboardList } from 'lucide-react';
import { useApp } from '@/components/shell/app-context';
import { CORE, MISSIONS, TIME_BUDGET_MIN } from '@/lib/pilot/instruments';
import { mmss, usePilotDetection, useTick } from './use-pilot';

/** Sticky strip shown while a tester is mid-session: where they are, what is next, and how long it has been. */
export function PilotBanner() {
  const { w, me } = useApp();
  usePilotDetection();
  const tick = useTick(1000);
  const run = w.pilot[me.id];
  if (!run || run.stage !== 'missions') return null;
  const done = CORE.filter((m) => run.missions[m.id]?.doneAt);
  const next = CORE.find((m) => !run.missions[m.id]?.doneAt);
  const unrated = MISSIONS.find((m) => run.missions[m.id]?.doneAt && run.missions[m.id].seq == null && m.core);
  const elapsed = tick + w.clockOffsetMs - new Date(run.startedAt).getTime();
  const over = elapsed > TIME_BUDGET_MIN * 60000;
  return (
    <div role="region" aria-label="Pilot progress" className="sticky top-0 z-30 border-b border-lavender-100 bg-lavender-100/95 backdrop-blur" data-testid="pilot-banner">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2 text-sm">
        <ClipboardList size={18} className="shrink-0 text-lavender-600" aria-hidden />
        <div className="min-w-0 flex-1">
          <b>Pilot</b> · {done.length} of {CORE.length} missions · <span className={over ? 'font-semibold text-coral-600' : ''}>{mmss(elapsed)}</span>
          {next ? <span className="block truncate text-xs text-plum-500">Next: {next.title}</span> : <span className="block text-xs font-semibold text-mint-700"><CheckCircle2 size={12} className="mr-1 inline" aria-hidden />All missions done</span>}
        </div>
        <Link href="/pilot" className="shrink-0 rounded-full bg-lavender-600 px-3 py-1.5 text-xs font-semibold text-white">{unrated || !next ? 'Rate & continue' : 'Checklist'}</Link>
      </div>
    </div>
  );
}
