'use client';
import { useRouter } from 'next/navigation';
import { DEMO_PASSWORD, PERSONAS } from '@/lib/world/seed';
import { getWorld, setSession } from '@/lib/world/store';

export default function Demo() {
  const router = useRouter();
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'false') return null;
  const go = (id: string) => { setSession(id); router.replace(getWorld()!.users[id].onboardedAt ? '/home' : '/onboarding'); };
  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <h1 className="font-display text-3xl font-semibold">Demo logins</h1>
      <p className="mt-1 text-sm text-plum-500">One tap to sign in. This is a mock, so everything stays in this browser. Open another tab to be a second person at the same time.</p>
      <ul className="mt-6 space-y-3">
        {PERSONAS.map((p) => (
          <li key={p.id}>
            <button onClick={() => go(p.id)} className="w-full rounded-card bg-white p-4 text-left ring-1 ring-pink-100 hover:ring-pink-300">
              <b className="block">{p.label}</b><span className="text-sm text-plum-500">{p.blurb} · {p.email}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-plum-500">Password for all demo accounts: <code>{DEMO_PASSWORD}</code></p>
    </main>
  );
}
