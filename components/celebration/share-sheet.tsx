'use client';
import { useState } from 'react';
import { Copy, Download, MessageCircle, Briefcase, Share2, Camera, X } from 'lucide-react';
import { createShare } from '@/app/(app)/rewards/actions';
import type { EarnedBadge } from '@/lib/gamification/evaluate';

export function ShareSheet({ badge, onClose }: { badge: Pick<EarnedBadge, 'id' | 'name' | 'meaning_line'>; onClose: () => void }) {
  const [code, setCode] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);

  async function ensure() {
    if (code) return code;
    setBusy(true);
    const res = await createShare(badge.id);
    setBusy(false);
    setCode(res.code);
    return res.code;
  }
  const url = (c: string) => `${window.location.origin}/b/${c}`;
  const text = (c: string) => `I just earned the ${badge.name} badge on Sisi. ${badge.meaning_line ?? ''} ${url(c)}`;
  const open = async (build: (c: string) => string) => window.open(build(await ensure()), '_blank', 'noopener');

  async function story() {
    const c = await ensure();
    const res = await fetch(`/api/og/badge/${c}?format=story`);
    const blob = await res.blob();
    const file = new File([blob], `sisi-${c}.png`, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], text: text(c) }); } catch { /* cancelled */ }
      return;
    }
    download(blob, file.name);
    setToast('Saved. Add it to your Story from Instagram.');
  }
  function download(blob: Blob, name: string) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  async function image() {
    const c = await ensure();
    download(await (await fetch(`/api/og/badge/${c}`)).blob(), `sisi-${c}.png`);
  }
  async function copy() {
    const c = await ensure();
    await navigator.clipboard.writeText(url(c));
    setToast('Link copied');
  }

  const btn = 'flex items-center gap-3 rounded-input bg-white p-3 text-left font-medium ring-1 ring-pink-100 hover:ring-pink-300 disabled:opacity-60';
  return (
    <div className="w-full max-w-xs text-left">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">Share badge</h2>
        <button onClick={onClose} aria-label="Close"><X /></button>
      </div>
      <div className="mt-4 grid gap-2">
        <button disabled={busy} className={btn} onClick={() => open((c) => `https://wa.me/?text=${encodeURIComponent(text(c))}`)}><MessageCircle size={20} /> WhatsApp</button>
        <button disabled={busy} className={btn} onClick={story}><Camera size={20} /> Instagram Story</button>
        <button disabled={busy} className={btn} onClick={() => open((c) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url(c))}`)}><Briefcase size={20} /> LinkedIn</button>
        <button disabled={busy} className={btn} onClick={() => open((c) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text(c))}`)}><Share2 size={20} /> X</button>
        <button disabled={busy} className={btn} onClick={copy}><Copy size={20} /> Copy link</button>
        <button disabled={busy} className={btn} onClick={image}><Download size={20} /> Download image</button>
      </div>
      {toast && <p role="status" className="mt-3 text-sm text-pink-700">{toast}</p>}
    </div>
  );
}
