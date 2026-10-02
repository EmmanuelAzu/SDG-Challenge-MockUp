import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { SuggestForm, VoteButton } from '@/components/suggest-form';

export const dynamic = 'force-dynamic';

export default async function Suggest() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from('topic_suggestions').select('id,body,votes').order('votes', { ascending: false }).limit(20);
  return (
    <div>
      <Link href="/learn" className="text-sm text-pink-700">← Learn</Link>
      <h1 className="mt-2 font-display text-3xl font-semibold">Suggest a topic</h1>
      <p className="text-plum-500">Tell us what would help you most. The most-voted topics get made first.</p>
      <SuggestForm />
      <ul className="mt-6 divide-y divide-pink-100 rounded-card bg-white ring-1 ring-pink-100">
        {(data ?? []).map((s) => <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm"><span>{s.body}</span><VoteButton id={s.id} votes={s.votes} /></li>)}
        {!data?.length && <li className="px-4 py-3 text-sm text-plum-500">No suggestions yet. Be the first.</li>}
      </ul>
    </div>
  );
}
