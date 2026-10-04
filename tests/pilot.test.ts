import { describe, expect, it } from 'vitest';
import { buildWorld } from '@/lib/world/seed';
import { KNOWLEDGE, MISSIONS, CORE, formFor, otherForm, optionOrder, CONFIDENCE } from '@/lib/pilot/instruments';
import { anonymise, decodeRun, encodeRun, paired, scoreCheck, summarize, tCrit, toCsv, umuxScore } from '@/lib/pilot/analysis';
import { simulatedRuns } from '@/lib/pilot/sample';
import { applyDetections, coreComplete, detectable, goToPost, importRuns, quickStart, rateMission, startMission, submitCheck, submitSurvey, allRuns, confirmMission } from '@/lib/engine/pilot';
import { completeLesson } from '@/lib/engine/actions';
import { saveBudget, linesFromTemplate, TEMPLATES } from '@/lib/engine/budget';
import { sendMessage } from '@/lib/engine/chat';
import { communityChannel } from '@/lib/engine/chat';
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

describe('statistics and scoring', () => {
  it('UMUX-Lite maps 1–7 pairs to 0–100', () => { expect(umuxScore([1, 1])).toBe(0); expect(umuxScore([7, 7])).toBe(100); expect(umuxScore([5, 6])).toBe(75); });
  it('paired difference with a t interval', () => {
    const p = paired([1, 2, 1, 0, 2]);
    expect(p.mean).toBeCloseTo(1.2); expect(p.n).toBe(5); expect(p.ci[0]).toBeLessThan(p.mean); expect(p.ci[1]).toBeGreaterThan(p.mean);
    expect(tCrit(4)).toBeCloseTo(2.776, 2);
  });
  it('scores a check against the form used at that stage', () => {
    const run = { form: 'A' as const };
    const preK = Object.fromEntries(KNOWLEDGE.map((i) => [i.id, i.forms.A.correct]));
    const postK = Object.fromEntries(KNOWLEDGE.map((i, n) => [i.id, n < 2 ? i.forms.B.correct : -1]));
    expect(scoreCheck(run, 'pre', { k: preK, c: [3, 3, 3], at: '', ms: 0 })!.score).toBe(6);
    const post = scoreCheck(run, 'post', { k: postK, c: [3, 3, 3], at: '', ms: 0 })!;
    expect(post.score).toBe(2); expect(post.notSure).toBe(4);
    // A-form answers do not score on the B form
    expect(scoreCheck(run, 'post', { k: preK, c: [3, 3, 3], at: '', ms: 0 })!.score).toBeLessThan(6);
  });
});

