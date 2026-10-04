'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Bloom } from '@/components/bloom';
import { joinCommunity } from '@/lib/engine/actions';
import { oweekProgress } from '@/lib/engine/oweek';
import { courseLessons } from '@/lib/content';
import { fmtDateTime } from '@/lib/format';
import { useSessionId, useWorld } from '@/lib/world/hooks';
import { update } from '@/lib/world/store';

const WHAT = [['💬', 'A Circle of friends', 'Small groups that meet weekly, with a facilitator and a chat.'], ['📚', 'Three-minute lessons', 'Plain-words money lessons with a quick quiz and one small action.'], ['🏅', 'Badges you can be proud of', 'Celebrate progress. Never amounts, never pressure.']] as const;

export default function Join() {
  const { slug } = useParams<{ slug: string }>();
  const w = useWorld();
  const sid = useSessionId();
  if (!w) return <main className="mx-auto max-w-sm px-4 py-12" aria-busy="true"><div className="h-40 animate-pulse rounded-card bg-pink-100" /></main>;
  const c = w.communities.find((x) => x.slug === slug);
  if (!c) return <main className="mx-auto max-w-sm px-4 py-12 text-center"><h1 className="font-display text-2xl font-semibold">We can’t find that community</h1><Link href="/" className="mt-4 inline-block text-pink-700 underline">Meet Sisi</Link></main>;
  const me = sid ? w.users[sid] : undefined;
  const ready = !!me && me.role === 'member' && !!me.onboardedAt;
  const membership = ready ? w.communityMembers.find((m) => m.communityId === c.id && m.userId === me!.id) : undefined;
  const oweek = c.kind === 'university' || c.kind === 'oweek';
  const lessons = courseLessons('oweek-starter');
  const prog = ready ? oweekProgress(w, me!.id) : null;
  const now = Date.now() + w.clockOffsetMs;
  const event = oweek ? w.events.filter((e) => e.published && e.type === 'oweek' && e.communityId === c.id && new Date(e.startsAt).getTime() > now).sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] : undefined;
  const btn = 'mt-8 block w-full rounded-input bg-pink-600 py-3 font-semibold text-white hover:bg-pink-700';

  return (
    <main className="mx-auto max-w-sm px-4 py-12 text-center">
      <div className="flex justify-center"><Bloom progress={5} size={120} /></div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-pink-700">{oweek ? 'O-Week · welcome' : 'You’re invited'}</p>
      <h1 className="mt-1 font-display text-3xl font-semibold">Welcome, {c.name}</h1>
      <p className="mt-1 font-display italic text-pink-700">Small steps. Big future.</p>
      <p className="mt-3 text-plum-500">Sisi is money confidence, together. Made by PPS Investments for young women starting out.</p>

      <ul className="mt-6 space-y-2 text-left">
        {WHAT.map(([e, t, d]) => <li key={t} className="flex gap-3 rounded-card bg-white p-3 ring-1 ring-pink-100"><span className="text-2xl" aria-hidden>{e}</span><span><b className="block text-sm">{t}</b><span className="text-sm text-plum-500">{d}</span></span></li>)}
      </ul>

      {oweek && (
        <section className="mt-6 rounded-card bg-gold-100 p-4 text-left">
          <h2 className="font-display text-lg font-semibold">🎒 O-Week Starter</h2>
          <p className="text-sm text-plum-500">Three short lessons to start your first month well. Finish them for the O-Week Starter badge.</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{lessons.map((l) => <li key={l.id}>{l.title}</li>)}</ol>
          {prog && <p className="mt-2 text-xs font-semibold">{prog.done} of {prog.total} done</p>}
          {event && <p className="mt-2 text-xs text-plum-500">Join us live: {event.title}, {fmtDateTime(event.startsAt)}.{ready ? <> <Link href={`/events/${event.id}`} className="font-semibold text-pink-700 underline">Book a seat</Link></> : ' Sign up to book a seat.'}</p>}
        </section>
      )}

      {ready ? (
        membership
          ? <><Link href={oweek ? '/learn/oweek-starter' : `/community/${c.slug}`} className={btn}>{oweek ? 'Start O-Week Starter' : `Open ${c.name}`}</Link><Link href={`/community/${c.slug}`} className="mt-3 block text-sm font-medium text-pink-700">Open the {c.name} community</Link></>
          : <button onClick={() => update((x, n) => joinCommunity(x, me!.id, c.id, n))} className={btn}>Join {c.name} on Sisi</button>
      ) : (
        <>
          <Link href={`/login?community=${slug}&mode=up`} className={btn}>Join {c.name} on Sisi</Link>
          <Link href={`/login?community=${slug}`} className="mt-3 block text-sm font-medium text-pink-700">I already have an account</Link>
        </>
      )}
      <p className="mt-8 text-xs text-plum-500">Powered by PPS Investments. Education, not financial advice.</p>
    </main>
  );
}
