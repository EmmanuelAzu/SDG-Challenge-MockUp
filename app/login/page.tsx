'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const community = params.get('community');
  const [mode, setMode] = useState<'in' | 'up'>(params.get('mode') === 'up' ? 'up' : 'in');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email'));
    const password = String(f.get('password'));
    const supabase = createClient();
    const ref = params.get('ref') ?? undefined;
    const { error } =
      mode === 'up'
        ? await supabase.auth.signUp({ email, password, options: { data: { display_name: String(f.get('name') ?? ''), ref } } })
        : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setError(error.message.includes('Invalid') ? 'That email and password don’t match. Check them and try again.' : error.message);
    router.replace(mode === 'up' ? `/onboarding${community ? `?community=${community}` : ''}` : community ? `/community/${community}` : '/home');
    router.refresh();
  }

  const input = 'mt-1 w-full rounded-input border border-pink-300 bg-white px-3 py-3';
  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <h1 className="font-display text-3xl font-semibold">{mode === 'in' ? 'Welcome back' : 'Join Sisi'}</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === 'up' && (
          <label className="block text-sm font-medium">First name
            <input name="name" required className={input} autoComplete="given-name" />
          </label>
        )}
        <label className="block text-sm font-medium">Email
          <input name="email" type="email" required className={input} autoComplete="email" />
        </label>
        <label className="block text-sm font-medium">Password
          <input name="password" type="password" required minLength={8} className={input} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} />
        </label>
        {error && <p role="alert" className="text-sm text-coral-600">{error}</p>}
        <button disabled={busy} className="w-full rounded-input bg-pink-600 py-3 font-semibold text-white hover:bg-pink-700 disabled:opacity-60">
          {mode === 'in' ? 'Sign in' : 'Create my account'}
        </button>
      </form>
      <button onClick={() => setMode(mode === 'in' ? 'up' : 'in')} className="mt-4 text-sm text-pink-700 underline">
        {mode === 'in' ? 'New here? Create an account' : 'Already have an account? Sign in'}
      </button>
      <p className="mt-2 text-xs text-plum-500">Forgot your password? Ask your facilitator to set a temporary one.</p>
    </main>
  );
}

import { Suspense } from 'react';
export default function Login() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
