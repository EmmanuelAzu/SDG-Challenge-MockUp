import { describe, expect, it } from 'vitest';
import { decodePayload, encodePayload } from '@/lib/share';

describe('share payload', () => {
  it('round-trips, including non-ASCII names', () => {
    const p = { s: 'budget-builder', w: 'Thandé ✨', d: '2026-10-04T10:00:00.000Z', r: 'abc123' };
    expect(decodePayload(encodePayload(p))).toEqual(p);
  });
  it('is URL-safe', () => expect(encodePayload({ s: '???>>>', w: '~~~', d: 'x' })).toMatch(/^[A-Za-z0-9_-]+$/));
  it('rejects garbage', () => {
    expect(decodePayload('not-base64!!')).toBeNull();
    expect(decodePayload(btoa('{"x":1}'))).toBeNull();
  });
});
