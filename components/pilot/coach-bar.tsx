'use client';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useApp } from '@/components/shell/app-context';
import { chapterIndex, stepsDone } from '@/lib/engine/pilot';
import { CHAPTERS } from '@/lib/pilot/journey';
import { usePilotSync } from './use-pilot';

/** Sisi's coach strip: which chapter you are in, what to do next, and a way back to the story. */
export function CoachBar() {
  const { w, me } = useApp();
  usePilotSync();
  const run = w.pilot[me.id];
  if (!run || run.stage !== 'story') return null;
  const i = chapterIndex(run);
  const ch = CHAPTERS[i];
  if (!ch && run.stage === 'story') return (
    <div role="region" aria-label="Sisi coach" className="sticky top-0 z-30 border-b border-lavender-100 bg-lavender-100/95 px-4 py-2 text-sm">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3"><span>Peeking at more of the app</span><Link href="/pilot" className="rounded-full bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white">Back to my first week</Link></div>
    </div>
  );
  if (!ch || ch.id === 'reward' || !run.chapters[ch.id]?.startedAt) return null;
  const done = !!run.chapters[ch.id]?.doneAt;
  const steps = stepsDone(w, me.id, run, ch.id);
  const next = ch.steps.find((s) => !steps[s.id]);
  return (
    <div role="region" aria-label="Sisi coach" className="sticky top-0 z-30 border-b border-lavender-100 bg-lavender-100/95 backdrop-blur" data-testid="coach-bar">
      <div className="mx-auto flex max-w-3xl items-start gap-3 px-4 py-2 text-sm">
        <Sparkles size={18} className="mt-0.5 shrink-0 text-lavender-600" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-lavender-600">
            <span>{ch.emoji} {ch.label} · chapter {ch.n} of {CHAPTERS.length}</span>
            <span className="flex gap-1" aria-hidden>{CHAPTERS.map((c) => <span key={c.id} className={`h-1.5 w-4 rounded-full ${run.chapters[c.id]?.doneAt ? 'bg-lavender-600' : c.id === ch.id ? 'bg-pink-300' : 'bg-white'}`} />)}</span>
          </div>
          <p className="mt-0.5" data-testid="coach-tip">{done ? 'Chapter done! Tap Continue to hear what Sisi says.' : next?.tip}</p>
          {!done && ch.steps.length > 1 && <p className="text-[11px] text-plum-500">Step {Math.min(ch.steps.length, ch.steps.filter((s) => steps[s.id]).length + 1)} of {ch.steps.length}{next?.href ? <> · <Link href={next.href} className="font-semibold text-pink-700 underline">Go there</Link></> : ''}</p>}
        </div>
        <Link href="/pilot" className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${done ? 'bg-pink-600 text-white' : 'bg-white text-lavender-600'}`}>{done ? 'Continue' : 'Story'}</Link>
      </div>
    </div>
  );
}
