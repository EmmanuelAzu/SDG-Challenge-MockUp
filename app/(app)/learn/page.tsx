'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BookA, Lightbulb, Scale } from 'lucide-react';
import { COURSES, TOPICS, TRACKS, courseLessons } from '@/lib/content';

function Catalogue() {
  const sp = useSearchParams();
  const topic = sp.get('topic') ?? '';
  const track = sp.get('track') ?? '';
  const q = (sp.get('q') ?? '').trim().toLowerCase();
  const trackLessons = new Set(TRACKS.find((t) => t.slug === track)?.lessons ?? []);
  const courses = COURSES.filter((c) => (!topic || c.topic === topic) && (!q || c.title.toLowerCase().includes(q) || c.lessons.some((l) => l.title.toLowerCase().includes(q))) && (!track || c.lessons.some((l) => trackLessons.has(l.slug))));
  const href = (p: Record<string, string>) => { const s = new URLSearchParams({ ...(topic && { topic }), ...(track && { track }), ...p }); [...s].forEach(([k, v]) => !v && s.delete(k)); return `/learn${s.size ? `?${s}` : ''}`; };
  const chip = (on: boolean) => `whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium ${on ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-700'}`;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Learn</h1>
      <p className="text-plum-500">Three minutes. One takeaway. One action.</p>
      <form className="mt-4"><input name="q" defaultValue={sp.get('q') ?? ''} placeholder="Search lessons" aria-label="Search lessons" className="w-full rounded-input border border-pink-300 bg-white px-3 py-3" />{topic && <input type="hidden" name="topic" value={topic} />}{track && <input type="hidden" name="track" value={track} />}</form>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Life Track filter"><Link href={href({ track: '' })} className={chip(!track)}>All tracks</Link>{TRACKS.map((t) => <Link key={t.slug} href={href({ track: t.slug })} className={chip(track === t.slug)}>{t.name}</Link>)}</div>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1" aria-label="Topics"><Link href={href({ topic: '' })} className={chip(!topic)}>All topics</Link>{TOPICS.map((t) => <Link key={t} href={href({ topic: t })} className={chip(topic === t)}>{t}</Link>)}</div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold">
        <Link href="/learn/glossary" className="rounded-card bg-lavender-100 p-3 text-lavender-600"><BookA className="mx-auto mb-1" size={20} />Money words</Link>
        <Link href="/learn/options" className="rounded-card bg-mint-100 p-3 text-mint-700"><Scale className="mx-auto mb-1" size={20} />Compare options</Link>
        <Link href="/learn/suggest" className="rounded-card bg-pink-100 p-3 text-pink-700"><Lightbulb className="mx-auto mb-1" size={20} />Suggest a topic</Link>
      </div>
      {courses.length === 0 ? (
        <p className="mt-8 text-plum-500">Nothing here yet. We are adding more lessons all the time. <Link href="/learn/suggest" className="text-pink-700 underline">Suggest a topic</Link></p>
      ) : (
        <ul className="mt-5 space-y-3">
          {courses.map((c) => {
            const minutes = Math.ceil(courseLessons(c.slug).reduce((a, l) => a + l.durationSec, 0) / 60);
            return (
              <li key={c.slug}><Link href={`/learn/${c.slug}`} className="block rounded-card bg-white p-4 ring-1 ring-pink-100 hover:ring-pink-300">
                <span className="text-xs font-semibold uppercase tracking-wide text-pink-700">{c.topic}</span><b className="mt-1 block font-display text-lg">{c.title}</b>
                <span className="text-sm text-plum-500">{c.level} · {c.lessons.length} lessons · {minutes} min</span>
              </Link></li>
            );
          })}
        </ul>
      )}
      <footer className="mt-10 text-xs text-plum-500">Sisi provides financial education, not financial advice.</footer>
    </div>
  );
}

export default function Learn() { return <Suspense><Catalogue /></Suspense>; }
