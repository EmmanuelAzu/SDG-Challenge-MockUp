import { describe, expect, it } from 'vitest';
import { buildWorld } from '@/lib/world/seed';
import { completeAction, completeLesson, submitQuiz } from '@/lib/engine/actions';
import { CATEGORIES, TEMPLATES, linesFromTemplate, saveBudget, totals } from '@/lib/engine/budget';
import { addDeposit, createGoal, deleteGoal, goalsOf, progress, realResults, savedOf } from '@/lib/engine/goals';
import { AFFORDABILITY, CHECKLIST, EXPLAINERS, compound, finishInvest, readiness, runSimulator, seeExplainer, setAnswer, setPlan, steps, stepsDone, toggleChecklist, ensureInvest } from '@/lib/engine/invest';
import { getJourney } from '@/lib/engine/journey';
import { COURSES } from '@/lib/content';
import { rand } from '@/lib/money';

const NOW = new Date('2026-10-07T10:00:00Z');
const world = () => buildWorld(NOW);

describe('money formatting', () => {
  it('formats rands deterministically', () => {
    expect(rand(0)).toBe('R0'); expect(rand(1234567)).toBe('R1,234,567'); expect(rand(-2500)).toBe('-R2,500'); expect(rand(99.6)).toBe('R100');
  });
});

