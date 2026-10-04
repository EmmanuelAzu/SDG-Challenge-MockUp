import type { PilotCheck, PilotRun } from '@/lib/world/types';
import { CONFIDENCE, CORE, KNOWLEDGE, MISSIONS, UMUX, UNDERSTOOD, TIME_BUDGET_MIN, otherForm, type Form } from './instruments';

/* ---------- scoring ---------- */

export const formAt = (run: Pick<PilotRun, 'form'>, which: 'pre' | 'post'): Form => (which === 'pre' ? run.form : otherForm(run.form));

export function scoreCheck(run: Pick<PilotRun, 'form'>, which: 'pre' | 'post', check: PilotCheck | null) {
  if (!check) return null;
  const form = formAt(run, which);
  const perItem: Record<string, 0 | 1> = {};
  let score = 0;
  for (const item of KNOWLEDGE) { const ok = check.k[item.id] === item.forms[form].correct ? 1 : 0; perItem[item.id] = ok; score += ok; }
  const notSure = KNOWLEDGE.filter((i) => check.k[i.id] === -1).length;
  return { score, total: KNOWLEDGE.length, perItem, notSure };
}

export const confidenceMean = (c: PilotCheck | null) => (c && c.c.length ? c.c.reduce((a, b) => a + b, 0) / c.c.length : null);
export const umuxScore = (u: [number, number]) => Math.round(((u[0] - 1 + (u[1] - 1)) / 12) * 1000) / 10; // 0–100
export const totalMs = (r: PilotRun) => (r.finishedAt ? new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime() : null);
export const missionMs = (r: PilotRun, id: string) => { const m = r.missions[id]; return m?.startedAt && m.doneAt ? Math.max(0, new Date(m.doneAt).getTime() - new Date(m.startedAt).getTime()) : null; };
export const coreDone = (r: PilotRun) => CORE.every((m) => !!r.missions[m.id]?.doneAt);

/* ---------- small stats ---------- */

