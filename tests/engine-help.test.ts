import { describe, expect, it } from 'vitest';
import { buildWorld } from '@/lib/world/seed';
import { MAX_OPEN, answerRequest, cancelRequest, createRequest, hoursLeft, updateResource, formatPhone } from '@/lib/engine/help';
import { SAFETY_DEFAULTS } from '@/lib/content/safety';
import { FAQ } from '@/lib/content/faq';

const NOW = new Date('2026-10-07T10:00:00Z');
const q = { kind: 'question' as const, topic: 'Saving', body: 'How much should I save each month?' };

describe('Talk to someone', () => {
  it('creates a question and notifies staff', () => {
    const w = buildWorld(NOW);
    const r = createRequest(w, 'u-new', q, NOW);
    expect(r.ok).toBe(true);
    expect(w.notifications.some((n) => n.userId === 'u-pro' && n.href === '/admin/help')).toBe(true);
  });
  it('max 3 open requests; cancelling frees a slot (Nomsa starts with 1 open)', () => {
    const w = buildWorld(NOW);
    expect(createRequest(w, 'u-nomsa', q, NOW).ok).toBe(true);
    expect(createRequest(w, 'u-nomsa', q, NOW).ok).toBe(true);
    const blocked = createRequest(w, 'u-nomsa', q, NOW);
    expect(blocked).toMatchObject({ ok: false });
    expect(MAX_OPEN).toBe(3);
    cancelRequest(w, 'u-nomsa', w.helpRequests.find((h) => h.userId === 'u-nomsa' && h.status === 'open')!.id);
    expect(createRequest(w, 'u-nomsa', q, NOW).ok).toBe(true);
  });
  it('validates length, topic and call windows', () => {
    const w = buildWorld(NOW);
    expect(createRequest(w, 'u-new', { ...q, body: 'short' }, NOW).ok).toBe(false);
    expect(createRequest(w, 'u-new', { ...q, body: 'x'.repeat(601) }, NOW).ok).toBe(false);
    expect(createRequest(w, 'u-new', { ...q, topic: 'nope' }, NOW).ok).toBe(false);
    expect(createRequest(w, 'u-new', { ...q, kind: 'call' }, NOW).ok).toBe(false);
    expect(createRequest(w, 'u-new', { ...q, kind: 'call', windows: ['Weekday evenings'] }, NOW).ok).toBe(true);
  });
  it('only professionals and PPS admins answer; the member is notified', () => {
    const w = buildWorld(NOW);
    const r = createRequest(w, 'u-new', q, NOW);
    if (!r.ok) throw new Error('x');
    expect(answerRequest(w, 'u-thandi', r.request.id, 'Try 10%.', NOW)).toBe(false);
    expect(answerRequest(w, 'u-pro', r.request.id, 'Aim for 10% where you can.', NOW)).toBe(true);
    expect(w.helpRequests.find((h) => h.id === r.request.id)).toMatchObject({ status: 'answered', answeredBy: 'u-pro' });
    expect(w.notifications.some((n) => n.userId === 'u-new' && n.kind === 'help')).toBe(true);
    expect(answerRequest(w, 'u-pro', r.request.id, 'again', NOW)).toBe(false);
  });
  it('shows hours left to the 48 h target', () => {
    const w = buildWorld(NOW);
    const r = createRequest(w, 'u-new', q, NOW);
    if (!r.ok) throw new Error('x');
    expect(hoursLeft(r.request, NOW)).toBe(48);
    expect(hoursLeft(r.request, new Date(NOW.getTime() + 100 * 3600_000))).toBe(0);
  });
});

describe('Support resources', () => {
  it('all start unverified, and only PPS admins can edit or verify', () => {
    const w = buildWorld(NOW);
    expect(w.safety.length).toBe(SAFETY_DEFAULTS.length);
    expect(w.safety.every((r) => !r.verified)).toBe(true);
    expect(updateResource(w, 'u-pro', 'sr-gbv', { verified: true })).toBe(false);
    expect(updateResource(w, 'u-admin', 'sr-gbv', { verified: true, phone: '0800 428 428' })).toBe(true);
    expect(w.safety.find((r) => r.id === 'sr-gbv')).toMatchObject({ verified: true, phone: '0800428428' });
  });
  it('does not mutate the defaults when the world changes', () => {
    const w = buildWorld(NOW);
    updateResource(w, 'u-admin', 'sr-gbv', { verified: true });
    expect(SAFETY_DEFAULTS.find((r) => r.id === 'sr-gbv')!.verified).toBe(false);
  });
  it('formats ten-digit numbers', () => expect(formatPhone('0800428428')).toBe('0800 428 428'));
});

describe('FAQ', () => {
  it('has unique ids and non-empty answers', () => {
    expect(new Set(FAQ.map((f) => f.id)).size).toBe(FAQ.length);
    expect(FAQ.every((f) => f.q && f.a)).toBe(true);
  });
});
