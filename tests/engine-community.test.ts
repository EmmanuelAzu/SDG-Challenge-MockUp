import { describe, expect, it } from 'vitest';
import { buildWorld } from '@/lib/world/seed';
import { acceptCircleRules, approveMember, canModerateCommunity, isActiveMember, joinCircle, leaveCommunity, membershipOf, searchCommunities, suggestedCommunities } from '@/lib/engine/community';
import { joinCommunity } from '@/lib/engine/actions';
import { award } from '@/lib/engine/award';
import { campusBoard, circleBoard, gapToNext, individualBoard, pointsIn, weekStart } from '@/lib/engine/leaderboard';
import { postMilestones, feedFor, reactToPost, addNote, shouldAskShare } from '@/lib/engine/feed';
import { bookEvent, cancelBooking, checkIn, findBookingByCode, spotsLeft, waitlistSize, takenSeats } from '@/lib/engine/events';
import { blockUser, canAccess, circleChannel, mutedUntil, moderate, needsAgreement, reportMessage, sendMessage, toggleReaction, unreadCount, markRead, RATE_LIMIT_PER_MINUTE } from '@/lib/engine/chat';
import { planReplies } from '@/lib/sim/chat';
import { advanceClock, dailyJob, simulateDay } from '@/lib/engine/jobs';
import { cancelSession, createSessions, markAttendance, rsvp, goingCount } from '@/lib/engine/sessions';
import { pickWinner, previousMonth } from '@/lib/engine/winners';

const NOW = new Date('2026-10-07T10:00:00Z'); // Wednesday
const world = () => buildWorld(NOW);
const eventBySlug = (w: ReturnType<typeof world>, slug: string) => w.events.find((e) => e.id === `event-${slug}`)!;

describe('communities: search, suggestions, joining', () => {
  it('searches by name, tag and kind; name matches rank first', () => {
    const w = world();
    expect(searchCommunities(w, { q: 'wits' })[0].slug).toBe('wits');
    expect(searchCommunities(w, { q: 'stokvel' })[0].slug).toBe('stokvel-sisters');
    expect(searchCommunities(w, { q: 'tfsa' }).map((c) => c.slug)).toContain('invest-curious');
    expect(searchCommunities(w, { kind: 'university' }).every((c) => c.kind === 'university')).toBe(true);
    expect(searchCommunities(w, { tag: 'rent' }).map((c) => c.slug)).toContain('rent-and-independence');
    expect(searchCommunities(w, { q: 'zzzz' })).toEqual([]);
    expect(searchCommunities(w, { q: '' }).length).toBe(w.communities.length);
  });
  it('suggests likeminded communities from the Life Track and excludes ones already joined', () => {
    const w = world();
    w.users['u-new'].lifeTrack = 'invest-small';
    const s = suggestedCommunities(w, 'u-new');
    expect(s[0].community.slug).toBe('invest-curious');
    expect(s[0].reasons[0]).toMatch(/Matches your interest/);
    expect(suggestedCommunities(w, 'u-nomsa').map((x) => x.community.slug)).not.toContain('wits');
  });
  it('open communities join instantly; approval-only ones go pending until staff approve', () => {
    const w = world();
    joinCommunity(w, 'u-new', 'comm-first-salary-club', NOW);
    expect(isActiveMember(w, 'comm-first-salary-club', 'u-new')).toBe(true);
    joinCommunity(w, 'u-new', 'comm-debt-free-starters', NOW);
    expect(membershipOf(w, 'comm-debt-free-starters', 'u-new')?.status).toBe('pending');
    expect(approveMember(w, 'u-nomsa', 'comm-debt-free-starters', 'u-new', true, NOW)).toBe(false); // members cannot approve
    expect(approveMember(w, 'u-admin', 'comm-debt-free-starters', 'u-new', true, NOW)).toBe(true);
    expect(isActiveMember(w, 'comm-debt-free-starters', 'u-new')).toBe(true);
    expect(w.notifications.some((n) => n.userId === 'u-new' && /in:/.test(n.title))).toBe(true);
  });
  it('declining removes the request', () => {
    const w = world();
    joinCommunity(w, 'u-new', 'comm-debt-free-starters', NOW);
    approveMember(w, 'u-admin', 'comm-debt-free-starters', 'u-new', false, NOW);
    expect(membershipOf(w, 'comm-debt-free-starters', 'u-new')).toBeUndefined();
  });
  it('the seeded pending request is visible to staff', () => expect(w0().communityMembers.some((m) => m.status === 'pending')).toBe(true));
  it('leaving a community also leaves its Circles', () => {
    const w = world();
    leaveCommunity(w, 'u-nomsa', 'comm-wits');
    expect(isActiveMember(w, 'comm-wits', 'u-nomsa')).toBe(false);
    expect(w.circleMembers.some((m) => m.userId === 'u-nomsa' && m.circleId === 'circle-2')).toBe(false);
  });
  it('facilitators and admins moderate; plain members do not', () => {
    const w = world();
    expect(canModerateCommunity(w, 'u-thandi', 'comm-wits')).toBe(true);
    expect(canModerateCommunity(w, 'u-admin', 'comm-uj')).toBe(true);
    expect(canModerateCommunity(w, 'u-nomsa', 'comm-wits')).toBe(false);
  });
});
const w0 = world;

