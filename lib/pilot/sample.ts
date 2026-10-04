import type { PilotCheck, PilotRun } from '@/lib/world/types';
import { CONFIDENCE, CORE, KNOWLEDGE, formFor, otherForm } from './instruments';

/**
 * SIMULATED sample responses, only for previewing the dashboard before real testers exist.
 * Every record is flagged `simulated`, labelled in the UI, and left out of CSV exports unless asked for.
 * These are NOT evidence and the numbers mean nothing.
 */
export function simulatedRuns(n: number, now: Date): PilotRun[] {
  let s = 12345;
  const r = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const pick = <T,>(a: readonly T[]): T => a[Math.floor(r() * a.length)];
  const LIKED = ['The laptop example made borrowing click.', 'Short and clear.', 'Loved the community chat.', 'The budget sliders were fun.', 'Felt like a friend explaining it.'];
  const CONF = ['I was not sure which community to pick.', 'The budget needed a hint about saving.', 'Nothing really.', 'Took a moment to find the Lounge.'];
  const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: n }, (_, i) => {
    const id = 'P-' + Array.from({ length: 6 }, () => ALPHA[Math.floor(r() * ALPHA.length)]).join('');
    const form = formFor(id);
    const check = (which: 'pre' | 'post', p: number, base: number): PilotCheck => {
      const f = which === 'pre' ? form : otherForm(form);
      const k: Record<string, number> = {};
      for (const it of KNOWLEDGE) {
        const roll = r();
        if (roll < p) k[it.id] = it.forms[f].correct;
        else if (roll < p + 0.1) k[it.id] = -1;
        else { const wrong = [0, 1, 2, 3].filter((x) => x !== it.forms[f].correct); k[it.id] = pick(wrong); }
      }
      return { k, c: CONFIDENCE.map(() => Math.max(1, Math.min(5, Math.round(base + (r() - 0.5) * 2)))), at: now.toISOString(), ms: 60_000 + Math.floor(r() * 30_000) };
    };
    const t0 = new Date(now.getTime() - (i + 1) * 3_600_000);
    const totalMin = 7.5 + r() * 4.5;
    const missions: PilotRun['missions'] = {};
    CORE.forEach((m, j) => { const start = new Date(t0.getTime() + j * 120_000); missions[m.id] = { startedAt: start.toISOString(), doneAt: new Date(start.getTime() + (60 + r() * 100) * 1000).toISOString(), auto: true, seq: Math.min(7, Math.max(3, Math.round(5.6 + (r() - 0.4) * 2.4))) }; });
    return {
      id, userId: null, simulated: true, path: 'quick', form, consentAt: t0.toISOString(), profile: { ageBand: pick(['18–20', '21–23', '24–26']), status: pick(['Student', 'Working', 'Both']), experience: pick(['New to budgeting', 'Tried it a bit', 'I budget regularly']) },
      device: r() < 0.85 ? 'mobile' : 'desktop', stage: 'done', startedAt: t0.toISOString(), signupMs: 0, finishedAt: new Date(t0.getTime() + totalMin * 60_000).toISOString(),
      pre: check('pre', 0.45, 2.7), post: check('post', 0.72, 3.3), missions,
      survey: { umux: [Math.min(7, Math.max(2, Math.round(5.7 + (r() - 0.5) * 3))), Math.min(7, Math.max(2, Math.round(6 + (r() - 0.5) * 3)))], nps: Math.min(10, Math.max(0, Math.round(8.2 + (r() - 0.5) * 5))), safety: Math.min(5, Math.max(2, Math.round(4.3 + (r() - 0.5) * 2))), understood: r() < 0.9 ? 0 : 1, useful: pick(['The lesson', 'The budget tool', 'The community']), again: pick(['yes', 'yes', 'maybe', 'no']), liked: pick(LIKED), confusing: pick(CONF), at: now.toISOString() },
      followUp: null,
    } as PilotRun;
  });
}
