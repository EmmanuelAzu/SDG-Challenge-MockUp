import type { HelpRequest, SafetyResource, World } from '@/lib/world/types';
import { notify, uid } from './helpers';

export const MAX_OPEN = 3;
export const ANSWER_TARGET_HOURS = 48;
export const HELP_TOPICS = ['Budgeting', 'Saving', 'Investing', 'Debt and credit', 'Tax and payslips', 'Insurance', 'Something else'];
export const CALL_WINDOWS = ['Weekday mornings', 'Weekday afternoons', 'Weekday evenings', 'Saturday mornings'];
export const HELP_NOTICE = 'Answers are general financial education from a PPS-approved professional, not personalised advice.';

export const canAnswer = (w: World, userId: string) => ['professional', 'pps_admin'].includes(w.users[userId]?.role);
export const canEditSafety = (w: World, userId: string) => w.users[userId]?.role === 'pps_admin';
export const openRequests = (w: World, userId: string) => w.helpRequests.filter((h) => h.userId === userId && h.status === 'open');

export function createRequest(w: World, userId: string, input: { kind: 'question' | 'call'; topic: string; body: string; windows?: string[] }, now: Date): { ok: true; request: HelpRequest } | { ok: false; error: string } {
  const body = input.body.trim();
  if (openRequests(w, userId).length >= MAX_OPEN) return { ok: false, error: `You have ${MAX_OPEN} open requests. Wait for an answer or cancel one first.` };
  if (!HELP_TOPICS.includes(input.topic)) return { ok: false, error: 'Pick a topic.' };
  if (body.length < 10) return { ok: false, error: 'Tell us a little more (at least 10 characters).' };
  if (body.length > 600) return { ok: false, error: 'Please keep it under 600 characters.' };
  const windows = (input.windows ?? []).filter((x) => CALL_WINDOWS.includes(x));
  if (input.kind === 'call' && windows.length < 1) return { ok: false, error: 'Pick at least one time window for the call.' };
  const request: HelpRequest = { id: uid('help'), userId, kind: input.kind, topic: input.topic, body, windows: input.kind === 'call' ? windows : [], status: 'open', answer: '', answeredBy: null, at: now.toISOString(), answeredAt: null };
  w.helpRequests.push(request);
  for (const u of Object.values(w.users).filter((x) => x.role === 'professional' || x.role === 'pps_admin')) notify(w, u.id, { kind: 'admin', title: input.kind === 'call' ? 'New call request' : 'New question', body: `${input.topic}`, href: '/admin/help', key: `help-new-${request.id}-${u.id}` }, now);
  return { ok: true, request };
}

export function cancelRequest(w: World, userId: string, id: string) {
  const r = w.helpRequests.find((x) => x.id === id && x.userId === userId && x.status === 'open');
  if (r) r.status = 'closed';
}

export function answerRequest(w: World, staffId: string, id: string, answer: string, now: Date): boolean {
  const r = w.helpRequests.find((x) => x.id === id && x.status === 'open');
  const text = answer.trim();
  if (!r || !canAnswer(w, staffId) || text.length < 3) return false;
  r.status = 'answered'; r.answer = text.slice(0, 1500); r.answeredBy = staffId; r.answeredAt = now.toISOString();
  notify(w, r.userId, { kind: 'help', title: r.kind === 'call' ? 'Your call request was answered' : 'Your question was answered', body: 'Tap to read the answer.', href: '/help/talk', key: `help-answer-${r.id}` }, now);
  return true;
}

export function updateResource(w: World, adminId: string, id: string, patch: Partial<Pick<SafetyResource, 'name' | 'description' | 'phone' | 'hours' | 'verified'>>): boolean {
  const r = w.safety.find((x) => x.id === id);
  if (!r || !canEditSafety(w, adminId)) return false;
  Object.assign(r, { ...patch, ...(patch.phone !== undefined ? { phone: patch.phone.replace(/[^\d+]/g, '') } : {}) });
  return true;
}

/** Hours left to the 48 h target (0 once past it). */
export const hoursLeft = (r: HelpRequest, now: Date) => Math.max(0, Math.ceil(ANSWER_TARGET_HOURS - (now.getTime() - new Date(r.at).getTime()) / 3_600_000));

export const formatPhone = (p: string) => (p.length === 10 && p.startsWith('0') ? `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}` : p);
