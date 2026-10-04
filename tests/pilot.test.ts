import { describe, expect, it } from 'vitest';
import { buildWorld } from '@/lib/world/seed';
import { KNOWLEDGE, formFor, otherForm, optionOrder } from '@/lib/pilot/instruments';
import { anonymise, decodeRun, encodeRun, summarize, toCsv } from '@/lib/pilot/analysis';
import { simulatedRuns } from '@/lib/pilot/sample';
import { allChaptersDone, allRuns, applyUpdate, chapterIndex, chooseReward, finishRun, importRuns, markSeen, pendingUpdate, quickStart, react, startChapter, stepsDone, peek } from '@/lib/engine/pilot';
import { CHAPTERS } from '@/lib/pilot/journey';
import { setWeeklyTargetAction } from '@/lib/engine/settings';
import { startSimBuddy, nudge } from '@/lib/engine/buddy';
import { completeAction, completeLesson, submitQuiz } from '@/lib/engine/actions';
import { saveBudget, linesFromTemplate, TEMPLATES } from '@/lib/engine/budget';
import { communityChannel } from '@/lib/engine/chat';
import { joinCommunity } from '@/lib/engine/actions';
import { track } from '@/lib/engine/helpers';
import { COURSES } from '@/lib/content';

const NOW = new Date('2026-10-07T10:00:00Z');
const later = (min: number) => new Date(NOW.getTime() + min * 60000);

describe('knowledge instrument', () => {
  it('has six items, each with a correct answer and four distinct options per form', () => {
    expect(KNOWLEDGE).toHaveLength(6);
    for (const i of KNOWLEDGE) for (const f of ['A', 'B'] as const) {
      const form = i.forms[f];
      expect(form.options).toHaveLength(4);
      expect(new Set(form.options).size).toBe(4);
      expect(form.correct).toBeGreaterThanOrEqual(0); expect(form.correct).toBeLessThan(4);
      expect(i.source.length).toBeGreaterThan(10);
    }
  });
  it('arithmetic in the items is right', () => {
    expect(1000 * 1.1).toBe(1100); expect(2000 * 1.2).toBe(2400); expect(2700 - 2500).toBe(200); expect(4000 - 3750).toBe(250); expect(200 * 9).toBe(1800); expect(300 * 5).toBe(1500);
    const k2 = KNOWLEDGE.find((i) => i.id === 'k2')!; expect(k2.forms.A.options[k2.forms.A.correct]).toBe('R1,100'); expect(k2.forms.B.options[k2.forms.B.correct]).toBe('R2,400');
  });
  it('the two forms differ in wording for every item', () => { for (const i of KNOWLEDGE) expect(JSON.stringify(i.forms.A)).not.toBe(JSON.stringify(i.forms.B)); });
  it('forms are counterbalanced across participants and the other form is used at post-test', () => {
    const counts = { A: 0, B: 0 };
    for (let n = 0; n < 200; n++) counts[formFor(`P-${n}XYZ`)]++;
    expect(counts.A).toBeGreaterThan(70); expect(counts.B).toBeGreaterThan(70);
    expect(otherForm('A')).toBe('B');
  });
  it('option order is a stable permutation per participant', () => {
    const a = optionOrder('P-ABC123', 'k1', 'pre', 4); const b = optionOrder('P-ABC123', 'k1', 'pre', 4);
    expect(a).toEqual(b); expect([...a].sort()).toEqual([0, 1, 2, 3]);
    const positions = new Set(Array.from({ length: 40 }, (_, i) => optionOrder(`P-${i}`, 'k1', 'pre', 4).indexOf(1)));
    expect(positions.size).toBeGreaterThan(2);
  });
});

