import type { Earned, SavingsGoal, World } from '@/lib/world/types';
import { clampNum } from '@/lib/money';
import { earning } from './actions';
import { award } from './award';
import { track, uid } from './helpers';

export const GOAL_EMOJI = ['💻', '📱', '🎓', '🛟', '✈️', '🏠', '🚗', '🎁', '💍', '📚', '🌱', '⭐'];

export const goalsOf = (w: World, userId: string) => w.goals.filter((g) => g.userId === userId);
export const savedOf = (g: SavingsGoal) => g.deposits.reduce((a, d) => a + d.amount, 0);

export function progress(g: SavingsGoal, now: Date) {
  const saved = savedOf(g);
  const remaining = Math.max(0, g.target - saved);
  let perMonth: number | null = null;
  if (g.dueOn && remaining > 0) {
    const months = Math.max(1, (new Date(`${g.dueOn}T12:00:00Z`).getTime() - now.getTime()) / (30.44 * 86400_000));
    perMonth = Math.ceil(remaining / months / 10) * 10;
  }
  return { saved, remaining, pct: Math.min(100, Math.round((saved / g.target) * 100)), reached: saved >= g.target, perMonth };
}

export function createGoal(w: World, userId: string, o: { name: string; emoji: string; target: number; dueOn?: string | null }, now: Date): { ok: true; goal: SavingsGoal } | { ok: false; error: string } {
  const name = o.name.trim().slice(0, 40);
  const target = clampNum(o.target, 0, 100_000_000);
  if (!name) return { ok: false, error: 'Give your goal a name.' };
  if (target <= 0) return { ok: false, error: 'Set a target amount above R0.' };
  const goal: SavingsGoal = { id: uid('goal'), userId, name, emoji: GOAL_EMOJI.includes(o.emoji) ? o.emoji : '⭐', target, dueOn: o.dueOn || null, deposits: [], createdAt: now.toISOString(), reachedAt: null };
  w.goals.push(goal);
  track(w, userId, 'goal_created', {}, now);
  return { ok: true, goal };
}

/** Logs a deposit. Reaching the target earns Goal Getter. Amounts never leave the user's own data. */
export function addDeposit(w: World, userId: string, goalId: string, amount: number, now: Date): { ok: true; earned: Earned; reached: boolean } | { ok: false; error: string } {
  const g = w.goals.find((x) => x.id === goalId && x.userId === userId);
  const a = clampNum(amount, 0, 100_000_000);
  if (!g) return { ok: false, error: 'Goal not found.' };
  if (a <= 0) return { ok: false, error: 'Enter an amount above R0.' };
  g.deposits.push({ id: uid('dep'), amount: Math.round(a * 100) / 100, at: now.toISOString() });
  let reached = false;
  const earned = earning(w, userId, now, () => {
    if (!g.reachedAt && savedOf(g) >= g.target) {
      g.reachedAt = now.toISOString();
      reached = true;
      award(w, { userId, source: 'goal_reached', sourceId: g.id, points: 0, now });
      track(w, userId, 'goal_reached', {}, now);
    }
  });
  return { ok: true, earned, reached };
}

export function deleteGoal(w: World, userId: string, goalId: string) {
  w.goals = w.goals.filter((g) => !(g.id === goalId && g.userId === userId));
}

/** Feeds the Real results card. Totals stay private to the user. */
export function realResults(w: World, userId: string) {
  const mine = goalsOf(w, userId);
  return { saved: mine.reduce((a, g) => a + savedOf(g), 0), goals: mine.length, reached: mine.filter((g) => g.reachedAt).length };
}
