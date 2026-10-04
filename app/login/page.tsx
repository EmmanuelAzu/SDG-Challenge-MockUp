'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createAccount, signIn } from '@/lib/engine/actions';
import { getWorld, setSession, update } from '@/lib/world/store';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const community = params.get('community');
  const ref = params.get('ref');
  const [mode, setMode] = useState<'in' | 'up'>(params.get('mode') === 'up' ? 'up' : 'in');
  const [error, setError] = useState('');

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email'));
    const password = String(f.get('password'));
    if (mode === 'up') {
      const r = update((w, now) => createAccount(w, { email, password, displayName: String(f.get('name') ?? ''), ref }, now));
      if (!r.ok) return setError(r.error);
      setSession(r.id);
      router.replace(`/onboarding${community ? `?community=${community}` : ''}`);
    } else {
      const id = signIn(getWorld()!, email, password);
      if (!id) return setError('That email and password don’t match. Check them and try again, or use a demo account.');
      setSession(id);
      router.replace(getWorld()!.users[id].onboardedAt ? (community ? `/community/${community}` : '/home') : '/onboarding');
    }
  }

  const input = 'mt-1 w-full rounded-input border border-pink-300 bg-white px-3 py-3';
  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <h1 className="font-display text-3xl font-semibold">{mode === 'in' ? 'Welcome back' : 'Join Sisi'}</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === 'up' && <label className="block text-sm font-medium">First name<input name="name" required className={input} autoComplete="given-name" /></label>}
        <label className="block text-sm font-medium">Email<input name="email" type="email" required className={input} autoComplete="email" /></label>
        <label className="block text-sm font-medium">Password<input name="password" type="password" required minLength={8} className={input} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} /></label>
        {error && <p role="alert" className="text-sm text-coral-600">{error}</p>}
        <button className="w-full rounded-input bg-pink-600 py-3 font-semibold text-white hover:bg-pink-700">{mode === 'in' ? 'Sign in' : 'Create my account'}</button>
      </form>
      <button onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setError(''); }} className="mt-4 text-sm text-pink-700 underline">{mode === 'in' ? 'New here? Create an account' : 'Already have an account? Sign in'}</button>
      <p className="mt-6 rounded-card bg-pink-100 p-3 text-xs text-plum-500">This is a mock: accounts live only in this browser and nothing is sent anywhere. <Link href="/demo" className="font-semibold text-pink-700 underline">Try a demo account</Link> instead.</p>
    </main>
  );
}

export default function Login() {
  return <Suspense><LoginForm /></Suspense>;
}
