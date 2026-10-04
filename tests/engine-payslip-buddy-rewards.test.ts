import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TAX_ZA } from '@/config/tax-za';
import { buildWorld } from '@/lib/world/seed';
import { annualTax, calcPayslip, leftToAllocate, savePayslipRun, startingAllocation } from '@/lib/engine/payslip';
import { acceptInvite, bothComplete, createInvite, currentPlan, endPair, itemDone, jointWeeks, markManual, nudge, nudgedToday, pairOf, pickItems, planProgress, simRespond, startSimBuddy, syncBuddy } from '@/lib/engine/buddy';
import { amounts, claimReward, currentChallenge, eligibility, reviewClaim, runWeeklyDraw, REWARDS } from '@/lib/engine/rewards';
import { advanceClock, dailyJob, ensureWeeklyChallenge, simulateDay } from '@/lib/engine/jobs';
import { completeAction, completeLesson, submitQuiz } from '@/lib/engine/actions';
import { evaluateBadges } from '@/lib/engine/badges';
import { sendMessage, canAccess } from '@/lib/engine/chat';
import { planReplies } from '@/lib/sim/chat';
import { MILESTONES } from '@/lib/content';

const NOW = new Date('2026-10-07T10:00:00Z'); // Wednesday
const world = () => buildWorld(NOW);
const day = (n: number) => new Date(NOW.getTime() + n * 86400_000);
// advanceClock reads the system clock, so pin it to the same moment the test world was built at
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW); });
afterEach(() => { vi.useRealTimers(); });

describe('payslip maths (illustrative figures)', () => {
  it('is clearly flagged unverified', () => { expect(TAX_ZA.verified).toBe(false); expect(TAX_ZA.primaryRebate).toBeGreaterThan(0); });
  it('no tax below the threshold, tiny tax just above', () => {
    expect(annualTax(94_800)).toBe(0);
    expect(calcPayslip(7_900, 0).paye).toBe(0);
    expect(calcPayslip(8_000, 0).paye).toBeCloseTo(3.75, 2);
  });
  it('R12,000 gross', () => {
    const p = calcPayslip(12_000, 0);
    expect(p.paye).toBeCloseTo(723.75, 2);
    expect(p.uif).toBe(120);
    expect(p.net).toBeCloseTo(12_000 - 723.75 - 120, 2);
  });
  it('R40,000 gross uses a higher bracket and the UIF ceiling', () => {
    const p = calcPayslip(40_000, 0);
    expect(p.paye).toBeCloseTo(7_839.33, 2);
    expect(p.uif).toBeCloseTo(177.12, 2);
  });
  it('retirement is taken before tax, lowering PAYE, and the slider is capped at 15%', () => {
    const a = calcPayslip(25_000, 0), b = calcPayslip(25_000, 10);
    expect(b.retirement).toBe(2_500);
    expect(b.paye).toBeLessThan(a.paye);
    expect(b.net).toBeLessThan(a.net);
    expect(b.net).toBeCloseTo(25_000 - b.paye - b.uif - 2_500, 2);
    expect(calcPayslip(25_000, 99).retirement).toBe(25_000 * 0.15);
  });
  it('the tax is monotonic in income', () => { let prev = -1; for (let g = 5_000; g <= 200_000; g += 5_000) { const t = calcPayslip(g, 0).paye; expect(t).toBeGreaterThanOrEqual(prev); prev = t; } });
  it('the starting allocation is near net pay and the counter reaches exactly R0 when balanced', () => {
    const p = calcPayslip(12_000, 0);
    const a = startingAllocation(p.net);
    const left = leftToAllocate(p.net, a);
    expect(left).toBeGreaterThan(0); // a starting plan leaves something to place
    expect(left).toBeLessThan(p.net * 0.12);
    a.emergency += left;
    expect(leftToAllocate(p.net, a)).toBe(0);
  });
  it('a scenario saves only at R0 left; first save is an action (+15) and earns Payslip Pro; amounts never reach analytics', () => {
    const w = world();
    const p = calcPayslip(12_000, 0);
    const a = startingAllocation(p.net);
    const bad = savePayslipRun(w, 'u-new', { gross: 12_000, retirementPct: 0, allocation: a }, NOW);
    if (leftToAllocate(p.net, a) !== 0) expect(bad).toMatchObject({ ok: false });
    a.emergency += leftToAllocate(p.net, a);
    const r = savePayslipRun(w, 'u-new', { gross: 12_000, retirementPct: 0, allocation: a }, NOW);
    expect(r.ok && r.earned.points).toBeGreaterThanOrEqual(15);
    expect(r.ok && r.earned.badges.map((b) => b.slug)).toContain('payslip-pro');
    expect(JSON.stringify(w.analytics)).not.toMatch(/12000|11156/);
    for (let i = 0; i < 6; i++) savePayslipRun(w, 'u-new', { gross: 12_000, retirementPct: 0, allocation: a }, day(i));
    expect(w.payslipRuns['u-new']).toHaveLength(5);
    expect(savePayslipRun(w, 'u-new', { gross: 0, retirementPct: 0, allocation: a }, NOW)).toMatchObject({ ok: false });
  });
});

