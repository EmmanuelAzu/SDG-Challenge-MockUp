'use client';
import { useEffect, useState } from 'react';
import { applyDetections, detectable } from '@/lib/engine/pilot';
import { useSessionId, useWorld } from '@/lib/world/hooks';
import { update } from '@/lib/world/store';

/** Watches what the tester does and marks missions done the moment the real action happens. */
export function usePilotDetection() {
  const w = useWorld();
  const sid = useSessionId();
  useEffect(() => {
    if (!w || !sid) return;
    if (detectable(w, sid).length) update((x, now) => applyDetections(x, sid, now));
  }, [w, sid]);
}

/** A ticking clock for elapsed-time displays (real time, not the demo clock). */
export function useTick(ms = 1000) {
  const [t, setT] = useState(() => Date.now());
  useEffect(() => { const i = window.setInterval(() => setT(Date.now()), ms); return () => window.clearInterval(i); }, [ms]);
  return t;
}

export const mmss = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
