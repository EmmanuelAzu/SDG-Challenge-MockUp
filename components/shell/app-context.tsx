'use client';
import { createContext, useContext } from 'react';
import type { User, World } from '@/lib/world/types';

type Ctx = { w: World; me: User; now: Date };
export const AppContext = createContext<Ctx | null>(null);

/** The signed-in user, the world and the demo-clock "now". Only valid inside the app shell, which guarantees them. */
export function useApp(): Ctx {
  const c = useContext(AppContext);
  if (!c) throw new Error('useApp must be used inside the app shell');
  return c;
}
