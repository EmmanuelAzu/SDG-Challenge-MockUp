import QRCode from 'qrcode';

export const POSTER_W = 1240; // A4 at 150 dpi
export const POSTER_H = 1754;

function petals(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  for (let i = 0; i < 5; i++) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate((i * 2 * Math.PI) / 5);
    ctx.beginPath(); ctx.ellipse(0, -r * 0.55, r * 0.3, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 ? '#FCE4EF' : '#F48FB1'; ctx.fill(); ctx.restore();
  }
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.18, 0, Math.PI * 2); ctx.fillStyle = '#F2B33D'; ctx.fill();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  const words = text.split(' '); let line = ''; let yy = y;
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, yy); line = w; yy += lh; } else line = t;
  }
  if (line) ctx.fillText(line, x, yy);
  return yy + lh;
}

/** Renders the printable A4 O-Week poster for a join link onto a canvas (in the browser). */
export async function drawPoster(canvas: HTMLCanvasElement, o: { name: string; url: string; display: string; body: string }) {
  canvas.width = POSTER_W; canvas.height = POSTER_H;
  const ctx = canvas.getContext('2d')!;
  const cs = getComputedStyle(document.body);
  const serif = (cs.getPropertyValue('--font-fraunces') || 'Georgia').trim() + ', Georgia, serif';
  const sans = (cs.getPropertyValue('--font-jakarta') || 'system-ui').trim() + ', system-ui, sans-serif';
  try { await Promise.all([document.fonts.load(`700 80px ${serif}`), document.fonts.load(`500 40px ${sans}`)]); } catch { /* fall back to system fonts */ }

  const g = ctx.createLinearGradient(0, 0, 0, POSTER_H);
  g.addColorStop(0, '#D81B60'); g.addColorStop(0.47, '#AD1457'); g.addColorStop(0.47, '#FFF5F9'); g.addColorStop(1, '#FFF5F9');
  ctx.fillStyle = g; ctx.fillRect(0, 0, POSTER_W, POSTER_H);

  petals(ctx, POSTER_W / 2, 210, 140);
  ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
  ctx.font = `700 150px ${serif}`; ctx.fillText('Sisi', POSTER_W / 2, 470);
  ctx.font = `italic 400 46px ${serif}`; ctx.fillText('Small steps. Big future.', POSTER_W / 2, 540);
  ctx.font = `700 66px ${serif}`;
  const y = wrap(ctx, `Join ${o.name} on Sisi`, POSTER_W / 2, 690, POSTER_W - 200, 80);

  const size = 480; const x0 = (POSTER_W - size) / 2; const y0 = Math.max(y + 30, 850);
  ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(42,20,51,0.18)'; ctx.shadowBlur = 30; ctx.beginPath(); ctx.roundRect(x0 - 40, y0 - 40, size + 80, size + 80, 36); ctx.fill(); ctx.shadowBlur = 0;
  const qr = document.createElement('canvas');
  await QRCode.toCanvas(qr, o.url, { width: size, margin: 0, errorCorrectionLevel: 'M', color: { dark: '#2A1433', light: '#FFFFFF' } });
  ctx.drawImage(qr, x0, y0, size, size);

  ctx.fillStyle = '#2A1433'; ctx.font = `700 54px ${sans}`; ctx.fillText('Scan to join', POSTER_W / 2, y0 + size + 110);
  ctx.font = `500 34px ${sans}`; ctx.fillStyle = '#6E5A7A';
  const y2 = wrap(ctx, o.body, POSTER_W / 2, y0 + size + 170, POSTER_W - 260, 48);
  ctx.fillStyle = '#AD1457'; ctx.font = `700 34px ${sans}`; ctx.fillText(o.display, POSTER_W / 2, y2 + 10);
  ctx.fillStyle = '#6E5A7A'; ctx.font = `500 26px ${sans}`;
  ctx.fillText('Powered by PPS Investments · Education, not financial advice', POSTER_W / 2, POSTER_H - 70);
}
