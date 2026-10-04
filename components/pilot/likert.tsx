'use client';

/** A row of numbered buttons (1..n) with labelled ends. Used for confidence, ease and agreement scales. */
export function Likert({ legend, value, onChange, min = 1, max = 5, low, high, name }: { legend: string; value: number | null; onChange: (v: number) => void; min?: number; max?: number; low: string; high: string; name?: string }) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <fieldset className="text-left" aria-label={name ?? legend}>
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="mt-2 flex gap-1.5" role="radiogroup" aria-label={legend}>
        {steps.map((n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} onClick={() => onChange(n)}
            className={`h-11 min-w-0 flex-1 rounded-input border text-sm font-semibold ${value === n ? 'border-pink-600 bg-pink-600 text-white' : 'border-pink-300 bg-white text-plum-900'}`}>{n}</button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-plum-500"><span>{low}</span><span>{high}</span></div>
    </fieldset>
  );
}