describe('source-checked content figures', () => {
  const text = JSON.stringify(COURSES.find((c) => c.slug === 'money-matters'));
  it('payslip net is gross minus deductions (the facilitator guide’s R10,319.25 is wrong; the slide’s R9,819.25 is right)', () => {
    expect(260.75 + 120 + 750 + 550).toBe(1680.75);
    expect(11500 - 1680.75).toBe(9819.25);
    const q = COURSES.find((c) => c.slug === 'money-matters')!.lessons.find((l) => l.slug === 'payslip-walkthrough')!.quiz[0];
    expect(q.options[q.correct]).toBe('R9,819.25'); // R10,319.25 appears only as a wrong option
    expect(text).toContain('R9,819.25');
  });
  it('compounding figures are reproducible (R500 a month, 8% a year, monthly)', () => {
    const fv = (years: number) => { const i = 0.08 / 12; const n = years * 12; return 500 * ((1 + i) ** n - 1) / i; };
    expect(Math.round(fv(40))).toBeGreaterThan(1_745_000); expect(Math.round(fv(40))).toBeLessThan(1_746_000);
    expect(Math.round(fv(30))).toBeGreaterThan(745_000); expect(Math.round(fv(30))).toBeLessThan(745_500);
    expect(Math.round(fv(20))).toBe(294_510); // the source slide shows R349,101, which does not follow from the same method
    expect(fv(40) / fv(20)).toBeGreaterThan(5.9);
    expect(text).toContain('R295,000'); expect(text).toContain('R120,000 more');
  });
  it('laptop example: R1,500 at 15% is R1,725 and saving R150 × 12 leaves R300', () => { expect(1500 * 1.15).toBeCloseTo(1725); expect(150 * 12 - 1500).toBe(300); });
  it('the budget scenario template reproduces R3,600 of spending on R3,500', () => {
    const t = TEMPLATES.find((x) => x.id === 'workshop')!;
    const lines = linesFromTemplate(t, 3500);
    expect(t.income).toBe(3500);
    expect(Object.values(lines).reduce((a, b) => a + b, 0)).toBe(3600);
  });
});

