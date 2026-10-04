'use client';
import { useEffect, useState } from 'react';
import { applyUpdate, pendingUpdate } from '@/lib/engine/pilot';
import { useSessionId, useWorld } from '@/lib/world/hooks';
import { update } from '@/lib/world/store';

/** Watches what the tester does and records chapter progress the moment the real action happens. */
export function usePilotSync() {
  const w = useWorld();
  const sid = useSessionId();
  useEffect(() => {
    if (!w || !sid) return;
    if (pendingUpdate(w, sid)) update((x, now) => applyUpdate(x, sid, now));
  }, [w, sid]);
}

export function useTick(ms = 1000) {
  const [t, setT] = useState(() => Date.now());
  useEffect(() => { const i = window.setInterval(() => setT(Date.now()), ms); return () => window.clearInterval(i); }, [ms]);
  return t;
}
