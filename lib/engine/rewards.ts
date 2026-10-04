import type { Claim, Draw, World } from '@/lib/world/types';
import { sastDate } from '@/lib/time';
import { pairOf } from './buddy';
import { notify, uid, track } from './helpers';
import { weekStart } from './leaderboard';
import { MILESTONE_SLUGS } from './rules';

export const CREDIT_BONUS = 0.1; // credit is worth +10% over the same cash amount
export const DRAW_PRIZES = 5;
export const DRAW_PRIZE = 25;
export const PILOT_LABEL = 'Pilot reward — subject to PPS approval.';

export type RewardDef = { slug: string; title: string; short: string; how: string; cash: number; baseCredit: number; kind: 'cash-choice' | 'bundle' | 'draw' };
export const REWARDS: RewardDef[] = [
  { slug: 'milestones-cash', title: 'R50 cash', short: 'Finish 3 Money Milestones', how: 'Complete any three of the five Money Milestones.', cash: 50, baseCredit: 0, kind: 'cash-choice' },
  { slug: 'all-pathways', title: 'R500 investment credit + R100 cash', short: 'Finish all three pathways', how: 'Money Milestones (all 5), a joint Money Buddy milestone, and Invest HER.', cash: 100, baseCredit: 500, kind: 'bundle' },
  { slug: 'weekly-draw', title: 'R25 weekly prize draw', short: `${DRAW_PRIZES} prizes of R${DRAW_PRIZE} every week`, how: 'Do this week’s challenge to enter. Winners are drawn each Monday.', cash: DRAW_PRIZE, baseCredit: 0, kind: 'draw' },
  { slug: 'buddy-joint', title: 'R100 joint buddy reward', short: 'Hit a joint milestone with your buddy', how: 'Finish your weekly buddy plan together two weeks running. One claim per pair.', cash: 100, baseCredit: 0, kind: 'cash-choice' },
];

export type RewardState = 'locked' | 'eligible' | 'claimed' | 'approved' | 'rejected' | 'paid';
export type RewardView = { def: RewardDef; state: RewardState; done: number; total: number; label: string; refKey: string; claim?: Claim; entered?: boolean; entrants?: number; prizes?: number; wonDraw?: Draw };

/** What a claim is worth for a choice. Credit = cash amount +10%, plus any fixed credit in a bundle. */
export function amounts(def: RewardDef, choice: 'cash' | 'credit') {
  const cashPart = def.cash;
  return choice === 'cash' ? { cash: cashPart, credit: def.baseCredit } : { cash: 0, credit: def.baseCredit + Math.round(cashPart * (1 + CREDIT_BONUS)) };
}

export const currentChallenge = (w: World, now: Date) => {
  const today = sastDate(now);
  return [...w.challenges].filter((c) => c.weekStart <= today).sort((a, b) => b.weekStart.localeCompare(a.weekStart))[0];
};

export function eligibility(w: World, userId: string, now: Date): RewardView[] {
  const milestones = Object.keys(w.milestonesDone[userId] ?? {}).length;
  const pair = pairOf(w, userId);
  const hasFlag = (source: string) => w.pointEvents.some((p) => p.userId === userId && p.source === source);
  const jointDone = !!pair?.jointAt || hasFlag('buddy_joint');
  const investDone = hasFlag('invest_done');
  const claimOf = (slug: string, refKey: string) => w.claims.find((c) => c.rewardSlug === slug && c.refKey === refKey && (slug === 'buddy-joint' ? true : c.userId === userId));
  const stateFromClaim = (c?: Claim): RewardState | null => (c ? c.status : null);

  return REWARDS.map<RewardView>((def) => {
    if (def.slug === 'milestones-cash') {
      const claim = claimOf(def.slug, 'once');
      const ok = milestones >= 3;
      return { def, refKey: 'once', claim, done: Math.min(milestones, 3), total: 3, label: `${Math.min(milestones, 3)} of 3 milestones`, state: stateFromClaim(claim) ?? (ok ? 'eligible' : 'locked') };
    }
    if (def.slug === 'all-pathways') {
      const claim = claimOf(def.slug, 'once');
      const parts = [milestones >= MILESTONE_SLUGS.length, jointDone, investDone];
      const done = parts.filter(Boolean).length;
      return { def, refKey: 'once', claim, done, total: 3, label: `${done} of 3 pathways`, state: stateFromClaim(claim) ?? (done === 3 ? 'eligible' : 'locked') };
    }
    if (def.slug === 'buddy-joint') {
      const refKey = pair?.id ?? 'none';
      const claim = pair ? claimOf(def.slug, refKey) : undefined;
      return { def, refKey, claim, done: jointDone ? 1 : 0, total: 1, label: jointDone ? 'Joint milestone reached' : pair ? 'Finish the buddy plan 2 weeks running' : 'Needs a Money Buddy', state: stateFromClaim(claim) ?? (jointDone ? 'eligible' : 'locked') };
    }
    // weekly draw: you are 'eligible' only when you have won a draw you have not claimed yet
    const ch = currentChallenge(w, now);
    const entered = !!ch && w.challengeDone.some((d) => d.challengeId === ch.id && d.userId === userId);
    const entrants = ch ? w.challengeDone.filter((d) => d.challengeId === ch.id).length : 0;
    const won = [...w.draws].reverse().find((d) => d.winners.includes(userId) && !w.claims.some((c) => c.userId === userId && c.rewardSlug === def.slug && c.refKey === d.id));
    const lastClaim = [...w.claims].reverse().find((c) => c.userId === userId && c.rewardSlug === def.slug);
    return { def, refKey: won?.id ?? 'none', claim: won ? undefined : lastClaim, entered, entrants, prizes: DRAW_PRIZES, wonDraw: won, done: entered ? 1 : 0, total: 1, label: entered ? 'You are entered this week' : 'Do this week’s challenge to enter', state: won ? 'eligible' : (lastClaim?.status ?? 'locked') };
  });
}

