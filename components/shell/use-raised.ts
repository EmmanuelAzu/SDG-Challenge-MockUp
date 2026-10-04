'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/** True on chat screens, where the floating buttons must sit above the message box. */
export function useRaised(): boolean {
  const path = usePathname();
  const [raised, setRaised] = useState(false);
  useEffect(() => {
    const update = () => setRaised(path.endsWith('/chat') || new URLSearchParams(window.location.search).get('tab') === 'lounge');
    update();
    window.addEventListener('popstate', update);
    // in-app tab links change the query without a pathname change
    const t = window.setInterval(update, 500);
    return () => { window.removeEventListener('popstate', update); window.clearInterval(t); };
  }, [path]);
  return raised;
}
