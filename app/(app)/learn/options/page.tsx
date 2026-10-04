'use client';
import Link from 'next/link';

const ROWS = [
  { name: 'Savings account', what: 'A bank account that pays interest on money you are not spending.', access: 'Usually same or next day.', tax: 'Interest above your tax-free threshold is taxable.', min: 'Often very low or none. Check the bank.', who: 'Your emergency fund and short-term goals.' },
  { name: 'TFSA', what: 'A tax-free container for savings or investments, with yearly and lifetime limits.', access: 'You can withdraw, but the contribution room you used is gone.', tax: 'Interest, dividends and growth inside are tax-free within SARS limits.', min: 'Varies by provider. Some start from small monthly amounts.', who: 'Medium to long-term goals you will not touch soon.' },
  { name: 'Unit trust', what: 'A pooled fund run by a manager that invests in shares, bonds or cash.', access: 'Usually within a few working days.', tax: 'Returns are taxable unless held inside a TFSA or retirement product.', min: 'Varies by provider. Some start from small monthly amounts.', who: 'Growth over five years or more, if you can ride out ups and downs.' },
  { name: 'Retirement annuity', what: 'A long-term retirement product you contribute to regularly.', access: 'Locked until retirement age, with limited exceptions.', tax: 'Contributions can reduce your taxable income within limits.', min: 'Varies by provider.', who: 'Long-term retirement saving, especially once you earn a taxable salary.' },
];

export default function Options() {
  return (
    <div>
      <Link href="/learn" className="text-sm text-pink-700">← Learn</Link>
      <h1 className="mt-2 font-display text-3xl font-semibold">Compare your options</h1>
      <p className="text-plum-500">Where could your money live? Limits, thresholds and minimums change, so always check the current figures with SARS and the provider.</p>
      <ul className="mt-5 space-y-4">
        {ROWS.map((r) => (
          <li key={r.name} className="rounded-card bg-white p-4 ring-1 ring-pink-100">
            <h2 className="font-display text-xl font-semibold text-pink-700">{r.name}</h2>
            <p className="mt-1 text-sm">{r.what}</p>
            <dl className="mt-3 grid gap-2 text-sm">
              {([['Access', r.access], ['Tax benefit', r.tax], ['Typical minimum', r.min], ['Who it suits', r.who]] as const).map(([k, v]) => (
                <div key={k}><dt className="text-xs font-semibold uppercase tracking-wide text-plum-500">{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-plum-500">Sisi provides financial education, not financial advice.</p>
    </div>
  );
}
