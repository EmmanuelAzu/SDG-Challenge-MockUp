'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { BadgeArt } from '@/components/badge-art';
import { ShareSheet } from '@/components/celebration/share-sheet';
import { useMe } from '@/lib/world/hooks';
import type { Earned, EarnedBadge } from '@/lib/world/types';

type Ctx = { celebrate: (e: Pick<Earned, 'badges' | 'milestones'>) => void };
const CelebrationContext = createContext<Ctx>({ celebrate: () => {} });
export const useCelebrate = () => useContext(CelebrationContext).celebrate;

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const ctx = useMe();
  const focus = !!ctx?.me.focusMode;
  const [queue, setQueue] = useState<EarnedBadge[]>([]);
  const [milestones, setMilestones] = useState<string[]>([]);
  const [sharing, setSharing] = useState(false);
  const [toast, setToast] = useState('');
  const fired = useRef<string | null>(null);

  const celebrate = useCallback((e: Pick<Earned, 'badges' | 'milestones'>) => {
    if (!e.badges.length && !e.milestones.length) return;
    if (focus) {
      // Focus mode: no full-screen celebration, just a quiet note.
      setToast(e.badges.length ? `Badge earned: ${e.badges.map((b) => b.name).join(', ')}` : `${e.milestones[0]} complete`);
      setTimeout(() => setToast(''), 4000);
      return;
    }
    setQueue((q) => [...q, ...e.badges]);
    setMilestones((m) => [...m, ...e.milestones]);
  }, [focus]);

  const current = queue[0];
  const currentId = current?.id;
  useEffect(() => {
    if (!currentId || fired.current === currentId) return;
    fired.current = currentId;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    import('canvas-confetti').then(({ default: fire }) => fire({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#D81B60', '#F48FB1', '#F2B33D', '#FCE4EF'] }));
  }, [currentId]);

  const dismiss = () => {
    setSharing(false);
    setQueue((q) => q.slice(1));
    if (queue.length <= 1) setMilestones([]);
  };

  return (
    <CelebrationContext.Provider value={{ celebrate }}>
      {children}
      {toast && <p role="status" className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-sm rounded-input bg-plum-900 px-4 py-3 text-center text-sm text-white">{toast}</p>}
      {current && (
        <div role="dialog" aria-modal="true" aria-label={`Badge earned: ${current.name}`} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-pink-50 p-6 text-center">
          {sharing ? (
            <ShareSheet badge={current} onClose={dismiss} />
          ) : (
            <>
              <p className="font-display text-lg italic text-pink-700">You earned a badge</p>
              <div className="my-6 animate-[pop_0.5s_ease-out]"><BadgeArt slug={current.slug} rarity={current.rarity} size={180} /></div>
              <h2 className="font-display text-3xl font-semibold">{current.name}</h2>
              <p className="mt-1 text-plum-500">{current.meaning}</p>
              {milestones.length > 0 && <p className="mt-3 rounded-full bg-pink-100 px-3 py-1 text-sm font-semibold text-pink-700">A petal blooms: {milestones[0]} complete</p>}
              <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
                <button onClick={() => setSharing(true)} className="rounded-input bg-pink-600 py-3 font-semibold text-white hover:bg-pink-700">Share badge</button>
                <button onClick={dismiss} className="rounded-input py-3 font-semibold text-pink-700">Later</button>
              </div>
            </>
          )}
          <style>{`@keyframes pop{0%{transform:scale(.4);opacity:0}70%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}`}</style>
        </div>
      )}
    </CelebrationContext.Provider>
  );
}
