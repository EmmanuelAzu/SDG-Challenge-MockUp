'use client';
import { useEffect, useRef, useState } from 'react';

/** Camera ticket scanner (html5-qrcode). Falls back gracefully when no camera is available. */
export function Scanner({ onCode }: { onCode: (code: string) => void }) {
  const [state, setState] = useState<'idle' | 'on' | 'error'>('idle');
  const ref = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const last = useRef('');

  async function start() {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const s = new Html5Qrcode('sisi-reader');
      ref.current = s as never;
      setState('on');
      await s.start({ facingMode: 'environment' }, { fps: 8, qrbox: 200 }, (text) => { if (text !== last.current) { last.current = text; onCode(text); setTimeout(() => { last.current = ''; }, 3000); } }, () => {});
    } catch { setState('error'); }
  }
  async function stop() { try { await ref.current?.stop(); ref.current?.clear(); } catch { /* already stopped */ } setState('idle'); }
  useEffect(() => () => { void ref.current?.stop().catch(() => {}); }, []);

  return (
    <div>
      <div id="sisi-reader" className={state === 'on' ? 'mt-2 overflow-hidden rounded-card' : 'hidden'} />
      {state !== 'on' ? <button onClick={start} className="mt-2 rounded-input border border-pink-300 px-4 py-2 text-sm font-semibold text-pink-700">Scan a ticket with the camera</button> : <button onClick={stop} className="mt-2 rounded-input border border-pink-300 px-4 py-2 text-sm font-semibold text-pink-700">Stop camera</button>}
      {state === 'error' && <p role="alert" className="mt-2 text-xs text-coral-600">No camera available here. Type the ticket code instead.</p>}
    </div>
  );
}
