'use client';
import { useEffect } from 'react';
import { LogOut, Phone } from 'lucide-react';
import { SAFETY_DEFAULTS, SAFETY_GROUPS } from '@/lib/content/safety';
import { formatPhone } from '@/lib/engine/help';
import { useWorld } from '@/lib/world/hooks';

const EXIT_URL = 'https://www.google.com/';
const quickExit = () => window.location.replace(EXIT_URL); // replaces this page in history

export default function Support() {
  const w = useWorld();
  const resources = w?.safety ?? SAFETY_DEFAULTS;
  useEffect(() => {
    let last = 0;
    const onKey = (e: KeyboardEvent) => { if (e.key !== 'Escape') return; if (Date.now() - last < 800) quickExit(); last = Date.now(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const anyUnverified = resources.some((r) => !r.verified);
  return (
    <main className="mx-auto max-w-md px-4 py-6 pb-24">
      <button onClick={quickExit} className="fixed right-3 top-3 z-50 flex items-center gap-1 rounded-full bg-plum-900 px-4 py-2 text-sm font-semibold text-white shadow-lg"><LogOut size={16} aria-hidden /> Quick exit</button>
      <h1 className="mt-8 font-display text-3xl font-semibold">Support</h1>
      <p className="mt-1 text-plum-500">You are not alone, and this page is private. Nothing here is tracked or shared. Press Quick exit (or Esc twice) to leave straight away.</p>
      {anyUnverified && <p role="note" className="mt-4 rounded-input bg-gold-100 p-3 text-sm" data-testid="unverified-note">Some numbers below are still waiting to be checked by the Sisi team. If a call does not connect, try another line or your campus.</p>}
      {SAFETY_GROUPS.map((g) => { const items = resources.filter((r) => r.group === g.id); if (!items.length) return null; return (
        <section key={g.id} className="mt-6">
          <h2 className={`font-display text-lg font-semibold ${g.id === 'emergency' ? 'text-coral-600' : ''}`}>{g.title}</h2>
          <ul className="mt-2 space-y-2">
            {items.map((r) => (
              <li key={r.id} className="rounded-card bg-white p-4 ring-1 ring-pink-100">
                <div className="flex items-start justify-between gap-2"><b>{r.name}</b>{!r.verified && <span className="shrink-0 rounded-full bg-gold-100 px-2 py-0.5 text-xs font-semibold">Unverified</span>}</div>
                <p className="text-sm text-plum-500">{r.description}</p>
                <p className="mt-1 text-xs text-plum-500">{r.hours}</p>
                {r.phone ? <a href={`tel:${r.phone}`} className="mt-2 inline-flex items-center gap-2 rounded-input bg-pink-600 px-4 py-2 font-semibold text-white"><Phone size={16} aria-hidden /> Call {formatPhone(r.phone)}</a> : <p className="mt-2 text-sm font-medium">Ask your campus for this number.</p>}
              </li>
            ))}
          </ul>
        </section>); })}
      <p className="mt-8 text-xs text-plum-500">Sisi is education, not a crisis service. In an emergency, call 112 or 10111.</p>
    </main>
  );
}