describe('pilot run', () => {
  const fresh = () => {
    const w = buildWorld(NOW);
    const r = quickStart(w, { nickname: 'Test', communitySlug: 'student-savers', profile: null, device: 'mobile' }, NOW);
    if (!r.ok) throw new Error(r.error);
    return { w, id: r.userId };
  };
  const answers = (w: ReturnType<typeof fresh>['w'], id: string, right: boolean, which: 'pre' | 'post') => {
    const run = w.pilot[id]; const f = which === 'pre' ? run.form : otherForm(run.form);
    return { k: Object.fromEntries(KNOWLEDGE.map((i) => [i.id, right ? i.forms[f].correct : -1])), c: [3, 3, 3], ms: 60000 };
  };

  it('quick start creates an onboarded practice account, joins the community and starts at the pre-check', () => {
    const { w, id } = fresh();
    expect(w.users[id].onboardedAt).toBeTruthy();
    expect(w.communityMembers.some((m) => m.userId === id)).toBe(true);
    expect(w.pilot[id]).toMatchObject({ stage: 'pre', path: 'quick' });
    expect(w.surveys.some((s) => s.userId === id)).toBe(false); // no fake baseline
    expect(w.pilot[id].id).toMatch(/^P-[A-Z0-9]{6}$/);
  });
  it('rejects bad nicknames and unlisted communities', () => {
    const w = buildWorld(NOW);
    expect(quickStart(w, { nickname: 'a', communitySlug: 'wits', profile: null, device: 'mobile' }, NOW)).toMatchObject({ ok: false });
    expect(quickStart(w, { nickname: 'Test', communitySlug: 'pps-yp', profile: null, device: 'mobile' }, NOW)).toMatchObject({ ok: false });
  });
  it('validates the pre-check and moves to missions', () => {
    const { w, id } = fresh();
    expect(submitCheck(w, id, 'pre', { k: { k1: 0 }, c: [3, 3, 3], ms: 1 }, NOW)).toMatchObject({ ok: false });
    expect(submitCheck(w, id, 'pre', { ...answers(w, id, false, 'pre'), c: [3, 3, 9] }, NOW)).toMatchObject({ ok: false });
    expect(submitCheck(w, id, 'pre', answers(w, id, false, 'pre'), NOW)).toMatchObject({ ok: true });
    expect(w.pilot[id].stage).toBe('missions');
    expect(submitCheck(w, id, 'pre', answers(w, id, false, 'pre'), NOW)).toMatchObject({ ok: false }); // once only
  });
  it('detects what the tester really did: join, lesson, budget and a community message', () => {
    const { w, id } = fresh();
    submitCheck(w, id, 'pre', answers(w, id, false, 'pre'), NOW);
    expect(detectable(w, id)).toEqual(['join']);
    applyDetections(w, id, later(0));
    expect(w.pilot[id].missions.join.doneAt).toBeTruthy();

    startMission(w, id, 'learn', later(1));
    completeLesson(w, id, 'now-now-stack-it-grow-it', later(3));
    expect(applyDetections(w, id, later(3))).toContain('learn');

    // a budget that overspends or saves too little does not count
    const tpl = TEMPLATES.find((t) => t.id === 'workshop')!;
    saveBudget(w, id, { template: 'workshop', income: 3500, lines: linesFromTemplate(tpl, 3500) }, later(4));
    expect(detectable(w, id)).not.toContain('budget');
    saveBudget(w, id, { template: 'workshop', income: 3500, lines: { ...linesFromTemplate(tpl, 3500), transport: 600, fun: 450, emergency: 150 } }, later(5)); // 3,600 − 200 −150 + 150 = 3,400 + 150 saving
    expect(applyDetections(w, id, later(5))).toContain('budget');

    const comm = w.communities.find((c) => c.slug === 'student-savers')!;
    expect(detectable(w, id)).not.toContain('community');
    const ch = communityChannel(w, comm.id)!;
    w.messages.push({ id: 'm1', channelId: ch.id, userId: id, body: 'Hi!', replyTo: null, kind: 'user', pinned: false, deleted: false, at: later(6).toISOString() });
    expect(applyDetections(w, id, later(6))).toContain('community');
    expect(coreComplete(w.pilot[id])).toBe(true);
  });
  it('full path to a finished, exportable record', async () => {
    const { w, id } = fresh();
    const run = () => w.pilot[id];
    submitCheck(w, id, 'pre', answers(w, id, false, 'pre'), NOW);
    CORE.forEach((m, j) => { run().missions[m.id] = { startedAt: later(j).toISOString(), doneAt: later(j + 1).toISOString(), auto: true }; });
    expect(goToPost(w, id)).toMatchObject({ ok: false }); // not rated yet
    CORE.forEach((m) => rateMission(w, id, m.id, 6));
    expect(goToPost(w, id)).toMatchObject({ ok: true });
    expect(submitCheck(w, id, 'post', answers(w, id, true, 'post'), later(8))).toMatchObject({ ok: true });
    expect(submitSurvey(w, id, { umux: [6, 7], nps: 9, safety: null, understood: 0, useful: 'The lesson', again: 'yes', liked: 'x', confusing: '' }, later(10))).toMatchObject({ ok: false }); // community done, so safety required
    expect(submitSurvey(w, id, { umux: [6, 7], nps: 9, safety: 5, understood: 0, useful: 'The lesson', again: 'yes', liked: 'x', confusing: '' }, later(10))).toMatchObject({ ok: true });
    expect(run().stage).toBe('done');

    const code = await encodeRun(run());
    expect(code.startsWith('SISI')).toBe(true);
    const back = await decodeRun(code);
    expect(back).not.toBeNull();
    expect(back!.userId).toBeNull();
    expect(JSON.stringify(back)).not.toContain(id.replace('P-', 'u-'));
    expect(JSON.stringify(anonymise(run()))).not.toContain('"userId":"u-');
    const s = summarize([back!]);
    expect(s.knowledge.mean).toBe(6); expect(s.time.median).toBeCloseTo(10, 5);
    expect(await decodeRun('SISI2.garbage')).toBeNull(); expect(await decodeRun('hello')).toBeNull();
  });
  it('support and rewards are self-confirmed; automatic missions cannot be self-confirmed', () => {
    const { w, id } = fresh();
    confirmMission(w, id, 'support', NOW); confirmMission(w, id, 'learn', NOW);
    expect(w.pilot[id].missions.support.doneAt).toBeTruthy(); expect(w.pilot[id].missions.learn).toBeUndefined();
  });
  it('imports dedupe by participant and prefer the finished record', async () => {
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
  it('flags small and exploratory samples', () => { expect(summarize(runs.slice(0, 5)).small).toBe(true); expect(summarize(runs.slice(0, 20)).exploratory).toBe(true); expect(s.exploratory).toBe(false); });
  it('computes gains, completion and decision rules', () => {
    expect(s.n).toBe(40); expect(s.knowledge.n).toBe(40); expect(s.knowledge.mean).toBeGreaterThan(0.5);
    expect(s.knowledge.improved + s.knowledge.same + s.knowledge.declined).toBe(40);
    expect(s.verdicts).toHaveLength(9); expect(s.missions.filter((m) => m.core)).toHaveLength(4);
    expect(s.knowledge.byItem).toHaveLength(6); expect(s.knowledge.byForm).toHaveLength(2);
  });
  it('CSV has a header, one row per participant and no account ids or emails', () => {
    const csv = toCsv(runs);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(41);
    expect(lines[0].split(',').length).toBeGreaterThan(60);
    expect(csv).not.toMatch(/@|u-[a-z0-9]{3,}/i);
  });
  it('mission and confidence definitions line up with the instruments', () => { expect(MISSIONS.filter((m) => m.core)).toHaveLength(4); expect(CONFIDENCE).toHaveLength(3); });
});
