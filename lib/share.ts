/** Stateless share payloads: everything needed to render a badge card lives in the URL, so links work on any device with no server data. */
export type BadgePayload = { s: string; w: string; d: string; r?: string };

const b64 = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

export const encodePayload = (p: BadgePayload) => b64(JSON.stringify(p));
export function decodePayload(code: string): BadgePayload | null {
  try {
    const p = JSON.parse(unb64(code));
    return typeof p?.s === 'string' && typeof p?.w === 'string' && typeof p?.d === 'string' ? p : null;
  } catch { return null; }
}
