'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bloom } from '@/components/bloom';
import { completeOnboarding } from '@/lib/engine/actions';
import { update } from '@/lib/world/store';
import { useMe } from '@/lib/world/hooks';
import { useCelebrate } from '@/components/celebration/provider';
import { assignTrack, QUIZ, TRACKS, type QuizAnswers } from '@/lib/content/life-tracks';

const SLIDES = [
  { title: 'Real skills. Bigger dreams.', body: 'Three-minute lessons that turn “I should” into “I can”.' },
  { title: 'Do it with friends', body: 'Join a Circle, find a Money Buddy, and cheer each other on.' },
  { title: 'Earn badges, not pressure', body: 'Small actions earn points and badges. Competing is always optional, and Focus mode switches the game off.' },
];
const LIKERT = [
  'I feel confident making everyday money decisions.',
  'I could build a monthly budget and stick to it.',
  'I know how to start saving for an emergency.',
  'I know how to start investing with a small amount.',
  'I feel comfortable talking about money with people I trust.',
];

type Community = { id: string; slug: string; name: string };
// 0-2 slides · 3 name · 4 community · 5-9 quiz · 10 result · 11 confidence · 12 consent
const LAST = 12;

export function OnboardingFlow({ communities, presetCommunity, defaultName }: { communities: Community[]; presetCommunity: string | null; defaultName: string }) {
  const router = useRouter();
  const celebrate = useCelebrate();
  const meId = useMe()!.me.id;
  const [step, setStep] = useState(0);
  const [name, setName] = useState(defaultName);
  const [nick, setNick] = useState('');
  const [community, setCommunity] = useState<string | null>(presetCommunity);
  const [code, setCode] = useState('');
  const [quiz, setQuiz] = useState<Partial<QuizAnswers>>({});
  const [conf, setConf] = useState<number[]>([0, 0, 0, 0, 0]);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const pending = false;

  const primary = 'w-full rounded-input bg-pink-600 py-3 font-semibold text-white hover:bg-pink-700 disabled:opacity-50';
  const field = 'mt-1 w-full rounded-input border border-pink-300 bg-white px-3 py-3';
  const q = step >= 5 && step <= 9 ? QUIZ[step - 5] : null;
  const plan = step === 10 && QUIZ.every((x) => quiz[x.key] !== undefined) ? assignTrack(quiz as QuizAnswers) : null;
  const track = plan ? TRACKS.find((t) => t.slug === plan.track)! : null;

  function answer(value: string | number) {
    setQuiz((cur) => ({ ...cur, [q!.key]: value }));
    setStep(step + 1);
  }

  function finish() {
    setError('');
    try {
      const earned = update((w, now) => completeOnboarding(w, meId, { displayName: name, nickname: nick, communityId: community, joinCode: code || undefined, quiz: quiz as QuizAnswers, confidence: conf }, now));
      celebrate(earned);
      let next = '/home';
      try { const n = sessionStorage.getItem('sisi.next'); if (n?.startsWith('/')) { next = n; sessionStorage.removeItem('sisi.next'); } } catch {}
      router.replace(next);
    } catch {
      setError('Something went wrong. Check your answers and try again.');
    }
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-10">
      <div className="h-1.5 rounded-full bg-pink-100" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={LAST + 1}>
        <div className="h-1.5 rounded-full bg-pink-600 transition-all" style={{ width: `${((step + 1) / (LAST + 1)) * 100}%` }} />
      </div>

      {step < 3 && (
        <section className="mt-10 text-center">
          <div className="flex justify-center"><Bloom progress={step + 2} size={140} /></div>
          <h1 className="mt-6 font-display text-3xl font-semibold">{SLIDES[step].title}</h1>
          <p className="mt-2 text-plum-500">{SLIDES[step].body}</p>
        </section>
      )}

      {step === 3 && (
        <section className="mt-8 space-y-4">
          <h1 className="font-display text-3xl font-semibold">What should we call you?</h1>
          <label className="block text-sm font-medium">First name<input value={name} onChange={(e) => setName(e.target.value)} className={field} autoComplete="given-name" /></label>
          <label className="block text-sm font-medium">Nickname <span className="text-plum-500">(optional, used on leaderboards and shares)</span><input value={nick} onChange={(e) => setNick(e.target.value)} className={field} maxLength={20} /></label>
        </section>
      )}

      {step === 4 && (
        <section className="mt-8">
          <h1 className="font-display text-3xl font-semibold">Join a community</h1>
          <p className="text-sm text-plum-500">Pick yours, enter a code, or skip for now.</p>
          <ul className="mt-4 space-y-2">
            {communities.map((c) => (
              <li key={c.id}>
                <button onClick={() => setCommunity(community === c.id ? null : c.id)} aria-pressed={community === c.id} className={`w-full rounded-input border p-3 text-left font-medium ${community === c.id ? 'border-pink-600 bg-pink-100' : 'border-pink-300 bg-white'}`}>{c.name}</button>
              </li>
            ))}
          </ul>
          <label className="mt-4 block text-sm font-medium">Have a join code?<input value={code} onChange={(e) => setCode(e.target.value)} className={field} /></label>
        </section>
      )}

      {q && (
        <section className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-pink-700">Where do I start? · {step - 4} of 5</p>
          <h1 className="mt-1 font-display text-2xl font-semibold">{q.question}</h1>
          <ul className="mt-4 space-y-2">
            {q.options.map(([value, label]) => (
              <li key={String(value)}><button onClick={() => answer(value)} aria-pressed={quiz[q.key] === value} className={`w-full rounded-input border p-3 text-left font-medium ${quiz[q.key] === value ? 'border-pink-600 bg-pink-100' : 'border-pink-300 bg-white'}`}>{label}</button></li>
            ))}
          </ul>
        </section>
      )}

      {step === 10 && plan && track && (
        <section className="mt-8">
          <p className="font-display italic text-pink-700">Here is where to start</p>
          <h1 className="font-display text-3xl font-semibold">{track.name}</h1>
          <p className="mt-1 text-plum-500">{track.description}</p>
          <dl className="mt-5 space-y-2 rounded-card bg-white p-4 text-sm ring-1 ring-pink-100">
            <div className="flex justify-between"><dt>Your weekly target</dt><dd className="font-semibold">{plan.weeklyTarget} {plan.weeklyTarget === 1 ? 'day' : 'days'} a week</dd></div>
            <div className="flex justify-between"><dt>First pathway</dt><dd className="font-semibold">{plan.firstPathway === 'invest-her' ? 'Invest HER' : 'Money Milestones'}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-plum-500">You can change your track and target any time in Profile.</p>
          <Link href="/learn/options" target="_blank" className="mt-3 inline-block text-sm font-semibold text-pink-700 underline">Compare savings options: savings account, TFSA, unit trust, retirement annuity</Link>
        </section>
      )}

      {step === 11 && (
        <section className="mt-8">
          <h1 className="font-display text-3xl font-semibold">Where are you today?</h1>
          <p className="text-sm text-plum-500">1 = not at all, 5 = completely. There are no wrong answers.</p>
          <div className="mt-4 space-y-5">
            {LIKERT.map((text, qi) => (
              <fieldset key={text}>
                <legend className="text-sm font-medium">{text}</legend>
                <div className="mt-2 flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setConf(conf.map((v, i) => (i === qi ? n : v)))} aria-pressed={conf[qi] === n} className={`h-11 flex-1 rounded-input border font-semibold ${conf[qi] === n ? 'border-pink-600 bg-pink-600 text-white' : 'border-pink-300 bg-white'}`}>{n}</button>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </section>
      )}

      {step === 12 && (
        <section className="mt-8">
          <h1 className="font-display text-3xl font-semibold">One last thing</h1>
          <p className="mt-2 text-sm text-plum-500">We never ask for your income, ID number or account details. Any budget or savings figures you add later are optional, private and never shared or ranked. Sisi is education, not financial advice.</p>
          <label className="mt-4 flex items-start gap-3 text-sm">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5 accent-pink-600" />
            <span>I agree to Sisi processing my information as described in the <Link href="/privacy" target="_blank" className="underline">privacy notice</Link> (POPIA).</span>
          </label>
          {error && <p role="alert" className="mt-3 text-sm text-coral-600">{error}</p>}
        </section>
      )}

      <div className="mt-10 space-y-2">
        {step === LAST ? (
          <button className={primary} onClick={finish} disabled={!consent || pending}>{pending ? 'Setting up…' : 'Start my journey'}</button>
        ) : step >= 5 && step <= 9 ? null : (
          <button className={primary} onClick={() => setStep(step + 1)} disabled={(step === 3 && !name.trim()) || (step === 11 && conf.some((v) => !v))}>
            {step < 3 ? 'Next' : step === 4 && !community && !code ? 'Skip for now' : 'Continue'}
          </button>
        )}
        {step > 0 && <button onClick={() => setStep(step - 1)} className="w-full py-2 text-sm font-medium text-pink-700">Back</button>}
      </div>
    </main>
  );
}
