/** Deterministic rand formatting (toLocaleString differs between server and browser and breaks hydration). */
export const rand = (n: number) => `${n < 0 ? '-' : ''}R${Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
export const clampNum = (v: unknown, min: number, max: number) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min; };
