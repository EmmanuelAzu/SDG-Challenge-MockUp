import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { JoinButton, ChallengeButton } from '@/components/circle-actions';
import { RefreshOnFocus } from '@/components/refresh-on-focus';
import { sastDate } from '@/lib/time';

export const dynamic = 'force-dynamic';
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const AGENDA = [['LEARN', 10], ['DO', 10], ['TALK', 10], ['CHALLENGE', 5]] as const;

export default async function CirclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data: dir } = await supabase.rpc('circle_directory', { p_circle: id });
  const c = (dir as any[] | null)?.[0];
  if (!c) notFound();
  const today = sastDate();
  const [{ data: prog }, { data: challenges }, { data: community }] = await Promise.all([
    supabase.rpc('circle_week_progress', { p_circle: id }),
    supabase.from('challenges').select('id,title,description,points,community_id').lte('week_start', today).order('week_start', { ascending: false }).limit(5),
    supabase.from('communities').select('slug,name').eq('id', c.community_id).single(),
  ]);
  const challenge = (challenges ?? []).find((x) => !x.community_id || x.community_id === c.community_id);
  const { data: doneRow } = challenge ? await supabase.from('challenge_completions').select('challenge_id').eq('challenge_id', challenge.id).eq('user_id', user.id).maybeSingle() : { data: null };
  const done = Number(prog?.[0]?.done ?? 0);
  const total = Number(prog?.[0]?.total ?? 0);
  const pct = total ? done / total : 0;
  const R = 34, C = 2 * Math.PI * R;

  return (
    <div>
      <RefreshOnFocus />
      <Link href={`/community/${community?.slug}`} className="text-sm text-pink-700">← {community?.name}</Link>
      <div className="mt-2 flex items-start justify-between gap-3">
        <div><h1 className="font-display text-3xl font-semibold">{c.name}</h1><p className="text-plum-500">{c.topic}</p></div>
        <JoinButton circleId={id} isMember={c.is_member} full={Number(c.members) >= c.capacity} />
      </div>
      <p className="mt-2 text-sm">{c.facilitator_name ? `Facilitated by ${c.facilitator_name} · ` : ''}{c.weekday != null ? `${DAYS[c.weekday]}s at ${String(c.start_time).slice(0, 5)}` : 'Time to be set'} · {c.members}/{c.capacity} seats</p>

      <section className="mt-6 rounded-card bg-white p-4 ring-1 ring-pink-100">
        <h2 className="font-display text-lg font-semibold">Session agenda (35 min)</h2>
        <ol className="mt-3 grid grid-cols-4 gap-2 text-center">
          {AGENDA.map(([n, m]) => <li key={n} className="rounded-input bg-pink-100 p-2"><b className="block text-xs text-pink-700">{n}</b><span className="text-sm">{m} min</span></li>)}
        </ol>
      </section>

      <section className="mt-4 flex items-center gap-4 rounded-card bg-white p-4 ring-1 ring-pink-100">
        <svg width="84" height="84" viewBox="0 0 84 84" role="img" aria-label={`${done} of ${total} members completed this week's action`}>
          <circle cx="42" cy="42" r={R} fill="none" stroke="#FCE4EF" strokeWidth="9" />
          <circle cx="42" cy="42" r={R} fill="none" stroke="#D81B60" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${C * pct} ${C}`} transform="rotate(-90 42 42)" />
        </svg>
        <div><b className="font-display text-lg">{done} of {total}</b><p className="text-sm text-plum-500">completed this week’s action</p></div>
      </section>

      {challenge && (
        <section className="mt-4 rounded-card bg-lavender-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-lavender-600">This week’s challenge · +{challenge.points} pts</p>
          <b className="mt-1 block font-display text-lg">{challenge.title}</b>
          <p className="text-sm">{challenge.description}</p>
          {c.is_member && <ChallengeButton challengeId={challenge.id} done={!!doneRow} />}
        </section>
      )}

      {c.is_member ? (
        <Link href={`/circles/${id}/chat`} className="mt-6 flex items-center justify-center gap-2 rounded-input bg-pink-600 py-3 font-semibold text-white hover:bg-pink-700"><MessageCircle size={20} /> Open Circle chat</Link>
      ) : (
        <p className="mt-6 text-sm text-plum-500">Join this Circle to chat with the group.</p>
      )}
    </div>
  );
}
