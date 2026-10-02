import { describe, expect, it } from 'vitest';
import { GLOSSARY, markTerms, slugify } from '@/lib/content/glossary';

describe('glossary', () => {
  it('has at least 80 unique terms', () => {
    expect(GLOSSARY.length).toBeGreaterThanOrEqual(80);
    expect(new Set(GLOSSARY.map((g) => slugify(g.term))).size).toBe(GLOSSARY.length);
  });
  it('marks the first occurrence of a term only', () => {
    expect(markTerms('Your net pay is not gross pay. Net pay matters.', ['net pay', 'gross pay'])).toBe('Your [[net pay]] is not [[gross pay]]. Net pay matters.');
  });
  it('is case-insensitive and keeps the original text', () => {
    expect(markTerms('A TFSA is tax-free.', ['TFSA'])).toBe('A [[TFSA]] is tax-free.');
  });
  it('does not double-mark', () => {
    const once = markTerms('Check the TER.', ['TER']);
    expect(markTerms(once, ['TER'])).toBe(once);
  });
});