describe('Circles', () => {
  it('need community membership, an open Circle and a free seat', () => {
    const w = world();
    expect(joinCircle(w, 'u-new', 'circle-0', NOW)).toMatchObject({ ok: false });
    joinCommunity(w, 'u-new', 'comm-wits', NOW);
    expect(joinCircle(w, 'u-new', 'circle-0', NOW)).toEqual({ ok: true });
    w.circles[1].capacity = 1;
    expect(joinCircle(w, 'u-new', 'circle-1', NOW)).toMatchObject({ ok: false, error: expect.stringMatching(/full/) });
    w.circles[3].isOpen = false;
    expect(joinCircle(w, 'u-new', 'circle-3', NOW)).toMatchObject({ ok: false, error: expect.stringMatching(/closed/) });
  });
});

describe('leaderboards', () => {
  it('weeks start Monday 00:00 SAST', () => expect(weekStart(NOW)).toBe('2026-10-04T22:00:00.000Z'));
  it('individuals show only opted-in members, by nickname else first name', () => {
    const w = world();
    const rows = individualBoard(w, 'comm-wits', 'all', NOW);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => w.users[r.id].showOnLeaderboard)).toBe(true);
    w.users['m-5'].showOnLeaderboard = false;
    expect(individualBoard(w, 'comm-wits', 'all', NOW).some((r) => r.id === 'm-5')).toBe(false);
    expect(rows.find((r) => r.id === 'u-nomsa')?.name).toBe('Nomsa');
  });
  it('community-tied points count only in their community; personal points count everywhere', () => {
    const w = world();
    const before = pointsIn(w, 'u-new', 'comm-wits', null);
    award(w, { userId: 'u-new', source: 'lesson', sourceId: 'x', now: NOW }); // personal
    award(w, { userId: 'u-new', source: 'session', sourceId: 's1', communityId: 'comm-uj', now: NOW }); // UJ only
    expect(pointsIn(w, 'u-new', 'comm-wits', null) - before).toBe(10);
    expect(pointsIn(w, 'u-new', 'comm-uj', null)).toBe(35);
  });
  it('Circle Cup ranks by average points per member and ties share a rank', () => {
    const w = world();
    const rows = circleBoard(w, 'comm-wits', 'all', NOW);
    expect(rows.map((r) => r.rank)[0]).toBe(1);
    expect(rows.every((r, i) => i === 0 || rows[i - 1].points >= r.points)).toBe(true);
  });
  it('shows how many points to pass the next place', () => {
    const rows = [{ id: 'a', name: 'A', points: 100, rank: 1 }, { id: 'b', name: 'B', points: 60, rank: 2 }, { id: 'c', name: 'C', points: 40, rank: 3 }];
    expect(gapToNext(rows, 'c')).toEqual({ rank: 2, pointsToPass: 21 });
    expect(gapToNext(rows, 'a')).toBeNull();
  });
  it('the weekly board excludes older points', () => {
    const w = world();
    expect(pointsIn(w, 'u-nomsa', 'comm-wits', weekStart(NOW))).toBeLessThan(pointsIn(w, 'u-nomsa', 'comm-wits', null));
  });
  it('Campus Cup has not started before 5 October and entrants are the three communities', () => {
    const w = world();
    const early = campusBoard(w, w.seasons[0], new Date('2026-10-04T10:00:00Z'));
    expect(early).toHaveLength(3);
    expect(early.every((r) => !r.started && r.points === 0)).toBe(true);
  });
});

