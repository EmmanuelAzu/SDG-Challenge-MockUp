'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import QRCode from 'qrcode';
import { useApp } from '@/components/shell/app-context';
import { fmtDate, fmtTime } from '@/lib/format';

export default function Ticket() {
  const { id } = useParams<{ id: string }>();
  const { w, me } = useApp();
  const b = w.bookings.find((x) => x.id === id && x.userId === me.id);
  const [qr, setQr] = useState('');
  const code = b?.ticketCode;
  useEffect(() => { if (code) void QRCode.toDataURL(`SISI:${code}`, { margin: 1, width: 240, color: { dark: '#2A1433', light: '#FFFFFF' } }).then(setQr); }, [code]);
  if (!b) notFound();
  const e = w.events.find((x) => x.id === b.eventId)!;
  return (
    <div className="mx-auto max-w-sm">
      <Link href={`/events/${e.id}`} className="text-sm text-pink-700">← Event details</Link>
      <div className="mt-3 overflow-hidden rounded-card bg-white text-center shadow-sm ring-1 ring-pink-100">
        <div className="bg-pink-600 p-4 text-white"><p className="text-xs font-semibold uppercase tracking-wide opacity-80">{b.status === 'waitlisted' ? 'Waitlist' : b.status === 'checked_in' ? 'Checked in' : 'Your ticket'}</p><h1 className="font-display text-xl font-semibold">{e.title}</h1></div>
        <div className="p-5">
          {b.status === 'waitlisted' ? <p className="rounded-input bg-lavender-100 p-4 text-sm">You are #{b.waitlistPosition} on the waitlist. Your ticket appears here if a seat opens.</p>
            : <>{qr ? <img /* eslint-disable-line @next/next/no-img-element */ src={qr} alt={`QR code for ticket ${b.ticketCode}`} width={240} height={240} className="mx-auto" /> : <div className="mx-auto h-60 w-60 animate-pulse rounded bg-pink-100" />}<p className="mt-2 font-mono text-xl font-bold tracking-widest">{b.ticketCode}</p></>}
          <p className="mt-4 text-sm">{fmtDate(e.startsAt)}</p><p className="text-sm text-plum-500">{fmtTime(e.startsAt)} to {fmtTime(e.endsAt)} SAST</p><p className="text-sm text-plum-500">{e.location}</p>
          <p className="mt-3 text-xs text-plum-500">{me.displayName}</p>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-plum-500">Show this at the door, or read the code to the host. Free event, no payment needed.</p>
    </div>
  );
}
