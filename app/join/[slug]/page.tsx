'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Bloom } from '@/components/bloom';
import { useWorld } from '@/lib/world/hooks';

export default function Join() {
  const { slug } = useParams<{ slug: string }>();
  const w = useWorld();
  if (!w) return <main className="mx-auto max-w-sm px-4 py-12" aria-busy="true"><div className="h-40 animate-pulse rounded-card bg-pink-100" /></main>;
  const c = w.communities.find((x) => x.slug === slug);
  if (!c) return <main className="mx-auto max-w-sm px-4 py-12 text-center"><h1 className="font-display text-2xl font-semibold">We can’t find that community</h1><Link href="/" className="mt-4 inline-block text-pink-700 underline">Meet Sisi</Link></main>;
  return (
    <main className="mx-auto max-w-sm px-4 py-12 text-center">
      <div className="flex justify-center"><Bloom progress={5} size={120} /></div>
      <h1 className="mt-6 font-display text-3xl font-semibold">Welcome, {c.name}</h1>
      <p className="mt-1 font-display italic text-pink-700">Small steps. Big future.</p>
      <p className="mt-3 text-plum-500">Sisi is money confidence, together. Three-minute lessons, a Circle of friends, and badges you can be proud of.</p>
      <Link href={`/login?community=${slug}&mode=up`} className="mt-8 block rounded-input bg-pink-600 py-3 font-semibold text-white hover:bg-pink-700">Join {c.name} on Sisi</Link>
      <Link href={`/login?community=${slug}`} className="mt-3 block text-sm font-medium text-pink-700">I already have an account</Link>
      <p className="mt-8 text-xs text-plum-500">Powered by PPS Investments. Education, not financial advice.</p>
    </main>
  );
}
