import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-md items-center justify-between px-4 pt-4 text-sm">
        <Link href="/help/faq" className="sr-only focus:not-sr-only">Help</Link>
        <BackLink />
      </header>
      {children}
    </div>
  );
}

function BackLink() {
  return <Link href="/home" className="inline-flex items-center gap-1 font-medium text-pink-700"><ArrowLeft size={16} aria-hidden /> Back to Sisi</Link>;
}
