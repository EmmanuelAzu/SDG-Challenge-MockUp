'use client';
import Link from 'next/link';
import { Calculator, PiggyBank, Receipt, Sprout, Wallet } from 'lucide-react';
import { useApp } from '@/components/shell/app-context';
import { realResults } from '@/lib/engine/goals';
import { stepsDone } from '@/lib/engine/invest';
import { rand } from '@/lib/money';

export default function Tools() {
  const { w, me } = useApp();
  const r = realResults(w, me.id);
  const inv = w.invest[me.id];
  const budget = w.budgets[me.id];
  const cards = [
    { href: '/tools/budget', Icon: Wallet, title: 'Budget builder', blurb: budget ? 'You have a saved budget. Tweak it any time.' : 'Plan a month in five minutes. Starts from a template.', tone: 'bg-pink-100 text-pink-700' },
    { href: '/tools/goals', Icon: PiggyBank, title: 'Savings goals', blurb: r.goals ? `${r.goals} ${r.goals === 1 ? 'goal' : 'goals'}, ${rand(r.saved)} saved so far (only you see this).` : 'Name something you are saving for and watch it grow.', tone: 'bg-gold-500/25 text-plum-900' },
    { href: '/pathways/invest-her', Icon: Sprout, title: 'Invest HER', blurb: inv?.finishedAt ? 'Done. You earned Investor Ready.' : inv ? `${stepsDone(inv)} of 4 steps done. A simulated first step with small amounts.` : 'A guided, simulated first step into investing from R50 a month.', tone: 'bg-mint-100 text-mint-700' },
    { href: '/pathways/milestones', Icon: Calculator, title: 'Quick tools', blurb: 'Cash-flow check and a 50/30/20 builder. Nothing is saved.', tone: 'bg-lavender-100 text-lavender-600' },
  ];
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Money tools</h1>
      <p className="text-plum-500">Hands-on tools. Anything you type is private to you and never shared or ranked.</p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {cards.map(({ href, Icon, title, blurb, tone }) => (
          <li key={href}><Link href={href} className="flex h-full gap-3 rounded-card bg-white p-4 ring-1 ring-pink-100 hover:ring-pink-300"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-card ${tone}`}><Icon size={22} aria-hidden /></span><span><b className="block font-display text-lg">{title}</b><span className="text-sm text-plum-500">{blurb}</span></span></Link></li>
        ))}
        <li><div className="flex h-full gap-3 rounded-card bg-white p-4 opacity-70 ring-1 ring-pink-100"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-pink-50 text-pink-700"><Receipt size={22} aria-hidden /></span><span><b className="block font-display text-lg">First payslip simulator</b><span className="text-sm text-plum-500">Coming next.</span></span></div></li>
      </ul>
      <footer className="mt-10 text-xs text-plum-500">Sisi provides financial education, not financial advice.</footer>
    </div>
  );
}
