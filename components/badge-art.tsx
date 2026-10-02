import type { ReactElement } from 'react';

const RING: Record<string, { ring: string; fill: string }> = {
  common: { ring: '#D81B60', fill: '#FCE4EF' },
  rare: { ring: '#7E57C2', fill: '#EFE7FB' },
  epic: { ring: '#F2B33D', fill: '#FFF3D6' },
};
const INK = '#2A1433';
const PINK = '#D81B60';
const GOLD = '#F2B33D';
const MINT = '#0F7B5F';

/** Emblems drawn in a 96×96 box. Original geometric art; only path/circle/rect/polygon so it also renders in OG images. */
const EMBLEMS: Record<string, () => ReactElement> = {
  started: () => (
    <g>
      <path d="M48 70 V46" stroke={MINT} strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M48 52 C34 52 28 42 28 32 C40 32 48 38 48 52Z" fill={MINT} />
      <path d="M48 46 C48 34 56 26 68 26 C68 38 60 46 48 46Z" fill="#34B38A" />
    </g>
  ),
  'budget-builder': () => (
    <g>
      <rect x="28" y="56" width="40" height="10" rx="5" fill={GOLD} />
      <rect x="28" y="44" width="40" height="10" rx="5" fill="#FFD878" />
      <rect x="28" y="32" width="40" height="10" rx="5" fill={GOLD} />
    </g>
  ),
  'savings-streak': () => (
    <g>
      <path d="M48 68 C28 54 28 36 40 34 C44 34 47 36 48 40 C49 36 52 34 56 34 C68 36 68 54 48 68Z" fill={PINK} />
      <circle cx="48" cy="26" r="3" fill={GOLD} />
      <circle cx="38" cy="26" r="2" fill={GOLD} />
      <circle cx="58" cy="26" r="2" fill={GOLD} />
    </g>
  ),
  'investor-ready': () => (
    <g>
      <rect x="28" y="52" width="9" height="16" rx="2" fill="#34B38A" />
      <rect x="43" y="42" width="9" height="26" rx="2" fill="#34B38A" />
      <rect x="58" y="30" width="9" height="38" rx="2" fill={MINT} />
      <path d="M28 40 L44 30 L52 34 L68 22" stroke={GOLD} strokeWidth="3" strokeLinecap="round" fill="none" />
    </g>
  ),
  'wealth-builder': () => (
    <g>
      {[0, 72, 144, 216, 288].map((r, i) => (
        <path key={r} transform={`translate(48 48) rotate(${r})`} d={`M0 -6 C ${8 + i} -8, ${7 + i} -${16 + i * 2}, 0 -${20 + i * 2} C -${7 + i} -${16 + i * 2}, -${8 + i} -8, 0 -6Z`} fill={PINK} />
      ))}
      <circle cx="48" cy="48" r="7" fill={GOLD} />
    </g>
  ),
  'first-lesson': () => (
    <g>
      <path d="M26 34 H46 V68 H26Z" fill={PINK} />
      <path d="M50 34 H70 V68 H50Z" fill="#AD1457" />
      <path d="M46 34 Q48 30 50 34 V68 H46Z" fill={GOLD} />
    </g>
  ),
  'quiz-whiz': () => <path d="M54 22 L32 52 H46 L42 74 L64 42 H50Z" fill={GOLD} stroke={INK} strokeWidth="2" strokeLinejoin="round" />,
  'curious-mind': () => (
    <g>
      <circle cx="48" cy="42" r="16" fill={GOLD} />
      <rect x="40" y="60" width="16" height="5" rx="2" fill={INK} />
      <rect x="42" y="67" width="12" height="4" rx="2" fill={INK} />
      <path d="M43 42 H53" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  'glow-3w': () => (
    <g>
      <circle cx="48" cy="48" r="13" fill={GOLD} />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x="46.5" y="22" width="3" height="9" rx="1.5" fill={GOLD} transform={`rotate(${i * 45} 48 48)`} />
      ))}
    </g>
  ),
  'bloom-12w': () => (
    <g>
      {[0, 72, 144, 216, 288].map((r) => (
        <path key={r} transform={`translate(48 48) rotate(${r})`} d="M0 -6 C 10 -9, 9 -22, 0 -27 C -9 -22, -10 -9, 0 -6Z" fill="#fff" stroke={PINK} strokeWidth="2" />
      ))}
      <circle cx="48" cy="48" r="7" fill={GOLD} />
    </g>
  ),
  'circle-starter': () => (
    <g>
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i * 60 * Math.PI) / 180;
        return <circle key={i} cx={48 + Math.cos(a) * 18} cy={48 + Math.sin(a) * 18} r="6" fill={i === 0 ? GOLD : PINK} />;
      })}
    </g>
  ),
  'show-up-sisi': () => (
    <g>
      <rect x="26" y="30" width="44" height="38" rx="6" fill="#fff" stroke={PINK} strokeWidth="3" />
      <rect x="26" y="30" width="44" height="10" rx="5" fill={PINK} />
      <path d="M38 54 L45 61 L59 46" stroke={MINT} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
  ),
  'workshop-goer': () => (
    <g>
      <path d="M24 34 H72 V44 A4 4 0 0 0 72 52 V62 H24 V52 A4 4 0 0 0 24 44Z" fill={PINK} />
      <path d="M58 34 V62" stroke="#fff" strokeWidth="2" strokeDasharray="3 3" />
      <circle cx="40" cy="48" r="5" fill={GOLD} />
    </g>
  ),
  'circle-cup-champion': () => (
    <g>
      <path d="M34 28 H62 V44 A14 14 0 0 1 34 44Z" fill={GOLD} />
      <path d="M34 32 H26 V38 A8 8 0 0 0 34 46 M62 32 H70 V38 A8 8 0 0 1 62 46" stroke={GOLD} strokeWidth="3" fill="none" />
      <rect x="44" y="58" width="8" height="8" fill={GOLD} />
      <rect x="36" y="66" width="24" height="6" rx="3" fill={INK} />
    </g>
  ),
  'better-together': () => (
    <g>
      <circle cx="40" cy="48" r="16" fill="none" stroke={PINK} strokeWidth="6" />
      <circle cx="58" cy="48" r="16" fill="none" stroke="#7E57C2" strokeWidth="6" />
    </g>
  ),
  'hype-girl': () => (
    <g>
      <path d="M28 40 H40 L64 26 V70 L40 56 H28Z" fill={PINK} />
      <rect x="32" y="56" width="8" height="14" rx="3" fill="#AD1457" />
      <path d="M70 38 Q76 48 70 58" stroke={GOLD} strokeWidth="3" strokeLinecap="round" fill="none" />
    </g>
  ),
  'oweek-starter': () => (
    <g>
      <polygon points="48,28 76,42 48,56 20,42" fill={INK} />
      <path d="M34 50 V60 Q48 70 62 60 V50 L48 57Z" fill="#6E5A7A" />
      <path d="M72 44 V60" stroke={GOLD} strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  'campus-cup-champion': () => (
    <g>
      <path d="M34 28 H62 V44 A14 14 0 0 1 34 44Z" fill="#7E57C2" />
      <path d="M34 32 H26 V38 A8 8 0 0 0 34 46 M62 32 H70 V38 A8 8 0 0 1 62 46" stroke="#7E57C2" strokeWidth="3" fill="none" />
      <polygon points="48,32 51,40 59,40 53,45 55,53 48,48 41,53 43,45 37,40 45,40" fill={GOLD} />
      <rect x="44" y="58" width="8" height="8" fill="#7E57C2" />
      <rect x="36" y="66" width="24" height="6" rx="3" fill={INK} />
    </g>
  ),
  'payslip-pro': () => (
    <g>
      <path d="M30 24 H66 V72 L60 68 L54 72 L48 68 L42 72 L36 68 L30 72Z" fill="#fff" stroke={PINK} strokeWidth="3" strokeLinejoin="round" />
      <rect x="37" y="34" width="22" height="4" rx="2" fill={PINK} />
      <rect x="37" y="43" width="16" height="4" rx="2" fill="#F48FB1" />
      <rect x="37" y="52" width="22" height="6" rx="3" fill={MINT} />
    </g>
  ),
  'goal-getter': () => (
    <g>
      <circle cx="48" cy="48" r="24" fill="#fff" stroke="#7E57C2" strokeWidth="4" />
      <circle cx="48" cy="48" r="14" fill="none" stroke="#7E57C2" strokeWidth="4" />
      <circle cx="48" cy="48" r="5" fill={GOLD} />
    </g>
  ),
  'plain-talker': () => (
    <g>
      <path d="M26 30 H70 A6 6 0 0 1 76 36 V54 A6 6 0 0 1 70 60 H48 L36 72 V60 H26 A6 6 0 0 1 20 54 V36 A6 6 0 0 1 26 30Z" fill={PINK} />
      <circle cx="36" cy="45" r="3" fill="#fff" /><circle cx="48" cy="45" r="3" fill="#fff" /><circle cx="60" cy="45" r="3" fill="#fff" />
    </g>
  ),
  'founding-member': () => <polygon points="48,24 56,42 76,44 61,57 66,76 48,66 30,76 35,57 20,44 40,42" fill={GOLD} stroke="#D99A1E" strokeWidth="2" strokeLinejoin="round" />,
};

export function BadgeArt({ slug, rarity = 'common', size = 96, locked = false }: { slug: string; rarity?: string; size?: number; locked?: boolean }) {
  const c = RING[rarity] ?? RING.common;
  const Emblem = EMBLEMS[slug] ?? EMBLEMS.started;
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" style={locked ? { opacity: 0.35, filter: 'grayscale(1)' } : undefined}>
      <circle cx="48" cy="48" r="44" fill={c.fill} stroke={c.ring} strokeWidth="4" />
      <Emblem />
    </svg>
  );
}
