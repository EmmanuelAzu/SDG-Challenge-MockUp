import type { Message, World } from '@/lib/world/types';
import { CHAT_POOLS, COMMUNITY_TOPIC } from '@/lib/content/community-data';
import { CHAT_EMOJI } from '@/lib/content/community-data';

/** Simulated people. Scripted, keyword-aware replies so chat feels alive without any backend. */
const KEYWORDS: [RegExp, keyof typeof CHAT_POOLS][] = [
  [/budget|50\/30\/20|spend|track/i, 'budget'], [/save|saving|emergency|r500|fund/i, 'savings'], [/invest|tfsa|unit trust|fee|return|etf/i, 'invest'],
  [/payslip|salary|uif|paye|gross|net/i, 'payslip'], [/nsfas|allowance|student|campus|data/i, 'student'], [/stokvel/i, 'stokvel'],
  [/family|black tax|mom|mum|sister|boundar/i, 'family'], [/debt|store card|credit|loan/i, 'debt'], [/hustle|invoice|client|price/i, 'hustle'], [/rent|flat|deposit|landlord/i, 'rent'],
];
const FALLBACK = ['Love this 💗', 'Yes! Thanks for sharing', 'Same here honestly', 'Good point, I had not thought of it that way', 'You got this sisi!', 'Welcome, so glad you are here 🌸', 'Ha, relatable 😂'];
const GREETING = /\b(hi|hello|hey|sawubona|molo|heita)\b/i;

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };

export type PlannedReply = { delayMs: number; userId: string; body: string; typingMs: number; reactWith?: string };

/** Who is around in a channel (simulated members only). */
export function simMembers(w: World, channelId: string): string[] {
  const ch = w.channels.find((c) => c.id === channelId);
  if (!ch) return [];
  if (ch.kind === 'buddy') { const p = w.buddies.find((x) => x.id === ch.refId && x.status === 'active'); return p ? [p.inviterId, p.inviteeId].filter((id): id is string => !!id && !!w.users[id]?.sim) : []; }
  const ids = ch.kind === 'circle' ? w.circleMembers.filter((m) => m.circleId === ch.refId).map((m) => m.userId) : w.communityMembers.filter((m) => m.communityId === ch.refId && m.status === 'active').map((m) => m.userId);
  return ids.filter((id) => w.users[id]?.sim);
}

/** Plans 0 to 2 replies to a message, deterministic for a given message id. */
export function planReplies(w: World, msg: Message): PlannedReply[] {
  const people = simMembers(w, msg.channelId).filter((id) => id !== msg.userId);
  if (!people.length || msg.kind !== 'user') return [];
  const h = hash(msg.id + msg.body);
  const ch = w.channels.find((c) => c.id === msg.channelId)!;
  const communitySlug = w.communities.find((c) => c.id === (ch.kind === 'community' ? ch.refId : w.circles.find((x) => x.id === ch.refId)?.communityId))?.slug ?? '';
  const topic = KEYWORDS.find(([re]) => re.test(msg.body))?.[1] ?? COMMUNITY_TOPIC[communitySlug] ?? 'general';
  const pool = ch.kind === 'buddy' ? CHAT_POOLS.buddy : GREETING.test(msg.body) ? ['Welcome!! 🌸', 'Hi sisi! So glad you are here', 'Heyy 💗 welcome'] : [...CHAT_POOLS[topic], ...(h % 3 === 0 ? FALLBACK : [])];
  const first = people[h % people.length];
  const out: PlannedReply[] = [{ delayMs: 2500 + (h % 3000), typingMs: 1800, userId: first, body: pool[h % pool.length], reactWith: h % 4 === 0 ? CHAT_EMOJI[h % CHAT_EMOJI.length] : undefined }];
  if (people.length > 1 && h % 5 < 2) {
    const second = people[(h >>> 3) % people.length];
    if (second !== first) out.push({ delayMs: 7000 + (h % 4000), typingMs: 2200, userId: second, body: FALLBACK[(h >>> 5) % FALLBACK.length] });
  }
  return out;
}
