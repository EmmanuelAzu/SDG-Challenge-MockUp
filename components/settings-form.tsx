'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveSettings, type Settings } from '@/lib/engine/actions';
import { TRACKS } from '@/lib/content';
import { useApp } from '@/components/shell/app-context';
import { setSession, update } from '@/lib/world/store';

export function SettingsForm() {
  const router = useRouter();
  const { me } = useApp();
  const [v, setV] = useState<Settings>({ nickname: me.nickname, shareNameMode: me.shareNameMode, showOnLeaderboard: me.showOnLeaderboard, weeklyTarget: me.weeklyTarget, focusMode: me.focusMode, lifeTrack: me.lifeTrack, shareMilestones: me.shareMilestones, reminderDays: me.reminderDays, reminderEnabled: me.reminderEnabled });
  const [saved, setSaved] = useState(false);
  const set = (patch: Partial<Settings>) => { setSaved(false); setV({ ...v, ...patch }); };
  return (
    <form onSubmit={(e) => { e.preventDefault(); update((w) => saveSettings(w, me.id, v)); setSaved(true); }} className="space-y-5">
      <label className="block text-sm font-medium">Nickname<input value={v.nickname} maxLength={20} onChange={(e) => set({ nickname: e.target.value })} className="mt-1 w-full rounded-input border border-pink-300 bg-white px-3 py-3" /></label>

      <fieldset><legend className="text-sm font-medium">My Life Track</legend>
        <div className="mt-1 grid gap-2">{TRACKS.map((t) => (
          <label key={t.slug} className={`flex items-center gap-2 rounded-input border p-3 text-sm ${v.lifeTrack === t.slug ? 'border-pink-600 bg-pink-100' : 'border-pink-300 bg-white'}`}><input type="radio" name="track" checked={v.lifeTrack === t.slug} onChange={() => set({ lifeTrack: t.slug })} className="accent-pink-600" />{t.name}</label>
        ))}</div>
      </fieldset>

      <fieldset><legend className="text-sm font-medium">Weekly target: days a week I will do 3 minutes</legend>
        <div className="mt-1 flex gap-2">{[1, 2, 3].map((n) => <button type="button" key={n} aria-pressed={v.weeklyTarget === n} onClick={() => set({ weeklyTarget: n as 1 | 2 | 3 })} className={`h-11 flex-1 rounded-input border font-semibold ${v.weeklyTarget === n ? 'border-pink-600 bg-pink-600 text-white' : 'border-pink-300 bg-white'}`}>{n}</button>)}</div>
        <p className="mt-1 text-xs text-plum-500">Missing a day never resets anything. Only whole weeks count towards your streak.</p>
      </fieldset>

      <fieldset><legend className="text-sm font-medium">Name shown on shared badges</legend>
        {(['first', 'nickname'] as const).map((m) => <label key={m} className="mt-1 flex items-center gap-2 text-sm"><input type="radio" name="mode" checked={v.shareNameMode === m} onChange={() => set({ shareNameMode: m })} className="accent-pink-600" />{m === 'first' ? 'First name' : 'Nickname'}</label>)}
      </fieldset>

      <label className="flex items-start gap-3 rounded-card bg-pink-100 p-3 text-sm"><input type="checkbox" checked={v.showOnLeaderboard} onChange={(e) => set({ showOnLeaderboard: e.target.checked })} className="mt-1 h-5 w-5 accent-pink-600" /><span><b>Show me on community leaderboards</b><br />Optional. You appear by nickname (or first name). Only effort points are shown, never money.</span></label>
      <label className="flex items-start gap-3 rounded-card bg-lavender-100 p-3 text-sm"><input type="checkbox" checked={v.focusMode} onChange={(e) => set({ focusMode: e.target.checked })} className="mt-1 h-5 w-5 accent-pink-600" /><span><b>Focus mode</b><br />Hides points, streaks, levels, leaderboards and celebrations. Lessons, tools, milestones and rewards stay exactly the same, and points still add up quietly.</span></label>
      <label className="flex items-start gap-3 rounded-card bg-mint-100 p-3 text-sm"><input type="checkbox" checked={v.shareMilestones} onChange={(e) => set({ shareMilestones: e.target.checked })} className="mt-1 h-5 w-5 accent-pink-600" /><span><b>Share my milestones with friends</b><br />Off by default. Friends see badges and progress in their Letterbox, never amounts.</span></label>

      <button className="w-full rounded-input bg-pink-600 py-3 font-semibold text-white hover:bg-pink-700">Save settings</button>
      {saved && <p role="status" className="text-sm text-mint-700">Saved.</p>}
      <button type="button" onClick={() => { setSession(null); router.replace('/'); }} className="w-full py-2 text-sm font-medium text-pink-700">Sign out</button>
    </form>
  );
}
