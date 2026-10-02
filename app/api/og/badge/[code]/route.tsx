import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';
import { BadgeArt } from '@/components/badge-art';

export const runtime = 'edge';

const font = (name: string) => fetch(new URL(`../../../../../assets/fonts/${name}`, import.meta.url)).then((r) => r.arrayBuffer());

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const story = new URL(req.url).searchParams.get('format') === 'story';
  const [w, h] = story ? [1080, 1920] : [1200, 630];
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data } = await db.rpc('public_badge', { p_code: code });
  const b = data?.[0];
  if (!b) return new Response('Not found', { status: 404 });
  const [fraunces, jakarta] = await Promise.all([font('fraunces-600.woff'), font('jakarta-500.woff')]);
  const host = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sisi-pps.vercel.app').replace(/^https?:\/\//, '');
  const date = new Date(b.earned_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Johannesburg' });
  const art = story ? 520 : 300;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: story ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: story ? 60 : 70, padding: 60, background: 'linear-gradient(135deg,#FFF5F9 0%,#F48FB1 100%)', fontFamily: 'Jakarta', color: '#2A1433' }}>
        {BadgeArt({ slug: b.slug, rarity: b.rarity, size: art })}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: story ? 'center' : 'flex-start', textAlign: story ? 'center' : 'left', maxWidth: story ? 900 : 640 }}>
          <div style={{ fontSize: story ? 44 : 30, color: '#AD1457' }}>{b.who} earned</div>
          <div style={{ fontFamily: 'Fraunces', fontSize: story ? 110 : 76, lineHeight: 1.05, marginTop: 8 }}>{b.badge_name}</div>
          <div style={{ fontSize: story ? 44 : 30, marginTop: 20 }}>{b.meaning_line}</div>
          <div style={{ fontSize: story ? 34 : 24, marginTop: 20, color: '#6E5A7A' }}>{date}</div>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: story ? 80 : 40, fontSize: story ? 40 : 28, color: '#AD1457' }}>
            <span style={{ fontFamily: 'Fraunces', fontSize: story ? 56 : 40, marginRight: 14 }}>Sisi</span> {host}
          </div>
        </div>
      </div>
    ),
    { width: w, height: h, fonts: [{ name: 'Fraunces', data: fraunces, weight: 600 }, { name: 'Jakarta', data: jakarta, weight: 500 }] },
  );
}
