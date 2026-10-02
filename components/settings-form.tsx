'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveSettings, signOut } from '@/app/(app)/profile/actions';

type Track = { slug: string; name: string };
type P = { nickname: string; shareNameMode: 'first' | 'nickname'; showOnLeaderboard: boolean; weeklyTarget: number; focusMode: boolean; lifeTrack: string | null };

export function SettingsForm({ initial, tracks }: { initial: P; tracks: Track[] }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const set = (patch: Partial<P>) => { setSaved(false); setV({ ...v, ...patch }); };
  return (
    <form onSubmit={(e) => { e.preventDefault(); start(async () => { await saveSettings(v as never); setSaved(true); router.refresh(); }); }} className="space-y-5">
      <label className="block text-sm font-medium">Nickname<input value={v.nickname} maxLength={20} onChange={(e) => set({ nickname: e.target.value })} className="mt-1 w-full rounded-input border border-pink-300 bg-white px-3 py-3" /></label>

      <fieldset>
        <legend className="text-sm font-medium">My Life Track</legend>
        <div className="mt-1 grid gap-2">
          {tracks.map((t) => (
            <label key={t.slug} className={`flex items-center gap-2 rounded-input border p-3 text-sm ${v.lifeTrack === t.slug ? 'border-pink-600 bg-pink-100' : 'border-pink-300 bg-white'}`}>
              <input type="radio" name="track" checked={v.lifeTrack === t.slug} onChange={() => set({ lifeTrack: t.slug })} className="accent-pink-600" />{t.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium">Weekly target: days a week I will do 3 minutes</legend>
        <div className="mt-1 flex gap-2">
          {[1, 2, 3].map((n) => <button type="button" key={n} aria-pressed={v.weeklyTarget === n} onClick={() => set({ weeklyTarget: n })} className={`h-11 flex-1 rounded-input border font-semibold ${v.weeklyTarget === n ? 'border-pink-600 bg-pink-600 text-white' : 'border-pink-300 bg-white'}`}>{n}</button>)}
        </div>
        <p className="mt-1 text-xs text-plum-500">Missing a day never resets anything. Only whole weeks count towards your streak.</p>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium">Name shown on shared badges</legend>
        {(['first', 'nickname'] as const).map((m) => (
          <label key={m} className="mt-1 flex items-center gap-2 text-sm"><input type="radio" name="mode" checked={v.shareNameMode === m} onChange={() => set({ shareNameMode: m })} className="accent-pink-600" />{m === 'first' ? 'First name' : 'Nickname'}</label>
        ))}
      </fieldset>

      <label className="flex items-start gap-3 rounded-card bg-pink-100 p-3 text-sm">
        <input type="checkbox" checked={v.showOnLeaderboard} onChange={(e) => set({ showOnLeaderboard: e.target.checked })} className="mt-1 h-5 w-5 accent-pink-600" />
        <span><b>Show me on community leaderboards</b><br />Optional. You appear by nickname (or first name). Only effort points are shown, never money.</span>
      </label>

      <label className="flex items-start gap-3 rounded-card bg-lavender-100 p-3 text-sm">
        <input type="checkbox" checked={v.focusMode} onChange={(e) => set({ focusMode: e.target.checked })} className="mt-1 h-5 w-5 accent-pink-600" />
        <span><b>Focus mode</b><br />Hides points, streaks, levels, leaderboards and celebrations. Lessons, tools, milestones and rewards stay exactly the same, and points still add up quietly.</span>
      </label>

      <button disabled={pending} className="w-full rounded-input bg-pink-600 py-3 font-semibold text-white hover:bg-pink-700 disabled:opacity-60">{pending ? 'Saving…' : 'Save settings'}</button>
      {saved && <p role="status" className="text-sm text-mint-700">Saved.</p>}
      <button type="button" onClick={async () => { await signOut(); router.replace('/'); router.refresh(); }} className="w-full py-2 text-sm font-medium text-pink-700">Sign out</button>
    </form>
  );
}
