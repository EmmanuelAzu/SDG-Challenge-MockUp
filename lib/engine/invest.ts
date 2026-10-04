import type { Earned, InvestState, World } from '@/lib/world/types';
import { clampNum } from '@/lib/money';
import { earning } from './actions';
import { award } from './award';
import { track } from './helpers';

export const MIN_MONTHLY = 50, MAX_MONTHLY = 500, DEFAULT_MONTHLY = 200;
export const MIN_YEARS = 1, MAX_YEARS = 20, DEFAULT_YEARS = 10;
export const RATE_PRESETS = [6, 8, 10] as const;
export const DEFAULT_RATE = 8;
export const BANNER = 'SIMULATION — no real money. Illustrative returns, not a forecast. Education, not financial advice.';

export const AFFORDABILITY = [
  { id: 'emergency', q: 'Have you started an emergency fund?', options: [['yes', 'Yes, I have started'], ['not-yet', 'Not yet']] },
  { id: 'debt', q: 'Do you owe on store cards or loans with high interest?', options: [['no', 'No'], ['yes', 'Yes']] },
  { id: 'horizon', q: 'Could you leave this money alone for 5 years or more?', options: [['yes', 'Yes'], ['maybe', 'Maybe'], ['no', 'No, I may need it sooner']] },
  { id: 'income', q: 'Do you have some regular money coming in, even a small amount?', options: [['yes', 'Yes'], ['no', 'Not right now']] },
] as const;

export const EXPLAINERS = [
  { id: 'tfsa', title: 'TFSA', line: 'A tax-free container', body: 'A tax-free savings account (TFSA) lets what your money earns grow without being taxed, within yearly and lifetime SARS limits. It is a container: you choose what goes inside, such as savings or a unit trust. Going over the limits means a tax penalty, so always check the current limits on the SARS website and the provider’s fees.', good: 'Medium to long-term goals you will not touch soon.', watch: 'Contribution limits, and fees that eat growth.' },
  { id: 'unit-trust', title: 'Unit trust', line: 'A pooled fund', body: 'A unit trust pools money from many people. A manager invests it in shares, bonds or cash, and you own units of the fund. You can often start with a small monthly amount, but the value goes up and down. Ask for the total yearly fee (the TER) before you choose.', good: 'Growth over five years or more, if you can ride out ups and downs.', watch: 'Total yearly fees, and the risk of short-term falls.' },
  { id: 'ra', title: 'Retirement annuity', line: 'Locked for later', body: 'A retirement annuity (RA) is a long-term retirement product. Contributions can reduce your taxable income within limits, but the money is locked until retirement age with few exceptions. It helps most once you earn a taxable salary.', good: 'Long-term retirement saving.', watch: 'Access is limited, and fees vary a lot.' },
] as const;

export const CHECKLIST = [
  { id: 'compare-tfsa', label: 'Compare two TFSA providers’ fees on their websites (no sign-up needed)' },
  { id: 'check-fees', label: 'Write down the total yearly fee for one fund you are curious about' },
  { id: 'debit-order', label: 'Decide the day after payday you would set a small debit order' },
  { id: 'check-regulator', label: 'Check that a provider is on the FSCA register before you give them money' },
] as const;
export const CHECKLIST_REQUIRED = 3;

export type Series = { year: number; contributions: number; growth: number; total: number }[];

/** Monthly compounding, contributions at the end of each month. Returns one point per year (plus year 0). */
export function compound(monthly: number, years: number, annualRatePct: number): Series {
  const r = annualRatePct / 100 / 12;
  let bal = 0;
  const out: Series = [{ year: 0, contributions: 0, growth: 0, total: 0 }];
  for (let m = 1; m <= years * 12; m++) {
    bal = bal * (1 + r) + monthly;
    if (m % 12 === 0) { const contributions = monthly * m; out.push({ year: m / 12, contributions, growth: Math.round(bal - contributions), total: Math.round(bal) }); }
  }
  return out;
}

