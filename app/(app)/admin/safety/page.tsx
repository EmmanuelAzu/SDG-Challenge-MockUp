'use client';
import Link from 'next/link';
import { useApp } from '@/components/shell/app-context';
import { canEditSafety, updateResource } from '@/lib/engine/help';
import { update } from '@/lib/world/store';

export default function AdminSafety() {
  const { w, me } = useApp();
  if (!canEditSafety(w, me.id)) return <div><h1 className="font-display text-2xl font-semibold">PPS admins only</h1><Link href="/admin" className="text-pink-700 underline">Back</Link></div>;
  const field = (id: string, k: 'name' | 'description' | 'phone' | 'hours', v: string) => update((x) => updateResource(x, me.id, id, { [k]: v }));
  const input = 'w-full rounded-input border border-pink-300 px-3 py-1.5 text-sm';
  return (
    <div>
      <Link href="/admin" className="text-sm text-pink-700 underline">Staff console</Link>
      <h1 className="font-display text-3xl font-semibold">Safety resources</h1>
      <p className="text-sm text-plum-500">Call each number before ticking “verified”. Unverified numbers show a visible flag on the Support page.</p>
      <ul className="mt-4 space-y-3">
        {w.safety.map((r) => (
          <li key={r.id} className="space-y-2 rounded-card bg-white p-4 ring-1 ring-pink-100" data-testid="resource">
            <input aria-label={`${r.name} name`} defaultValue={r.name} onBlur={(e) => field(r.id, 'name', e.target.value)} className={`${input} font-semibold`} />
            <input aria-label={`${r.name} description`} defaultValue={r.description} onBlur={(e) => field(r.id, 'description', e.target.value)} className={input} />
            <div className="flex gap-2">
              <input aria-label={`${r.name} phone`} inputMode="tel" defaultValue={r.phone} onBlur={(e) => field(r.id, 'phone', e.target.value)} className={input} placeholder="Phone digits" />
              <input aria-label={`${r.name} hours`} defaultValue={r.hours} onBlur={(e) => field(r.id, 'hours', e.target.value)} className={input} />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={r.verified} onChange={(e) => update((x) => updateResource(x, me.id, r.id, { verified: e.target.checked }))} /> Verified by the team</label>
          </li>
        ))}
      </ul>
    </div>
  );
}
