import Link from 'next/link';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Glossary({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { supabase } = await requireUser();
  const { data } = await supabase.from('glossary_terms').select('slug,term,definition,money_example').order('term');
  const term = q?.trim().toLowerCase();
  const list = (data ?? []).filter((t) => !term || t.term.toLowerCase().includes(term) || t.definition.toLowerCase().includes(term));
  return (
    <div>
      <Link href="/learn" className="text-sm text-pink-700">← Learn</Link>
      <h1 className="mt-2 font-display text-3xl font-semibold">Money words, in plain language</h1>
      <form className="mt-4"><input name="q" defaultValue={q} placeholder="Search a term" aria-label="Search glossary" className="w-full rounded-input border border-pink-300 bg-white px-3 py-3" /></form>
      <dl className="mt-5 space-y-3">
        {list.map((t) => (
          <div key={t.slug} className="rounded-card bg-white p-4 ring-1 ring-pink-100">
            <dt className="font-display text-lg font-semibold">{t.term}</dt>
            <dd className="text-sm">{t.definition}</dd>
            <dd className="mt-2 rounded-input bg-pink-50 p-2 text-sm"><b>What this means for your money:</b> {t.money_example}</dd>
          </div>
        ))}
      </dl>
      {!list.length && <p className="mt-6 text-plum-500">No match. Try another word, or suggest a topic in Learn.</p>}
    </div>
  );
}
