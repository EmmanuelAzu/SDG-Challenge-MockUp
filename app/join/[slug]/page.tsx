import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Bloom } from '@/components/bloom';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function Join({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: c } = await supabase.from('communities').select('name,description').eq('slug', slug).maybeSingle();
  if (!c) notFound();
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
