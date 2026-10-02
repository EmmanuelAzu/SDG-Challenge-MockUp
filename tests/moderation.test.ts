import { describe, expect, it } from 'vitest';
import { maskProfanity, mentionsHarm } from '@/lib/moderation/filter';

describe('moderation', () => {
  it('masks profanity but keeps the message', () => {
    const out = maskProfanity('that is shit honestly');
    expect(out).not.toContain('shit');
    expect(out).toContain('honestly');
  });
  it('leaves normal text alone', () => expect(maskProfanity('Budget Besties rock')).toBe('Budget Besties rock'));
  it('masks custom blocklist', () => expect(maskProfanity('avoid a loanshark')).toBe('avoid a *********'));
  it('detects harm keywords', () => {
    expect(mentionsHarm('I feel not safe at home')).toBe(true);
    expect(mentionsHarm('saving for a laptop')).toBe(false);
  });
});
