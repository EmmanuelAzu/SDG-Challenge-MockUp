'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Printer } from 'lucide-react';
import { CORE, EXTRA, TIME_BUDGET_MIN } from '@/lib/pilot/instruments';

const RUN = [
  ['0:00', 'Open the link, read the short note and tick the two boxes', 'Pilot page'],
  ['0:30', 'Quick start: pick a nickname and join a community', 'Mission 1 · Join'],
  ['1:30', 'Quick check: six questions and three statements', 'Pilot page'],
  ['2:30', 'Read the lesson “Now-Now, Stack It, Grow It” (skip the quiz)', 'Mission 2 · Learn'],
  ['4:30', 'Fix the R3,500 budget so it saves at least R150', 'Mission 3 · Budget'],
  ['6:30', 'Say hello in your community’s Lounge (or react to a post)', 'Mission 4 · Community'],
  ['7:30', 'Final check: same kind of questions again', 'Pilot page'],
  ['8:30', 'Feedback, then copy or send your results code', 'Pilot page'],
];

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
            <h1 className="font-display text-4xl font-semibold">Help us test Sisi in {TIME_BUDGET_MIN} minutes</h1>
            <p className="mt-2 text-base text-plum-500">You will learn one money idea, fix a budget, say hello in a community, and tell us what worked and what did not. It is not a test of you. We are testing Sisi.</p>
            <p className="mt-3 text-base"><b>Open:</b> <span className="break-all">{origin}/pilot</span></p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr && <img src={qr} alt="QR code that opens the Sisi pilot" width={170} height={170} className="rounded-card ring-1 ring-pink-100" />}
        </div>

        <h2 className={`mt-6 ${h2}`}>Your {TIME_BUDGET_MIN} minutes</h2>
        <table className="mt-2 w-full border-collapse text-left">
          <thead><tr className="bg-pink-100"><th className="border border-pink-300 p-2">Time</th><th className="border border-pink-300 p-2">What you do</th><th className="border border-pink-300 p-2">Where</th><th className="w-10 border border-pink-300 p-2">Done</th></tr></thead>
          <tbody>{RUN.map(([t, a, w]) => <tr key={t}><td className="border border-pink-300 p-2 font-semibold">{t}</td><td className="border border-pink-300 p-2">{a}</td><td className="border border-pink-300 p-2 text-plum-500">{w}</td><td className="border border-pink-300 p-2 text-center">☐</td></tr>)}</tbody>
        </table>
        <p className="mt-2 text-xs text-plum-500">The timer in the purple bar at the top shows how you are doing. It is fine to go over. We measure how long it really takes.</p>

        <h2 className={`mt-6 ${h2}`}>Tips</h2>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>Use your own phone if you can. Use the Sisi pages, not your browser’s back button, if you get lost: the purple bar always has a “Checklist” button.</li>
          <li>“I’m not sure” is a good answer. Please do not look things up.</li>
          <li>Do not type your name, contact details, ID number, bank details or any real amounts.</li>
          <li>If something is confusing, that is exactly what we want to know. Say so in the feedback, or tell the person running the session.</li>
        </ul>

        <h2 className={`mt-6 ${h2}`}>What we keep, and what happens to it</h2>
        <p className="mt-1">Your answers, which tasks you finished, how long they took and whether you used a phone or a computer. Nothing with your name or email. Everything stays in your browser until you choose to send your results code to the pilot team. Sisi is education, not financial advice, and all numbers are practice.</p>

        <h2 className={`mt-6 ${h2}`}>Finished early? Optional extras</h2>
        <p className="mt-1">{EXTRA.map((m) => m.title).join(' · ')}. Each takes a minute or two. Please rate the ones you try, then copy your code again.</p>
      </section>

      <section className="mt-10 break-before-page">
        <p className="text-xs font-semibold uppercase tracking-wide text-lavender-600">For the person running the session</p>
        <h1 className="font-display text-3xl font-semibold">Facilitator notes</h1>

        <h2 className={`mt-5 ${h2}`}>Before</h2>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>Open the pilot link on a phone and run it once yourself. Do not change the app version during the pilot: a new version resets stored data on every device.</li>
          <li>Check Wi-Fi or data. The first load needs a connection; after that the session runs from the browser.</li>
          <li>Shared device? Between testers use Profile → “Delete my account / reset my data” (testers’ codes are already saved by then).</li>
          <li>Decide where codes go (WhatsApp group, email) and who pastes them into Staff console → Pilot results.</li>
        </ul>

        <h2 className={`mt-5 ${h2}`}>Say (30 seconds)</h2>
        <blockquote className="mt-1 border-l-4 border-pink-300 pl-3 italic">“Thanks for helping. This takes about ten minutes. It is not a test of you; we are testing the app. If something confuses you, that helps us, so please say it out loud. I will not help unless you are stuck for half a minute. You can stop at any time.”</blockquote>

        <h2 className={`mt-5 ${h2}`}>While they work: watch, do not coach</h2>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>Note the second they hesitate for more than 10 seconds, and what they were looking at.</li>
          <li>Count every time you have to help (an “assist”). One assist is a usability finding.</li>
          <li>Write down exact words they say about the lesson, the budget task and the community. Quotes beat paraphrases.</li>
          <li>Never explain the answer to a knowledge question. Never hint at which option is right.</li>
        </ul>

        <h2 className={`mt-5 ${h2}`}>After</h2>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>Ask them to send the results code before they leave. Check it starts with “SISI”.</li>
          <li>Ask two questions: “What was the hardest part?” and “What would you tell a friend about it?”. Note the answers.</li>
          <li>Offer the Day-7 follow-up link ({origin}/pilot/follow-up) and ask them to open it from the same phone and browser.</li>
        </ul>

        <h2 className={`mt-5 ${h2}`}>Observation sheet (one per tester)</h2>
        <table className="mt-2 w-full border-collapse text-left">
          <tbody>
            {['Participant code (P-XXXXXX)', 'Start / end time', 'Device and browser', `Hesitations (what, where, seconds): ${CORE.map((m) => m.title.split(':')[0]).join(', ')}`, 'Assists given (when and why)', 'Quotes', 'Hardest part / what they would tell a friend'].map((r) => <tr key={r}><td className="w-1/3 border border-pink-300 p-2 font-semibold">{r}</td><td className="h-14 border border-pink-300 p-2" /></tr>)}
          </tbody>
        </table>
      </section>
    </main>
  );
}
