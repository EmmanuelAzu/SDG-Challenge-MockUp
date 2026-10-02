'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Download, MessageCircle, Star, ShieldAlert, X } from 'lucide-react';
import { completeAction, completeLesson, recordLookup, submitFeedback, submitQuiz } from '@/app/(app)/learn/actions';
import { useCelebrate } from '@/components/celebration/provider';
import { RichText } from '@/components/rich-text';

type Card = { title: string; body: string; callout?: string };
type Q = { id: string; prompt: string; options: string[]; correct_index: number; explanation: string | null };
type Term = { slug: string; term: string; definition: string; money_example: string | null };
type Props = {
  lesson: { id: string; title: string; cards: Card[]; takeaway: string | null; duration_sec: number | null; format: string; video_url: string | null; transcript: string | null };
  questions: Q[];
  action: { id: string; title: string; description: string | null } | null;
  initialStage: 'cards' | 'quiz' | 'action';
  topic: string;
  sources: { title: string; url: string | null }[];
  review: { reviewer_name: string; credential: string; reviewed_on: string } | null;
  glossary: Term[];
  focus: boolean;
  rated: boolean;
};

export function LessonPlayer({ lesson, questions, action, initialStage, topic, sources, review, glossary, focus, rated }: Props) {
  const celebrate = useCelebrate();
  const [stage, setStage] = useState<'cards' | 'quiz' | 'action' | 'done'>(initialStage);
  const [i, setI] = useState(0);
  const [pending, start] = useTransition();
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<{ passed: boolean; correct: number; total: number } | null>(null);
  const [points, setPoints] = useState(0);
  const [note, setNote] = useState('');
  const [term, setTerm] = useState<Term | null>(null);
  const [rating, setRating] = useState(0);
  const [confusing, setConfusing] = useState('');
  const [sent, setSent] = useState(rated);

  const cards = lesson.cards ?? [];
  const isVideo = lesson.format === 'video' && lesson.video_url;
  const terms = new Map(glossary.map((t) => [t.slug, t]));
  const investing = /invest/i.test(topic);

  function openTerm(slug: string, label: string) {
    setTerm(terms.get(slug) ?? { slug, term: label, definition: 'We are still writing this definition.', money_example: null });
    void recordLookup(slug).then(celebrate);
  }
  function finishCards() {
    start(async () => {
      const r = await completeLesson(lesson.id);
      setPoints((p) => p + r.points);
      celebrate(r);
      setStage(questions.length ? 'quiz' : action ? 'action' : 'done');
    });
  }
  function nextQuestion() {
    const next = [...answers, picked!];
    setAnswers(next);
    setPicked(null);
    if (qi + 1 < questions.length) return setQi(qi + 1);
    start(async () => {
      const r = await submitQuiz({ lessonId: lesson.id, answers: next });
      setResult(r);
      setPoints((p) => p + r.points);
      celebrate(r);
    });
  }
  function retry() { setQi(0); setAnswers([]); setPicked(null); setResult(null); }
  function doAction(status: 'done' | 'skipped', msg?: string) {
    start(async () => {
      const r = await completeAction({ actionId: action!.id, status });
      setPoints((p) => p + r.points);
      celebrate(r);
      setNote(msg ?? '');
      setStage('done');
    });
  }
  function sendFeedback() {
    start(async () => {
      const r = await submitFeedback({ lessonId: lesson.id, rating, confusing });
      setPoints((p) => p + r.points);
      setSent(true);
    });
  }
  const shareText = `${lesson.takeaway ?? lesson.title} (learned on Sisi)`;

  const card = 'rounded-card bg-white p-6 ring-1 ring-pink-100';
  const primary = 'rounded-input bg-pink-600 px-5 py-3 font-semibold text-white hover:bg-pink-700 disabled:opacity-60';

  return (
    <div>
      <Link href="/learn" className="text-sm text-pink-700">← Learn</Link>
      <h1 className="mt-2 font-display text-2xl font-semibold">{lesson.title}</h1>
      <p className="text-sm text-plum-500">{Math.ceil((lesson.duration_sec ?? 180) / 60)} min or less</p>
      <p className="mt-1 text-xs text-plum-500">
        {review ? `Reviewed by ${review.reviewer_name}, ${review.credential}, ${new Date(review.reviewed_on).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric', timeZone: 'Africa/Johannesburg' })}` : 'Review pending'}
      </p>

      {stage === 'cards' && (
        <section className="mt-5" aria-live="polite">
          {isVideo ? (
            <div className="aspect-video overflow-hidden rounded-card"><iframe className="h-full w-full" src={lesson.video_url!} title={lesson.title} allowFullScreen /></div>
          ) : (
            <>
              <div className="h-2 rounded-full bg-pink-100" role="progressbar" aria-valuenow={i + 1} aria-valuemin={1} aria-valuemax={cards.length}>
                <div className="h-2 rounded-full bg-pink-300 transition-all" style={{ width: `${((i + 1) / cards.length) * 100}%` }} />
              </div>
              <article className={`${card} mt-4 min-h-56`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-pink-700">Card {i + 1} of {cards.length}</p>
                <h2 className="mt-2 font-display text-2xl font-semibold">{cards[i]?.title}</h2>
                <p className="mt-3 text-lg leading-relaxed"><RichText text={cards[i]?.body ?? ''} onTerm={openTerm} /></p>
                {cards[i]?.callout && <p className="mt-4 rounded-input bg-lavender-100 p-3 text-sm"><b className="text-lavender-600">Cause and effect:</b> {cards[i].callout}</p>}
              </article>
            </>
          )}
          {lesson.takeaway && (i === cards.length - 1 || isVideo) && (
            <p className="mt-4 rounded-card bg-gold-500/20 p-4 text-sm"><b>Key takeaway:</b> {lesson.takeaway}</p>
          )}
          {investing && i === cards.length - 1 && (
            <aside className="mt-4 rounded-card bg-pink-100 p-4 text-sm" aria-label="Spot the scam">
              <p className="flex items-center gap-2 font-semibold text-pink-700"><ShieldAlert size={18} /> Spot the scam</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>Promises of high, fixed returns with “no risk”.</li>
                <li>Pressure to decide today or to recruit friends.</li>
                <li>Anyone not on the FSCA register. Check before you pay.</li>
              </ul>
            </aside>
          )}
          <div className="mt-5 flex justify-between">
            <button onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0 || !!isVideo} className="flex items-center gap-1 rounded-input px-4 py-3 font-semibold text-pink-700 disabled:opacity-30"><ArrowLeft size={18} /> Back</button>
            {i < cards.length - 1 && !isVideo ? (
              <button onClick={() => setI(i + 1)} className={`${primary} flex items-center gap-1`}>Next <ArrowRight size={18} /></button>
            ) : (
              <button onClick={finishCards} disabled={pending} className={primary}>{questions.length ? 'On to the quiz' : 'Finish lesson'}</button>
            )}
          </div>
          {lesson.transcript && <details className="mt-6 text-sm"><summary className="cursor-pointer font-medium">Transcript</summary><p className="mt-2 text-plum-500">{lesson.transcript}</p></details>}
          {sources.length > 0 && (
            <details className="mt-4 text-sm"><summary className="cursor-pointer font-medium">Sources</summary>
              <ul className="mt-2 list-disc pl-5 text-plum-500">{sources.map((s) => <li key={s.title}>{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">{s.title}</a> : s.title}</li>)}</ul>
            </details>
          )}
        </section>
      )}

      {stage === 'quiz' && !result && questions[qi] && (
        <section className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-pink-700">Question {qi + 1} of {questions.length}</p>
          <h2 className="mt-1 font-display text-xl font-semibold">{questions[qi].prompt}</h2>
          <ul className="mt-4 space-y-2">
            {questions[qi].options.map((o, n) => {
              const right = picked !== null && n === questions[qi].correct_index;
              const wrong = picked === n && n !== questions[qi].correct_index;
              return (
                <li key={n}>
                  <button onClick={() => picked === null && setPicked(n)} disabled={picked !== null} className={`flex w-full items-center justify-between rounded-input border p-3 text-left font-medium ${right ? 'border-mint-700 bg-mint-100' : wrong ? 'border-coral-600 bg-red-50' : 'border-pink-300 bg-white'}`}>
                    {o}{right && <Check size={18} aria-label="Correct" />}{wrong && <X size={18} aria-label="Not quite" />}
                  </button>
                </li>
              );
            })}
          </ul>
          {picked !== null && (
            <div role="status" className="mt-4 rounded-card bg-pink-100 p-4 text-sm">
              <b>{picked === questions[qi].correct_index ? 'Yes!' : 'Not quite.'}</b> {questions[qi].explanation}
              <button onClick={nextQuestion} disabled={pending} className={`${primary} mt-3 block`}>{qi + 1 < questions.length ? 'Next question' : 'See my result'}</button>
            </div>
          )}
        </section>
      )}

      {stage === 'quiz' && result && (
        <section className={`${card} mt-5 text-center`}>
          <h2 className="font-display text-2xl font-semibold">{result.passed ? 'Quiz passed' : 'Almost there'}</h2>
          <p className="mt-1 text-plum-500">You got {result.correct} of {result.total}.</p>
          {result.passed ? (
            <button onClick={() => setStage(action ? 'action' : 'done')} className={`${primary} mt-4`}>Continue</button>
          ) : (
            <><p className="mt-2 text-sm">You need at least {Math.min(2, result.total)} right. Retries are free.</p><button onClick={retry} className={`${primary} mt-4`}>Try again</button></>
          )}
        </section>
      )}

      {stage === 'action' && action && (
        <section className={`${card} mt-5`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-pink-700">Do it</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">{action.title}</h2>
          <p className="mt-2">{action.description}</p>
          <div className="mt-5 flex flex-col gap-2">
            <button onClick={() => doAction('done')} disabled={pending} className={primary}>I did it</button>
            <button onClick={() => doAction('skipped', 'No stress. Your action stays on your list.')} disabled={pending} className="rounded-input py-3 font-semibold text-pink-700">Remind me tomorrow</button>
            <button onClick={() => doAction('skipped', 'Skipped. You can come back to it any time.')} disabled={pending} className="rounded-input py-2 text-sm text-plum-500">Skip for now</button>
          </div>
        </section>
      )}

      {stage === 'done' && (
        <section className="mt-5 space-y-4">
          <div className={`${card} text-center`}>
            <h2 className="font-display text-2xl font-semibold">Lesson done</h2>
            {!focus && points > 0 && <p className="mt-1 font-semibold text-pink-700">+{points} points</p>}
            {note && <p className="mt-1 text-sm text-plum-500">{note}</p>}
          </div>

          {!sent ? (
            <div className={card}>
              <h3 className="font-display text-lg font-semibold">How was this lesson?</h3>
              <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((n) => <button key={n} role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)}><Star size={30} className={n <= rating ? 'fill-gold-500 text-gold-500' : 'text-pink-300'} /></button>)}
              </div>
              <label className="mt-3 block text-sm font-medium">What was confusing? <span className="text-plum-500">(optional)</span>
                <textarea value={confusing} onChange={(e) => setConfusing(e.target.value)} maxLength={300} rows={2} className="mt-1 w-full rounded-input border border-pink-300 p-2" />
              </label>
              <button onClick={sendFeedback} disabled={!rating || pending} className={`${primary} mt-3`}>Send feedback</button>
            </div>
          ) : (
            <p role="status" className="text-center text-sm text-mint-700">Thanks. Your feedback helps us make lessons clearer.</p>
          )}

          {lesson.takeaway && (
            <div className={card}>
              <h3 className="font-display text-lg font-semibold">Share what you learned</h3>
              <p className="mt-1 text-sm text-plum-500">“{lesson.takeaway}”</p>
              <div className="mt-3 flex gap-2">
                <a href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${typeof window !== 'undefined' ? window.location.origin : ''}`)}`} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-input bg-pink-100 py-2 text-sm font-semibold text-pink-700"><MessageCircle size={16} /> WhatsApp</a>
                <a href={`/api/og/takeaway/${lesson.id}?format=story`} download={`sisi-takeaway.png`} className="flex flex-1 items-center justify-center gap-2 rounded-input bg-pink-100 py-2 text-sm font-semibold text-pink-700"><Download size={16} /> Download card</a>
              </div>
            </div>
          )}
          <Link href="/home" className={`${primary} block text-center`}>Back to my journey</Link>
        </section>
      )}

      {term && (
        <div role="dialog" aria-modal="true" aria-label={`Definition of ${term.term}`} className="fixed inset-0 z-40 flex items-end bg-plum-900/40" onClick={() => setTerm(null)}>
          <div className="w-full rounded-t-card bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h2 className="font-display text-xl font-semibold">{term.term}</h2><button onClick={() => setTerm(null)} aria-label="Close"><X /></button></div>
            <p className="mt-2">{term.definition}</p>
            {term.money_example && <p className="mt-3 rounded-input bg-pink-50 p-3 text-sm"><b>What this means for your money:</b> {term.money_example}</p>}
            <Link href="/learn/glossary" className="mt-3 inline-block text-sm font-semibold text-pink-700 underline">Browse all money words</Link>
          </div>
        </div>
      )}
    </div>
  );
}
