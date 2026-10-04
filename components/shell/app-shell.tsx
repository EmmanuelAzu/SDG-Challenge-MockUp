'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Bell, Gift, Home, User, Users } from 'lucide-react';
import { HelpSheet } from '@/components/help-sheet';
import { DemoTools } from './demo-tools';
import { AppContext } from './app-context';
import { useMe, useSessionId, useWorld } from '@/lib/world/hooks';

const NAV = [
  { href: '/home', label: 'Home', Icon: Home },
  { href: '/learn', label: 'Learn', Icon: BookOpen },
  { href: '/community', label: 'Community', Icon: Users },
  { href: '/rewards', label: 'Rewards', Icon: Gift },
  { href: '/profile', label: 'Profile', Icon: User },
];

/** Client-side guard: no session → login; not onboarded → onboarding. Renders a skeleton until the world has loaded. */
export function AppShell({ children, requireOnboarded = true }: { children: React.ReactNode; requireOnboarded?: boolean }) {
  const router = useRouter();
  const w = useWorld();
  const sid = useSessionId();
  const ctx = useMe();

  useEffect(() => {
    if (!w) return;
    if (!sid || !w.users[sid]) router.replace('/login');
    else if (requireOnboarded && !w.users[sid].onboardedAt && w.users[sid].role === 'member') router.replace('/onboarding');
  }, [w, sid, requireOnboarded, router]);

  if (!ctx) return <div className="min-h-screen p-6" aria-busy="true"><div className="mx-auto max-w-3xl animate-pulse space-y-4"><div className="h-8 w-40 rounded bg-pink-100" /><div className="h-32 rounded-card bg-pink-100" /><div className="h-24 rounded-card bg-pink-100" /></div></div>;
  if (requireOnboarded && !ctx.me.onboardedAt && ctx.me.role === 'member') return null;

  const now = new Date(Date.now() + ctx.w.clockOffsetMs);
  const unread = ctx.w.notifications.filter((n) => n.userId === ctx.me.id && !n.read).length;
  const staff = ctx.me.role !== 'member';

  return (
    <AppContext.Provider value={{ ...ctx, now }}>
      <div className="min-h-screen pb-24 md:pb-0">
        <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 border-t border-pink-100 bg-white md:static md:border-b md:border-t-0">
          <ul className="mx-auto flex max-w-3xl items-center justify-around py-2">
            {NAV.map(({ href, label, Icon }) => (
              <li key={href}><Link href={href} className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium text-plum-500 hover:text-pink-700"><Icon size={22} aria-hidden /> {label}</Link></li>
            ))}
          </ul>
        </nav>
        <header className="mx-auto flex max-w-3xl items-center justify-end gap-3 px-4 pt-3">
          {staff && <Link href="/admin" className="rounded-full bg-lavender-100 px-3 py-1 text-xs font-semibold text-lavender-600">Staff console</Link>}
          <Link href="/notifications" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} className="relative rounded-full bg-white p-2 ring-1 ring-pink-100">
            <Bell size={18} />
            {unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-600 px-1 text-[10px] font-bold text-white">{unread}</span>}
          </Link>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-4">{children}</main>
        <HelpSheet />
        <DemoTools />
      </div>
    </AppContext.Provider>
  );
}