describe('guided pilot', () => {
  const LESSON = 'now-now-stack-it-grow-it';
  const fresh = () => {
    const w = buildWorld(NOW);
    const r = quickStart(w, { nickname: 'Test', profile: null, device: 'mobile' }, NOW);
    if (!r.ok) throw new Error(r.error);
    return { w, id: r.userId };
  };
  const sync = (w: ReturnType<typeof fresh>['w'], id: string, at: Date) => { if (pendingUpdate(w, id)) applyUpdate(w, id, at); };

  it('has five chapters in Sisi’s loop order', () => { expect(CHAPTERS.map((c) => c.label)).toEqual(['LEARN', 'DO', 'PROGRESS', 'REWARD', 'CONNECT']); });
  it('quick start creates an onboarded practice account, joins no community yet and begins the story', () => {
    const { w, id } = fresh();
    expect(w.users[id].onboardedAt).toBeTruthy();
    expect(w.communityMembers.some((m) => m.userId === id)).toBe(false);
    expect(w.pilot[id]).toMatchObject({ stage: 'story', path: 'quick' });
    expect(w.pilot[id].id).toMatch(/^[A-Z0-9]{4}$/);
    expect(chapterIndex(w.pilot[id])).toBe(0);
    expect(w.surveys.some((s) => s.userId === id)).toBe(false);
  });
  it('rejects bad nicknames', () => {
    const w = buildWorld(NOW);
    expect(quickStart(w, { nickname: 'a', profile: null, device: 'mobile' }, NOW)).toMatchObject({ ok: false });
  });
  it('LEARN needs the cards, the quiz and the action, in the real app', () => {
    const { w, id } = fresh(); const run = () => w.pilot[id];
    startChapter(w, id, 'learn', later(0));
    expect(Object.values(stepsDone(w, id, run(), 'learn'))).toEqual([false, false, false]);
    completeLesson(w, id, LESSON, later(1));
    expect(stepsDone(w, id, run(), 'learn')).toMatchObject({ cards: true, quiz: false, action: false });
    submitQuiz(w, id, LESSON, [0, 0, 0], later(2));
    expect(stepsDone(w, id, run(), 'learn').quiz).toBe(true);
    sync(w, id, later(2)); expect(run().chapters.learn?.doneAt).toBeUndefined();
    completeAction(w, id, LESSON, 'skipped', later(3));
    sync(w, id, later(3)); expect(run().chapters.learn?.doneAt).toBeTruthy();
    expect(run().facts.quizScore).toBeGreaterThanOrEqual(0); expect(run().facts.quizAttempts).toBe(1);
  });
  it('only the current chapter counts, and only what happens after it starts', () => {
    const { w, id } = fresh(); const run = () => w.pilot[id];
    // saving the right budget before chapter 2 has started does nothing
    const tpl = TEMPLATES.find((t) => t.id === 'workshop')!;
    saveBudget(w, id, { template: 'workshop', income: 3500, lines: { ...linesFromTemplate(tpl, 3500), transport: 600, fun: 450, emergency: 150 } }, later(0));
    sync(w, id, later(0)); expect(run().chapters.do?.doneAt).toBeUndefined();
    expect(chapterIndex(run())).toBe(0);
  });
  it('DO needs a budget that spends within R3,500 and saves at least R150', () => {
    const { w, id } = fresh(); const run = () => w.pilot[id];
    startChapter(w, id, 'do', later(0));
    const tpl = TEMPLATES.find((t) => t.id === 'workshop')!;
    saveBudget(w, id, { template: 'workshop', income: 3500, lines: linesFromTemplate(tpl, 3500) }, later(1)); // R3,600 out
    expect(stepsDone(w, id, run(), 'do').budget).toBe(false);
    saveBudget(w, id, { template: 'workshop', income: 3500, lines: { ...linesFromTemplate(tpl, 3500), transport: 600, fun: 450, emergency: 150 } }, later(2));
    expect(stepsDone(w, id, run(), 'do').budget).toBe(true);
    saveBudget(w, id, { template: 'workshop', income: 3500, lines: { ...linesFromTemplate(tpl, 3500), transport: 600, fun: 500 } }, later(3)); // within income but saves nothing
    expect(stepsDone(w, id, run(), 'do').budget).toBe(false);
  });
  it('PROGRESS needs an explicit weekly-target tap', () => {
    const { w, id } = fresh(); const run = () => w.pilot[id];
    startChapter(w, id, 'progress', later(0));
    expect(stepsDone(w, id, run(), 'progress').target).toBe(false);
    setWeeklyTargetAction(w, id, 3, later(1));
    expect(stepsDone(w, id, run(), 'progress').target).toBe(true);
  });
  it('REWARD records the choice and nothing real is claimed', () => {
    const { w, id } = fresh();
    chooseReward(w, id, 'credit', later(0));
    expect(w.pilot[id].facts.rewardChoice).toBe('credit');
    expect(w.claims.filter((c) => c.userId === id)).toHaveLength(0);
    expect(stepsDone(w, id, w.pilot[id], 'reward').choose).toBe(true);
  });
  it('CONNECT needs a message in a community channel, a buddy and a nudge', () => {
    const { w, id } = fresh(); const run = () => w.pilot[id];
    for (const c of CHAPTERS.slice(0, 4)) run().chapters[c.id] = { startedAt: later(0).toISOString(), doneAt: later(0).toISOString(), seen: true };
    startChapter(w, id, 'connect', later(0));
    expect(Object.values(stepsDone(w, id, run(), 'connect'))).toEqual([false, false, false, false]);
    const comm = w.communities.find((c) => c.slug === 'student-savers')!;
    joinCommunity(w, id, comm.id, later(0.5));
    expect(stepsDone(w, id, run(), 'connect').join).toBe(true);
    const ch = communityChannel(w, comm.id)!;
    w.messages.push({ id: 'm1', channelId: ch.id, userId: id, body: 'Hi!', replyTo: null, kind: 'user', pinned: false, deleted: false, at: later(1).toISOString() });
    const r = startSimBuddy(w, id, later(2)); if (!r.ok) throw new Error('x');
    expect(stepsDone(w, id, run(), 'connect')).toMatchObject({ join: true, hello: true, buddy: true, nudge: false });
    nudge(w, id, r.pair.id, later(3));
    expect(stepsDone(w, id, run(), 'connect').nudge).toBe(true);
    expect(run().facts.messageSent).toBeFalsy(); sync(w, id, later(3));
    expect(run().chapters.connect?.doneAt).toBeTruthy(); expect(run().facts).toMatchObject({ messageSent: true, buddyStarted: true, nudged: true });
  });
  it('the whole story ends in an anonymous, exportable record that holds no message text or amounts', async () => {
    const { w, id } = fresh(); const run = () => w.pilot[id];
    const tpl = TEMPLATES.find((t) => t.id === 'workshop')!;
    const comm = w.communities.find((c) => c.slug === 'student-savers')!;
    CHAPTERS.forEach((c, i) => {
      startChapter(w, id, c.id, later(i * 3));
      if (c.id === 'learn') { completeLesson(w, id, LESSON, later(i * 3 + 1)); submitQuiz(w, id, LESSON, [1, 0, 1], later(i * 3 + 1)); completeAction(w, id, LESSON, 'done', later(i * 3 + 1)); }
      if (c.id === 'do') track(w, id, 'payslip_sim_saved', {}, later(i * 3 + 1));
      if (c.id === 'do') saveBudget(w, id, { template: 'workshop', income: 3500, lines: { ...linesFromTemplate(tpl, 3500), transport: 600, fun: 450, emergency: 150 } }, later(i * 3 + 1));
      if (c.id === 'progress') setWeeklyTargetAction(w, id, 2, later(i * 3 + 1));
      if (c.id === 'reward') chooseReward(w, id, 'cash', later(i * 3 + 1));
      if (c.id === 'connect') {
        joinCommunity(w, id, comm.id, later(i * 3 + 1));
        w.messages.push({ id: 'm1', channelId: communityChannel(w, comm.id)!.id, userId: id, body: 'A very private message about my rent', replyTo: null, kind: 'user', pinned: false, deleted: false, at: later(i * 3 + 1).toISOString() });
        const r = startSimBuddy(w, id, later(i * 3 + 1)); if (r.ok) nudge(w, id, r.pair.id, later(i * 3 + 1));
      }
      sync(w, id, later(i * 3 + 2));
      expect(run().chapters[c.id]?.doneAt).toBeTruthy();
      react(w, id, c.id, 1); markSeen(w, id, c.id);
    });
    expect(allChaptersDone(run())).toBe(true); expect(chapterIndex(run())).toBe(CHAPTERS.length);
    peek(w, id, 'payslip');
    expect(finishRun(w, id, later(16))).toMatchObject({ ok: true });
    const code = await encodeRun(run());
    expect(code.startsWith('SISI3.') || code.startsWith('SISI1.')).toBe(true);
    const text = JSON.stringify(anonymise(run()));
    expect(text).not.toContain('private message'); expect(text).not.toContain('"userId":"u-');
    const back = await decodeRun(code);
    expect(back).toMatchObject({ userId: null, stage: 'done', peeked: ['payslip'] });
    expect(back!.facts).toMatchObject({ budgetOk: true, rewardChoice: 'cash', weeklyTarget: 2, messageSent: true, buddyStarted: true, nudged: true });
    const s = summarize([back!]);
    expect(s.done).toBe(1); expect(s.chapters.every((c) => c.finished === 1)).toBe(true);
    expect(await decodeRun('SISI2.old')).toBeNull(); expect(await decodeRun('hello')).toBeNull();
  });
  it('cannot finish before all five chapters are done', () => {
    const { w, id } = fresh();
    expect(finishRun(w, id, NOW)).toMatchObject({ ok: false });
  });
  it('imports dedupe by participant', () => {
    const w = buildWorld(NOW);
    const [a] = simulatedRuns(1, NOW);
    expect(importRuns(w, [a]).added).toBe(1);
    expect(importRuns(w, [a]).duplicates).toBe(1);
    expect(allRuns(w)).toHaveLength(1);
  });
});

