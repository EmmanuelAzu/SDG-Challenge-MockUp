import webpush from 'web-push';
import { adminClient } from '@/lib/supabase/admin';
import { sastDate } from '@/lib/time';
import { getWeekly } from '@/lib/gamification/evaluate';

const MESSAGES = [
  '2 minutes for your next lesson?',
  'A tiny step today keeps your week on track.',
  'Your Circle would love to see you today. 3 minutes?',
  'One small action today. You have got this.',
];
const MAX_PER_WEEK = 3;

/** ISO weekday 1 = Monday … 7 = Sunday, from a SAST date string. */
export const isoWeekday = (d: string) => ((new Date(`${d}T12:00:00Z`).getUTCDay() + 6) % 7) + 1;

/** Push reminders: only on the user's reminder days, only if this week's target is not met, max 3 a week. */
export async function sendPushReminders(today = sastDate()) {
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return { skipped: 'VAPID keys not set' };
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:team@sisi-pps.vercel.app', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  const db = adminClient();
  const dow = isoWeekday(today);
  const { data: prefs } = await db.from('reminder_prefs').select('user_id,days').eq('enabled', true).contains('days', [dow]);
  const weekStart = new Date(new Date(`${today}T12:00:00Z`).getTime() - (dow - 1) * 86400_000).toISOString().slice(0, 10);
  let sent = 0, skipped = 0;
  for (const p of prefs ?? []) {
    const [{ count }, weekly, { data: subs }, { data: already }] = await Promise.all([
      db.from('push_log').select('*', { count: 'exact', head: true }).eq('user_id', p.user_id).gte('sent_on', weekStart),
      getWeekly(p.user_id),
      db.from('push_subscriptions').select('id,endpoint,keys').eq('user_id', p.user_id),
      db.from('push_log').select('sent_on').eq('user_id', p.user_id).eq('sent_on', today),
    ]);
    if ((count ?? 0) >= MAX_PER_WEEK || weekly.thisWeek.hit || !subs?.length || already?.length) { skipped++; continue; }
    const payload = JSON.stringify({ title: 'Sisi', body: MESSAGES[(dow + sent) % MESSAGES.length], url: '/home' });
    for (const s of subs) {
      try { await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys as { p256dh: string; auth: string } }, payload); }
      catch (e: any) { if (e?.statusCode === 404 || e?.statusCode === 410) await db.from('push_subscriptions').delete().eq('id', s.id); }
    }
    await db.from('push_log').upsert({ user_id: p.user_id, sent_on: today, week_key: weekStart }, { onConflict: 'user_id,sent_on', ignoreDuplicates: true });
    sent++;
  }
  return { sent, skipped };
}

/** In-app reminders for sessions (RSVP going) and event bookings starting in the next 24 hours. Idempotent via dedupe_key. */
export async function createUpcomingReminders(now = new Date()) {
  const db = adminClient();
  const until = new Date(now.getTime() + 24 * 3600_000).toISOString();
  const fmt = (iso: string) => new Intl.DateTimeFormat('en-ZA', { weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Johannesburg' }).format(new Date(iso));
  let created = 0;

  const { data: sessions } = await db.from('sessions').select('id,title,starts_at,session_rsvps(user_id,status)').gte('starts_at', now.toISOString()).lte('starts_at', until).is('cancelled_at', null);
  for (const s of (sessions ?? []) as any[]) {
    for (const r of s.session_rsvps ?? []) {
      if (r.status !== 'going') continue;
      const { error } = await db.from('notifications').insert({ user_id: r.user_id, kind: 'reminder', title: `Coming up: ${s.title}`, body: fmt(s.starts_at), href: '/calendar', dedupe_key: `session-${s.id}` });
      if (!error) created++;
    }
  }
  const { data: events } = await db.from('events').select('id,title,starts_at,bookings(id,user_id,status)').gte('starts_at', now.toISOString()).lte('starts_at', until);
  for (const e of (events ?? []) as any[]) {
    for (const b of e.bookings ?? []) {
      if (b.status !== 'booked') continue;
      const { error } = await db.from('notifications').insert({ user_id: b.user_id, kind: 'reminder', title: `Tomorrow: ${e.title}`, body: `${fmt(e.starts_at)}. Your ticket is ready.`, href: `/tickets/${b.id}`, dedupe_key: `booking-${b.id}` });
      if (!error) created++;
    }
  }
  return { created };
}
