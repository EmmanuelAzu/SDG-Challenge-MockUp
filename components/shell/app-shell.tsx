'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Bell, ChevronDown, ChevronUp, Gift, Home, User, Users } from 'lucide-react';
import { HelpSheet } from '@/components/help-sheet';
import { DemoTools } from './demo-tools';
import { CoachBar } from '@/components/pilot/coach-bar';
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
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => { try { setCollapsed(localStorage.getItem('sisi.nav.collapsed') === '1'); } catch {} }, []);
  const toggleNav = () => setCollapsed((c) => { try { localStorage.setItem('sisi.nav.collapsed', c ? '0' : '1'); } catch {} return !c; });
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
      <CoachBar />
      <div className={`min-h-screen md:pb-0 ${collapsed ? 'pb-14' : 'pb-24'}`}>
        <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 border-t border-pink-100 bg-white md:static md:border-b md:border-t-0">
          <div className="mx-auto flex max-w-3xl items-center">
            <ul className={`flex flex-1 items-center justify-around ${collapsed ? 'py-1' : 'py-2'}`}>
              {NAV.map(({ href, label, Icon }) => (
                <li key={href}><Link href={href} aria-label={collapsed ? label : undefined} title={label} className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium text-plum-500 hover:text-pink-700"><Icon size={22} aria-hidden />{!collapsed && <span>{label}</span>}</Link></li>
              ))}
            </ul>
            <button onClick={toggleNav} aria-expanded={!collapsed} aria-label={collapsed ? 'Expand navigation labels' : 'Collapse navigation labels'} className="mr-2 rounded-full p-2 text-plum-500 hover:bg-pink-100">{collapsed ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button>
          </div>
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
