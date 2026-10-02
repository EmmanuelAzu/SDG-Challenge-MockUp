import Link from 'next/link';
import { BookA, Lightbulb, Scale } from 'lucide-react';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
// Ordered by demand in our survey
const TOPICS = ['Building wealth', 'Investing', 'Tax', 'Insurance', 'Credit & debt', 'Saving', 'Retirement', 'Budgeting', 'Bank fees & adult accounts', 'Family & black tax', 'Spot the scam'];

export default async function Learn({ searchParams }: { searchParams: Promise<{ topic?: string; q?: string; track?: string }> }) {
  const { topic, q, track } = await searchParams;
  const { supabase } = await requireUser();
  const [{ data }, { data: tracks }] = await Promise.all([
    supabase.from('courses').select('slug,title,topic,level,sort,lessons(id,duration_sec)').order('sort'),
    supabase.from('life_tracks').select('slug,name,lesson_ids').order('name'),
  ]);
  const trackIds = new Set<string>(((tracks ?? []).find((t) => t.slug === track)?.lesson_ids ?? []) as string[]);
  const term = q?.trim().toLowerCase();
  const courses = (data ?? []).filter((c: any) =>
    (!topic || c.topic === topic) && (!term || c.title.toLowerCase().includes(term)) && (!track || (c.lessons ?? []).some((l: any) => trackIds.has(l.id))));
  const href = (p: Record<string, string | undefined>) => {
    const sp = new URLSearchParams(Object.entries({ topic, track, ...p }).filter(([, v]) => v) as [string, string][]);
    return `/learn${sp.size ? `?${sp}` : ''}`;
  };
  const chip = (on: boolean) => `whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium ${on ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-700'}`;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Learn</h1>
      <p className="text-plum-500">Three minutes. One takeaway. One action.</p>
      <form className="mt-4">
        <input name="q" defaultValue={q} placeholder="Search lessons" aria-label="Search lessons" className="w-full rounded-input border border-pink-300 bg-white px-3 py-3" />
        {topic && <input type="hidden" name="topic" value={topic} />}{track && <input type="hidden" name="track" value={track} />}
      </form>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Life Track filter">
        <Link href={href({ track: undefined })} className={chip(!track)}>All tracks</Link>
        {(tracks ?? []).map((t) => <Link key={t.slug} href={href({ track: t.slug })} className={chip(track === t.slug)}>{t.name}</Link>)}
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1" aria-label="Topics">
        <Link href={href({ topic: undefined })} className={chip(!topic)}>All topics</Link>
        {TOPICS.map((t) => <Link key={t} href={href({ topic: t })} className={chip(topic === t)}>{t}</Link>)}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold">
        <Link href="/learn/glossary" className="rounded-card bg-lavender-100 p-3 text-lavender-600"><BookA className="mx-auto mb-1" size={20} />Money words</Link>
        <Link href="/learn/options" className="rounded-card bg-mint-100 p-3 text-mint-700"><Scale className="mx-auto mb-1" size={20} />Compare options</Link>
        <Link href="/learn/suggest" className="rounded-card bg-pink-100 p-3 text-pink-700"><Lightbulb className="mx-auto mb-1" size={20} />Suggest a topic</Link>
      </div>

      {courses.length === 0 ? (
        <p className="mt-8 text-plum-500">Nothing here yet. We are adding more lessons all the time. <Link href="/learn/suggest" className="text-pink-700 underline">Suggest a topic</Link></p>
      ) : (
        <ul className="mt-5 space-y-3">
          {courses.map((c: any) => {
            const minutes = Math.ceil((c.lessons ?? []).reduce((a: number, l: any) => a + (l.duration_sec ?? 180), 0) / 60);
            return (
              <li key={c.slug}>
                <Link href={`/learn/${c.slug}`} className="block rounded-card bg-white p-4 ring-1 ring-pink-100 hover:ring-pink-300">
                  <span className="text-xs font-semibold uppercase tracking-wide text-pink-700">{c.topic}</span>
                  <b className="mt-1 block font-display text-lg">{c.title}</b>
                  <span className="text-sm text-plum-500">{c.level} · {c.lessons?.length ?? 0} lessons · {minutes} min</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <footer className="mt-10 text-xs text-plum-500">Sisi provides financial education, not financial advice.</footer>
    </div>
  );
}
