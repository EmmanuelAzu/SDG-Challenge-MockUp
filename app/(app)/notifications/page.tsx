'use client';
import Link from 'next/link';
import { useApp } from '@/components/shell/app-context';
import { update } from '@/lib/world/store';

export default function Notifications() {
  const { w, me } = useApp();
  const mine = w.notifications.filter((n) => n.userId === me.id).sort((a, b) => b.at.localeCompare(a.at));
  const read = (id: string) => update((x) => { const n = x.notifications.find((y) => y.id === id); if (n) n.read = true; });
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">Notifications</h1>
        {mine.some((n) => !n.read) && <button onClick={() => update((x) => x.notifications.forEach((n) => { if (n.userId === me.id) n.read = true; }))} className="text-sm font-semibold text-pink-700">Mark all read</button>}
      </div>
      <ul className="mt-4 space-y-2">
        {mine.map((n) => (
          <li key={n.id}>
            <Link href={n.href || '/home'} onClick={() => read(n.id)} className={`block rounded-card p-4 ring-1 ${n.read ? 'bg-white ring-pink-100' : 'bg-pink-50 ring-pink-300'}`}>
              <b className="block">{n.title}</b><span className="text-sm text-plum-500">{n.body}</span>
              <span className="mt-1 block text-xs text-plum-500">{new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Johannesburg' }).format(new Date(n.at))}</span>
            </Link>
          </li>
        ))}
        {!mine.length && <li className="rounded-card bg-white p-6 text-center text-plum-500 ring-1 ring-pink-100">Nothing yet. Reminders, bookings and friend news will show up here.</li>}
      </ul>
    </div>
  );
}
