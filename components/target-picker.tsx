'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setWeeklyTarget } from '@/app/(app)/profile/actions';

export function TargetPicker({ current }: { current: number }) {
  const router = useRouter();
  const [n, setN] = useState(current);
  const [pending, start] = useTransition();
  return (
    <div className="mt-3 flex items-center gap-2 text-sm">
      <span className="font-medium">My weekly target:</span>
      {[1, 2, 3].map((v) => (
        <button key={v} disabled={pending} aria-pressed={n === v} onClick={() => { setN(v); start(async () => { await setWeeklyTarget(v); router.refresh(); }); }} className={`h-9 w-9 rounded-full border font-semibold ${n === v ? 'border-pink-600 bg-pink-600 text-white' : 'border-pink-300 bg-white'}`}>{v}</button>
      ))}
      <span className="text-plum-500">days a week</span>
    </div>
  );
}
