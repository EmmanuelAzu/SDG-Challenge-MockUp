import Link from 'next/link';
import { Check } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { getJourney } from '@/lib/journey';
import { Bloom } from '@/components/bloom';
import { BudgetBuilder, CashFlowCheck } from '@/components/budget-tools';

export const dynamic = 'force-dynamic';

export default async function Milestones() {
  const { supabase, user } = await requireUser();
  const j = await getJourney(supabase, user.id);
  return (
    <div>
      <div className="flex items-center gap-4">
        <Bloom progress={j.doneCount} size={90} />
        <div><h1 className="font-display text-3xl font-semibold">Money Milestones</h1><p className="text-plum-500">{j.doneCount} of 5 petals bloomed</p></div>
      </div>
      <ol className="mt-6 space-y-3">
        {j.milestones.map((m, i) => (
          <li key={m.id} className="rounded-card bg-white p-4 ring-1 ring-pink-100">
            <div className="flex items-center gap-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-full font-bold ${m.done ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-700'}`}>{m.done ? <Check size={18} aria-label="Done" /> : i + 1}</span>
              <div className="flex-1"><b className="font-display text-lg">{m.title}</b><p className="text-sm text-plum-500">{m.lessonsDone} of {m.lessonsTotal} lessons done</p></div>
              {!m.done && m.next && <Link href={m.next.href} className="rounded-full bg-pink-600 px-4 py-1.5 text-sm font-semibold text-white">{m.next.cta}</Link>}
            </div>
          </li>
        ))}
      </ol>
      <h2 className="mt-10 font-display text-xl font-semibold">Try the tools</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2"><CashFlowCheck /><BudgetBuilder /></div>
      <footer className="mt-10 text-xs text-plum-500">Sisi provides financial education, not financial advice.</footer>
    </div>
  );
}
