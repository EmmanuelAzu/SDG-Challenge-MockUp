'use client';
import { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useCelebrate } from '@/components/celebration/provider';
import { useApp } from '@/components/shell/app-context';
import { recordLookup } from '@/lib/engine/actions';
import { glossaryBySlug } from '@/lib/content';
import { update } from '@/lib/world/store';

/** A tappable jargon term (dotted underline) that opens a plain-language definition sheet. */
export function GlossaryTerm({ slug, children }: { slug: string; children: React.ReactNode }) {
  const { me } = useApp();
  const celebrate = useCelebrate();
  const [open, setOpen] = useState(false);
  const g = glossaryBySlug(slug);
  if (!g) return <>{children}</>;
  return (
    <>
      <button type="button" onClick={() => { setOpen(true); celebrate(update((x, n) => recordLookup(x, me.id, slug, n))); }} aria-label={`${g.term}: tap for a plain definition`} className="border-b-2 border-dotted border-pink-600 font-medium text-pink-700">{children}</button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label={`Definition of ${g.term}`} className="fixed inset-0 z-40 flex items-end bg-plum-900/40" onClick={() => setOpen(false)}>
          <div className="w-full rounded-t-card bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h2 className="font-display text-xl font-semibold">{g.term}</h2><button onClick={() => setOpen(false)} aria-label="Close"><X /></button></div>
            <p className="mt-2">{g.definition}</p>
            <p className="mt-3 rounded-input bg-pink-50 p-3 text-sm"><b>What this means for your money:</b> {g.example}</p>
            <Link href="/learn/glossary" className="mt-3 inline-block text-sm font-semibold text-pink-700 underline">Browse all money words</Link>
          </div>
        </div>
      )}
    </>
  );
}
