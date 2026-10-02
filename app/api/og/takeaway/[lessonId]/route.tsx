import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
const font = (name: string) => fetch(new URL(`../../../../../assets/fonts/${name}`, import.meta.url)).then((r) => r.arrayBuffer());

/** Share-your-takeaway card. Public lesson content only; sharing earns no points. */
export async function GET(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const story = new URL(req.url).searchParams.get('format') === 'story';
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data } = await db.from('lessons').select('title,takeaway').eq('id', lessonId).maybeSingle();
  if (!data) return new Response('Not found', { status: 404 });
  const [fraunces, jakarta] = await Promise.all([font('fraunces-600.woff'), font('jakarta-500.woff')]);
  const host = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sisi-pps.vercel.app').replace(/^https?:\/\//, '');
  const [w, h] = story ? [1080, 1920] : [1200, 630];
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: story ? 90 : 80, background: 'linear-gradient(135deg,#FFF5F9 0%,#F48FB1 100%)', fontFamily: 'Jakarta', color: '#2A1433' }}>
        <div style={{ fontSize: story ? 40 : 28, color: '#AD1457' }}>What I learned on Sisi</div>
        <div style={{ fontFamily: 'Fraunces', fontSize: story ? 96 : 62, lineHeight: 1.1, marginTop: 24 }}>{data.takeaway}</div>
        <div style={{ fontSize: story ? 36 : 26, marginTop: 28, color: '#6E5A7A' }}>{data.title}</div>
        <div style={{ display: 'flex', marginTop: story ? 100 : 50, fontSize: story ? 40 : 28, color: '#AD1457' }}>
          <span style={{ fontFamily: 'Fraunces', marginRight: 14 }}>Sisi</span> {host} · Education, not financial advice
        </div>
      </div>
    ),
    { width: w, height: h, fonts: [{ name: 'Fraunces', data: fraunces, weight: 600 }, { name: 'Jakarta', data: jakarta, weight: 500 }] },
  );
}
