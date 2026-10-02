'use client';
import { TERM_RE, slugify } from '@/lib/content/glossary';

/** Renders text with [[glossary terms]] as dotted-underline buttons (the jargon buster). */
export function RichText({ text, onTerm }: { text: string; onTerm: (slug: string, label: string) => void }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(TERM_RE)) {
    if (m.index! > last) parts.push(text.slice(last, m.index));
    const label = m[1];
    parts.push(
      <button key={m.index} type="button" onClick={() => onTerm(slugify(label), label)} className="border-b-2 border-dotted border-pink-600 font-medium text-pink-700" aria-label={`${label}: tap for a plain definition`}>
        {label}
      </button>,
    );
    last = m.index! + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