describe('dashboard maths on simulated data', () => {
  const runs = simulatedRuns(40, NOW);
  const s = summarize(runs);
  it('flags small and exploratory samples and withholds verdicts for tiny ones', () => {
    expect(summarize(runs.slice(0, 5)).small).toBe(true); expect(summarize(runs.slice(0, 20)).exploratory).toBe(true); expect(s.exploratory).toBe(false);
    expect(summarize(runs.slice(0, 3)).verdicts.every((v) => v.pass === null)).toBe(true);
  });
  it('summarises completion, time, quiz, budget, reward choice and connection', () => {
    expect(s.n).toBe(40); expect(s.done).toBe(40); expect(s.chapters).toHaveLength(5);
    expect(s.verdicts.map((v) => v.id)).toEqual(['completion', 'time', 'quiz', 'budget', 'connect', 'reactions']);
    expect(s.facts.reward.cash + s.facts.reward.credit).toBe(40); expect(s.facts.quiz.n).toBe(40);
  });
  it('CSV has a header, one row per participant and no account ids or emails', () => {
    const csv = toCsv(runs); const lines = csv.split('\n');
    expect(lines).toHaveLength(41); expect(lines[0]).toContain('learn_done'); expect(lines[0]).toContain('reward_choice');
    expect(csv).not.toMatch(/@|u-[a-z0-9]{3,}/i);
  });
});