describe('Money Buddy', () => {
  it('seeds Nomsa with a simulated buddy and one joint week banked', () => {
    const w = world();
    const pair = pairOf(w, 'u-nomsa')!;
    expect(pair).toMatchObject({ sim: true, status: 'active' });
    expect(jointWeeks(w, pair, NOW)).toBe(1);
  });
  it('invites once, and others accept: not your own, not twice, not if already paired', () => {
    const w = world();
    const inv = createInvite(w, 'u-new', NOW);
    if (!inv.ok) throw new Error();
    expect(createInvite(w, 'u-new', NOW)).toMatchObject({ ok: false });
    expect(acceptInvite(w, 'u-new', inv.pair.code, NOW)).toMatchObject({ ok: false, error: expect.stringMatching(/own invite/) });
    expect(acceptInvite(w, 'u-nomsa', inv.pair.code, NOW)).toMatchObject({ ok: false, error: expect.stringMatching(/already have/) });
    endPair(w, 'u-nomsa', 'pair-seed');
    const ok = acceptInvite(w, 'u-nomsa', inv.pair.code, NOW);
    expect(ok.ok && ok.pair.status).toBe('active');
    expect(acceptInvite(w, 'u-thandi', inv.pair.code, NOW)).toMatchObject({ ok: false });
    expect(w.notifications.some((n) => n.userId === 'u-new' && /Money Buddy joined/.test(n.title))).toBe(true);
    expect(canAccess(w, 'u-nomsa', w.channels.find((c) => c.kind === 'buddy' && c.refId === inv.pair.id)!)).toBe(true);
    expect(canAccess(w, 'u-thandi', w.channels.find((c) => c.kind === 'buddy' && c.refId === inv.pair.id)!)).toBe(false);
  });
  it('picks three items from the milestone the pair is on', () => {
    const w = world();
    const inv = createInvite(w, 'u-new', NOW); if (!inv.ok) throw new Error();
    acceptInvite(w, 'u-nomsa', inv.pair.code, NOW);
    expect(w.buddies.find((p) => p.id === 'pair-seed')!.status).toBe('active'); // acceptance failed: Nomsa already paired
    const w2 = world(); endPair(w2, 'u-nomsa', 'pair-seed');
    const i2 = createInvite(w2, 'u-new', NOW); if (!i2.ok) throw new Error();
    const acc = acceptInvite(w2, 'u-nomsa', i2.pair.code, NOW); if (!acc.ok) throw new Error();
    const items = pickItems(w2, acc.pair);
    expect(items).toHaveLength(3);
    expect(items.filter((i) => i.kind === 'action')).toHaveLength(2);
    expect(items[2].kind).toBe('manual');
  });
  it('both finishing the week earns +20 each; two weeks running earns Better Together and joint eligibility', () => {
    const w = world(); endPair(w, 'u-nomsa', 'pair-seed');
    const inv = createInvite(w, 'u-new', NOW); if (!inv.ok) throw new Error();
    const acc = acceptInvite(w, 'u-nomsa', inv.pair.code, NOW); if (!acc.ok) throw new Error();
    const pair = acc.pair;
    const finishWeek = (now: Date) => {
      const plan = currentPlan(w, pair, now);
      for (const u of ['u-nomsa', 'u-new']) for (const item of plan.items) {
        if (item.kind === 'action') completeAction(w, u, item.lessonId!, 'done', now); else markManual(w, u, pair.id, item.id, now);
      }
      syncBuddy(w, 'u-nomsa', now);
      return plan;
    };
    // before finishing, only one of them is done
    const plan1 = currentPlan(w, pair, NOW);
    completeAction(w, 'u-nomsa', plan1.items[0].lessonId!, 'done', NOW);
    expect(itemDone(w, plan1, 'u-nomsa', plan1.items[0])).toBe(true);
    expect(planProgress(w, plan1, 'u-new').done).toBe(0);
    expect(bothComplete(w, plan1, pair)).toBe(false);

    finishWeek(NOW);
    expect(bothComplete(w, currentPlan(w, pair, NOW), pair)).toBe(true);
    expect(w.pointEvents.filter((p) => p.source === 'buddy' && p.sourceId.startsWith(pair.id))).toHaveLength(2);
    expect(pair.jointAt).toBeNull();
    syncBuddy(w, 'u-nomsa', NOW); // idempotent
    expect(w.pointEvents.filter((p) => p.source === 'buddy' && p.sourceId.startsWith(pair.id))).toHaveLength(2);

    finishWeek(day(7));
    expect(jointWeeks(w, pair, day(7))).toBe(2);
    expect(pair.jointAt).not.toBeNull();
    expect(evaluateBadges(w, 'u-nomsa', day(7)).map((b) => b.slug)).toContain('better-together');
    expect(eligibility(w, 'u-nomsa', day(7)).find((v) => v.def.slug === 'buddy-joint')!.state).toBe('eligible');
  });
  it('a missed week breaks the joint run', () => {
    const w = world();
    const pair = pairOf(w, 'u-nomsa')!;
    expect(jointWeeks(w, pair, NOW)).toBe(1);
    expect(jointWeeks(w, pair, day(14))).toBe(0);
  });
  it('one nudge per buddy per day; resets tomorrow', () => {
    const w = world();
    expect(nudge(w, 'u-nomsa', 'pair-seed', NOW)).toEqual({ ok: true });
    expect(nudgedToday(pairOf(w, 'u-nomsa')!, 'u-nomsa', NOW)).toBe(true);
    expect(nudge(w, 'u-nomsa', 'pair-seed', NOW)).toMatchObject({ ok: false });
    expect(nudge(w, 'u-nomsa', 'pair-seed', day(1))).toEqual({ ok: true });
    expect(nudge(w, 'u-thandi', 'pair-seed', NOW)).toMatchObject({ ok: false });
  });
  it('a practice buddy can be started alone, only one pairing at a time', () => {
    const w = world();
    expect(startSimBuddy(w, 'u-nomsa', NOW)).toMatchObject({ ok: false });
    const r = startSimBuddy(w, 'u-new', NOW);
    expect(r.ok && r.pair.sim).toBe(true);
    expect(startSimBuddy(w, 'u-new', NOW)).toMatchObject({ ok: false });
  });
  it('a practice buddy answers a nudge with a message and one finished item', () => {
    const w = world();
    const r = startSimBuddy(w, 'u-new', NOW);
    if (!r.ok) throw new Error('x');
    const before = w.messages.length;
    simRespond(w, 'u-new', r.pair.id, NOW);
    expect(w.messages.length).toBe(before + 1);
    expect(currentPlan(w, r.pair, NOW).done['m-0']).toHaveLength(1);
  });
  it('the practice buddy chats in the buddy channel and finishes tasks as days pass', () => {
    const w = world();
    const pair = pairOf(w, 'u-nomsa')!;
    const ch = w.channels.find((c) => c.kind === 'buddy' && c.refId === pair.id)!;
    const sent = sendMessage(w, 'u-nomsa', ch.id, 'How is your week?', null, NOW);
    if (!sent.ok) throw new Error();
    const replies = planReplies(w, sent.message);
    expect(replies.length).toBeGreaterThan(0);
    expect(replies.every((r) => r.userId === 'm-0')).toBe(true);
    expect(sendMessage(w, 'u-thandi', ch.id, 'hi', null, NOW)).toMatchObject({ ok: false });
    advanceClock(w, 6 * 86400_000);
    const simDone = pair.plans.reduce((a, pl) => a + (pl.done['m-0']?.length ?? 0), 0);
    expect(simDone).toBeGreaterThan(3); // the seeded week had 3; this week's plan has progress too
    expect(currentPlan(w, pair, new Date(Date.now() + w.clockOffsetMs)).weekKey).not.toBe(pair.plans[0].weekKey);
  });
});

