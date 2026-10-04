import type { BudgetCategory, Earned, PayslipRun, World } from '@/lib/world/types';
import { TAX_ZA } from '@/config/tax-za';
import { clampNum } from '@/lib/money';
import { earning } from './actions';
import { award } from './award';
import { track, uid } from './helpers';

export const PRESETS = [8000, 12000, 18000, 25000, 40000] as const;

export function annualTax(taxableAnnual: number): number {
  const t = Math.max(0, taxableAnnual);
  const b = [...TAX_ZA.brackets].reverse().find((x) => t > x.over) ?? TAX_ZA.brackets[0];
  return Math.max(0, b.base + b.rate * (t - b.over) - TAX_ZA.primaryRebate);
}

export type Payslip = { gross: number; retirement: number; taxable: number; paye: number; uif: number; net: number; deductions: number };

/** Illustrative monthly payslip. Retirement is taken before tax; UIF is on earnings up to the ceiling. */
export function calcPayslip(grossMonthly: number, retirementPct: number): Payslip {
  const gross = clampNum(grossMonthly, 0, 10_000_000);
  const pct = clampNum(retirementPct, 0, TAX_ZA.retirement.sliderMaxPct) / 100;
  const retirement = Math.min(gross * pct, gross * TAX_ZA.retirement.maxShare, TAX_ZA.retirement.annualCap / 12);
  const taxable = Math.max(0, (gross - retirement) * 12);
  const paye = annualTax(taxable) / 12;
  const uif = Math.min(gross, TAX_ZA.uif.monthlyCeiling) * TAX_ZA.uif.rate;
  const net = gross - paye - uif - retirement;
  return { gross, retirement, taxable, paye, uif, net, deductions: paye + uif + retirement };
}

/** Starting allocation of net pay, as a share of net. */
export const ALLOCATION_START: Record<BudgetCategory, number> = { rent: 0.3, transport: 0.1, groceries: 0.15, utilities: 0.08, family: 0.05, emergency: 0.1, investing: 0.07, fun: 0.07 };
export function startingAllocation(net: number): Record<BudgetCategory, number> {
  const out = {} as Record<BudgetCategory, number>;
  (Object.keys(ALLOCATION_START) as BudgetCategory[]).forEach((k) => { out[k] = Math.round((net * ALLOCATION_START[k]) / 10) * 10; });
  return out;
}
export const leftToAllocate = (net: number, alloc: Record<BudgetCategory, number>) => Math.round(net) - Object.values(alloc).reduce((a, b) => a + b, 0);

/** Saves a scenario. It only counts once the allocation reaches R0 left; the first save is an action (+15) and earns Payslip Pro. */
export function savePayslipRun(w: World, userId: string, o: { gross: number; retirementPct: number; allocation: Record<BudgetCategory, number> }, now: Date): { ok: true; run: PayslipRun; earned: Earned } | { ok: false; error: string } {
  const p = calcPayslip(o.gross, o.retirementPct);
  if (p.gross <= 0) return { ok: false, error: 'Enter a gross monthly salary first.' };
  const allocation = {} as Record<BudgetCategory, number>;
  (Object.keys(ALLOCATION_START) as BudgetCategory[]).forEach((k) => { allocation[k] = clampNum(o.allocation[k] ?? 0, 0, 10_000_000); });
  if (leftToAllocate(p.net, allocation) !== 0) return { ok: false, error: 'Give every rand a job first: the “left to allocate” counter must reach R0.' };
  const run: PayslipRun = { id: uid('ps'), gross: p.gross, retirementPct: clampNum(o.retirementPct, 0, TAX_ZA.retirement.sliderMaxPct), allocation, at: now.toISOString() };
  const list = (w.payslipRuns[userId] ??= []);
  list.unshift(run);
  w.payslipRuns[userId] = list.slice(0, 5);
  track(w, userId, 'payslip_sim_saved', {}, now); // never the amounts
  const earned = earning(w, userId, now, () => {
    award(w, { userId, source: 'action', sourceId: 'payslip-sim', now });
    award(w, { userId, source: 'payslip_done', sourceId: 'payslip-sim', points: 0, now });
  });
  return { ok: true, run, earned };
}
