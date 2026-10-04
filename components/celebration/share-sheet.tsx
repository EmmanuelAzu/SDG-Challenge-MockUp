'use client';
import { useState } from 'react';
import { Briefcase, Camera, Copy, Download, MessageCircle, Share2, X } from 'lucide-react';
import { useAct, useMe } from '@/lib/world/hooks';
import { createShare } from '@/lib/engine/actions';
import { encodePayload } from '@/lib/share';
import { firstName } from '@/lib/engine/helpers';
import type { EarnedBadge } from '@/lib/world/types';

/** Builds a stateless share link: the card's data lives in the URL, so it opens on any device. */
export function ShareSheet({ badge, onClose }: { badge: Pick<EarnedBadge, 'id' | 'slug' | 'name' | 'meaning'>; onClose: () => void }) {
  const ctx = useMe();
  const act = useAct();
  const [toast, setToast] = useState('');
  if (!ctx) return null;
  const { w, me } = ctx;
  const earned = w.userBadges.find((b) => b.id === badge.id)?.earnedAt ?? new Date().toISOString();
  const who = me.shareNameMode === 'nickname' && me.nickname ? me.nickname : firstName(me.displayName);
  const payload = encodePayload({ s: badge.slug, w: who, d: earned, r: me.referralCode });

  const ensure = () => { act((x, now, id) => createShare(x, id, badge.id, now)); return payload; };
  const url = () => `${window.location.origin}/b/${ensure()}`;
  const text = () => `I just earned the ${badge.name} badge on Sisi. ${badge.meaning}. ${url()}`;
  const open = (href: string) => window.open(href, '_blank', 'noopener');
  const download = (blob: Blob, name: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href); };

  async function story() {
    ensure();
    const blob = await (await fetch(`/api/og/badge/${payload}?format=story`)).blob();
    const file = new File([blob], `sisi-${badge.slug}.png`, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], text: text() }); } catch { /* cancelled */ } return; }
    download(blob, file.name);
    setToast('Saved. Add it to your Story from Instagram.');
  }
  async function image() { ensure(); download(await (await fetch(`/api/og/badge/${payload}`)).blob(), `sisi-${badge.slug}.png`); }
  async function copy() { await navigator.clipboard.writeText(url()); setToast('Link copied'); }

  const btn = 'flex items-center gap-3 rounded-input bg-white p-3 text-left font-medium ring-1 ring-pink-100 hover:ring-pink-300';
  return (
    <div className="w-full max-w-xs text-left">
      <div className="flex items-center justify-between"><h2 className="font-display text-2xl font-semibold">Share badge</h2><button onClick={onClose} aria-label="Close"><X /></button></div>
      <div className="mt-4 grid gap-2">
        <button className={btn} onClick={() => open(`https://wa.me/?text=${encodeURIComponent(text())}`)}><MessageCircle size={20} /> WhatsApp</button>
        <button className={btn} onClick={story}><Camera size={20} /> Instagram Story</button>
        <button className={btn} onClick={() => open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url())}`)}><Briefcase size={20} /> LinkedIn</button>
        <button className={btn} onClick={() => open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text())}`)}><Share2 size={20} /> X</button>
        <button className={btn} onClick={copy}><Copy size={20} /> Copy link</button>
        <button className={btn} onClick={image}><Download size={20} /> Download image</button>
      </div>
      <p className="mt-3 text-xs text-plum-500">Shows {who} and the badge. Never money. Sharing earns no points.</p>
      {toast && <p role="status" className="mt-2 text-sm text-pink-700">{toast}</p>}
    </div>
  );
}
