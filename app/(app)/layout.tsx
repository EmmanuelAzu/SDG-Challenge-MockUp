import Link from 'next/link';
import { Home, BookOpen, Users, Gift, User } from 'lucide-react';
import { HelpSheet } from '@/components/help-sheet';

const NAV = [
  { href: '/home', label: 'Home', Icon: Home },
  { href: '/learn', label: 'Learn', Icon: BookOpen },
  { href: '/community', label: 'Community', Icon: Users },
  { href: '/rewards', label: 'Rewards', Icon: Gift },
  { href: '/profile', label: 'Profile', Icon: User },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 border-t border-pink-100 bg-white md:static md:border-b md:border-t-0">
        <ul className="mx-auto flex max-w-3xl justify-around py-2">
          {NAV.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link href={href} className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium text-plum-500 hover:text-pink-700">
                <Icon size={22} aria-hidden /> {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
      <HelpSheet />
    </div>
  );
}
