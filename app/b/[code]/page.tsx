import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { BadgeArt } from '@/components/badge-art';

type Props = { params: Promise<{ code: string }>; searchParams: Promise<{ ref?: string }> };

async function load(code: string) {
  const db = await createClient();
  const { data } = await db.rpc('public_badge', { p_code: code });
  return data?.[0] as { badge_name: string; meaning_line: string; rarity: string; slug: string; earned_at: string; who: string } | undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const b = await load(code);
  if (!b) return { title: 'Badge no longer shared', robots: { index: false } };
  const title = `${b.who} earned the ${b.badge_name} badge on Sisi`;
  const images = [`/api/og/badge/${code}`];
  return { title, description: b.meaning_line, openGraph: { title, description: b.meaning_line, images }, twitter: { card: 'summary_large_image', title, images } };
}

export default async function BadgePage({ params, searchParams }: Props) {
  const { code } = await params;
  const { ref } = await searchParams;
  const b = await load(code);
  if (!b) {
    return (
      <main className="mx-auto max-w-sm px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">This badge is no longer shared</h1>
        <Link href="/" className="mt-6 inline-block text-pink-700 underline">Meet Sisi</Link>
      </main>
    );
  }
  return (
    <main className="mx-auto flex max-w-sm flex-col items-center px-4 py-12 text-center">
      <BadgeArt slug={b.slug} rarity={b.rarity} size={200} />
      <p className="mt-6 font-display italic text-pink-700">{b.who} earned</p>
      <h1 className="font-display text-4xl font-semibold">{b.badge_name}</h1>
      <p className="mt-2 text-plum-500">{b.meaning_line}</p>
      <Link href={`/login${ref ? `?ref=${ref}` : ''}`} className="mt-8 rounded-input bg-pink-600 px-6 py-3 font-semibold text-white hover:bg-pink-700">Join Sisi</Link>
      <p className="mt-6 text-xs text-plum-500">Sisi — money confidence, together. Education, not financial advice.</p>
    </main>
  );
}