export type Readiness = { level: 'ready' | 'almost' | 'not-yet'; message: string; tips: string[] };
/** A friendly guide, never advice. Nothing here stores or asks for amounts. */
export function readiness(a: Record<string, string>): Readiness {
  const tips: string[] = [];
  if (a.emergency !== 'yes') tips.push('Start your emergency fund first. Even R500 is a strong start.');
  if (a.debt === 'yes') tips.push('High-interest debt usually costs more than investments earn, so paying it down comes first.');
  if (a.horizon === 'no') tips.push('Money you may need soon belongs in savings, not investments.');
  else if (a.horizon === 'maybe') tips.push('Only invest the part you are sure you will not need for five years or more.');
  if (a.income === 'no') tips.push('Investing works best with a regular amount coming in. A tiny monthly amount is enough.');
  const level = tips.length === 0 ? 'ready' : tips.length <= 1 && a.debt !== 'yes' && a.emergency === 'yes' ? 'almost' : 'not-yet';
  return {
    level, tips,
    message: level === 'ready' ? 'You look ready to explore a small first step.' : level === 'almost' ? 'Nearly there. One thing to keep in mind.' : 'You can still explore the simulator for learning. Real money can wait until a few things are in place.',
  };
}

export const emptyInvest = (now: Date): InvestState => ({ affordability: {}, monthly: DEFAULT_MONTHLY, years: DEFAULT_YEARS, rate: DEFAULT_RATE, explainersSeen: [], simulated: false, simRuns: 0, checklist: [], startedAt: now.toISOString(), finishedAt: null });

export function ensureInvest(w: World, userId: string, now: Date): InvestState {
  if (!w.invest[userId]) { w.invest[userId] = emptyInvest(now); track(w, userId, 'invest_started', {}, now); }
  return w.invest[userId];
}

export const steps = (s: InvestState) => ({
  affordability: AFFORDABILITY.every((q) => !!s.affordability[q.id]),
  explainers: EXPLAINERS.every((e) => s.explainersSeen.includes(e.id)),
  simulator: s.simulated,
  checklist: s.checklist.length >= CHECKLIST_REQUIRED,
});
export const stepsDone = (s: InvestState) => Object.values(steps(s)).filter(Boolean).length;

export function setAnswer(w: World, userId: string, id: string, value: string, now: Date) {
  const q = AFFORDABILITY.find((x) => x.id === id);
  if (!q || !(q.options as readonly (readonly [string, string])[]).some(([v]) => v === value)) return;
  ensureInvest(w, userId, now).affordability[id] = value;
}
export function setPlan(w: World, userId: string, o: { monthly?: number; years?: number; rate?: number }, now: Date) {
  const s = ensureInvest(w, userId, now);
  if (o.monthly !== undefined) s.monthly = Math.round(clampNum(o.monthly, MIN_MONTHLY, MAX_MONTHLY) / 10) * 10;
  if (o.years !== undefined) s.years = Math.round(clampNum(o.years, MIN_YEARS, MAX_YEARS));
  if (o.rate !== undefined) s.rate = (RATE_PRESETS as readonly number[]).includes(o.rate) ? o.rate : DEFAULT_RATE;
}
export function seeExplainer(w: World, userId: string, id: string, now: Date) {
  const s = ensureInvest(w, userId, now);
  if (EXPLAINERS.some((e) => e.id === id) && !s.explainersSeen.includes(id)) s.explainersSeen.push(id);
}
/** Called when the user runs the simulator (counts as finishing that step). */
export function runSimulator(w: World, userId: string, now: Date) {
  const s = ensureInvest(w, userId, now);
  s.simRuns++;
  if (!s.simulated) { s.simulated = true; track(w, userId, 'simulator_finished', {}, now); }
}
export function toggleChecklist(w: World, userId: string, id: string, now: Date) {
  const s = ensureInvest(w, userId, now);
  if (!CHECKLIST.some((c) => c.id === id)) return;
  s.checklist = s.checklist.includes(id) ? s.checklist.filter((x) => x !== id) : [...s.checklist, id];
  if (s.checklist.length >= CHECKLIST_REQUIRED) track(w, userId, 'invest_checklist_done', {}, now);
}

/** Finishing every step awards Investor Ready (once). */
export function finishInvest(w: World, userId: string, now: Date): { ok: true; earned: Earned } | { ok: false; error: string } {
  const s = ensureInvest(w, userId, now);
  if (stepsDone(s) < 4) return { ok: false, error: 'Finish every step first: readiness check, the three explainers, the simulator and the checklist.' };
  const earned = earning(w, userId, now, () => {
    s.finishedAt ??= now.toISOString();
    award(w, { userId, source: 'invest_done', sourceId: 'invest-her', points: 0, now });
  });
  return { ok: true, earned };
}
