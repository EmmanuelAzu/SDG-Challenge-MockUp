'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { FAQ } from '@/lib/content/faq';

export default function FaqPage() {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const list = term ? FAQ.filter((f) => (f.q + ' ' + f.a).toLowerCase().includes(term)) : FAQ;
  const groups = [...new Set(list.map((f) => f.group))];
  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="font-display text-3xl font-semibold">FAQ</h1>
      <label className="mt-4 flex items-center gap-2 rounded-input border border-pink-300 bg-white px-3"><Search size={18} aria-hidden className="text-plum-500" />
        <input aria-label="Search the FAQ" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search questions" className="w-full bg-transparent py-3" /></label>
      {!list.length && <p className="mt-6 text-plum-500">No match. Try another word, or <Link href="/help/talk" className="font-semibold text-pink-700 underline">ask a person</Link>.</p>}
      {groups.map((g) => (
        <section key={g} className="mt-6">
          <h2 className="font-display text-lg font-semibold">{g}</h2>
          <div className="mt-2 divide-y divide-pink-100 rounded-card bg-white ring-1 ring-pink-100">
            {list.filter((f) => f.group === g).map((f) => (
              <details key={f.id} className="group px-4 py-3" open={!!term}>
                <summary className="cursor-pointer list-none font-medium marker:hidden">{f.q}</summary>
                <p className="mt-2 text-sm text-plum-500">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
      <p className="mt-8 text-sm text-plum-500">Still stuck? <Link href="/help/talk" className="font-semibold text-pink-700 underline">Talk to someone</Link>. Need support with something heavy? <Link replace href="/help/support" className="font-semibold text-pink-700 underline">Support</Link>.</p>
    </main>
  );
}
