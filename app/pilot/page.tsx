'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Done } from '@/components/pilot/done';
import { Landing } from '@/components/pilot/landing';
import { ChapterActive, ChapterIntro, ChapterOutro, Epilogue, RewardChapter } from '@/components/pilot/story';
import { usePilotSync } from '@/components/pilot/use-pilot';
import { chapterIndex, finishRun } from '@/lib/engine/pilot';
import { CHAPTERS, PEEK } from '@/lib/pilot/journey';
import { useSessionId, useWorld } from '@/lib/world/hooks';
import { update } from '@/lib/world/store';
import Link from 'next/link';

export default function Pilot() {
  const w = useWorld();
  const sid = useSessionId();
  const router = useRouter();
  const [error, setError] = useState('');
  const [more, setMore] = useState(false);
  const [rewardPlaying, setRewardPlaying] = useState(false);
  useEffect(() => { setMore(new URLSearchParams(window.location.search).get('more') === '1'); }, []);
  usePilotSync();
  const me = w && sid ? w.users[sid] : undefined;
  const run = w && sid ? w.pilot[sid] : undefined;

  if (!w) return <main className="mx-auto max-w-md px-4 py-12" aria-busy="true"><div className="h-48 animate-pulse rounded-card bg-pink-100" /></main>;
  if (!run || !sid) return <Landing w={w} me={me} />;
  if (run.stage === 'done') {
    if (more) return (
      <main className="mx-auto max-w-md px-4 py-8"><Link href="/pilot" className="text-sm text-pink-700">← Back</Link><h1 className="mt-2 font-display text-3xl font-semibold">More of the app</h1>
        <ul className="mt-4 space-y-3">{PEEK.map((p) => <li key={p.id}><Link href={p.href} className="block rounded-card bg-white p-4 ring-1 ring-pink-100"><b>{p.title}</b><span className="block text-sm text-plum-500">{p.blurb}</span></Link></li>)}</ul></main>
    );
    return <Done run={run} />;
  }

  const i = chapterIndex(run);
  if (i >= CHAPTERS.length) return <Epilogue w={w} run={run} userId={sid} error={error} onFinish={() => { const r = update((x, n) => finishRun(x, sid, n)); if (!r.ok) setError(r.error); }} />;
  const ch = CHAPTERS[i];
  const st = run.chapters[ch.id];
  if (ch.id === 'reward' && st?.startedAt && (!st.doneAt || rewardPlaying)) return <RewardChapter w={w} userId={sid} onPlaying={setRewardPlaying} onFinished={() => setRewardPlaying(false)} />;
  if (st?.doneAt) return <ChapterOutro ch={ch} w={w} run={run} userId={sid} isLast={i === CHAPTERS.length - 1} />;
  if (st?.startedAt) return <ChapterActive ch={ch} w={w} run={run} userId={sid} go={(href) => router.push(href)} />;
  return <ChapterIntro ch={ch} userId={sid} go={(href) => router.push(href)} />;
}
