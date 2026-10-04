import type { Booking, Earned, SisiEvent, World } from '@/lib/world/types';
import { award } from './award';
import { earning } from './actions';
import { evaluateBadges } from './badges';
import { notify, uid } from './helpers';

const fmt = (iso: string) => new Intl.DateTimeFormat('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Johannesburg' }).format(new Date(iso));
export const fmtWhen = fmt;

export const takenSeats = (w: World, eventId: string) => w.bookings.filter((b) => b.eventId === eventId && (b.status === 'booked' || b.status === 'checked_in')).length;
export const spotsLeft = (w: World, e: SisiEvent) => Math.max(0, e.capacity - takenSeats(w, e.id));
export const waitlistSize = (w: World, eventId: string) => w.bookings.filter((b) => b.eventId === eventId && b.status === 'waitlisted').length;
export const bookingOf = (w: World, eventId: string, userId: string): Booking | undefined => w.bookings.find((b) => b.eventId === eventId && b.userId === userId && b.status !== 'cancelled');
export const isPast = (e: SisiEvent, now: Date) => new Date(e.endsAt).getTime() < now.getTime();
export const myBookings = (w: World, userId: string) => w.bookings.filter((b) => b.userId === userId && b.status !== 'cancelled');

const code = () => Array.from({ length: 10 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');

export function canManageEvent(w: World, userId: string): boolean {
  const u = w.users[userId];
  if (!u) return false;
  if (u.role !== 'member') return true;
  return false;
}

export type BookResult = { ok: true; status: 'booked' | 'waitlisted'; booking: Booking } | { ok: false; error: string };

/** Capacity is enforced here: a full event puts you on the waitlist. */
export function bookEvent(w: World, userId: string, eventId: string, now: Date): BookResult {
  const e = w.events.find((x) => x.id === eventId);
  if (!e || !e.published) return { ok: false, error: 'This event is not available.' };
  if (isPast(e, now)) return { ok: false, error: 'This event has already finished.' };
  const existing = bookingOf(w, eventId, userId);
  if (existing) return { ok: true, status: existing.status === 'waitlisted' ? 'waitlisted' : 'booked', booking: existing };
  const full = takenSeats(w, eventId) >= e.capacity;
  const position = full ? waitlistSize(w, eventId) + 1 : null;
  const old = w.bookings.find((b) => b.eventId === eventId && b.userId === userId); // a cancelled one: reuse the row
  const booking: Booking = old ?? { id: uid('bk'), eventId, userId, status: 'booked', ticketCode: code(), waitlistPosition: null, at: now.toISOString() };
  Object.assign(booking, { status: full ? 'waitlisted' : 'booked', waitlistPosition: position, at: now.toISOString() });
  if (!old) w.bookings.push(booking);
  if (full) notify(w, userId, { kind: 'booking', title: `Waitlisted: ${e.title}`, body: `You are #${position} on the waitlist. We will tell you if a seat opens.`, href: `/events/${e.id}`, key: `book-${booking.id}-${now.getTime()}` }, now);
  else notify(w, userId, { kind: 'booking', title: `Booked: ${e.title}`, body: `${fmt(e.startsAt)}. Your ticket is ready.`, href: `/tickets/${booking.id}`, key: `book-${booking.id}-${now.getTime()}` }, now);
  return { ok: true, status: full ? 'waitlisted' : 'booked', booking };
}

/** Cancelling a seat promotes the first waitlisted booking in the same step. */
export function cancelBooking(w: World, userId: string, bookingId: string, now: Date): boolean {
  const b = w.bookings.find((x) => x.id === bookingId && x.userId === userId);
  if (!b || b.status === 'cancelled' || b.status === 'checked_in') return false;
  const wasBooked = b.status === 'booked';
  b.status = 'cancelled';
  b.waitlistPosition = null;
  const e = w.events.find((x) => x.id === b.eventId)!;
  if (wasBooked) {
    const next = w.bookings.filter((x) => x.eventId === b.eventId && x.status === 'waitlisted').sort((p, q) => (p.waitlistPosition ?? 0) - (q.waitlistPosition ?? 0))[0];
    if (next) {
      next.status = 'booked';
      next.waitlistPosition = null;
      notify(w, next.userId, { kind: 'booking', title: `You're in! A seat opened up`, body: `${e.title}, ${fmt(e.startsAt)}. Your ticket is ready.`, href: `/tickets/${next.id}`, key: `promo-${next.id}-${now.getTime()}` }, now);
    }
  }
  w.bookings.filter((x) => x.eventId === b.eventId && x.status === 'waitlisted').sort((p, q) => (p.waitlistPosition ?? 0) - (q.waitlistPosition ?? 0)).forEach((x, i) => { x.waitlistPosition = i + 1; });
  return true;
}

/** Host check-in: marks the booking as checked in, +30 points (community-tied) and Workshop Goer. */
export function checkIn(w: World, staffId: string, bookingId: string, now: Date): { ok: true; earned: Earned; who: string } | { ok: false; error: string } {
  const b = w.bookings.find((x) => x.id === bookingId);
  if (!b) return { ok: false, error: 'No booking with that ticket.' };
  const e = w.events.find((x) => x.id === b.eventId)!;
  if (!canManageEvent(w, staffId)) return { ok: false, error: 'Only hosts and staff can check people in.' };
  if (b.status === 'waitlisted' || b.status === 'cancelled') return { ok: false, error: `That ticket is ${b.status}.` };
  if (b.status === 'checked_in') return { ok: false, error: 'Already checked in.' };
  b.status = 'checked_in';
  const earned = earning(w, b.userId, now, () => { award(w, { userId: b.userId, source: 'event', sourceId: e.id, communityId: e.communityId, now }); });
  notify(w, b.userId, { kind: 'booking', title: `Checked in: ${e.title}`, body: 'Thanks for coming. +30 points.', href: '/rewards', key: `checkin-${b.id}` }, now);
  return { ok: true, earned, who: w.users[b.userId].displayName };
}

export const findBookingByCode = (w: World, ticketCode: string) => w.bookings.find((b) => b.ticketCode.toUpperCase() === ticketCode.trim().toUpperCase().replace(/^SISI:/, ''));

/** Calendar helpers */
export function icsFile(e: SisiEvent): string {
  const stamp = (iso: string) => iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (t: string) => t.replace(/[\;,]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sisi//Mock//EN', 'BEGIN:VEVENT', `UID:${e.id}@sisi.mock`, `DTSTAMP:${stamp(new Date().toISOString())}`, `DTSTART:${stamp(e.startsAt)}`, `DTEND:${stamp(e.endsAt)}`, `SUMMARY:${esc(e.title)}`, `DESCRIPTION:${esc(e.description)}`, `LOCATION:${esc(e.location)}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}
export const googleCalendarUrl = (e: SisiEvent) => {
  const stamp = (iso: string) => iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(e.title)}&dates=${stamp(e.startsAt)}/${stamp(e.endsAt)}&details=${encodeURIComponent(e.description)}&location=${encodeURIComponent(e.location)}`;
};
export const evaluateAfter = evaluateBadges;
