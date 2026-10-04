'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Printer } from 'lucide-react';
import { CHAPTERS, GUIDED_MINUTES, PEEK } from '@/lib/pilot/journey';

const NOTES: Record<string, string> = {
  learn: 'Read the six cards, answer the three quiz questions, then do or skip the small action.',
  do: 'Help the student spend no more than R3,500 and save at least R150 (Sisi coaches you on screen), then try the payslip decoder.',
  progress: 'Look around your Bloom and badges, then pick your weekly target (1 to 3 days).',
  reward: 'See the reward ladder and choose how you would like a reward. Nothing is real money.',
  connect: 'Join one of the practice communities, say hello in its Lounge, start a practice Money Buddy and send a nudge.',
};

export default function Guide() {
  const [qr, setQr] = useState('');
  const [origin, setOrigin] = useState('');
  useEffect(() => { const o = window.location.origin; setOrigin(o); QRCode.toDataURL(`${o}/pilot`, { width: 360, margin: 1, color: { dark: '#2A1433' } }).then(setQr).catch(() => {}); }, []);
  const h2 = 'font-display text-xl font-semibold';
  return (
    <main className="mx-auto max-w-3xl px-6 py-8 text-sm print:max-w-none print:px-0 print:py-0 print:text-[11pt]">
      <button onClick={() => window.print()} className="mb-4 flex items-center gap-2 rounded-input bg-pink-600 px-4 py-2 font-semibold text-white print:hidden"><Printer size={16} aria-hidden /> Print or save as PDF</button>

      <section>
        <div className="flex items-start gap-6">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-pink-700">Sisi pilot · tester guide</p>
            <h1 className="font-display text-4xl font-semibold">Your first week with Sisi, in about {GUIDED_MINUTES} minutes</h1>
            <p className="mt-2 text-base text-plum-500">Sisi will guide you through five short chapters so you can feel what the app could be: learn something, put it to work, see your progress, choose a reward and connect with other women. It is not a test of you. We are testing Sisi.</p>
            <p className="mt-3 text-base"><b>Open:</b> <span className="break-all">{origin}/pilot</span></p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr && <img src={qr} alt="QR code that opens the Sisi pilot" width={170} height={170} className="rounded-card ring-1 ring-pink-100" />}
        </div>

        <h2 className={`mt-6 ${h2}`}>The five chapters</h2>
        <table className="mt-2 w-full border-collapse text-left">
          <thead><tr className="bg-pink-100"><th className="border border-pink-300 p-2">Chapter</th><th className="border border-pink-300 p-2">What you do</th><th className="border border-pink-300 p-2">Time</th><th className="w-10 border border-pink-300 p-2">Done</th></tr></thead>
          <tbody>
            <tr><td className="border border-pink-300 p-2 font-semibold">Welcome</td><td className="border border-pink-300 p-2">Read the short note, tick two boxes, pick a nickname.</td><td className="border border-pink-300 p-2">1 min</td><td className="border border-pink-300 p-2 text-center">☐</td></tr>
            {CHAPTERS.map((c) => <tr key={c.id}><td className="border border-pink-300 p-2 font-semibold">{c.emoji} {c.n}. {c.label}</td><td className="border border-pink-300 p-2">{NOTES[c.id]}</td><td className="border border-pink-300 p-2">{c.minutes} min</td><td className="border border-pink-300 p-2 text-center">☐</td></tr>)}
            <tr><td className="border border-pink-300 p-2 font-semibold">Wrap-up</td><td className="border border-pink-300 p-2">See your first week, then copy your results code and note your participant ID.</td><td className="border border-pink-300 p-2">1 min</td><td className="border border-pink-300 p-2 text-center">☐</td></tr>
            <tr><td className="border border-pink-300 p-2 font-semibold">After</td><td className="border border-pink-300 p-2">Fill in the feedback form (4 to 5 minutes). It asks for your participant ID.</td><td className="border border-pink-300 p-2">4 to 5 min</td><td className="border border-pink-300 p-2 text-center">☐</td></tr>
          </tbody>
        </table>
        <p className="mt-2 text-xs text-plum-500">Sisi explains each step as you go, and a purple strip at the top shows what to do next. There is no timer: take the time you need.</p>

        <h2 className={`mt-6 ${h2}`}>Tips</h2>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>Use your own phone if you can.</li>
          <li>Lost? Tap <b>Story</b> in the purple strip to return to Sisi’s guide.</li>
          <li>The women in the chats and your practice buddy are simulated for the pilot.</li>
          <li>Do not type your name, contact details, ID number, bank details or any real amounts.</li>
          <li>If something confuses you, that is useful. Say so in the feedback form or to the person running the session.</li>
        </ul>

        <h2 className={`mt-6 ${h2}`}>What we keep, and what happens to it</h2>
        <p className="mt-1">Which steps you finish, how long they take, your quiz score, the choices you make (such as which reward you pick), and whether you used a phone or a computer. Never what you type in chat, your name or email, or any amounts of your own. It stays in your browser until you send your results code to the pilot team. Sisi is education, not financial advice, and all numbers are practice.</p>

        <h2 className={`mt-6 ${h2}`}>Want to see more? (optional)</h2>
        <p className="mt-1">{PEEK.map((p) => p.title).join(' · ')}. You will find them at the end of the story.</p>
      </section>

      <section className="mt-10 break-before-page">
        <p className="text-xs font-semibold uppercase tracking-wide text-lavender-600">For the person running the session</p>
        <h1 className="font-display text-3xl font-semibold">Facilitator notes</h1>

        <h2 className={`mt-5 ${h2}`}>Before</h2>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>Run the whole story once yourself on a phone. Do not change the app version during the pilot: a new version resets stored data on every device.</li>
          <li>Check Wi-Fi or data. The first load needs a connection.</li>
          <li>Shared device? Between testers use Profile → “Delete my account / reset my data” after their code is saved.</li>
          <li>Decide where codes go and who pastes them into Staff console → Pilot results. Have the feedback form link ready to write on the guide.</li>
        </ul>

        <h2 className={`mt-5 ${h2}`}>Say (30 seconds)</h2>
        <blockquote className="mt-1 border-l-4 border-pink-300 pl-3 italic">“Thanks for helping. This takes about fifteen minutes and is not a test of you; we are testing the app. Sisi will talk you through it. If something confuses you, say it out loud, that helps us. I will not help unless you are stuck for half a minute. Afterwards there is a short feedback form.”</blockquote>

        <h2 className={`mt-5 ${h2}`}>While they work: watch, do not coach</h2>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>Note the moment they hesitate for more than 10 seconds, and what they were looking at.</li>
          <li>Count every time you have to help (an “assist”). One assist is a usability finding.</li>
          <li>Write down exact words about the lesson, the quiz, the budget coaching, the reward choice and the chats. Quotes beat paraphrases.</li>
          <li>Watch the moments that should land: the points celebration, the “laptop in ten months” payoff, the community replies, the buddy’s reply to the nudge. Note what they say and do at each.</li>
          <li>Never explain a quiz answer or hint at which is right.</li>
        </ul>

        <h2 className={`mt-5 ${h2}`}>After</h2>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>Ask them to send the results code before they leave. Check it starts with “SISI”.</li>
          <li>Make sure they have noted their participant ID and know where the feedback form is.</li>
          <li>Ask two questions: “What was the best moment?” and “What would you tell a friend about it?”. Note the answers.</li>
          <li>Tell them the short follow-up form will reach them in a week.</li>
        </ul>

        <h2 className={`mt-5 ${h2}`}>Observation sheet (one per tester)</h2>
        <table className="mt-2 w-full border-collapse text-left">
          <tbody>
            {['Participant ID (4 characters)', 'Start / end time', 'Device and browser', 'Hesitations (what, where, seconds)', 'Assists given (when and why)', 'Reaction at each chapter (😍 🙂 🙁) and why', 'Best moment / what they would tell a friend'].map((r) => <tr key={r}><td className="w-1/3 border border-pink-300 p-2 font-semibold">{r}</td><td className="h-14 border border-pink-300 p-2" /></tr>)}
          </tbody>
        </table>
      </section>
    </main>
  );
}
