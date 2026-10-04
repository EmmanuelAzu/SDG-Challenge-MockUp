'use client';
import { useCallback, useSyncExternalStore } from 'react';
import { getSession, getWorld, subscribe, update } from './store';
import type { User, World } from './types';

const serverSnapshot = () => null;

/** The world (null until the client has loaded it). */
export function useWorld(): World | null {
  return useSyncExternalStore(subscribe, getWorld, serverSnapshot);
}

/** Id of the user signed in on this tab. */
export function useSessionId(): string | null {
  return useSyncExternalStore(subscribe, getSession, serverSnapshot);
}

export function useMe(): { w: World; me: User } | null {
  const w = useWorld();
  const id = useSessionId();
  const me = w && id ? w.users[id] : undefined;
  return w && me ? { w, me } : null;
}

/** Runs a world mutation as the signed-in user: `act((w, now, me) => completeLesson(w, me, id, now))`. */
export function useAct() {
  const id = useSessionId();
  return useCallback(<T,>(fn: (w: World, now: Date, meId: string) => T): T => update((w, now) => fn(w, now, id!)), [id]);
}