const T975: Record<number, number> = { 1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228, 11: 2.201, 12: 2.179, 13: 2.16, 14: 2.145, 15: 2.131, 16: 2.12, 17: 2.11, 18: 2.101, 19: 2.093, 20: 2.086, 21: 2.08, 22: 2.074, 23: 2.069, 24: 2.064, 25: 2.06, 26: 2.056, 27: 2.052, 28: 2.048, 29: 2.045, 30: 2.042 };
export const tCrit = (df: number) => (df <= 0 ? NaN : df <= 30 ? T975[df] : df <= 40 ? 2.021 : df <= 60 ? 2.0 : df <= 120 ? 1.98 : 1.96);
export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
export const sd = (xs: number[]) => { if (xs.length < 2) return NaN; const m = mean(xs); return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1)); };
export const median = (xs: number[]) => { if (!xs.length) return NaN; const s = [...xs].sort((a, b) => a - b); const h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
export const round = (x: number, d = 2) => (Number.isFinite(x) ? Math.round(x * 10 ** d) / 10 ** d : NaN);
const f2 = (x: number) => (Number.isFinite(x) ? String(round(x, 2)) : '–');
const sgn = (x: number) => (x >= 0 ? '+' : '') + f2(x);

export function paired(diffs: number[]) {
  const n = diffs.length; const m = mean(diffs); const s = sd(diffs);
  const half = n > 1 ? tCrit(n - 1) * (s / Math.sqrt(n)) : NaN;
  return { n, mean: m, sd: s, ci: [m - half, m + half] as [number, number], dz: s > 0 ? m / s : NaN, improved: diffs.filter((d) => d > 0).length, same: diffs.filter((d) => d === 0).length, declined: diffs.filter((d) => d < 0).length };
}

/* ---------- summary ---------- */

export type Verdict = { id: string; label: string; target: string; value: string; pass: boolean | null };

export function summarize(runs: PilotRun[]) {
  const n = runs.length;
  const done = runs.filter((r) => r.stage === 'done');
  const finishedCore = runs.filter((r) => r.stage === 'done' && coreDone(r));
  const times = done.map(totalMs).filter((x): x is number => x != null).map((ms) => ms / 60000);

  const pairs = runs.map((r) => ({ r, pre: scoreCheck(r, 'pre', r.pre), post: scoreCheck(r, 'post', r.post) })).filter((p) => p.pre && p.post) as { r: PilotRun; pre: NonNullable<ReturnType<typeof scoreCheck>>; post: NonNullable<ReturnType<typeof scoreCheck>> }[];
  const k = paired(pairs.map((p) => p.post.score - p.pre.score));
  const byItem = KNOWLEDGE.map((i) => {
    const pre = pairs.length ? pairs.filter((p) => p.pre.perItem[i.id]).length / pairs.length : NaN;
    const post = pairs.length ? pairs.filter((p) => p.post.perItem[i.id]).length / pairs.length : NaN;
    return { id: i.id, concept: i.concept, taughtIn: i.taughtIn, pre, post, gain: post - pre };
  });
  const byForm = (['A', 'B'] as Form[]).map((f) => ({
    form: f,
    preMean: mean(pairs.filter((p) => formAt(p.r, 'pre') === f).map((p) => p.pre.score)),
    preN: pairs.filter((p) => formAt(p.r, 'pre') === f).length,
    postMean: mean(pairs.filter((p) => formAt(p.r, 'post') === f).map((p) => p.post.score)),
    postN: pairs.filter((p) => formAt(p.r, 'post') === f).length,
  }));

  const cpairs = runs.filter((r) => r.pre && r.post && r.pre.c.length && r.post.c.length);
  const conf = paired(cpairs.map((r) => confidenceMean(r.post)! - confidenceMean(r.pre)!));
  const confItems = CONFIDENCE.map((text, i) => ({ text, pre: mean(cpairs.map((r) => r.pre!.c[i])), post: mean(cpairs.map((r) => r.post!.c[i])) }));

  const missions = MISSIONS.map((m) => {
    const attempted = runs.filter((r) => r.missions[m.id]?.startedAt || r.missions[m.id]?.doneAt);
    const succeeded = attempted.filter((r) => r.missions[m.id]?.doneAt);
    const secs = succeeded.map((r) => missionMs(r, m.id)).filter((x): x is number => x != null).map((ms) => ms / 1000);
    const seqs = runs.map((r) => r.missions[m.id]?.seq).filter((x): x is number => typeof x === 'number');
    return { id: m.id, title: m.title, core: m.core, attempted: attempted.length, succeeded: succeeded.length, successRate: attempted.length ? succeeded.length / attempted.length : NaN, medianSec: median(secs), seqMean: mean(seqs), seqN: seqs.length };
  });

  const surveys = runs.filter((r) => r.survey);
  const sv = surveys.map((r) => r.survey!);
  const umuxScores = sv.map((s) => umuxScore(s.umux));
  const nps = sv.map((s) => s.nps);
  const promoters = nps.filter((x) => x >= 9).length; const detractors = nps.filter((x) => x <= 6).length;
  const useful: Record<string, number> = {}; sv.forEach((s) => { useful[s.useful] = (useful[s.useful] ?? 0) + 1; });
  const safety = sv.map((s) => s.safety).filter((x): x is number => x != null);
  const fu = runs.filter((r) => r.followUp);

  const usability = {
    n: sv.length,
    umuxMean: mean(umuxScores),
    umuxItems: UMUX.map((text, i) => ({ text, mean: mean(sv.map((s) => s.umux[i])) })),
    nps: { n: nps.length, score: nps.length ? Math.round(((promoters - detractors) / nps.length) * 100) : NaN, promoters, detractors, passives: nps.length - promoters - detractors },
    safetyMean: mean(safety), safetyN: safety.length,
    understoodPct: sv.length ? sv.filter((s) => s.understood === UNDERSTOOD.correct).length / sv.length : NaN,
    againYes: sv.filter((s) => s.again === 'yes').length, againMaybe: sv.filter((s) => s.again === 'maybe').length, againNo: sv.filter((s) => s.again === 'no').length,
    useful,
    liked: sv.map((s) => s.liked).filter(Boolean), confusing: sv.map((s) => s.confusing).filter(Boolean),
  };

  const timeStats = { n: times.length, median: median(times), mean: mean(times), within: times.length ? times.filter((t) => t <= TIME_BUDGET_MIN).length / times.length : NaN };
  const core = CORE.map((m) => missions.find((x) => x.id === m.id)!);

  const small = n < 10;
  const verdicts: Verdict[] = [
    { id: 'completion', label: 'Finished the core path', target: '≥ 80% of testers', value: n ? `${Math.round((finishedCore.length / n) * 100)}% (${finishedCore.length} of ${n})` : '–', pass: n ? finishedCore.length / n >= 0.8 : null },
    { id: 'time', label: 'Finished within 10 minutes', target: '≥ 75% of finishers', value: Number.isFinite(timeStats.within) ? `${Math.round(timeStats.within * 100)}% · median ${round(timeStats.median, 1)} min` : '–', pass: Number.isFinite(timeStats.within) ? timeStats.within >= 0.75 : null },
    { id: 'knowledge', label: 'Knowledge gain (of 6)', target: 'mean ≥ +1.0 and CI above 0', value: k.n ? `${sgn(k.mean)} (95% CI ${f2(k.ci[0])} to ${f2(k.ci[1])}), n=${k.n}` : '–', pass: k.n >= 2 ? k.mean >= 1 && k.ci[0] > 0 : null },
    { id: 'confidence', label: 'Confidence gain (1–5)', target: 'mean ≥ +0.3', value: conf.n ? `${sgn(conf.mean)} (95% CI ${f2(conf.ci[0])} to ${f2(conf.ci[1])}), n=${conf.n}` : '–', pass: conf.n >= 2 ? conf.mean >= 0.3 : null },
    { id: 'usability', label: 'Usability (UMUX-Lite, 0–100)', target: '≥ 68', value: Number.isFinite(usability.umuxMean) ? `${round(usability.umuxMean, 1)}` : '–', pass: Number.isFinite(usability.umuxMean) ? usability.umuxMean >= 68 : null },
    { id: 'tasks', label: 'Core tasks: success and ease', target: 'each ≥ 80% success and SEQ ≥ 5.5', value: core.every((c) => c.attempted) ? core.map((c) => `${c.id} ${Math.round(c.successRate * 100)}%/${Number.isFinite(c.seqMean) ? round(c.seqMean, 1) : '–'}`).join(' · ') : '–', pass: core.every((c) => c.attempted && c.seqN) ? core.every((c) => c.successRate >= 0.8 && c.seqMean >= 5.5) : null },
    { id: 'safety', label: 'Felt comfortable in the community (1–5)', target: 'mean ≥ 4.0', value: usability.safetyN ? `${round(usability.safetyMean, 1)} (n=${usability.safetyN})` : '–', pass: usability.safetyN ? usability.safetyMean >= 4 : null },
    { id: 'understood', label: 'Understood “education, not advice”', target: '≥ 90%', value: Number.isFinite(usability.understoodPct) ? `${Math.round(usability.understoodPct * 100)}%` : '–', pass: Number.isFinite(usability.understoodPct) ? usability.understoodPct >= 0.9 : null },
    { id: 'intent', label: 'Would use again (yes or maybe)', target: '≥ 70%', value: usability.n ? `${Math.round(((usability.againYes + usability.againMaybe) / usability.n) * 100)}%` : '–', pass: usability.n ? (usability.againYes + usability.againMaybe) / usability.n >= 0.7 : null },
  ];

  if (n < 5) verdicts.forEach((v) => { v.pass = null; }); // too few testers to call anything met or not met

  return {
    n, done: done.length, finishedCore: finishedCore.length, small, exploratory: n < 30,
    time: timeStats, knowledge: { ...k, byItem, byForm, notSurePre: pairs.length ? mean(pairs.map((p) => p.pre.notSure)) : NaN, notSurePost: pairs.length ? mean(pairs.map((p) => p.post.notSure)) : NaN, preMean: mean(pairs.map((p) => p.pre.score)), postMean: mean(pairs.map((p) => p.post.score)) },
    confidence: { ...conf, items: confItems, preMean: mean(cpairs.map((r) => confidenceMean(r.pre)!)), postMean: mean(cpairs.map((r) => confidenceMean(r.post)!)) },
    missions, usability,
    followUp: { n: fu.length, usedAgain: fu.filter((r) => r.followUp!.usedAgain === 'yes').length, did: fu.reduce<Record<string, number>>((acc, r) => { r.followUp!.did.forEach((d) => { acc[d] = (acc[d] ?? 0) + 1; }); return acc; }, {}) },
    verdicts,
  };
}

/* ---------- CSV export (one row per participant, no personal data) ---------- */

const q = (v: unknown) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

export function toCsv(runs: PilotRun[]): string {
  const missionIds = MISSIONS.map((m) => m.id);
  const head = [
    'participant', 'simulated', 'path', 'device', 'age_band', 'status', 'experience', 'pre_form', 'stage', 'total_min', 'signup_min',
    'pre_score', 'post_score', 'gain', ...KNOWLEDGE.flatMap((i) => [`${i.id}_pre`, `${i.id}_post`]), 'pre_not_sure', 'post_not_sure',
    ...CONFIDENCE.flatMap((_, i) => [`conf${i + 1}_pre`, `conf${i + 1}_post`]), 'conf_pre_mean', 'conf_post_mean',
    ...missionIds.flatMap((id) => [`${id}_done`, `${id}_sec`, `${id}_seq`]),
    'umux1', 'umux2', 'umux_score', 'nps', 'safety', 'understood_correct', 'most_useful', 'use_again', 'liked', 'confusing',
    'fu_used_again', 'fu_actions', 'fu_conf_mean', 'fu_changed',
  ];
  const rows = runs.map((r) => {
    const pre = scoreCheck(r, 'pre', r.pre); const post = scoreCheck(r, 'post', r.post); const s = r.survey; const t = totalMs(r);
    return [
      r.id, r.simulated ? 1 : 0, r.path, r.device, r.profile?.ageBand ?? '', r.profile?.status ?? '', r.profile?.experience ?? '', r.form, r.stage, t != null ? round(t / 60000, 2) : '', round(r.signupMs / 60000, 2),
      pre?.score ?? '', post?.score ?? '', pre && post ? post.score - pre.score : '', ...KNOWLEDGE.flatMap((i) => [pre ? pre.perItem[i.id] : '', post ? post.perItem[i.id] : '']), pre?.notSure ?? '', post?.notSure ?? '',
      ...CONFIDENCE.flatMap((_, i) => [r.pre?.c[i] ?? '', r.post?.c[i] ?? '']), round(confidenceMean(r.pre) ?? NaN), round(confidenceMean(r.post) ?? NaN),
      ...missionIds.flatMap((id) => { const m = r.missions[id]; const ms = missionMs(r, id); return [m?.doneAt ? 1 : m?.startedAt ? 0 : '', ms != null ? Math.round(ms / 1000) : '', m?.seq ?? '']; }),
      s?.umux[0] ?? '', s?.umux[1] ?? '', s ? umuxScore(s.umux) : '', s?.nps ?? '', s?.safety ?? '', s ? (s.understood === UNDERSTOOD.correct ? 1 : 0) : '', s?.useful ?? '', s?.again ?? '', s?.liked ?? '', s?.confusing ?? '',
      r.followUp?.usedAgain ?? '', r.followUp ? r.followUp.did.join('; ') : '', r.followUp ? round(mean(r.followUp.c)) : '', r.followUp?.changed ?? '',
    ].map(q).join(',');
  });
  return [head.join(','), ...rows].join('\n');
}

/* ---------- results code: how a tester's anonymous answers reach the team ---------- */

const PREFIX_PLAIN = 'SISI1.';
const PREFIX_ZIP = 'SISI2.';
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

const str = (v: unknown, max = 400) => (typeof v === 'string' ? v.slice(0, max) : '');
const num = (v: unknown, lo: number, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : null);

/** Validates and cleans an imported run. Returns null when it is not a Sisi pilot code. */
export function cleanRun(x: any): PilotRun | null {
  if (!x || typeof x !== 'object' || typeof x.id !== 'string' || !/^P-[A-Z0-9]{6}$/.test(x.id) || (x.form !== 'A' && x.form !== 'B')) return null;
  const check = (c: any): PilotCheck | null => {
    if (!c || typeof c !== 'object' || typeof c.k !== 'object') return null;
    const k: Record<string, number> = {};
    for (const i of KNOWLEDGE) { const v = num(c.k[i.id], -1, 3); if (v == null) return null; k[i.id] = v; }
    return { k, c: Array.isArray(c.c) ? c.c.slice(0, CONFIDENCE.length).map((v: unknown) => num(v, 1, 5) ?? 3) : [], at: str(c.at, 40), ms: num(c.ms, 0, 3_600_000) ?? 0 };
  };
  const missions: PilotRun['missions'] = {};
  for (const m of MISSIONS) { const v = x.missions?.[m.id]; if (v) missions[m.id] = { startedAt: str(v.startedAt, 40) || undefined, doneAt: str(v.doneAt, 40) || undefined, auto: !!v.auto, seq: num(v.seq, 1, 7) ?? undefined }; }
  const s = x.survey;
  return {
    id: x.id, userId: null, path: x.path === 'full' ? 'full' : 'quick', form: x.form, consentAt: str(x.consentAt, 40), profile: x.profile ? { ageBand: str(x.profile.ageBand, 20), status: str(x.profile.status, 20), experience: str(x.profile.experience, 40) } : null,
    device: x.device === 'desktop' ? 'desktop' : 'mobile', stage: ['pre', 'missions', 'post', 'feedback', 'done'].includes(x.stage) ? x.stage : 'pre', startedAt: str(x.startedAt, 40), signupMs: num(x.signupMs, 0, 3_600_000) ?? 0, finishedAt: x.finishedAt ? str(x.finishedAt, 40) : null,
    pre: check(x.pre), post: check(x.post), missions,
    survey: s && Array.isArray(s.umux) ? { umux: [num(s.umux[0], 1, 7) ?? 4, num(s.umux[1], 1, 7) ?? 4], nps: num(s.nps, 0, 10) ?? 0, safety: num(s.safety, 1, 5), understood: num(s.understood, 0, 3) ?? 0, useful: str(s.useful, 40), again: s.again === 'yes' || s.again === 'no' ? s.again : 'maybe', liked: str(s.liked, 300), confusing: str(s.confusing, 300), at: str(s.at, 40) } : null,
    followUp: x.followUp ? { at: str(x.followUp.at, 40), usedAgain: x.followUp.usedAgain === 'yes' ? 'yes' : 'no', did: Array.isArray(x.followUp.did) ? x.followUp.did.slice(0, 6).map((d: unknown) => str(d, 80)) : [], c: Array.isArray(x.followUp.c) ? x.followUp.c.slice(0, 3).map((v: unknown) => num(v, 1, 5) ?? 3) : [], changed: str(x.followUp.changed, 300) } : null,
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
