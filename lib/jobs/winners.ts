/** Pure winner selection so the monthly/season rules are unit-tested. */
export type CupRow = { id: string; name: string; score: number; challengeCompletions: number };

/** Highest score wins; ties go to more completed weekly challenges, then alphabetical. */
export function pickWinner(rows: CupRow[]): CupRow | null {
  if (!rows.length) return null;
  return [...rows].sort((a, b) => b.score - a.score || b.challengeCompletions - a.challengeCompletions || a.name.localeCompare(b.name))[0];
}

/** Previous calendar month of a SAST date (yyyy-MM-dd) as { key: 'yyyy-MM', from, to } (to exclusive), as SAST-midnight ISO instants. */
export function previousMonth(todaySast: string) {
  const [y, m] = todaySast.split('-').map(Number);
  const py = m === 1 ? y - 1 : y;
  const pm = m === 1 ? 12 : m - 1;
  const pad = (n: number) => String(n).padStart(2, '0');
  const sast = (yy: number, mm: number) => new Date(`${yy}-${pad(mm)}-01T00:00:00+02:00`).toISOString();
  return { key: `${py}-${pad(pm)}`, from: sast(py, pm), to: sast(y, m) };
}