describe('rewards and claims', () => {
  const setMilestones = (w: ReturnType<typeof world>, userId: string, n: number) => { w.milestonesDone[userId] = Object.fromEntries(MILESTONES.slice(0, n).map((m) => [m.slug, NOW.toISOString()])); };
  const view = (w: ReturnType<typeof world>, userId: string, slug: string, now = NOW) => eligibility(w, userId, now).find((v) => v.def.slug === slug)!;

  it('there are exactly four rewards, labelled as a pilot', () => expect(REWARDS.map((r) => r.slug)).toEqual(['milestones-cash', 'all-pathways', 'weekly-draw', 'buddy-joint']));
  it('R50 cash unlocks at 3 milestones; progress is shown before that', () => {
    const w = world();
    expect(view(w, 'u-nomsa', 'milestones-cash')).toMatchObject({ state: 'locked', done: 1, total: 3 });
    setMilestones(w, 'u-nomsa', 3);
    expect(view(w, 'u-nomsa', 'milestones-cash').state).toBe('eligible');
  });
  it('cash or investment credit: credit is worth +10%, and bundles keep their fixed credit', () => {
    const [cashR, bundle] = REWARDS;
    expect(amounts(cashR, 'cash')).toEqual({ cash: 50, credit: 0 });
    expect(amounts(cashR, 'credit')).toEqual({ cash: 0, credit: 55 });
    expect(amounts(bundle, 'cash')).toEqual({ cash: 100, credit: 500 });
    expect(amounts(bundle, 'credit')).toEqual({ cash: 0, credit: 610 });
  });
  it('claim → approve → paid, with notifications; only PPS admins review; one claim each', () => {
    const w = world(); setMilestones(w, 'u-nomsa', 3);
    expect(claimReward(w, 'u-new', 'milestones-cash', 'cash', NOW)).toMatchObject({ ok: false });
    const c = claimReward(w, 'u-nomsa', 'milestones-cash', 'credit', NOW);
    if (!c.ok) throw new Error();
    expect(c.claim).toMatchObject({ status: 'claimed', cash: 0, credit: 55 });
    expect(view(w, 'u-nomsa', 'milestones-cash').state).toBe('claimed');
    expect(claimReward(w, 'u-nomsa', 'milestones-cash', 'cash', NOW)).toMatchObject({ ok: false });
    expect(w.notifications.some((n) => n.userId === 'u-admin' && /claim/.test(n.title))).toBe(true);
    expect(reviewClaim(w, 'u-thandi', c.claim.id, 'approve', '', NOW)).toBe(false);
    expect(reviewClaim(w, 'u-admin', c.claim.id, 'paid', '', NOW)).toBe(false); // must be approved first
    expect(reviewClaim(w, 'u-admin', c.claim.id, 'approve', '', day(1))).toBe(true);
    expect(view(w, 'u-nomsa', 'milestones-cash').state).toBe('approved');
    expect(reviewClaim(w, 'u-admin', c.claim.id, 'paid', '', day(2))).toBe(true);
    expect(view(w, 'u-nomsa', 'milestones-cash').state).toBe('paid');
    expect(w.notifications.filter((n) => n.userId === 'u-nomsa' && n.kind === 'reward').map((n) => n.title.split(': ')[1])).toEqual(expect.arrayContaining(['approved', 'paid']));
  });
  it('a rejected claim records the note', () => {
    const w = world(); setMilestones(w, 'u-nomsa', 3);
    const c = claimReward(w, 'u-nomsa', 'milestones-cash', 'cash', NOW); if (!c.ok) throw new Error();
    expect(reviewClaim(w, 'u-admin', c.claim.id, 'reject', 'Duplicate account', NOW)).toBe(true);
    expect(view(w, 'u-nomsa', 'milestones-cash')).toMatchObject({ state: 'rejected' });
    expect(w.claims[0].note).toBe('Duplicate account');
  });
  it('the three-pathway bundle needs milestones, a joint buddy milestone and Invest HER', () => {
    const w = world();
    expect(view(w, 'u-nomsa', 'all-pathways')).toMatchObject({ state: 'locked', done: 0 });
    setMilestones(w, 'u-nomsa', 5);
    w.pointEvents.push({ id: 'x1', userId: 'u-nomsa', communityId: null, source: 'invest_done', sourceId: 'invest-her', points: 0, at: NOW.toISOString() });
    expect(view(w, 'u-nomsa', 'all-pathways').done).toBe(2);
    pairOf(w, 'u-nomsa')!.jointAt = NOW.toISOString();
    expect(view(w, 'u-nomsa', 'all-pathways').state).toBe('eligible');
  });
  it('the joint buddy reward is one claim per pair', () => {
    const w = world();
    const pair = pairOf(w, 'u-nomsa')!; pair.jointAt = NOW.toISOString();
    const c = claimReward(w, 'u-nomsa', 'buddy-joint', 'cash', NOW);
    expect(c.ok).toBe(true);
    expect(view(w, 'u-nomsa', 'buddy-joint').state).toBe('claimed');
  });
  it('the prize draw shows entrants and prizes, and the seeded last-week draw exists', () => {
    const w = world();
    const v = view(w, 'u-nomsa', 'weekly-draw');
    expect(v.prizes).toBe(5);
    expect(v.entrants).toBeGreaterThan(0);
    expect(v.entered).toBe(false);
    expect(w.draws.length).toBeGreaterThanOrEqual(1);
    const d = w.draws[0];
    expect(d.winners.length).toBe(Math.min(5, d.entrants.length));
    expect(d.winners.every((x) => d.entrants.includes(x))).toBe(true);
  });
  it('drawing is idempotent and winners can claim exactly once', () => {
    const w = world();
    const n = w.draws.length;
    expect(runWeeklyDraw(w, NOW)).toEqual([]);
    expect(w.draws.length).toBe(n);
    w.draws.push({ id: 'draw-test', challengeId: 'ch-0', weekKey: '2026-09-28', entrants: ['u-nomsa'], winners: ['u-nomsa'], prizes: 5, prize: 25, at: NOW.toISOString() });
    expect(view(w, 'u-nomsa', 'weekly-draw').state).toBe('eligible');
    const c = claimReward(w, 'u-nomsa', 'weekly-draw', 'cash', NOW);
    expect(c.ok && c.claim.cash).toBe(25);
    expect(view(w, 'u-nomsa', 'weekly-draw').state).not.toBe('eligible');
  });
  it('a new weekly challenge appears each Monday and last week is drawn when the week turns', () => {
    const w = world();
    const before = currentChallenge(w, NOW)!;
    w.challengeDone.push({ challengeId: before.id, userId: 'u-nomsa', at: NOW.toISOString() });
    advanceClock(w, 7 * 86400_000);
    const after = currentChallenge(w, new Date(Date.now() + w.clockOffsetMs))!;
    expect(after.id).not.toBe(before.id);
    const d = w.draws.find((x) => x.challengeId === before.id)!;
    expect(d.entrants).toContain('u-nomsa');
    expect(ensureWeeklyChallenge(w, new Date(Date.now() + w.clockOffsetMs))).toBeUndefined();
    expect(w.challenges.filter((c) => c.weekStart === after.weekStart)).toHaveLength(1);
  });
  it('a sim day keeps working with the new simulation (challenges + buddy)', () => {
    const w = world();
    simulateDay(w, day(1));
    simulateDay(w, day(1));
    expect(w.pointEvents.length).toBeGreaterThan(0);
    expect(dailyJob(w, day(1))).toMatchObject({ draws: expect.any(Number) });
    void completeLesson; void submitQuiz;
  });
});
