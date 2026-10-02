import { requireUser } from '@/lib/auth';
import { getJourney } from '@/lib/journey';
import { Bloom } from '@/components/bloom';
import { SettingsForm } from '@/components/settings-form';

export const dynamic = 'force-dynamic';

export default async function Profile() {
  const { supabase, user } = await requireUser();
  const [{ data: p }, { data: tracks }, j] = await Promise.all([
    supabase.from('profiles').select('display_name,nickname,share_name_mode,show_on_leaderboard,referral_code,weekly_target,focus_mode,life_track').eq('id', user.id).single(),
    supabase.from('life_tracks').select('slug,name').order('name'),
    getJourney(supabase, user.id),
  ]);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  return (
    <div>
      <div className="flex items-center gap-4">
        <Bloom progress={j.doneCount} size={90} />
        <div><h1 className="font-display text-3xl font-semibold">{p?.display_name}</h1><p className="text-sm text-plum-500">{user.email}</p></div>
      </div>
      <h2 className="mt-8 font-display text-xl font-semibold">Privacy &amp; sharing</h2>
      <div className="mt-3"><SettingsForm initial={{ nickname: p?.nickname ?? '', shareNameMode: p?.share_name_mode ?? 'first', showOnLeaderboard: p?.show_on_leaderboard ?? false, weeklyTarget: p?.weekly_target ?? 2, focusMode: p?.focus_mode ?? false, lifeTrack: p?.life_track ?? null }} tracks={tracks ?? []} /></div>
      <h2 className="mt-8 font-display text-xl font-semibold">Invite a friend</h2>
      <p className="mt-1 break-all rounded-input bg-white p-3 text-sm ring-1 ring-pink-100">{site}/login?ref={p?.referral_code}</p>
      <p className="mt-1 text-xs text-plum-500">When a friend joins through your link you earn the Hype Girl badge.</p>
    </div>
  );
}