describe('budget builder', () => {
  it('every template is within 100% and uses all 8 categories', () => {
    expect(CATEGORIES).toHaveLength(8);
    for (const t of TEMPLATES) {
      expect(Object.values(t.pct).reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(100);
      expect(Object.keys(t.pct).sort()).toEqual(CATEGORIES.map((c) => c.id).sort());
    }
  });
  it('turns a template into rand lines rounded to R10', () => {
    const lines = linesFromTemplate(TEMPLATES[3], 12000);
    expect(lines.rent).toBe(3600);
    expect(Object.values(lines).every((v) => v % 10 === 0)).toBe(true);
  });
  it('computes what is left and the 50/30/20 split', () => {
    const t = totals(10000, { rent: 3000, transport: 500, groceries: 1500, utilities: 500, family: 0, emergency: 1000, investing: 1000, fun: 500 });
    expect(t).toMatchObject({ spent: 8000, left: 2000, over: false, needs: 5500, wants: 500, saving: 2000 });
    expect(t.pct(t.needs)).toBe(55);
    expect(totals(1000, { rent: 1500, transport: 0, groceries: 0, utilities: 0, family: 0, emergency: 0, investing: 0, fun: 0 }).over).toBe(true);
  });
  it('saving needs an income, stores privately, and completes the Budget Builder action once (+15)', () => {
    const w = world();
    expect(saveBudget(w, 'u-new', { template: 'allowance', income: 0, lines: {} }, NOW)).toMatchObject({ ok: false });
    const r = saveBudget(w, 'u-new', { template: 'allowance', income: 3000, lines: { rent: 750, groceries: 750 } }, NOW);
    expect(r.ok && r.earned.points).toBe(15);
    expect(w.budgets['u-new'].income).toBe(3000);
    expect(w.actionCompletions['u-new:budget-50-30-20:action'].status).toBe('done');
    const again = saveBudget(w, 'u-new', { template: 'allowance', income: 3200, lines: {} }, NOW);
    expect(again.ok && again.earned.points).toBe(0);
    expect(w.budgets['u-nomsa'].income).toBe(4200); // other people's budgets are untouched
    // analytics never carry amounts
    expect(JSON.stringify(w.analytics.filter((e) => e.name === 'budget_saved'))).not.toMatch(/3000|3200|750/);
  });
  it('clamps silly inputs', () => {
    const w = world();
    const r = saveBudget(w, 'u-new', { template: 'x', income: 5000, lines: { rent: -50, fun: 1e12 } }, NOW);
    expect(r.ok && r.budget.lines.rent).toBe(0);
    expect(r.ok && r.budget.lines.fun).toBe(10_000_000);
  });
  it('completing the First budget milestone (lessons + budget) earns Budget Builder', () => {
    const w = world();
    for (const l of COURSES[1].lessons) { completeLesson(w, 'u-new', l.slug, NOW); submitQuiz(w, 'u-new', l.slug, l.quiz.map((q) => q.correct), NOW); }
    completeAction(w, 'u-new', COURSES[1].lessons[0].slug, 'done', NOW);
    expect(getJourney(w, 'u-new').milestones.find((m) => m.slug === 'first-budget')?.done).toBe(false);
    const r = saveBudget(w, 'u-new', { template: 'first-salary', income: 12000, lines: { rent: 3600 } }, NOW);
    expect(r.ok && r.earned.milestones).toEqual(['First budget']);
    expect(r.ok && r.earned.badges.map((b) => b.slug)).toContain('budget-builder');
  });
});

describe('savings goals', () => {
  it('validates and creates goals', () => {
    const w = world();
    expect(createGoal(w, 'u-new', { name: ' ', emoji: '💻', target: 100 }, NOW)).toMatchObject({ ok: false });
    expect(createGoal(w, 'u-new', { name: 'Laptop', emoji: '💻', target: 0 }, NOW)).toMatchObject({ ok: false });
    const r = createGoal(w, 'u-new', { name: 'x'.repeat(80), emoji: 'not-an-emoji', target: 1000 }, NOW);
    expect(r.ok && r.goal.name).toHaveLength(40);
    expect(r.ok && r.goal.emoji).toBe('⭐');
  });
  it('deposits add up, validate, and show progress and a monthly pace', () => {
    const w = world();
    const g = createGoal(w, 'u-new', { name: 'Trip', emoji: '✈️', target: 1000, dueOn: '2027-01-07' }, NOW);
    if (!g.ok) throw new Error();
    expect(addDeposit(w, 'u-new', g.goal.id, 0, NOW)).toMatchObject({ ok: false });
    expect(addDeposit(w, 'u-new', 'nope', 100, NOW)).toMatchObject({ ok: false });
    addDeposit(w, 'u-new', g.goal.id, 250, NOW);
    expect(w.goals.find((x) => x.id === g.goal.id)!.deposits).toHaveLength(1);
    const fresh = progress(w.goals.find((x) => x.id === g.goal.id)!, NOW);
    expect(fresh).toMatchObject({ saved: 250, remaining: 750, pct: 25, reached: false });
    expect(fresh.perMonth).toBe(250); // 750 over ~3 months
  });
  it('reaching the target earns Goal Getter once', () => {
    const w = world();
    const g = createGoal(w, 'u-new', { name: 'Fund', emoji: '🛟', target: 500 }, NOW);
    if (!g.ok) throw new Error();
    expect(addDeposit(w, 'u-new', g.goal.id, 200, NOW)).toMatchObject({ ok: true, reached: false });
    const r = addDeposit(w, 'u-new', g.goal.id, 300, NOW);
    expect(r.ok && r.reached).toBe(true);
    expect(r.ok && r.earned.badges.map((b) => b.slug)).toContain('goal-getter');
    const more = addDeposit(w, 'u-new', g.goal.id, 50, NOW);
    expect(more.ok && more.reached).toBe(false);
    expect(w.pointEvents.filter((p) => p.userId === 'u-new' && p.source === 'goal_reached')).toHaveLength(1);
  });
  it('goals are private and totals feed Real results', () => {
    const w = world();
    expect(realResults(w, 'u-nomsa')).toEqual({ saved: 5200, goals: 2, reached: 0 });
    expect(goalsOf(w, 'u-new')).toEqual([]);
    expect(addDeposit(w, 'u-new', 'goal-laptop', 100, NOW)).toMatchObject({ ok: false }); // not their goal
    deleteGoal(w, 'u-new', 'goal-laptop');
    expect(goalsOf(w, 'u-nomsa')).toHaveLength(2);
    const laptop = w.goals.find((g) => g.id === 'goal-laptop')!;
    expect(progress(laptop, NOW).pct).toBe(60);
    expect(savedOf(laptop)).toBe(4800);
  });
  it('never puts amounts in analytics', () => {
    const w = world();
    const g = createGoal(w, 'u-new', { name: 'Secret', emoji: '🎁', target: 7777 }, NOW);
    if (!g.ok) throw new Error();
    addDeposit(w, 'u-new', g.goal.id, 7777, NOW);
    expect(JSON.stringify(w.analytics)).not.toMatch(/7777/);
  });
});

describe('Invest HER', () => {
  it('compound growth: R200 a month for 10 years at 8% is about R36,589', () => {
    const s = compound(200, 10, 8);
    expect(s).toHaveLength(11);
    expect(s[10].total).toBeGreaterThanOrEqual(36580);
    expect(s[10].total).toBeLessThanOrEqual(36600);
    expect(s[10].contributions).toBe(24000);
    expect(s[10].growth).toBe(s[10].total - 24000);
  });
  it('grows with time and rate; zero return means no growth', () => {
    expect(compound(200, 20, 8)[20].total).toBeGreaterThan(compound(200, 10, 8)[10].total);
    expect(compound(200, 10, 10)[10].total).toBeGreaterThan(compound(200, 10, 6)[10].total);
    expect(compound(200, 5, 0)[5].growth).toBe(0);
    expect(compound(200, 0, 8)).toEqual([{ year: 0, contributions: 0, growth: 0, total: 0 }]);
  });
  it('the readiness guide is kind and never advice', () => {
    expect(readiness({ emergency: 'yes', debt: 'no', horizon: 'yes', income: 'yes' }).level).toBe('ready');
    expect(readiness({ emergency: 'yes', debt: 'no', horizon: 'maybe', income: 'yes' }).level).toBe('almost');
    const low = readiness({ emergency: 'not-yet', debt: 'yes', horizon: 'no', income: 'no' });
    expect(low.level).toBe('not-yet');
    expect(low.tips.length).toBe(4);
    expect(low.message).toMatch(/learning/);
  });
  it('plan inputs are clamped to the spec ranges', () => {
    const w = world();
    setPlan(w, 'u-new', { monthly: 1000, years: 99, rate: 7 }, NOW);
    expect(w.invest['u-new']).toMatchObject({ monthly: 500, years: 20, rate: 8 });
    setPlan(w, 'u-new', { monthly: 5, years: 0, rate: 10 }, NOW);
    expect(w.invest['u-new']).toMatchObject({ monthly: 50, years: 1, rate: 10 });
    expect(ensureInvest(world(), 'u-new', NOW)).toMatchObject({ monthly: 200, years: 10, rate: 8 });
  });
  it('finishing needs every step; then Investor Ready is awarded once', () => {
    const w = world();
    expect(finishInvest(w, 'u-new', NOW)).toMatchObject({ ok: false });
    for (const q of AFFORDABILITY) setAnswer(w, 'u-new', q.id, q.options[0][0], NOW);
    setAnswer(w, 'u-new', 'emergency', 'bogus', NOW); // ignored
    EXPLAINERS.forEach((e) => seeExplainer(w, 'u-new', e.id, NOW));
    expect(stepsDone(w.invest['u-new'])).toBe(2);
    runSimulator(w, 'u-new', NOW);
    CHECKLIST.slice(0, 2).forEach((c) => toggleChecklist(w, 'u-new', c.id, NOW));
    expect(steps(w.invest['u-new']).checklist).toBe(false);
    expect(finishInvest(w, 'u-new', NOW)).toMatchObject({ ok: false });
    toggleChecklist(w, 'u-new', CHECKLIST[2].id, NOW);
    const r = finishInvest(w, 'u-new', NOW);
    expect(r.ok && r.earned.badges.map((b) => b.slug)).toContain('investor-ready');
    const again = finishInvest(w, 'u-new', NOW);
    expect(again.ok && again.earned.badges).toEqual([]);
    expect(w.analytics.map((e) => e.name)).toEqual(expect.arrayContaining(['invest_started', 'simulator_finished', 'invest_checklist_done']));
  });
  it('un-ticking a checklist item takes it back below the bar', () => {
    const w = world();
    CHECKLIST.slice(0, 3).forEach((c) => toggleChecklist(w, 'u-new', c.id, NOW));
    expect(steps(w.invest['u-new']).checklist).toBe(true);
    toggleChecklist(w, 'u-new', CHECKLIST[0].id, NOW);
    expect(steps(w.invest['u-new']).checklist).toBe(false);
  });
});
