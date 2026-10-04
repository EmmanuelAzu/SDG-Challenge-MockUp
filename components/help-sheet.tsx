'use client';
import { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, X } from 'lucide-react';
import { useRaised } from '@/components/shell/use-raised';

export function HelpSheet() {
  const [open, setOpen] = useState(false);
  const raised = useRaised();
  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Help" className={`fixed right-4 z-30 rounded-full bg-pink-600 p-3 text-white shadow-lg md:bottom-6 ${raised ? 'bottom-44' : 'bottom-20'}`}>
        <HelpCircle size={24} />
      </button>
      {open && (
        <div role="dialog" aria-label="Help" className="fixed inset-0 z-40 flex items-end bg-plum-900/40" onClick={() => setOpen(false)}>
          <div className="w-full rounded-t-card bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">How can we help?</h2>
              <button onClick={() => setOpen(false)} aria-label="Close"><X /></button>
            </div>
            <ul className="mt-4 space-y-2">
              <li><Link href="/help/talk" className="block rounded-input bg-pink-100 p-3 font-medium">Talk to someone</Link></li>
              <li><Link replace href="/help/support" className="block rounded-input bg-pink-100 p-3 font-medium">Support</Link></li>
              <li><Link href="/help/faq" className="block rounded-input bg-pink-100 p-3 font-medium">FAQ</Link></li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
