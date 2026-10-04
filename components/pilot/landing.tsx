'use client';
import { useState } from 'react';
import { Bloom } from '@/components/bloom';
import { CHAPTERS, GUIDED_MINUTES } from '@/lib/pilot/journey';
import { PROFILE } from '@/lib/pilot/instruments';
import { quickStart, startRun } from '@/lib/engine/pilot';
import { setSession, update } from '@/lib/world/store';
import type { User, World } from '@/lib/world/types';

type Profile = { ageBand: string; status: string; experience: string };

/** The prologue: Sisi says hello, shows the five-chapter path, takes consent and a nickname. */
export function Landing({ w, me }: { w: World; me: User | undefined }) {
  const [age, setAge] = useState(false);
  const [agree, setAgree] = useState(false);
  const [profile, setProfile] = useState<Profile>({ ageBand: '', status: '', experience: '' });
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const device = typeof window !== 'undefined' && window.innerWidth >= 768 ? 'desktop' : 'mobile';
  const prof = profile.ageBand || profile.status || profile.experience ? profile : null;
  const ready = age && agree;
  const field = 'mt-1 w-full rounded-input border border-pink-300 bg-white px-3 py-2.5 text-sm';
  const signedIn = !!me && me.role === 'member' && !!me.onboardedAt;

  function begin(useAccount: boolean) {
    setError('');
    if (!ready) return setError('Please tick both boxes to take part.');
    if (useAccount && me) { update((x, n) => startRun(x, me.id, { path: 'account', profile: prof, device }, n)); return; }
    const r = update((x, n) => quickStart(x, { nickname, profile: prof, device }, n));
    if (!r.ok) return setError(r.error);
    setSession(r.userId);
  }

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <div className="flex justify-center"><Bloom progress={4} size={96} /></div>
      <p className="mt-3 text-center text-xs font-semibold uppercase tracking-wide text-pink-700">Sisi pilot</p>
      <h1 className="text-center font-display text-3xl font-semibold">Your first week with Sisi, in about {GUIDED_MINUTES} minutes</h1>
      <p className="mt-2 text-center text-plum-500">I’m Sisi. I’ll walk you through five short chapters so you can feel what this app could be for you and women like you.</p>

      <ol className="mt-5 space-y-2">
        {CHAPTERS.map((c) => (
          <li key={c.id} className="flex items-center gap-3 rounded-card bg-white p-3 ring-1 ring-pink-100">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-100 text-lg" aria-hidden>{c.emoji}</span>
            <span className="min-w-0 flex-1"><b className="block text-xs tracking-wide text-pink-700">{c.label}</b><span className="text-sm">{c.title}</span></span>
            <span className="text-xs text-plum-500">~{c.minutes} min</span>
          </li>
        ))}
      </ol>

      <section className="mt-4 rounded-card bg-pink-100 p-4 text-sm">
        <h2 className="font-display text-lg font-semibold">Before we start</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><b>It is not a test of you.</b> We are testing Sisi, and everything you see is practice.</li>
          <li><b>What we keep:</b> which steps you finish, how long they take, your quiz score, the choices you make (like which reward you pick), and whether you used a phone or a computer. <b>Never</b> what you type in chat, your name, email, ID, bank details or any amounts of your own.</li>
          <li><b>Where it lives:</b> in this browser. At the end you get a code to give the team and a participant ID for the feedback form.</li>
          <li><b>You can stop any time.</b> Sisi is education, not financial advice.</li>
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
        <h2 className="font-display text-lg font-semibold">Let’s begin</h2>
        <label className="mt-2 block text-sm font-medium">Pick a nickname<input value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={20} placeholder="Not your full name" className={field} autoComplete="off" /></label>
        {error && <p role="alert" className="mt-3 text-sm text-coral-600">{error}</p>}
        <button onClick={() => begin(false)} disabled={!ready} className="mt-4 w-full rounded-input bg-pink-600 py-3 font-semibold text-white hover:bg-pink-700 disabled:opacity-50">Start the story</button>
        {signedIn && <button onClick={() => begin(true)} disabled={!ready} className="mt-2 w-full rounded-input border border-pink-600 py-2.5 text-sm font-semibold text-pink-700 disabled:opacity-50">Use my current account ({me!.displayName || 'this account'}) instead</button>}
      </section>
      <p className="mt-6 text-center text-xs text-plum-500">Powered by PPS Investments. Education, not financial advice.</p>
    </main>
  );
}
