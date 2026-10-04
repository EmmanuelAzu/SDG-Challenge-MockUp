import type { PilotCheck, PilotRun, PilotSurvey, World } from '@/lib/world/types';
import { CONFIDENCE, CORE, KNOWLEDGE, MISSIONS, QUICK_COMMUNITIES, formFor } from '@/lib/pilot/instruments';
import { completeOnboarding, createAccount } from './actions';
import { friendIds, outgoing } from './friends';
import { pairOf } from './buddy';
import { totals } from './budget';
import { track } from './helpers';

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const newParticipantId = () => 'P-' + Array.from({ length: 6 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join('');

export const runOf = (w: World, userId: string | null | undefined): PilotRun | undefined => (userId ? w.pilot[userId] : undefined);
export const BUDGET_SCENARIO = { income: 3500, minSaving: 150 };

type Profile = PilotRun['profile'];

/** Creates the participant record for an existing account (after sign-up, or right after a quick start). */
export function startRun(w: World, userId: string, o: { path: 'quick' | 'full'; profile: Profile; device: 'mobile' | 'desktop'; signupMs?: number }, now: Date): PilotRun {
  const existing = w.pilot[userId];
  if (existing) return existing;
  const id = newParticipantId();
  const run: PilotRun = {
    id, userId, path: o.path, form: formFor(id), consentAt: now.toISOString(), profile: o.profile, device: o.device, stage: 'pre',
    startedAt: now.toISOString(), signupMs: Math.max(0, o.signupMs ?? 0), finishedAt: null, pre: null, post: null, missions: {}, survey: null, followUp: null,
  };
  w.pilot[userId] = run;
  return run;
}

/** Quick start: a practice account with only a nickname, so the 10-minute path begins at the lesson, not at a long form. */
export function quickStart(w: World, o: { nickname: string; communitySlug: string; profile: Profile; device: 'mobile' | 'desktop' }, now: Date): { ok: true; userId: string } | { ok: false; error: string } {
  const nickname = o.nickname.trim().slice(0, 20);
  if (nickname.length < 2) return { ok: false, error: 'Pick a nickname with at least 2 letters. Please do not use your full name.' };
  const community = w.communities.find((c) => c.slug === o.communitySlug && QUICK_COMMUNITIES.includes(c.slug));
  if (!community) return { ok: false, error: 'Pick a community to join.' };
  const slug = Math.random().toString(36).slice(2, 10);
  const acc = createAccount(w, { email: `pilot-${slug}@pilot.sisi.app`, password: Math.random().toString(36).slice(2, 14) + 'A1', displayName: nickname }, now);
  if (!acc.ok) return acc;
  completeOnboarding(w, acc.id, { displayName: nickname, nickname, communityId: community.id, quiz: { source: 'allowance', goal: 'budget', timeframe: 'month', obligations: 'none', checkins: 2 }, confidence: [], skipSurvey: true }, now);
  startRun(w, acc.id, { path: 'quick', profile: o.profile, device: o.device }, now);
  track(w, acc.id, 'pilot_started', { path: 'quick' }, now);
  return { ok: true, userId: acc.id };
}

/* ---------- checks ---------- */

export function submitCheck(w: World, userId: string, which: 'pre' | 'post', input: { k: Record<string, number>; c: number[]; ms: number }, now: Date): { ok: true } | { ok: false; error: string } {
  const run = w.pilot[userId];
  if (!run) return { ok: false, error: 'No pilot session found.' };
  if (which === 'pre' ? run.stage !== 'pre' : run.stage !== 'post') return { ok: false, error: 'This step is already done.' };
  if (!KNOWLEDGE.every((i) => Number.isInteger(input.k[i.id]) && input.k[i.id] >= -1 && input.k[i.id] <= 3)) return { ok: false, error: 'Answer every question (or tap “I’m not sure”).' };
  if (input.c.length !== CONFIDENCE.length || input.c.some((v) => !(v >= 1 && v <= 5))) return { ok: false, error: 'Rate each statement from 1 to 5.' };
  const check: PilotCheck = { k: input.k, c: input.c, at: now.toISOString(), ms: Math.max(0, Math.min(3_600_000, Math.round(input.ms))) };
  if (which === 'pre') { run.pre = check; run.stage = 'missions'; } else { run.post = check; run.stage = 'feedback'; }
  return { ok: true };
}

/* ---------- missions ---------- */

export function startMission(w: World, userId: string, id: string, now: Date) {
  const run = w.pilot[userId];
  if (!run || !MISSIONS.some((m) => m.id === id)) return;
  const m = (run.missions[id] ??= {});
  m.startedAt ??= now.toISOString();
}

/** Missions whose success can be seen in what the tester actually did. Success is observed, not self-reported. */
export function detectable(w: World, userId: string): string[] {
  const run = w.pilot[userId];
  if (!run) return [];
  const since = run.startedAt;
  const open = (id: string) => !run.missions[id]?.doneAt;
  const out: string[] = [];
  const check = (id: string, ok: boolean) => { if (open(id) && ok) out.push(id); };

  check('join', w.communityMembers.some((m) => m.userId === userId));
  const lp = w.lessonProgress[`${userId}:now-now-stack-it-grow-it`];
  check('learn', !!lp && (lp.status === 'completed' || lp.status === 'passed') && (lp.completedAt ?? '') >= since);
  const b = w.budgets[userId];
  check('budget', !!b && b.savedAt >= since && b.income === BUDGET_SCENARIO.income && totals(b.income, b.lines).spent <= b.income && b.lines.emergency + b.lines.investing >= BUDGET_SCENARIO.minSaving);
  const talked = w.messages.some((m) => m.userId === userId && m.kind === 'user' && m.at >= since && w.channels.find((c) => c.id === m.channelId && (c.kind === 'community' || c.kind === 'circle')));
  check('community', talked || w.feedReactions.some((r) => r.userId === userId) || w.feedNotes.some((n) => n.userId === userId && n.at >= since));
  check('payslip', (w.payslipRuns[userId]?.length ?? 0) > 0);
  check('buddy', !!pairOf(w, userId));
  check('letterbox', friendIds(w, userId).length > 0 || outgoing(w, userId).length > 0);
  check('invest', !!w.invest[userId]);
  check('talk', w.helpRequests.some((h) => h.userId === userId && h.at >= since));
  return out;
}

export function applyDetections(w: World, userId: string, now: Date): string[] {
  const ids = detectable(w, userId);
  const run = w.pilot[userId];
  for (const id of ids) { const m = (run.missions[id] ??= {}); m.startedAt ??= id === 'join' ? run.startedAt : now.toISOString(); m.doneAt = now.toISOString(); m.auto = true; }
  return ids;
}

/** For pages the pilot deliberately does not track (Support), or read-only ones (Rewards). */
export function confirmMission(w: World, userId: string, id: string, now: Date) {
  const run = w.pilot[userId];
  const def = MISSIONS.find((m) => m.id === id);
  if (!run || !def || def.auto) return;
  const m = (run.missions[id] ??= {});
  m.startedAt ??= now.toISOString(); m.doneAt ??= now.toISOString(); m.auto = false;
}

export function rateMission(w: World, userId: string, id: string, seq: number) {
  const run = w.pilot[userId];
  if (!run || !run.missions[id]?.doneAt || !(seq >= 1 && seq <= 7)) return;
  run.missions[id].seq = Math.round(seq);
}

export const coreComplete = (run: PilotRun) => CORE.every((m) => !!run.missions[m.id]?.doneAt);
export const coreRated = (run: PilotRun) => CORE.every((m) => typeof run.missions[m.id]?.seq === 'number');

export function goToPost(w: World, userId: string): { ok: true } | { ok: false; error: string } {
  const run = w.pilot[userId];
  if (!run || run.stage !== 'missions') return { ok: false, error: 'Nothing to do here.' };
  if (!coreComplete(run)) return { ok: false, error: 'Finish the four core missions first.' };
  if (!coreRated(run)) return { ok: false, error: 'Tap a rating for each mission first. It takes a second.' };
  run.stage = 'post';
  return { ok: true };
}

/* ---------- survey and follow-up ---------- */

export function submitSurvey(w: World, userId: string, s: Omit<PilotSurvey, 'at'>, now: Date): { ok: true } | { ok: false; error: string } {
  const run = w.pilot[userId];
  if (!run || run.stage !== 'feedback') return { ok: false, error: 'Nothing to submit yet.' };
  if (s.umux.some((v) => !(v >= 1 && v <= 7)) || !(s.nps >= 0 && s.nps <= 10) || !['yes', 'maybe', 'no'].includes(s.again)) return { ok: false, error: 'Please answer each rating question.' };
  if (run.missions.community?.doneAt && s.safety == null) return { ok: false, error: 'Please rate how comfortable the community felt.' };
  run.survey = { ...s, liked: s.liked.trim().slice(0, 300), confusing: s.confusing.trim().slice(0, 300), at: now.toISOString() };
  run.stage = 'done'; run.finishedAt = now.toISOString();
  track(w, userId, 'pilot_finished', { core: coreComplete(run) }, now);
  return { ok: true };
}

export function submitFollowUp(w: World, userId: string, f: { usedAgain: 'yes' | 'no'; did: string[]; c: number[]; changed: string }, now: Date): boolean {
  const run = w.pilot[userId];
  if (!run || run.stage !== 'done' || f.c.length !== CONFIDENCE.length || f.c.some((v) => !(v >= 1 && v <= 5))) return false;
  run.followUp = { at: now.toISOString(), usedAgain: f.usedAgain, did: f.did.slice(0, 6), c: f.c, changed: f.changed.trim().slice(0, 300) };
  return true;
}

/** Admin: add a tester's pasted code. Returns false for duplicates. */
export function importRuns(w: World, runs: PilotRun[]): { added: number; duplicates: number } {
  let added = 0; let duplicates = 0;
  for (const r of runs) {
    const i = w.pilotImports.findIndex((x) => x.id === r.id);
    if (i >= 0) { // a later code (for example with the follow-up) replaces the earlier one
      const old = w.pilotImports[i];
      if ((r.followUp ? 1 : 0) > (old.followUp ? 1 : 0) || r.stage === 'done' && old.stage !== 'done') { w.pilotImports[i] = r; added++; } else duplicates++;
    } else { w.pilotImports.push(r); added++; }
  }
  return { added, duplicates };
}

/** Everything the dashboard analyses: runs on this device plus imported codes (an imported copy of a local run is not counted twice). */
export function allRuns(w: World): PilotRun[] {
  const local = Object.values(w.pilot);
  const ids = new Set(local.map((r) => r.id));
  return [...local, ...w.pilotImports.filter((r) => !ids.has(r.id))];
}
