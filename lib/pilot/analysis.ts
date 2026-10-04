import type { ChapterId, PilotRun } from '@/lib/world/types';
import { CHAPTERS, GUIDED_MINUTES, PEEK } from './journey';

/* ---------- small stats ---------- */

export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
export const median = (xs: number[]) => { if (!xs.length) return NaN; const s = [...xs].sort((a, b) => a - b); const h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
export const round = (x: number, d = 2) => (Number.isFinite(x) ? Math.round(x * 10 ** d) / 10 ** d : NaN);

export const totalMs = (r: PilotRun) => (r.finishedAt ? new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime() : null);
export const chapterMs = (r: PilotRun, id: ChapterId) => { const c = r.chapters[id]; return c?.startedAt && c.doneAt ? Math.max(0, new Date(c.doneAt).getTime() - new Date(c.startedAt).getTime()) : null; };
export const allDone = (r: PilotRun) => CHAPTERS.every((c) => !!r.chapters[c.id]?.doneAt);

/* ---------- summary ---------- */

export type Verdict = { id: string; label: string; target: string; value: string; pass: boolean | null };
const pct = (n: number, d: number) => (d ? n / d : NaN);

export function summarize(runs: PilotRun[]) {
  const n = runs.length;
  const done = runs.filter((r) => r.stage === 'done' && allDone(r));
  const times = done.map(totalMs).filter((x): x is number => x != null).map((ms) => ms / 60000);
  const within = times.length ? times.filter((t) => t <= GUIDED_MINUTES).length / times.length : NaN;

  const chapters = CHAPTERS.map((c) => {
    const started = runs.filter((r) => r.chapters[c.id]?.startedAt);
    const finished = runs.filter((r) => r.chapters[c.id]?.doneAt);
    const secs = runs.map((r) => chapterMs(r, c.id)).filter((x): x is number => x != null).map((ms) => ms / 1000);
    const rx = runs.map((r) => r.chapters[c.id]?.reaction).filter((x): x is 1 | 2 | 3 => !!x);
    return { id: c.id, label: c.label, title: c.title, started: started.length, finished: finished.length, completion: pct(finished.length, started.length), medianSec: median(secs), reactions: { loved: rx.filter((x) => x === 1).length, okay: rx.filter((x) => x === 2).length, notForMe: rx.filter((x) => x === 3).length, n: rx.length } };
  });

  const quiz = runs.map((r) => r.facts.quizScore).filter((x): x is number => typeof x === 'number');
  const budgetTried = runs.filter((r) => r.chapters.do?.startedAt);
  const reward = { cash: runs.filter((r) => r.facts.rewardChoice === 'cash').length, credit: runs.filter((r) => r.facts.rewardChoice === 'credit').length };
  const targets: Record<string, number> = {}; runs.forEach((r) => { if (r.facts.weeklyTarget) targets[String(r.facts.weeklyTarget)] = (targets[String(r.facts.weeklyTarget)] ?? 0) + 1; });
  const connectTried = runs.filter((r) => r.chapters.connect?.startedAt);
  const peeked: Record<string, number> = {}; runs.forEach((r) => r.peeked.forEach((id) => { peeked[id] = (peeked[id] ?? 0) + 1; }));
  const points = runs.map((r) => r.facts.points).filter((x): x is number => typeof x === 'number');

  const facts = {
    quiz: { n: quiz.length, mean: mean(quiz), passRate: quiz.length ? quiz.filter((q) => q >= 67).length / quiz.length : NaN, retried: runs.filter((r) => (r.facts.quizAttempts ?? 0) > 1).length },
    budget: { tried: budgetTried.length, ok: runs.filter((r) => r.facts.budgetOk).length, rate: pct(runs.filter((r) => r.facts.budgetOk).length, budgetTried.length) },
    reward, targets,
    connect: { tried: connectTried.length, message: runs.filter((r) => r.facts.messageSent).length, buddy: runs.filter((r) => r.facts.buddyStarted).length, nudged: runs.filter((r) => r.facts.nudged).length },
    peeked: PEEK.map((p) => ({ id: p.id, title: p.title, n: peeked[p.id] ?? 0 })),
    pointsMean: mean(points),
    device: { mobile: runs.filter((r) => r.device === 'mobile').length, desktop: runs.filter((r) => r.device === 'desktop').length },
  };

  const reacted = chapters.filter((c) => c.reactions.n);
  const positiveAll = reacted.length ? reacted.every((c) => (c.reactions.loved + c.reactions.okay) / c.reactions.n >= 0.8) : null;
  const verdicts: Verdict[] = [
    { id: 'completion', label: 'Finished all five chapters', target: '≥ 80% of testers', value: n ? `${Math.round((done.length / n) * 100)}% (${done.length} of ${n})` : '–', pass: n ? done.length / n >= 0.8 : null },
    { id: 'time', label: `Finished within ${GUIDED_MINUTES} minutes`, target: '≥ 75% of finishers', value: Number.isFinite(within) ? `${Math.round(within * 100)}% · median ${round(median(times), 1)} min` : '–', pass: Number.isFinite(within) ? within >= 0.75 : null },
    { id: 'quiz', label: 'Passed the lesson quiz (2 of 3 or better)', target: '≥ 70% of testers', value: quiz.length ? `${Math.round(facts.quiz.passRate * 100)}% · mean score ${round(facts.quiz.mean, 0)}%` : '–', pass: quiz.length ? facts.quiz.passRate >= 0.7 : null },
    { id: 'budget', label: 'Fixed the budget scenario', target: '≥ 80% of those who tried', value: facts.budget.tried ? `${Math.round(facts.budget.rate * 100)}% (${facts.budget.ok} of ${facts.budget.tried})` : '–', pass: facts.budget.tried ? facts.budget.rate >= 0.8 : null },
    { id: 'connect', label: 'Said hello and started a Money Buddy', target: '≥ 70% of those who tried', value: facts.connect.tried ? `${Math.round((runs.filter((r) => r.facts.messageSent && r.facts.buddyStarted).length / facts.connect.tried) * 100)}%` : '–', pass: facts.connect.tried ? runs.filter((r) => r.facts.messageSent && r.facts.buddyStarted).length / facts.connect.tried >= 0.7 : null },
    { id: 'reactions', label: 'Every chapter “Loved it” or “It was okay”', target: '≥ 80% for each chapter', value: reacted.length ? reacted.map((c) => `${c.label} ${Math.round(((c.reactions.loved + c.reactions.okay) / c.reactions.n) * 100)}%`).join(' · ') : '–', pass: positiveAll },
  ];
  if (n < 5) verdicts.forEach((v) => { v.pass = null; }); // too few testers to call anything met or not met

  return { n, done: done.length, small: n < 10, exploratory: n < 30, time: { n: times.length, median: median(times), mean: mean(times), within }, chapters, facts, verdicts };
}

/* ---------- CSV export (one row per participant, no personal data) ---------- */

const q = (v: unknown) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

export function toCsv(runs: PilotRun[]): string {
  const ch = CHAPTERS.flatMap((c) => [`${c.id}_done`, `${c.id}_sec`, `${c.id}_reaction`]);
  const head = ['participant', 'simulated', 'path', 'device', 'age_band', 'status', 'experience', 'stage', 'total_min', ...ch, 'quiz_score', 'quiz_attempts', 'budget_ok', 'weekly_target', 'reward_choice', 'message_sent', 'buddy_started', 'nudged', 'points', 'level', 'badges', 'peeked'];
  const rows = runs.map((r) => {
    const t = totalMs(r); const f = r.facts;
    return [
      r.id, r.simulated ? 1 : 0, r.path, r.device, r.profile?.ageBand ?? '', r.profile?.status ?? '', r.profile?.experience ?? '', r.stage, t != null ? round(t / 60000, 2) : '',
      ...CHAPTERS.flatMap((c) => { const x = r.chapters[c.id]; const ms = chapterMs(r, c.id); return [x?.doneAt ? 1 : x?.startedAt ? 0 : '', ms != null ? Math.round(ms / 1000) : '', x?.reaction ?? '']; }),
      f.quizScore ?? '', f.quizAttempts ?? '', f.budgetOk == null ? '' : f.budgetOk ? 1 : 0, f.weeklyTarget ?? '', f.rewardChoice ?? '', f.messageSent ? 1 : 0, f.buddyStarted ? 1 : 0, f.nudged ? 1 : 0, f.points ?? '', f.level ?? '', (f.badges ?? []).join('; '), r.peeked.join('; '),
    ].map(q).join(',');
  });
  return [head.join(','), ...rows].join('\n');
}

/* ---------- results code: how a tester's anonymous record reaches the team ---------- */

const PREFIX_PLAIN = 'SISI1.';
const PREFIX_ZIP = 'SISI3.'; // v3: guided journey. Older SISI2 codes (the checklist pilot) are not accepted.
const toB64 = (u8: Uint8Array) => { let s = ''; for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const fromB64 = (b: string) => { const s = atob(b.replace(/-/g, '+').replace(/_/g, '/')); const u8 = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i); return u8; };

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const blob = new Blob([bytes as BlobPart]).stream().pipeThrough(stream as unknown as ReadableWritablePair<Uint8Array, Uint8Array>);
  return new Uint8Array(await new Response(blob).arrayBuffer());
}

