import type { ChapterId, PilotRun } from '@/lib/world/types';
import { CHAPTERS } from './journey';

/**
 * SIMULATED sample responses, only for previewing the dashboard before real testers exist.
 * Every record is flagged `simulated`, labelled in the UI, and left out of CSV exports.
 * These are NOT evidence and the numbers mean nothing.
 */
export function simulatedRuns(n: number, now: Date): PilotRun[] {
  let s = 12345;
  const r = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const pick = <T,>(a: readonly T[]): T => a[Math.floor(r() * a.length)];
  const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: n }, (_, i) => {
    const id = 'P-' + Array.from({ length: 6 }, () => ALPHA[Math.floor(r() * ALPHA.length)]).join('');
    const t0 = new Date(now.getTime() - (i + 1) * 3_600_000);
    let at = t0.getTime();
    const chapters: PilotRun['chapters'] = {};
    for (const c of CHAPTERS) {
      const dur = (c.minutes * 0.7 + r() * c.minutes * 0.8) * 60_000;
      chapters[c.id as ChapterId] = { startedAt: new Date(at).toISOString(), doneAt: new Date(at + dur).toISOString(), reaction: r() < 0.45 ? 1 : r() < 0.85 ? 2 : 3 };
      at += dur + 20_000;
    }
    return {
      id, userId: null, simulated: true, path: 'quick', consentAt: t0.toISOString(), profile: { ageBand: pick(['18–20', '21–23', '24–26']), status: pick(['Student', 'Working', 'Both']), experience: pick(['New to budgeting', 'Tried it a bit']) },
      device: r() < 0.85 ? 'mobile' : 'desktop', stage: 'done', startedAt: t0.toISOString(), finishedAt: new Date(at).toISOString(), chapters,
      facts: { quizScore: pick([33, 67, 67, 100, 100]), quizAttempts: r() < 0.2 ? 2 : 1, budgetOk: r() < 0.9, weeklyTarget: pick([1, 2, 2, 3]), rewardChoice: r() < 0.6 ? 'credit' : 'cash', messageSent: r() < 0.95, buddyStarted: r() < 0.9, nudged: r() < 0.85, points: 40 + Math.floor(r() * 30), level: 'Seed', badges: ['started'] },
      peeked: r() < 0.5 ? [pick(['payslip', 'letterbox', 'invest', 'events'])] : [],
    } as PilotRun;
  });
}
