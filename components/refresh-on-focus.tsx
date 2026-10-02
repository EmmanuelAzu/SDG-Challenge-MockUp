'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Leaderboards recompute on window focus (no realtime). */
export function RefreshOnFocus() {
  const router = useRouter();
  useEffect(() => {
    const on = () => document.visibilityState === 'visible' && router.refresh();
    window.addEventListener('focus', on);
    document.addEventListener('visibilitychange', on);
    return () => { window.removeEventListener('focus', on); document.removeEventListener('visibilitychange', on); };
  }, [router]);
  return null;
}
