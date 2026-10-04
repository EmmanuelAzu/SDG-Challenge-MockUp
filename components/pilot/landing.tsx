'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bloom } from '@/components/bloom';
import { CORE, EXTRA, PROFILE, QUICK_COMMUNITIES, TIME_BUDGET_MIN } from '@/lib/pilot/instruments';
import { quickStart, startRun } from '@/lib/engine/pilot';
import { setSession, update } from '@/lib/world/store';
import type { User, World } from '@/lib/world/types';

const PENDING = 'sisi.pilot.pending';
type Profile = { ageBand: string; status: string; experience: string };

export function Landing({ w, me }: { w: World; me: User | undefined }) {
  const router = useRouter();
  const [age, setAge] = useState(false);
  const [agree, setAgree] = useState(false);
  const [profile, setProfile] = useState<Profile>({ ageBand: '', status: '', experience: '' });
  const [path, setPath] = useState<'quick' | 'full'>('quick');
  const [nickname, setNickname] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const device = typeof window !== 'undefined' && window.innerWidth >= 768 ? 'desktop' : 'mobile';
  const communities = QUICK_COMMUNITIES.map((s) => w.communities.find((c) => c.slug === s)).filter((c): c is NonNullable<typeof c> => !!c);
  const prof = profile.ageBand || profile.status || profile.experience ? profile : null;
  const ready = age && agree;
  const field = 'mt-1 w-full rounded-input border border-pink-300 bg-white px-3 py-2.5 text-sm';
  const signedIn = !!me && me.role === 'member' && !!me.onboardedAt;

  function begin() {
    setError('');
    if (!ready) return setError('Please tick both boxes to take part.');
    if (signedIn && path === 'full') { update((x, n) => startRun(x, me!.id, { path: 'full', profile: prof, device }, n)); return; }
    if (path === 'full') {
      try { sessionStorage.setItem(PENDING, JSON.stringify({ profile: prof, device, startedAt: Date.now() })); sessionStorage.setItem('sisi.next', '/pilot'); } catch { /* the sign-up page still works */ }
      router.push('/login?mode=up&next=/pilot');
      return;
    }
    const r = update((x, n) => quickStart(x, { nickname, communitySlug: slug, profile: prof, device }, n));
    if (!r.ok) return setError(r.error);
    setSession(r.userId);
  }

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <div className="flex justify-center"><Bloom progress={4} size={96} /></div>
      <p className="mt-3 text-center text-xs font-semibold uppercase tracking-wide text-pink-700">Sisi pilot</p>
      <h1 className="text-center font-display text-3xl font-semibold">Help us test Sisi</h1>
      <p className="mt-2 text-center text-plum-500">About {TIME_BUDGET_MIN} minutes. You will learn something, try a tool, say hello in a community, then tell us what worked.</p>

      <section className="mt-6 rounded-card bg-white p-4 ring-1 ring-pink-100">
        <h2 className="font-display text-lg font-semibold">Your {TIME_BUDGET_MIN} minutes</h2>
        <ol className="mt-2 space-y-1.5 text-sm">
          <li><b>Quick check</b> · about 1 min · six questions about money</li>
          {CORE.map((m) => <li key={m.id}><b>{m.title}</b> · about {m.minutes} min</li>)}
          <li><b>Final check and feedback</b> · about 2½ min</li>
        </ol>
        <p className="mt-2 text-xs text-plum-500">Want to try more? There are {EXTRA.length} optional extras afterwards.</p>
      </section>

      <section className="mt-4 rounded-card bg-pink-100 p-4 text-sm">
        <h2 className="font-display text-lg font-semibold">Before you start</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-plum-900">
          <li><b>It is not a test of you.</b> “I’m not sure” is a fine answer. We are testing Sisi.</li>
          <li><b>What we keep:</b> your answers, which tasks you finished, how long they took and whether you used a phone or computer. No name, email, ID or bank details, and never the amounts you enter.</li>
          <li><b>Where it lives:</b> in this browser only. At the end you get a code to give the team. We only see what is in that code.</li>
          <li><b>You can stop any time.</b> Sisi is education, not financial advice, and every number is practice.</li>
        </ul>
        <label className="mt-3 flex items-start gap-2"><input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} className="mt-1 h-4 w-4" /> <span>I am 18 or older.</span></label>
        <label className="mt-2 flex items-start gap-2"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-4 w-4" /> <span>I understand this and I agree to take part.</span></label>
      </section>

      <details className="mt-4 rounded-card bg-white p-4 ring-1 ring-pink-100">
        <summary className="cursor-pointer text-sm font-semibold">Optional: about you (helps us see who it works for)</summary>
        {(['ageBand', 'status', 'experience'] as const).map((k) => (
          <label key={k} className="mt-3 block text-sm font-medium">{k === 'ageBand' ? 'Age' : k === 'status' ? 'Right now I am' : 'Budgeting'}
            <select value={profile[k]} onChange={(e) => setProfile({ ...profile, [k]: e.target.value })} className={field}><option value="">Prefer not to say</option>{PROFILE[k].map((o) => <option key={o}>{o}</option>)}</select></label>
        ))}
      </details>

      <section className="mt-4 rounded-card bg-white p-4 ring-1 ring-pink-100">
        <h2 className="font-display text-lg font-semibold">How would you like to start?</h2>
        <div className="mt-2 space-y-2" role="radiogroup" aria-label="Start path">
          <button type="button" role="radio" aria-checked={path === 'quick'} onClick={() => setPath('quick')} className={`block w-full rounded-input border p-3 text-left text-sm ${path === 'quick' ? 'border-pink-600 bg-pink-100' : 'border-pink-300'}`}><b>Quick start</b> (recommended)<span className="block text-xs text-plum-500">A nickname and a community, no email or password. Fits the {TIME_BUDGET_MIN} minutes.</span></button>
          <button type="button" role="radio" aria-checked={path === 'full'} onClick={() => setPath('full')} className={`block w-full rounded-input border p-3 text-left text-sm ${path === 'full' ? 'border-pink-600 bg-pink-100' : 'border-pink-300'}`}><b>{signedIn ? 'Use my current account' : 'Full sign-up'}</b><span className="block text-xs text-plum-500">{signedIn ? `Continue as ${me!.displayName || 'this account'}.` : 'Create a real account and do the full welcome questions (about 3 extra minutes, timed separately).'}</span></button>
        </div>
        {path === 'quick' && (
          <div className="mt-3">
            <label className="block text-sm font-medium">Nickname<input value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={20} placeholder="Not your full name" className={field} autoComplete="off" /></label>
            <fieldset className="mt-3"><legend className="text-sm font-medium">Join a community</legend>
              <div className="mt-1 space-y-1.5" role="radiogroup" aria-label="Community">
                {communities.map((c) => <button key={c.id} type="button" role="radio" aria-checked={slug === c.slug} onClick={() => setSlug(c.slug)} className={`flex w-full items-center gap-2 rounded-input border px-3 py-2 text-left text-sm ${slug === c.slug ? 'border-pink-600 bg-pink-100 font-semibold' : 'border-pink-300 bg-white'}`}><span aria-hidden>{c.emoji}</span> {c.name}</button>)}
              </div></fieldset>
          </div>
        )}
      </section>

      {error && <p role="alert" className="mt-3 text-sm text-coral-600">{error}</p>}
      <button onClick={begin} className="mt-4 w-full rounded-input bg-pink-600 py-3 font-semibold text-white hover:bg-pink-700 disabled:opacity-50" disabled={!ready}>Start the pilot</button>
      <p className="mt-6 text-center text-xs text-plum-500">Powered by PPS Investments. Education, not financial advice.</p>
    </main>
  );
}

export const readPending = (): { profile: Profile | null; device: 'mobile' | 'desktop'; startedAt: number } | null => {
  try { const raw = sessionStorage.getItem(PENDING); return raw ? JSON.parse(raw) : null; } catch { return null; }
};
export const clearPending = () => { try { sessionStorage.removeItem(PENDING); } catch { /* ignore */ } };
