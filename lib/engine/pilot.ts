import type { ChapterId, PilotFacts, PilotRun, World } from '@/lib/world/types';
import { CHAPTERS, chapterById } from '@/lib/pilot/journey';
import { QUICK_COMMUNITIES, formFor } from '@/lib/pilot/instruments';
import { LESSONS } from '@/lib/content';
import { completeOnboarding, createAccount } from './actions';
import { xpOf } from './award';
import { pairOf } from './buddy';
import { totals } from './budget';
import { track } from './helpers';
import { levelFor } from './levels';

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const newParticipantId = () => 'P-' + Array.from({ length: 6 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join('');
void formFor; // parallel-form helpers are kept for a possible future before/after check

export const runOf = (w: World, userId: string | null | undefined): PilotRun | undefined => (userId ? w.pilot[userId] : undefined);
export const BUDGET_SCENARIO = { income: 3500, minSaving: 150 };
export const LESSON_ID = 'now-now-stack-it-grow-it';
type Profile = PilotRun['profile'];

/** Creates the participant record for an existing account. */
export function startRun(w: World, userId: string, o: { path: 'quick' | 'account'; profile: Profile; device: 'mobile' | 'desktop' }, now: Date): PilotRun {
  const existing = w.pilot[userId];
  if (existing) return existing;
  const run: PilotRun = { id: newParticipantId(), userId, path: o.path, consentAt: now.toISOString(), profile: o.profile, device: o.device, stage: 'story', startedAt: now.toISOString(), finishedAt: null, chapters: {}, facts: {}, peeked: [] };
  w.pilot[userId] = run;
  return run;
}

/** Quick start: a practice account with just a nickname, so the story begins at the lesson, not at a long form. */
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

/* ---------- where the tester is in the story ---------- */

/** The chapter the tester is on: the first one whose wrap-up they have not yet moved past. */
export const chapterIndex = (run: PilotRun) => { const i = CHAPTERS.findIndex((c) => !run.chapters[c.id]?.seen); return i === -1 ? CHAPTERS.length : i; };
export const currentChapter = (run: PilotRun) => CHAPTERS[chapterIndex(run)];
export const allChaptersDone = (run: PilotRun) => CHAPTERS.every((c) => !!run.chapters[c.id]?.doneAt);

export function startChapter(w: World, userId: string, id: ChapterId, now: Date) {
  const run = w.pilot[userId];
  if (!run) return;
  const ch = (run.chapters[id] ??= {});
  ch.startedAt ??= now.toISOString();
}

/* ---------- what the tester actually did (observed, never self-reported) ---------- */

const since = (run: PilotRun, id: ChapterId) => run.chapters[id]?.startedAt ?? run.startedAt;
const events = (w: World, userId: string, name: string, from: string) => w.analytics.filter((e) => e.userId === userId && e.name === name && e.at >= from);

/** Which steps of a chapter are done, from the world itself. */
export function stepsDone(w: World, userId: string, run: PilotRun, id: ChapterId): Record<string, boolean> {
  const from = since(run, id);
  switch (id) {
    case 'learn': {
      const lesson = LESSONS.find((l) => l.id === LESSON_ID);
      const lp = w.lessonProgress[`${userId}:${LESSON_ID}`];
      const act = lesson && w.actionCompletions[`${userId}:${lesson.action.id}`];
      return {
        cards: !!lp && (lp.status === 'completed' || lp.status === 'passed') && (lp.completedAt ?? '') >= from,
        quiz: !!lp && lp.quizScore != null && (lp.completedAt ?? '') >= from,
        action: !!act && act.at >= from,
      };
    }
    case 'do': {
      const b = w.budgets[userId];
      return { budget: !!b && b.savedAt >= from && b.income === BUDGET_SCENARIO.income && totals(b.income, b.lines).spent <= b.income && b.lines.emergency + b.lines.investing >= BUDGET_SCENARIO.minSaving };
    }
    case 'progress': return { target: events(w, userId, 'weekly_target_set', from).length > 0 };
    case 'reward': return { choose: !!run.facts.rewardChoice };
    case 'connect': {
      const pair = pairOf(w, userId);
      const hello = w.messages.some((m) => m.userId === userId && m.kind === 'user' && m.at >= from && w.channels.some((c) => c.id === m.channelId && (c.kind === 'community' || c.kind === 'circle')));
      return { hello, buddy: !!pair, nudge: !!pair && pair.nudges.some((n) => n.fromId === userId) };
    }
  }
}

/** Facts about what happened. They hold no amounts the tester typed and no message text. */
export function computeFacts(w: World, userId: string, run: PilotRun): PilotFacts {
  const lp = w.lessonProgress[`${userId}:${LESSON_ID}`];
  const pair = pairOf(w, userId);
  const xp = xpOf(w, userId);
  const done = (id: ChapterId, step: string) => stepsDone(w, userId, run, id)[step];
  return {
    ...run.facts,
    quizScore: lp?.quizScore ?? null,
    quizAttempts: w.analytics.filter((e) => e.userId === userId && e.name === 'quiz_submitted' && e.props?.lesson === LESSON_ID).length,
    budgetOk: !!run.chapters.do?.doneAt || done('do', 'budget'),
    weeklyTarget: events(w, userId, 'weekly_target_set', run.startedAt).length ? w.users[userId].weeklyTarget : run.facts.weeklyTarget,
    messageSent: !!run.chapters.connect?.doneAt || done('connect', 'hello') || run.facts.messageSent,
    buddyStarted: !!pair || run.facts.buddyStarted,
    nudged: (!!pair && pair.nudges.some((n) => n.fromId === userId)) || run.facts.nudged,
    points: xp, level: levelFor(xp).name,
    badges: w.userBadges.filter((b) => b.userId === userId).map((b) => b.slug),
  };
}

/** True when the stored record is out of date with the world. The caller applies it once, so it never loops. */
export function pendingUpdate(w: World, userId: string): boolean {
  const run = w.pilot[userId];
  if (!run || run.stage === 'done') return false;
  const ch = currentChapter(run);
  if (ch && run.chapters[ch.id]?.startedAt && Object.values(stepsDone(w, userId, run, ch.id)).every(Boolean) && !run.chapters[ch.id]?.doneAt) return true;
  return JSON.stringify(computeFacts(w, userId, run)) !== JSON.stringify(run.facts);
}

export function applyUpdate(w: World, userId: string, now: Date) {
  const run = w.pilot[userId];
  if (!run) return;
  const ch = currentChapter(run);
  if (ch && run.chapters[ch.id]?.startedAt && !run.chapters[ch.id]?.doneAt && Object.values(stepsDone(w, userId, run, ch.id)).every(Boolean)) run.chapters[ch.id]!.doneAt = now.toISOString();
  run.facts = computeFacts(w, userId, run);
}

/* ---------- choices made inside the story ---------- */

export function chooseReward(w: World, userId: string, choice: 'cash' | 'credit', now: Date) {
  const run = w.pilot[userId];
  if (!run) return;
  startChapter(w, userId, 'reward', now);
  run.facts.rewardChoice = choice;
  track(w, userId, 'pilot_reward_choice', { choice }, now);
}

export function markSeen(w: World, userId: string, id: ChapterId) {
  const run = w.pilot[userId];
  if (run?.chapters[id]?.doneAt) run.chapters[id]!.seen = true;
}

export function react(w: World, userId: string, id: ChapterId, v: 1 | 2 | 3) {
  const run = w.pilot[userId];
  if (!run || !run.chapters[id]?.doneAt) return;
  run.chapters[id]!.reaction = v;
}

export function peek(w: World, userId: string, id: string) {
  const run = w.pilot[userId];
  if (run && !run.peeked.includes(id)) run.peeked.push(id);
}

export function finishRun(w: World, userId: string, now: Date): { ok: true } | { ok: false; error: string } {
  const run = w.pilot[userId];
  if (!run) return { ok: false, error: 'No pilot session found.' };
  if (!allChaptersDone(run)) return { ok: false, error: 'Finish the five chapters first.' };
  run.facts = computeFacts(w, userId, run);
  run.stage = 'done'; run.finishedAt = now.toISOString();
  track(w, userId, 'pilot_finished', { chapters: CHAPTERS.length }, now);
  return { ok: true };
}

/** Admin: add a tester's pasted code. A later code for the same tester replaces the earlier one. */
export function importRuns(w: World, runs: PilotRun[]): { added: number; duplicates: number } {
  let added = 0; let duplicates = 0;
  for (const r of runs) {
    const i = w.pilotImports.findIndex((x) => x.id === r.id);
    if (i >= 0) {
      const old = w.pilotImports[i];
      if ((r.stage === 'done' && old.stage !== 'done') || r.peeked.length > old.peeked.length) { w.pilotImports[i] = r; added++; } else duplicates++;
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

export const chapterTitle = (id: ChapterId) => chapterById(id).title;
