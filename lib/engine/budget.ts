import type { Budget, BudgetCategory, Earned, World } from '@/lib/world/types';
import { clampNum } from '@/lib/money';
import { completeAction } from './actions';
import { track } from './helpers';

export const CATEGORIES: { id: BudgetCategory; label: string; group: 'needs' | 'wants' | 'saving'; emoji: string }[] = [
  { id: 'rent', label: 'Rent / accommodation', group: 'needs', emoji: '🏠' },
  { id: 'transport', label: 'Transport', group: 'needs', emoji: '🚌' },
  { id: 'groceries', label: 'Groceries', group: 'needs', emoji: '🛒' },
  { id: 'utilities', label: 'Electricity & data', group: 'needs', emoji: '💡' },
  { id: 'family', label: 'Family support', group: 'needs', emoji: '👪' },
  { id: 'emergency', label: 'Emergency savings', group: 'saving', emoji: '🛟' },
  { id: 'investing', label: 'Investing', group: 'saving', emoji: '🌱' },
  { id: 'fun', label: 'Fun', group: 'wants', emoji: '🎉' },
];

export type Template = { id: string; name: string; blurb: string; income: number; pct: Record<BudgetCategory, number> };
/** Starting points in percent of take-home. Example incomes only: change them to yours. */
export const TEMPLATES: Template[] = [
  { id: 'allowance', name: 'Allowance', blurb: 'Money from family each month', income: 3000, pct: { rent: 25, transport: 10, groceries: 25, utilities: 10, family: 0, emergency: 10, investing: 0, fun: 10 } },
  { id: 'nsfas', name: 'NSFAS / bursary', blurb: 'A funded living allowance', income: 3500, pct: { rent: 0, transport: 10, groceries: 30, utilities: 10, family: 5, emergency: 10, investing: 0, fun: 10 } },
  { id: 'part-time', name: 'Part-time work', blurb: 'Shifts, tutoring or a side hustle', income: 4500, pct: { rent: 30, transport: 12, groceries: 20, utilities: 8, family: 5, emergency: 10, investing: 3, fun: 7 } },
  { id: 'first-salary', name: 'First salary', blurb: 'Your first net pay', income: 12000, pct: { rent: 30, transport: 10, groceries: 15, utilities: 8, family: 7, emergency: 10, investing: 10, fun: 8 } },
  { id: 'workshop', name: 'Workshop scenario', blurb: 'R3,500 in, R3,600 out. Can you save for a R1,500 laptop?', income: 3500, pct: { rent: 34.2857, transport: 22.8571, groceries: 20, utilities: 8.5714, family: 0, emergency: 0, investing: 0, fun: 17.1429 } },
];

export const emptyLines = (): Record<BudgetCategory, number> => ({ rent: 0, transport: 0, groceries: 0, utilities: 0, family: 0, emergency: 0, investing: 0, fun: 0 });

export function linesFromTemplate(t: Template, income: number): Record<BudgetCategory, number> {
  const out = emptyLines();
  for (const c of CATEGORIES) out[c.id] = Math.round((income * t.pct[c.id]) / 100 / 10) * 10; // round to R10
  return out;
}

export function totals(income: number, lines: Record<BudgetCategory, number>) {
  const spent = CATEGORIES.reduce((a, c) => a + (lines[c.id] || 0), 0);
  const by = (g: 'needs' | 'wants' | 'saving') => CATEGORIES.filter((c) => c.group === g).reduce((a, c) => a + (lines[c.id] || 0), 0);
  return { spent, left: income - spent, over: spent > income, needs: by('needs'), wants: by('wants'), saving: by('saving'), pct: (n: number) => (income > 0 ? Math.round((n / income) * 100) : 0) };
}

export type BudgetInput = { template: string; income: number; lines: Partial<Record<BudgetCategory, number>> };

/** Saves the user's current budget (private to them). Saving it completes the Budget Builder action. */
export function saveBudget(w: World, userId: string, input: BudgetInput, now: Date): { ok: true; budget: Budget; earned: Earned } | { ok: false; error: string } {
  const income = clampNum(input.income, 0, 10_000_000);
  if (income <= 0) return { ok: false, error: 'Enter your monthly take-home amount first.' };
  const lines = emptyLines();
  for (const c of CATEGORIES) lines[c.id] = clampNum(input.lines[c.id] ?? 0, 0, 10_000_000);
  const budget: Budget = { template: input.template, income, lines, savedAt: now.toISOString() };
  w.budgets[userId] = budget;
  track(w, userId, 'budget_saved', { template: input.template }, now); // never the amounts
  const earned = completeAction(w, userId, 'budget-50-30-20', 'done', now);
  return { ok: true, budget, earned };
}
