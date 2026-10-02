import { NextResponse } from 'next/server';
import { sendPushReminders, createUpcomingReminders } from '@/lib/jobs/reminders';
import { awardMonthlyCircleCups, awardCampusCups } from '@/lib/jobs/awards';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * The single daily job (Vercel Cron 0 16 * * * = 18:00 SAST), guarded by CRON_SECRET.
 * 1) push reminders  2) in-app reminders for the next 24h  3) on the 1st (SAST): Circle Cup; at season end: Campus Cup.
 * Each step is idempotent and isolated in its own try/catch.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return new NextResponse('Unauthorized', { status: 401 });

  const result: Record<string, unknown> = {};
  const step = async (name: string, fn: () => Promise<unknown>) => {
    try { result[name] = await fn(); } catch (e) { result[name] = { error: e instanceof Error ? e.message : String(e) }; }
  };
  await step('pushReminders', () => sendPushReminders());
  await step('upcomingReminders', () => createUpcomingReminders());
  await step('circleCup', () => awardMonthlyCircleCups());
  await step('campusCup', () => awardCampusCups());
  return NextResponse.json(result);
}