describe('feed (shared milestones)', () => {
  it('posts only when the author opted in, and never includes amounts', () => {
    const w = world();
    const n = w.feed.length;
    w.users['u-new'].shareMilestones = false;
    postMilestones(w, 'u-new', { badges: [{ id: 'x', slug: 'budget-builder', name: 'Budget Builder', meaning: '', rarity: 'common' }], milestones: [], level: null, weeklyStreak: null }, NOW);
    expect(w.feed.length).toBe(n);
    w.users['u-new'].shareMilestones = true; w.users['u-new'].displayName = 'Sam';
    postMilestones(w, 'u-new', { badges: [{ id: 'x', slug: 'budget-builder', name: 'Budget Builder', meaning: '', rarity: 'common' }, { id: 'y', slug: 'started', name: 'Started', meaning: '', rarity: 'common' }], milestones: ['First budget'], level: 'Sprout', weeklyStreak: 3 }, NOW);
    const added = w.feed.slice(n).map((p) => p.text);
    expect(added).toEqual(['Sam earned the Budget Builder badge', 'Sam completed First budget', 'Sam reached Sprout level', 'Sam hit their weekly target 3 weeks running']);
    expect(added.join(' ')).not.toMatch(/R\d/);
  });
  it("a community's feed has its announcements and members' shared posts only", () => {
    const w = world();
    joinCommunity(w, 'u-new', 'comm-first-salary-club', NOW);
    w.users['u-new'].shareMilestones = true;
    postMilestones(w, 'u-new', { badges: [], milestones: ['the Cash-flow check'], level: null, weeklyStreak: null }, NOW);
    expect(feedFor(w, 'comm-first-salary-club').some((p) => p.userId === 'u-new')).toBe(true);
    expect(feedFor(w, 'comm-wits').some((p) => p.userId === 'u-new')).toBe(false);
    expect(feedFor(w, 'comm-wits')[0].pinned).toBe(true);
  });
  it('reactions toggle and notes are limited to 140 characters', () => {
    const w = world();
    const id = feedFor(w, 'comm-wits').find((p) => p.kind !== 'announcement')!.id;
    reactToPost(w, 'u-nomsa', id, '💗', NOW); expect(w.feedReactions.some((r) => r.postId === id && r.userId === 'u-nomsa')).toBe(true);
    reactToPost(w, 'u-nomsa', id, '💗', NOW); expect(w.feedReactions.some((r) => r.postId === id && r.userId === 'u-nomsa')).toBe(false);
    addNote(w, 'u-nomsa', id, 'x'.repeat(300), NOW);
    expect(w.feedNotes.find((n) => n.userId === 'u-nomsa')!.body).toHaveLength(140);
    expect(addNote(w, 'u-nomsa', id, '   ', NOW)).toBe(false);
  });
  it('asks to share once after the first badge', () => {
    const w = world();
    expect(shouldAskShare(w, 'u-new')).toBe(false);
    w.userBadges.push({ id: 'b', userId: 'u-new', slug: 'started', earnedAt: NOW.toISOString() });
    expect(shouldAskShare(w, 'u-new')).toBe(true);
    w.askedShare['u-new'] = true;
    expect(shouldAskShare(w, 'u-new')).toBe(false);
  });
});

