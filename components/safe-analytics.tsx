'use client';
import { Analytics } from '@vercel/analytics/next';

/** Page-view analytics, switched off on the Support route (spec: no analytics on Support). */
export function SafeAnalytics() {
  return <Analytics beforeSend={(e) => (/\/help\/support/.test(e.url) ? null : e)} />;
}
