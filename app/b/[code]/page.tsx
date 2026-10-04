import type { Metadata } from 'next';
import Link from 'next/link';
import { BadgeArt } from '@/components/badge-art';
import { badgeBySlug } from '@/lib/content/index';
import { decodePayload } from '@/lib/share';

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const p = decodePayload(code);
  const b = p && badgeBySlug(p.s);
  if (!p || !b) return { title: 'Badge not found', robots: { index: false } };
  const title = `${p.w} earned the ${b.name} badge on Sisi`;
  const images = [`/api/og/badge/${code}`];
  return { title, description: b.meaning, openGraph: { title, description: b.meaning, images }, twitter: { card: 'summary_large_image', title, images } };
}

/** Public, stateless badge page: all the data comes from the link itself. */
export default async function BadgePage({ params }: Props) {
  const { code } = await params;
  const p = decodePayload(code);
  const b = p && badgeBySlug(p.s);
  if (!p || !b) {
    return (
      <main className="mx-auto max-w-sm px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">This badge link isn’t valid</h1>
        <Link href="/" className="mt-6 inline-block text-pink-700 underline">Meet Sisi</Link>
      </main>
    );
  }
  return (
    <main className="mx-auto flex max-w-sm flex-col items-center px-4 py-12 text-center">
      <BadgeArt slug={b.slug} rarity={b.rarity} size={200} />
      <p className="mt-6 font-display italic text-pink-700">{p.w} earned</p>
      <h1 className="font-display text-4xl font-semibold">{b.name}</h1>
      <p className="mt-2 text-plum-500">{b.meaning}</p>
      <Link href={`/login?mode=up${p.r ? `&ref=${p.r}` : ''}`} className="mt-8 rounded-input bg-pink-600 px-6 py-3 font-semibold text-white hover:bg-pink-700">Join Sisi</Link>
      <p className="mt-6 text-xs text-plum-500">Sisi — money confidence, together. Education, not financial advice.</p>
    </main>
  );
}
