import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Bloom } from '@/components/bloom';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const [{ data: profile }, { count: milestones }, { data: pts }] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('id', user.id).single(),
    supabase.from('user_milestones').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('point_events').select('points').eq('user_id', user.id),
  ]);
  const points = (pts ?? []).reduce((a, r) => a + r.points, 0);
  const first = profile?.display_name?.split(' ')[0] || 'Sisi';

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Hi {first}</h1>
      <p className="font-display italic text-pink-700">Small steps. Big future.</p>
      <div className="mt-6 flex items-center gap-4">
        <Bloom progress={milestones ?? 0} size={110} />
        <p className="rounded-full bg-pink-100 px-3 py-1 text-sm font-semibold text-pink-700">{points} pts</p>
      </div>
      <Link href="/learn" className="mt-6 block rounded-card bg-pink-600 p-4 text-white">
        <span className="text-xs uppercase tracking-wide opacity-80">Your next action</span>
        <span className="mt-1 block font-display text-lg font-semibold">Start your first 3-minute lesson</span>
      </Link>
      <footer className="mt-10 text-xs text-plum-500">Sisi provides financial education, not financial advice.</footer>
    </div>
  );
}