describe('events: booking, waitlist, tickets', () => {
  it('seeded events: nearly full (1 left) and full with a waitlist', () => {
    const w = world();
    expect(spotsLeft(w, eventBySlug(w, 'ask-a-pro-r200'))).toBe(1);
    const debt = eventBySlug(w, 'debt-basics');
    expect(spotsLeft(w, debt)).toBe(0);
    expect(waitlistSize(w, debt.id)).toBe(3);
  });
  it('the last seat books, the next person is waitlisted, and capacity is never exceeded', () => {
    const w = world();
    const e = eventBySlug(w, 'ask-a-pro-r200');
    const a = bookEvent(w, 'u-nomsa', e.id, NOW);
    expect(a).toMatchObject({ ok: true, status: 'booked' });
    const b = bookEvent(w, 'u-new', e.id, NOW);
    expect(b).toMatchObject({ ok: true, status: 'waitlisted' });
    expect(takenSeats(w, e.id)).toBe(e.capacity);
  });
  it('booking twice is idempotent', () => {
    const w = world();
    const e = eventBySlug(w, 'first-payslip');
    bookEvent(w, 'u-nomsa', e.id, NOW);
    const n = w.bookings.length;
    bookEvent(w, 'u-nomsa', e.id, NOW);
    expect(w.bookings.length).toBe(n);
  });
  it('cancelling promotes the first waitlisted person in the same step, renumbers and notifies', () => {
    const w = world();
    const e = eventBySlug(w, 'debt-basics');
    const waiting = w.bookings.filter((b) => b.eventId === e.id && b.status === 'waitlisted').sort((a, b) => a.waitlistPosition! - b.waitlistPosition!);
    const booked = w.bookings.find((b) => b.eventId === e.id && b.status === 'booked')!;
    expect(cancelBooking(w, booked.userId, booked.id, NOW)).toBe(true);
    expect(waiting[0].status).toBe('booked');
    expect(waiting[1].waitlistPosition).toBe(1);
    expect(waiting[2].waitlistPosition).toBe(2);
    expect(takenSeats(w, e.id)).toBe(e.capacity);
    expect(w.notifications.some((n) => n.userId === waiting[0].userId && /You're in/.test(n.title))).toBe(true);
  });
  it('cancelling a waitlisted place does not free a seat; rebooking after cancelling works', () => {
    const w = world();
    const e = eventBySlug(w, 'debt-basics');
    const r = bookEvent(w, 'u-nomsa', e.id, NOW);
    if (!r.ok) throw new Error();
    expect(r.status).toBe('waitlisted');
    expect(cancelBooking(w, 'u-nomsa', r.booking.id, NOW)).toBe(true);
    expect(takenSeats(w, e.id)).toBe(e.capacity);
    expect(bookEvent(w, 'u-nomsa', e.id, NOW)).toMatchObject({ ok: true, status: 'waitlisted' });
  });
  it('past events cannot be booked', () => {
    const w = world();
    expect(bookEvent(w, 'u-nomsa', eventBySlug(w, 'tfsa-explained-past').id, NOW)).toMatchObject({ ok: false });
  });
  it('check-in awards 30 community-tied points and Workshop Goer; only staff can do it; ticket codes resolve', () => {
    const w = world();
    const e = eventBySlug(w, 'emergency-fund-student');
    const r = bookEvent(w, 'u-new', e.id, NOW);
    if (!r.ok) throw new Error();
    expect(r.booking.ticketCode).toMatch(/^[A-Z2-9]{10}$/);
    expect(checkIn(w, 'u-nomsa', r.booking.id, NOW)).toMatchObject({ ok: false });
    expect(findBookingByCode(w, `SISI:${r.booking.ticketCode.toLowerCase()}`)?.id).toBe(r.booking.id);
    const c = checkIn(w, 'u-thandi', r.booking.id, NOW);
    expect(c.ok && c.earned.points).toBe(30);
    expect(c.ok && c.earned.badges.map((b) => b.slug)).toContain('workshop-goer');
    expect(pointsIn(w, 'u-new', e.communityId!, null)).toBeGreaterThanOrEqual(30);
    expect(checkIn(w, 'u-thandi', r.booking.id, NOW)).toMatchObject({ ok: false, error: 'Already checked in.' });
  });
});

describe('chat', () => {
  const ch = (w: ReturnType<typeof world>) => circleChannel(w, 'circle-2')!;
  it('members chat; non-members are blocked; the agreement gates the first message', () => {
    const w = world();
    expect(canAccess(w, 'u-nomsa', ch(w))).toBe(true);
    expect(canAccess(w, 'u-new', ch(w))).toBe(false);
    expect(sendMessage(w, 'u-new', ch(w).id, 'hi', null, NOW)).toMatchObject({ ok: false });
    joinCommunity(w, 'u-new', 'comm-wits', NOW); joinCircle(w, 'u-new', 'circle-2', NOW);
    expect(needsAgreement(w, 'u-new', ch(w))).toBe(true);
    expect(sendMessage(w, 'u-new', ch(w).id, 'hi', null, NOW)).toMatchObject({ ok: false, error: expect.stringMatching(/agreement/) });
    acceptCircleRules(w, 'u-new', 'circle-2', NOW);
    expect(sendMessage(w, 'u-new', ch(w).id, 'hi', null, NOW)).toMatchObject({ ok: true });
  });
  it('masks profanity (never blocks), flags harm privately, and rejects empty or long messages', () => {
    const w = world();
    const masked = sendMessage(w, 'u-nomsa', ch(w).id, 'this is shit honestly', null, NOW);
    expect(masked.ok && masked.message.body).not.toMatch(/shit/);
    expect(masked.ok && masked.message.body).toMatch(/honestly/);
    expect(sendMessage(w, 'u-nomsa', ch(w).id, 'I do not feel safe at home', null, NOW)).toMatchObject({ ok: true, harm: true });
    expect(sendMessage(w, 'u-nomsa', ch(w).id, 'saving for a laptop', null, NOW)).toMatchObject({ ok: true, harm: false });
    expect(sendMessage(w, 'u-nomsa', ch(w).id, '   ', null, NOW)).toMatchObject({ ok: false });
    expect(sendMessage(w, 'u-nomsa', ch(w).id, 'x'.repeat(1001), null, NOW)).toMatchObject({ ok: false });
  });
  it('rate-limits to 10 messages a minute per person', () => {
    const w = world();
    for (let i = 0; i < RATE_LIMIT_PER_MINUTE; i++) expect(sendMessage(w, 'u-nomsa', ch(w).id, `m${i}`, null, NOW)).toMatchObject({ ok: true });
    expect(sendMessage(w, 'u-nomsa', ch(w).id, 'one more', null, NOW)).toMatchObject({ ok: false, error: expect.stringMatching(/Slow down/) });
    expect(sendMessage(w, 'u-nomsa', ch(w).id, 'later', null, new Date(NOW.getTime() + 61_000))).toMatchObject({ ok: true });
  });
  it('replies link to a message in the same channel only', () => {
    const w = world();
    const first = w.messages.find((m) => m.channelId === ch(w).id && m.kind === 'user')!;
    const r = sendMessage(w, 'u-nomsa', ch(w).id, 'agree!', first.id, NOW);
    expect(r.ok && r.message.replyTo).toBe(first.id);
    const other = w.messages.find((m) => m.channelId !== ch(w).id)!;
    const r2 = sendMessage(w, 'u-nomsa', ch(w).id, 'hmm', other.id, NOW);
    expect(r2.ok && r2.message.replyTo).toBeNull();
  });
  it('reactions toggle; only valid emoji; only for people in the channel', () => {
    const w = world();
    const m = w.messages.find((x) => x.channelId === ch(w).id && x.kind === 'user')!;
    expect(toggleReaction(w, 'u-nomsa', m.id, '💗')).toBe(true);
    expect(w.reactions.filter((r) => r.messageId === m.id)).toHaveLength(1);
    toggleReaction(w, 'u-nomsa', m.id, '💗');
    expect(w.reactions).toHaveLength(0);
    expect(toggleReaction(w, 'u-nomsa', m.id, '🤡')).toBe(false);
    expect(toggleReaction(w, 'u-new', m.id, '💗')).toBe(false);
  });
  it('facilitators delete, pin and mute; members cannot; a muted person cannot post for 24 hours', () => {
    const w = world();
    const m = w.messages.find((x) => x.channelId === ch(w).id && x.kind === 'user' && x.userId !== 'u-thandi' && x.userId !== 'u-nomsa')!;
    expect(moderate(w, 'u-nomsa', m.id, 'delete', NOW)).toBe(false);
    expect(moderate(w, 'u-thandi', m.id, 'pin', NOW)).toBe(true); expect(m.pinned).toBe(true);
    expect(moderate(w, 'u-thandi', m.id, 'delete', NOW)).toBe(true); expect(m.deleted).toBe(true);
    expect(moderate(w, 'u-thandi', m.id, 'mute', NOW)).toBe(true);
    expect(mutedUntil(w, m.userId!, ch(w).id, NOW)).not.toBeNull();
    expect(mutedUntil(w, m.userId!, ch(w).id, new Date(NOW.getTime() + 25 * 3600_000))).toBeNull();
  });
  it('reports queue up and blocking hides a person from the unread count', () => {
    const w = world();
    const m = w.messages.find((x) => x.channelId === ch(w).id && x.kind === 'user' && x.userId !== 'u-nomsa')!;
    expect(reportMessage(w, 'u-nomsa', m.id, 'unkind', NOW)).toBe(true);
    expect(reportMessage(w, 'u-nomsa', m.id, '  ', NOW)).toBe(false);
    expect(w.reports).toHaveLength(1);
    markRead(w, 'u-nomsa', ch(w).id, new Date(NOW.getTime() - 3600_000 * 1000));
    const all = unreadCount(w, 'u-nomsa', ch(w));
    blockUser(w, 'u-nomsa', m.userId!);
    expect(unreadCount(w, 'u-nomsa', ch(w))).toBeLessThan(all);
  });
  it('simulated replies are deterministic, from other members, and keyword-aware', () => {
    const w = world();
    const r = sendMessage(w, 'u-nomsa', ch(w).id, 'Anyone know about the TFSA limits?', null, NOW);
    if (!r.ok) throw new Error();
    const a = planReplies(w, r.message);
    expect(a).toEqual(planReplies(w, r.message));
    expect(a.length).toBeGreaterThanOrEqual(1);
    expect(a.every((x) => x.userId !== 'u-nomsa' && w.users[x.userId].sim)).toBe(true);
  });
});

describe('sessions and attendance', () => {
  it('weekly creates 8 rows with one series; cancelling "future" notifies and cancels the rest', () => {
    const w = world();
    const made = createSessions(w, 'u-thandi', { circleId: 'circle-2', title: 'Extra', startsAt: '2026-11-02T16:00:00Z', weekly: true });
    expect(made).toHaveLength(8);
    expect(new Set(made.map((s) => s.seriesId)).size).toBe(1);
    rsvp(w, 'u-nomsa', made[3].id, 'going');
    expect(cancelSession(w, 'u-thandi', made[2].id, 'future', NOW)).toBe(6);
    expect(made.slice(0, 2).every((s) => !w.sessions.find((x) => x.id === s.id)!.cancelled)).toBe(true);
    expect(w.notifications.some((n) => n.userId === 'u-nomsa' && /Cancelled/.test(n.title))).toBe(true);
    expect(createSessions(w, 'u-nomsa', { circleId: 'circle-2', title: 'No', startsAt: '2026-11-02T16:00:00Z', weekly: false })).toEqual([]);
  });
  it('attendance awards 25 community-tied points and Circle Starter once; only the facilitator can mark it', () => {
    const w = world();
    const s = w.sessions.find((x) => x.circleId === 'circle-2')!;
    expect(Object.keys(markAttendance(w, 'u-nomsa', s.id, ['u-nomsa'], NOW))).toHaveLength(0);
    const r = markAttendance(w, 'u-thandi', s.id, ['u-nomsa'], NOW);
    expect(w.pointEvents.find((p) => p.userId === 'u-nomsa' && p.source === 'session' && p.sourceId === s.id)).toMatchObject({ points: 25, communityId: s.communityId });
    expect(r['u-nomsa'].points).toBeGreaterThanOrEqual(25); // plus the weekly-target bonus if this was the day that hit it
    expect(r['u-nomsa'].badges.map((b) => b.slug)).toContain('circle-starter');
    expect(Object.keys(markAttendance(w, 'u-thandi', s.id, ['u-nomsa'], NOW))).toHaveLength(0);
    const upcoming = w.sessions.find((x) => x.circleId === 'circle-2' && x.startsAt > NOW.toISOString())!;
    expect(goingCount(w, upcoming.id)).toBeGreaterThan(0);
  });
});

describe('time: simulated activity and the daily job', () => {
  it('simulated members earn points as days pass, and the leaderboard moves', () => {
    const w = world();
    const before = individualBoard(w, 'comm-wits', 'week', NOW).reduce((a, r) => a + r.points, 0);
    advanceClock(w, 3 * 86400_000);
    const now = new Date(NOW.getTime() + w.clockOffsetMs);
    expect(w.pointEvents.some((p) => p.sourceId.startsWith('sim-'))).toBe(true);
    expect(individualBoard(w, 'comm-wits', 'all', now).reduce((a, r) => a + r.points, 0)).toBeGreaterThan(before);
  });
  it('the daily job is idempotent for reminders', () => {
    const w = world();
    const e = eventBySlug(w, 'o-week-r500');
    bookEvent(w, 'u-nomsa', e.id, NOW);
    const soon = new Date(new Date(e.startsAt).getTime() - 6 * 3600_000);
    const first = dailyJob(w, soon);
    const second = dailyJob(w, soon);
    expect(first.reminders).toBeGreaterThan(0);
    expect(second.reminders).toBe(0);
  });
  it('on the 1st the best Circle of the previous month wins Circle Cup Champion (badge for its members)', () => {
    const w = world();
    // make Budget Besties clearly best in September, personal points count in every community
    const members = w.circleMembers.filter((m) => m.circleId === 'circle-2').map((m) => m.userId);
    for (const u of members) award(w, { userId: u, source: 'lesson', sourceId: 'sept-big', points: 500, now: new Date('2026-09-15T10:00:00Z') });
    const first = new Date('2026-10-01T16:05:00Z');
    w.clockOffsetMs = first.getTime() - Date.now();
    const out = dailyJob(w, first);
    expect(out.circleCup.some((x) => x.includes('Budget Besties'))).toBe(true);
    expect(w.userBadges.some((b) => b.userId === 'u-nomsa' && b.slug === 'circle-cup-champion')).toBe(true);
    // idempotent
    const n = w.userBadges.length;
    dailyJob(w, first);
    expect(w.userBadges.length).toBe(n);
  });
  it('the Campus Cup is awarded once after the season ends', () => {
    const w = world();
    for (const m of w.communityMembers.filter((x) => x.communityId === 'comm-wits' && x.status === 'active')) award(w, { userId: m.userId, source: 'lesson', sourceId: 'cup-big', points: 800, now: new Date('2026-10-20T10:00:00Z') });
    const end = new Date('2026-11-02T16:00:00Z');
    const out = dailyJob(w, end);
    expect(out.campusCup[0]).toMatch(/Wits/);
    expect(w.userBadges.some((b) => b.userId === 'u-nomsa' && b.slug === 'campus-cup-champion')).toBe(true);
    expect(w.seasons[0].awardedAt).not.toBeNull();
    expect(dailyJob(w, end).campusCup).toEqual([]);
  });
  it('simulateDay is deterministic for a date', () => {
    const a = world(); const b = world();
    simulateDay(a, new Date('2026-10-08T10:00:00Z')); simulateDay(b, new Date('2026-10-08T10:00:00Z'));
    expect(a.pointEvents.length).toBe(b.pointEvents.length);
  });
});

describe('winners', () => {
  it('highest average wins; ties go to challenges then name', () => {
    expect(pickWinner([{ id: 'a', name: 'A', score: 10, challengeCompletions: 1 }, { id: 'b', name: 'B', score: 10, challengeCompletions: 4 }])?.id).toBe('b');
    expect(pickWinner([{ id: 'z', name: 'Zed', score: 5, challengeCompletions: 2 }, { id: 'a', name: 'Alpha', score: 5, challengeCompletions: 2 }])?.id).toBe('a');
    expect(pickWinner([])).toBeNull();
  });
  it('previous month wraps the year', () => {
    expect(previousMonth('2026-11-01')).toMatchObject({ key: '2026-10', from: '2026-09-30T22:00:00.000Z', to: '2026-10-31T22:00:00.000Z' });
    expect(previousMonth('2027-01-01').key).toBe('2026-12');
  });
});
