'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMe, useSessionId, useWorld } from '@/lib/world/hooks';

/** Guard only (no navigation chrome): sends signed-out visitors to /login. */
export function SessionGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const w = useWorld();
  const sid = useSessionId();
  const ctx = useMe();
  useEffect(() => { if (w && (!sid || !w.users[sid])) router.replace('/login'); }, [w, sid, router]);
  return ctx ? <>{children}</> : <div className="min-h-screen p-6" aria-busy="true"><div className="mx-auto max-w-sm animate-pulse space-y-4"><div className="h-2 rounded bg-pink-100" /><div className="h-40 rounded-card bg-pink-100" /></div></div>;
}
