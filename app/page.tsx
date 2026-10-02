import Link from 'next/link';
import { Bloom } from '@/components/bloom';

const PATHWAYS = [
  { name: 'Money Milestones', blurb: 'Five small steps from first budget to wealth.', cls: 'bg-pink-100 text-pink-700' },
  { name: 'Money Buddy', blurb: 'Do it with a friend. Nudge, not nag.', cls: 'bg-lavender-100 text-lavender-600' },
  { name: 'Invest HER', blurb: 'Try investing with R200 a month, simulated.', cls: 'bg-mint-100 text-mint-700' },
];

export default function Landing() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center gap-2 font-display text-xl font-semibold text-pink-700">
        <Bloom progress={5} size={32} /> Sisi
      </div>
      <h1 className="mt-10 font-display text-4xl font-semibold leading-tight">Real skills. Bigger dreams.</h1>
      <p className="mt-2 font-display text-xl italic text-pink-700">Small steps. Big future.</p>
      <p className="mt-4 max-w-prose text-plum-500">
        Sisi is money confidence, together. Three-minute lessons, one small action, and friends who cheer you on.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/login" className="rounded-input bg-pink-600 px-5 py-3 font-semibold text-white hover:bg-pink-700">Start with Sisi</Link>
        <Link href="/demo" className="rounded-input border border-pink-300 px-5 py-3 font-semibold text-pink-700">Try a demo account</Link>
      </div>
      <ul className="mt-10 grid gap-3 sm:grid-cols-3">
        {PATHWAYS.map((p) => (
          <li key={p.name} className={`rounded-card p-4 ${p.cls}`}>
            <h2 className="font-display text-lg font-semibold">{p.name}</h2>
            <p className="mt-1 text-sm text-plum-900">{p.blurb}</p>
          </li>
        ))}
      </ul>
      <footer className="mt-12 text-xs text-plum-500">
        Powered by PPS Investments. Sisi provides financial education, not financial advice.
      </footer>
    </main>
  );
}
