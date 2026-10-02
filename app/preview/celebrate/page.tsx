'use client';
import { useEffect } from 'react';
import { notFound } from 'next/navigation';
import { useCelebrate } from '@/components/celebration/provider';

/** Design-review helper: shows the badge-earned moment. Only available with SISI_PREVIEW=1. */
export default function Preview() {
  if (process.env.NODE_ENV === 'production') notFound();
  const celebrate = useCelebrate();
  useEffect(() => {
    celebrate({ badges: [{ id: 'ub9', slug: 'budget-builder', name: 'Budget Builder', meaning_line: 'Built my first budget', rarity: 'common' }], milestones: ['First budget'] });
  }, [celebrate]);
  return <main className="p-6 text-plum-500">Celebration preview</main>;
}
