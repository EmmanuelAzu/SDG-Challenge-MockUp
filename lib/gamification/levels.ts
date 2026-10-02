export const LEVELS = [
  { name: 'Seed', min: 0 },
  { name: 'Sprout', min: 150 },
  { name: 'Bud', min: 400 },
  { name: 'Bloom', min: 800 },
  { name: 'Blossom', min: 1500 },
] as const;

/** XP = total points. */
export function levelFor(xp: number) {
  let i = 0;
  LEVELS.forEach((l, n) => { if (xp >= l.min) i = n; });
  const cur = LEVELS[i];
  const next = LEVELS[i + 1] ?? null;
  return { name: cur.name, index: i, next: next?.name ?? null, toNext: next ? next.min - xp : 0, progress: next ? (xp - cur.min) / (next.min - cur.min) : 1 };
}
