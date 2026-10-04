'use client';
import { useState } from 'react';
import Link from 'next/link';
import { GLOSSARY } from '@/lib/content';

export default function Glossary() {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const list = [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term)).filter((t) => !term || t.term.toLowerCase().includes(term) || t.definition.toLowerCase().includes(term));
  return (
    <div>
      <Link href="/learn" className="text-sm text-pink-700">← Learn</Link>
      <h1 className="mt-2 font-display text-3xl font-semibold">Money words, in plain language</h1>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a term" aria-label="Search glossary" className="mt-4 w-full rounded-input border border-pink-300 bg-white px-3 py-3" />
      <dl className="mt-5 space-y-3">
        {list.map((t) => (
          <div key={t.term} className="rounded-card bg-white p-4 ring-1 ring-pink-100">
            <dt className="font-display text-lg font-semibold">{t.term}</dt><dd className="text-sm">{t.definition}</dd>
            <dd className="mt-2 rounded-input bg-pink-50 p-2 text-sm"><b>What this means for your money:</b> {t.example}</dd>
          </div>
        ))}
      </dl>
      {!list.length && <p className="mt-6 text-plum-500">No match. Try another word, or suggest a topic in Learn.</p>}
    </div>
  );
}
