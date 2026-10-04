'use client';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { Check } from 'lucide-react';
import { useApp } from '@/components/shell/app-context';
import { COURSES, courseLessons } from '@/lib/content';

export default function CoursePage() {
  const { course } = useParams<{ course: string }>();
  const { w, me } = useApp();
  const c = COURSES.find((x) => x.slug === course);
  if (!c) notFound();
  return (
    <div>
      <Link href="/learn" className="text-sm text-pink-700">← All lessons</Link>
      <h1 className="mt-2 font-display text-3xl font-semibold">{c.title}</h1>
      <ol className="mt-5 space-y-3">
        {courseLessons(c.slug).map((l, i) => {
          const passed = w.lessonProgress[`${me.id}:${l.id}`]?.status === 'passed';
          return (
            <li key={l.id}><Link href={`/learn/${c.slug}/${l.slug}`} className="flex items-center gap-3 rounded-card bg-white p-4 ring-1 ring-pink-100 hover:ring-pink-300">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${passed ? 'bg-mint-700 text-white' : 'bg-pink-100 text-pink-700'}`}>{passed ? <Check size={16} aria-label="Done" /> : i + 1}</span>
              <span><b className="block">{l.title}</b><span className="text-sm text-plum-500">{Math.ceil(l.durationSec / 60)} min</span></span>
            </Link></li>
          );
        })}
      </ol>
    </div>
  );
}
