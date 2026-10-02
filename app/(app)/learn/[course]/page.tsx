import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check } from 'lucide-react';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function CoursePage({ params }: { params: Promise<{ course: string }> }) {
  const { course } = await params;
  const { supabase, user } = await requireUser();
  const { data: c } = await supabase.from('courses').select('title,topic,lessons(id,slug,title,duration_sec,sort)').eq('slug', course).single();
  if (!c) notFound();
  const { data: lp } = await supabase.from('lesson_progress').select('lesson_id,status').eq('user_id', user.id);
  const status = new Map((lp ?? []).map((r) => [r.lesson_id, r.status]));
  const lessons = [...(c.lessons ?? [])].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  return (
    <div>
      <Link href="/learn" className="text-sm text-pink-700">← All lessons</Link>
      <h1 className="mt-2 font-display text-3xl font-semibold">{c.title}</h1>
      <ol className="mt-5 space-y-3">
        {lessons.map((l, i) => (
          <li key={l.id}>
            <Link href={`/learn/${course}/${l.slug}`} className="flex items-center gap-3 rounded-card bg-white p-4 ring-1 ring-pink-100 hover:ring-pink-300">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${status.get(l.id) === 'passed' ? 'bg-mint-700 text-white' : 'bg-pink-100 text-pink-700'}`}>
                {status.get(l.id) === 'passed' ? <Check size={16} aria-label="Done" /> : i + 1}
              </span>
              <span><b className="block">{l.title}</b><span className="text-sm text-plum-500">{Math.ceil((l.duration_sec ?? 180) / 60)} min</span></span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
