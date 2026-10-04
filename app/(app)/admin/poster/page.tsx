'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { useApp } from '@/components/shell/app-context';
import { drawPoster } from '@/lib/poster';

export default function Poster() {
  const { w, me } = useApp();
  const [slug, setSlug] = useState('wits');
  const [busy, setBusy] = useState(true);
  const ref = useRef<HTMLCanvasElement>(null);
  const c = w.communities.find((x) => x.slug === slug) ?? w.communities[0];
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const url = `${origin}/join/${c.slug}`;
  const staff = me.role !== 'member';

  useEffect(() => {
    if (!staff || !ref.current) return;
    setBusy(true);
    drawPoster(ref.current, { name: c.name, url, display: url.replace(/^https?:\/\//, ''), body: 'Three-minute money lessons, a Circle of friends and badges to be proud of. Free to join.' }).finally(() => setBusy(false));
  }, [c.name, url, staff]);

  if (!staff) return <div><h1 className="font-display text-2xl font-semibold">Staff only</h1><Link href="/home" className="text-pink-700 underline">Back home</Link></div>;
  const download = () => ref.current?.toBlob((b) => { if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `sisi-poster-${c.slug}.png`; a.click(); URL.revokeObjectURL(a.href); }, 'image/png');
  return (
    <div>
      <Link href="/admin" className="text-sm text-pink-700 underline">Staff console</Link>
      <h1 className="font-display text-3xl font-semibold">O-Week QR poster</h1>
      <p className="text-sm text-plum-500">A4 at 150 dpi (1240 × 1754 px), made in your browser. Print it at 100% scale.</p>
      <label className="mt-4 block text-sm font-medium">Community
        <select value={c.slug} onChange={(e) => setSlug(e.target.value)} className="mt-1 w-full rounded-input border border-pink-300 bg-white px-3 py-3">{w.communities.map((x) => <option key={x.id} value={x.slug}>{x.name}</option>)}</select></label>
      <p className="mt-2 break-all text-xs text-plum-500">Links to: {url}</p>
      <button onClick={download} disabled={busy} className="mt-3 flex items-center gap-2 rounded-input bg-pink-600 px-5 py-3 font-semibold text-white disabled:opacity-50"><Download size={18} aria-hidden /> {busy ? 'Preparing…' : 'Download PNG'}</button>
      <canvas ref={ref} aria-label={`Poster preview for ${c.name}`} className="mt-4 w-full max-w-sm rounded-card shadow ring-1 ring-pink-100" />
    </div>
  );
}