export function claimReward(w: World, userId: string, slug: string, choice: 'cash' | 'credit', now: Date): { ok: true; claim: Claim } | { ok: false; error: string } {
  const view = eligibility(w, userId, now).find((v) => v.def.slug === slug);
  if (!view) return { ok: false, error: 'Reward not found.' };
  if (view.state !== 'eligible') return { ok: false, error: view.state === 'locked' ? 'You are not eligible for this reward yet.' : 'This reward has already been claimed.' };
  const a = amounts(view.def, choice === 'credit' ? 'credit' : 'cash');
  const claim: Claim = { id: uid('claim'), userId, rewardSlug: slug, status: 'claimed', choice, cash: a.cash, credit: a.credit, refKey: view.refKey, note: '', at: now.toISOString(), updatedAt: now.toISOString() };
  w.claims.push(claim);
  track(w, userId, 'reward_claimed', { reward: slug, choice }, now);
  notify(w, userId, { kind: 'reward', title: 'Claim received', body: `${view.def.title}. PPS will review it. ${PILOT_LABEL}`, href: '/rewards', key: `claim-${claim.id}` }, now);
  for (const admin of Object.values(w.users).filter((u) => u.role === 'pps_admin')) notify(w, admin.id, { kind: 'admin', title: 'New reward claim to review', body: `${w.users[userId].displayName}: ${view.def.title}`, href: '/admin/claims', key: `admin-claim-${claim.id}` }, now);
  return { ok: true, claim };
}

export const canAdminister = (w: World, userId: string) => w.users[userId]?.role === 'pps_admin';

/** Admin review: claimed → approved or rejected; approved → paid. No money moves in the mock. */
export function reviewClaim(w: World, adminId: string, claimId: string, action: 'approve' | 'reject' | 'paid', note: string, now: Date): boolean {
  const c = w.claims.find((x) => x.id === claimId);
  if (!c || !canAdminister(w, adminId)) return false;
  const next = action === 'approve' && c.status === 'claimed' ? 'approved' : action === 'reject' && c.status === 'claimed' ? 'rejected' : action === 'paid' && c.status === 'approved' ? 'paid' : null;
  if (!next) return false;
  c.status = next; c.note = note.trim().slice(0, 200) || c.note; c.updatedAt = now.toISOString();
  const def = REWARDS.find((r) => r.slug === c.rewardSlug)!;
  const body = { approved: 'Approved by PPS. Payment comes next.', rejected: `Not approved.${c.note ? ` ${c.note}` : ''}`, paid: 'Paid. Thank you for being part of the pilot.' }[next];
  notify(w, c.userId, { kind: 'reward', title: `${def.title}: ${next}`, body, href: '/rewards', key: `claim-${c.id}-${next}` }, now);
  return true;
}

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };

/** Draws winners for every past-week challenge that has not been drawn yet. Deterministic for a given set of entrants. */
export function runWeeklyDraw(w: World, now: Date): Draw[] {
  const thisWeek = weekStart(now).slice(0, 10);
  const made: Draw[] = [];
  for (const ch of w.challenges) {
    if (ch.weekStart >= thisWeek || w.draws.some((d) => d.challengeId === ch.id)) continue;
    const entrants = [...new Set(w.challengeDone.filter((d) => d.challengeId === ch.id).map((d) => d.userId))].sort();
    const prizes = Math.min(DRAW_PRIZES, entrants.length);
    const pool = [...entrants].sort((a, b) => hash(ch.id + a) - hash(ch.id + b));
    const draw: Draw = { id: uid('draw'), challengeId: ch.id, weekKey: ch.weekStart, entrants, winners: pool.slice(0, prizes), prizes: DRAW_PRIZES, prize: DRAW_PRIZE, at: now.toISOString() };
    w.draws.push(draw); made.push(draw);
    for (const id of draw.winners) if (!w.users[id]?.sim) notify(w, id, { kind: 'reward', title: 'You won the weekly prize draw! 🎉', body: `R${DRAW_PRIZE}. Claim it in Rewards. ${PILOT_LABEL}`, href: '/rewards', key: `draw-win-${draw.id}` }, now);
  }
  return made;
}
