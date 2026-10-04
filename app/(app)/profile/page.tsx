'use client';
import { useRouter } from 'next/navigation';
import { Bloom } from '@/components/bloom';
import { SettingsForm } from '@/components/settings-form';
import { useApp } from '@/components/shell/app-context';
import { getJourney } from '@/lib/engine/journey';
import { setSession, update } from '@/lib/world/store';

export default function Profile() {
  const router = useRouter();
  const { w, me } = useApp();
  const j = getJourney(w, me.id);
  const exportData = () => {
    const mine = { user: { ...me, password: '(hidden)' }, points: w.pointEvents.filter((p) => p.userId === me.id), badges: w.userBadges.filter((b) => b.userId === me.id), surveys: w.surveys.filter((s) => s.userId === me.id), budget: w.budgets[me.id] ?? null, goals: w.goals.filter((g) => g.userId === me.id), invest: w.invest[me.id] ?? null, progress: Object.fromEntries(Object.entries(w.lessonProgress).filter(([k]) => k.startsWith(`${me.id}:`))) };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(mine, null, 2)], { type: 'application/json' }));
    a.download = 'my-sisi-data.json';
    a.click();
  };
  const deleteMe = () => {
    if (!window.confirm('Delete your account and all your data from this browser? This cannot be undone.')) return;
    update((x) => {
      delete x.users[me.id];
      x.pointEvents = x.pointEvents.filter((p) => p.userId !== me.id); x.userBadges = x.userBadges.filter((b) => b.userId !== me.id);
      x.surveys = x.surveys.filter((s) => s.userId !== me.id); x.notifications = x.notifications.filter((n) => n.userId !== me.id);
      x.communityMembers = x.communityMembers.filter((m) => m.userId !== me.id); x.circleMembers = x.circleMembers.filter((m) => m.userId !== me.id);
      for (const k of Object.keys(x.lessonProgress)) if (k.startsWith(`${me.id}:`)) delete x.lessonProgress[k];
      for (const k of Object.keys(x.actionCompletions)) if (k.startsWith(`${me.id}:`)) delete x.actionCompletions[k];
      delete x.milestonesDone[me.id]; delete x.glossaryLookups[me.id];
      delete x.budgets[me.id]; delete x.invest[me.id]; x.goals = x.goals.filter((g) => g.userId !== me.id);
      x.buddies = x.buddies.filter((p) => p.inviterId !== me.id && p.inviteeId !== me.id); x.claims = x.claims.filter((c) => c.userId !== me.id); delete x.payslipRuns[me.id]; x.friendships = x.friendships.filter((f) => f.fromId !== me.id && f.toId !== me.id); x.helpRequests = x.helpRequests.filter((h) => h.userId !== me.id);
    });
    setSession(null);
    router.replace('/');
  };
  const site = typeof window !== 'undefined' ? window.location.origin : '';
  return (
    <div>
      <div className="flex items-center gap-4"><Bloom progress={j.doneCount} size={90} /><div><h1 className="font-display text-3xl font-semibold">{me.displayName}</h1><p className="text-sm text-plum-500">{me.email}</p></div></div>
      <h2 className="mt-8 font-display text-xl font-semibold">Privacy &amp; settings</h2>
      <div className="mt-3"><SettingsForm /></div>
      <h2 className="mt-8 font-display text-xl font-semibold">Invite a friend</h2>
      <p className="mt-1 break-all rounded-input bg-white p-3 text-sm ring-1 ring-pink-100">{site}/login?mode=up&ref={me.referralCode}</p>
      <p className="mt-1 text-xs text-plum-500">When a friend joins through your link and finishes onboarding you earn the Hype Girl badge. (Works between tabs in this browser.)</p>
      <h2 className="mt-8 font-display text-xl font-semibold">Your data</h2>
      <div className="mt-3 flex gap-2"><button onClick={exportData} className="rounded-input border border-pink-300 px-4 py-2 text-sm font-semibold text-pink-700">Export my data</button><button onClick={deleteMe} className="rounded-input border border-coral-600 px-4 py-2 text-sm font-semibold text-coral-600">Delete my account</button></div>
      <p className="mt-3 text-xs text-plum-500"><a href="/privacy" className="underline">Privacy notice</a> · This mock stores everything in this browser only.</p>
    </div>
  );
}