/** Anonymous export: no account id, no name, no email. */
export function anonymise(run: PilotRun): PilotRun {
  const copy: PilotRun = { ...run, userId: null };
  delete copy.simulated;
  return copy;
}

export async function encodeRun(run: PilotRun): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(anonymise(run)));
  if (typeof CompressionStream !== 'undefined') {
    try { return PREFIX_ZIP + toB64(await pipe(bytes, new CompressionStream('deflate-raw'))); } catch { /* fall through */ }
  }
  return PREFIX_PLAIN + toB64(bytes);
}

const str = (v: unknown, max = 60) => (typeof v === 'string' ? v.slice(0, max) : '');
const num = (v: unknown, lo: number, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : undefined);
const bool = (v: unknown) => (typeof v === 'boolean' ? v : undefined);

/** Validates and cleans an imported run. Returns null when it is not a Sisi pilot code. */
export function cleanRun(x: any): PilotRun | null {
  if (!x || typeof x !== 'object' || typeof x.id !== 'string' || !/^[A-Z0-9]{4}$/.test(x.id) || typeof x.chapters !== 'object') return null;
  const chapters: PilotRun['chapters'] = {};
  for (const c of CHAPTERS) { const v = x.chapters?.[c.id]; if (v) chapters[c.id] = { startedAt: str(v.startedAt) || undefined, doneAt: str(v.doneAt) || undefined, reaction: [1, 2, 3].includes(v.reaction) ? v.reaction : undefined, seen: v.seen === true }; }
  const f = x.facts ?? {};
  return {
    id: x.id, userId: null, path: x.path === 'account' ? 'account' : 'quick', consentAt: str(x.consentAt), profile: x.profile ? { ageBand: str(x.profile.ageBand, 20), status: str(x.profile.status, 20), experience: str(x.profile.experience, 40) } : null,
    device: x.device === 'desktop' ? 'desktop' : 'mobile', stage: x.stage === 'done' ? 'done' : 'story', startedAt: str(x.startedAt), finishedAt: x.finishedAt ? str(x.finishedAt) : null, chapters,
    facts: {
      quizScore: f.quizScore === null ? null : num(f.quizScore, 0, 100), quizAttempts: num(f.quizAttempts, 0, 50), budgetOk: bool(f.budgetOk), weeklyTarget: num(f.weeklyTarget, 1, 3),
      rewardChoice: f.rewardChoice === 'cash' || f.rewardChoice === 'credit' ? f.rewardChoice : undefined, messageSent: bool(f.messageSent), buddyStarted: bool(f.buddyStarted), nudged: bool(f.nudged),
      points: num(f.points, 0, 100000), level: str(f.level, 20) || undefined, badges: Array.isArray(f.badges) ? f.badges.slice(0, 30).map((b: unknown) => str(b, 40)) : undefined,
    },
    peeked: Array.isArray(x.peeked) ? x.peeked.slice(0, 12).map((p: unknown) => str(p, 20)) : [],
  };
}

export async function decodeRun(code: string): Promise<PilotRun | null> {
  const c = code.trim();
  try {
    let bytes: Uint8Array;
    if (c.startsWith(PREFIX_ZIP)) bytes = await pipe(fromB64(c.slice(PREFIX_ZIP.length)), new DecompressionStream('deflate-raw'));
    else if (c.startsWith(PREFIX_PLAIN)) bytes = fromB64(c.slice(PREFIX_PLAIN.length));
    else return null;
    return cleanRun(JSON.parse(new TextDecoder().decode(bytes)));
  } catch { return null; }
}
