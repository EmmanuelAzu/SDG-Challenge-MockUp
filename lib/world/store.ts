'use client';
import { buildWorld, WORLD_VERSION } from './seed';
import type { World } from './types';

const KEY = 'sisi.world.v2';
const SESSION = 'sisi.session';

let world: World | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function read(): World {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const w = JSON.parse(raw) as World;
      if (w.version === WORLD_VERSION) return w;
    }
  } catch { /* fall through to a fresh world */ }
  const fresh = buildWorld();
  try { localStorage.setItem(KEY, JSON.stringify(fresh)); } catch { /* storage full or blocked */ }
  return fresh;
}

/** The current world, or null on the server / before the first client read. */
export function getWorld(): World | null {
  if (typeof window === 'undefined') return null;
  return (world ??= read());
}

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(world)); } catch { /* quota: keep working in memory */ }
}

/** The only way to change the world. `fn` gets a private copy, so a throw leaves nothing half-written. */
export function update<T>(fn: (w: World, now: Date) => T): T {
  const current = getWorld()!;
  const draft = structuredClone(current);
  const result = fn(draft, new Date(Date.now() + draft.clockOffsetMs));
  world = draft;
  persist();
  emit();
  return result;
}

export function reset() {
  world = buildWorld();
  persist();
  emit();
}

export const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

if (typeof window !== 'undefined') {
  // another tab changed the world: reload it
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) { world = null; getWorld(); emit(); }
    if (e.key === null) { world = null; emit(); }
  });
}

// session = which user this tab is signed in as (per tab, so two tabs can be two people)
export const getSession = (): string | null => (typeof window === 'undefined' ? null : sessionStorage.getItem(SESSION));
export function setSession(id: string | null) {
  if (id) sessionStorage.setItem(SESSION, id); else sessionStorage.removeItem(SESSION);
  emit();
}
export const nowDate = () => new Date(Date.now() + (getWorld()?.clockOffsetMs ?? 0));
