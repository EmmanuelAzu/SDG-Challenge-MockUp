'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FlaskConical, X } from 'lucide-react';
import { PERSONAS } from '@/lib/world/seed';
import { reset, setSession, update } from '@/lib/world/store';
import { useSessionId, useWorld } from '@/lib/world/hooks';

const HOUR = 3600_000;

export function DemoTools() {
  const router = useRouter();
  const w = useWorld();
  const sid = useSessionId();
  const [open, setOpen] = useState(false);
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'false' || !w) return null;

  const now = new Date(Date.now() + w.clockOffsetMs);
  const jump = (ms: number) => update((x) => { x.clockOffsetMs += ms; });
  const toNextFirst = () => {
    const t = new Date(now);
    const target = Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 1, 0, 5) - 2 * HOUR; // 00:05 SAST on the 1st
    update((x) => { x.clockOffsetMs += target - now.getTime(); });
  };
  const go = (id: string) => { setSession(id); router.push(w.users[id].onboardedAt ? '/home' : '/onboarding'); setOpen(false); };
  const btn = 'rounded-input bg-pink-100 px-2 py-1.5 text-xs font-semibold text-pink-700 hover:bg-pink-300/40';

  return (
    <>
      <button onClick={() => setOpen(!open)} aria-label="Demo tools" className="fixed bottom-20 left-3 z-30 rounded-full bg-plum-900 p-2.5 text-white shadow-lg md:bottom-6"><FlaskConical size={18} /></button>
      {open && (
        <div role="dialog" aria-label="Demo tools" className="fixed bottom-32 left-3 z-40 w-72 rounded-card bg-white p-4 text-sm shadow-xl ring-1 ring-pink-100 md:bottom-16">
          <div className="flex items-center justify-between"><b className="font-display text-base">Demo tools</b><button onClick={() => setOpen(false)} aria-label="Close"><X size={16} /></button></div>
          <p className="mt-2 text-xs text-plum-500">Mock world stored in this browser. Each tab can be a different person.</p>

          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-plum-500">Switch persona (this tab)</p>
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            {PERSONAS.map((p) => <button key={p.id} onClick={() => go(p.id)} aria-pressed={sid === p.id} className={`${btn} ${sid === p.id ? 'ring-2 ring-pink-600' : ''}`}>{p.label}<span className="block text-[10px] font-normal text-plum-500">{p.blurb}</span></button>)}
          </div>

          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-plum-500">Demo clock</p>
          <p className="text-xs">{new Intl.DateTimeFormat('en-ZA', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Africa/Johannesburg' }).format(now)} SAST</p>
          <div className="mt-1 grid grid-cols-3 gap-1.5">
            <button onClick={() => jump(24 * HOUR)} className={btn}>+1 day</button>
            <button onClick={() => jump(7 * 24 * HOUR)} className={btn}>+1 week</button>
            <button onClick={toNextFirst} className={btn}>Next 1st</button>
            <button onClick={() => update((x) => { x.clockOffsetMs = 0; })} className={`${btn} col-span-3`}>Back to real time</button>
          </div>

          <button onClick={() => { if (window.confirm('Reset the whole mock world to its starting state?')) { reset(); setSession(null); router.push('/demo'); setOpen(false); } }} className="mt-3 w-full rounded-input border border-coral-600 py-1.5 text-xs font-semibold text-coral-600">Reset mock world</button>
        </div>
      )}
    </>
  );
}
