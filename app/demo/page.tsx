'use client';
import { notFound, useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const USERS = [
  { email: 'nomsa@demo.sisi.app', label: 'Nomsa — member, mid-journey' },
  { email: 'new@demo.sisi.app', label: 'New member — live onboarding' },
  { email: 'thandi@demo.sisi.app', label: 'Thandi — facilitator' },
  { email: 'admin@demo.sisi.app', label: 'Admin — PPS staff console' },
];

export default function Demo() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') notFound();
  const router = useRouter();
  const [error, setError] = useState('');

  async function go(email: string) {
    const { error } = await createClient().auth.signInWithPassword({ email, password: 'SisiDemo2026!' });
    if (error) return setError('Demo users aren’t seeded yet. Run `pnpm seed` first.');
    router.replace(email.startsWith('new@') ? '/onboarding' : '/home');
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <h1 className="font-display text-3xl font-semibold">Demo logins</h1>
      <p className="mt-1 text-sm text-plum-500">One tap to sign in. Demo data only.</p>
      <ul className="mt-6 space-y-3">
        {USERS.map((u) => (
          <li key={u.email}>
            <button onClick={() => go(u.email)} className="w-full rounded-card bg-white p-4 text-left font-medium shadow-sm ring-1 ring-pink-100 hover:ring-pink-300">
              {u.label}
            </button>
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="mt-4 text-sm text-coral-600">{error}</p>}
    </main>
  );
}
