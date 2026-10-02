import { RegExpMatcher, TextCensor, englishDataset, englishRecommendedTransformers, asteriskCensorStrategy } from 'obscenity';
import { BLOCKLIST } from './blocklist';
import { HARM_KEYWORDS } from './harm-keywords';

const matcher = new RegExpMatcher({ ...englishDataset.build(), ...englishRecommendedTransformers });
const censor = new TextCensor().setStrategy(asteriskCensorStrategy());

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const blockRe = BLOCKLIST.length ? new RegExp(`\\b(${BLOCKLIST.map(escape).join('|')})\\b`, 'gi') : null;

/** Masks profanity with asterisks (never blocks the message). */
export function maskProfanity(text: string): string {
  let out = censor.applyTo(text, matcher.getAllMatches(text));
  if (blockRe) out = out.replace(blockRe, (m) => '*'.repeat(m.length));
  return out;
}

export function mentionsHarm(text: string): boolean {
  const t = text.toLowerCase();
  return HARM_KEYWORDS.some((k) => t.includes(k));
}

export const SENSITIVE_RE = /\b\d{13}\b|\b\d{9,12}\b/;
