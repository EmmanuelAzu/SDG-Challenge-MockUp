import { ANNOUNCEMENTS, CHALLENGE_SEEDS, CHAT_POOLS, CIRCLE_SEEDS, COMMUNITY_SEEDS, COMMUNITY_TOPIC, EVENT_SEEDS, FEED_TEMPLATES, MEMBER_NAMES, NOTE_PRESETS, REACTIONS } from '@/lib/content/community-data';
import { COURSES } from '@/lib/content';
import { TRACKS } from '@/lib/content/life-tracks';
import { DEFAULT_REMINDER_DAYS } from '@/lib/engine/actions';
import type { Message, PointEvent, User, World } from './types';

export const WORLD_VERSION = 2;
export const DEMO_PASSWORD = 'SisiDemo2026!';
const COLORS = ['#D81B60', '#7E57C2', '#0F7B5F', '#F2B33D', '#AD1457', '#F48FB1'];

export const PERSONAS = [
  { id: 'u-nomsa', email: 'nomsa@demo.sisi.app', label: 'Nomsa', blurb: 'Member, mid-journey' },
  { id: 'u-new', email: 'new@demo.sisi.app', label: 'New member', blurb: 'Live onboarding' },
  { id: 'u-thandi', email: 'thandi@demo.sisi.app', label: 'Thandi', blurb: 'Facilitator' },
  { id: 'u-admin', email: 'admin@demo.sisi.app', label: 'Admin', blurb: 'PPS staff console' },
] as const;

// tiny deterministic RNG so every fresh world looks the same
function rng(seed = 7) {
  let s = seed;
  const next = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  return { next, int: (n: number) => Math.floor(next() * n), pick: <T,>(a: readonly T[]): T => a[Math.floor(next() * a.length)] };
}

/** Next date (>= tomorrow) that falls on `weekday` (0 = Sunday), at HH:MM SAST, as a UTC Date. */
export function nextWeekdayAt(now: Date, weekday: number, hhmm: string, weeksAhead = 0): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const sastNow = new Date(now.getTime() + 2 * 3600_000);
  const d = new Date(Date.UTC(sastNow.getUTCFullYear(), sastNow.getUTCMonth(), sastNow.getUTCDate() + 1));
  while (d.getUTCDay() !== weekday) d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCDate(d.getUTCDate() + weeksAhead * 7);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), h - 2, m));
}

export function buildWorld(now = new Date()): World {
  const r = rng();
  const iso = (d: Date) => d.toISOString();
  const daysAgo = (n: number, h = 12) => new Date(now.getTime() - n * 86400_000 - (12 - h) * 3600_000);
  const dow = (now.getUTCDay() + 6) % 7; // 0 = Monday
  let pid = 0;
  const events: PointEvent[] = [];
  const ev = (userId: string, source: string, sourceId: string, points: number, at: Date, communityId: string | null = null) =>
    events.push({ id: `p-seed-${pid++}`, userId, communityId, source, sourceId, points, at: iso(at) });

  const base = (id: string, email: string, displayName: string, over: Partial<User> = {}): User => ({
    id, email, password: DEMO_PASSWORD, displayName, nickname: '', role: 'member', color: COLORS[id.length % COLORS.length], lifeTrack: 'student', weeklyTarget: 2, focusMode: false,
    shareMilestones: false, showOnLeaderboard: false, shareNameMode: 'first', goals: ['budget'], reminderDays: DEFAULT_REMINDER_DAYS[2], reminderEnabled: false,
    consentedAt: iso(daysAgo(25)), onboardedAt: iso(daysAgo(25)), referralCode: id.replace('u-', '').replace('m-', 'm') + '26', referredBy: null, createdAt: iso(daysAgo(25)), ...over,
  });

  const users: Record<string, User> = {};
  users['u-nomsa'] = base('u-nomsa', 'nomsa@demo.sisi.app', 'Nomsa Dlamini', { nickname: 'Nomsa', showOnLeaderboard: true, shareMilestones: true, color: '#D81B60' });
  users['u-new'] = base('u-new', 'new@demo.sisi.app', '', { lifeTrack: null, goals: [], consentedAt: null, onboardedAt: null, color: '#7E57C2' });
  users['u-thandi'] = base('u-thandi', 'thandi@demo.sisi.app', 'Thandi Mokoena', { role: 'facilitator', nickname: 'Thandi', shareMilestones: true, color: '#0F7B5F' });
  users['u-admin'] = base('u-admin', 'admin@demo.sisi.app', 'Sisi Admin', { role: 'pps_admin', nickname: 'Admin', color: '#AD1457' });

  const members = MEMBER_NAMES.map((name, i) => {
    const id = `m-${i}`;
    users[id] = base(id, `${name.split(' ')[0].toLowerCase()}.${i}@seed.sisi.app`, name, {
      sim: true, nickname: i % 3 === 0 ? name.split(' ')[0] : '', showOnLeaderboard: i % 5 < 2, shareMilestones: i % 5 < 3, lifeTrack: r.pick(TRACKS).slug, weeklyTarget: ((i % 3) + 1) as 1 | 2 | 3, color: COLORS[i % COLORS.length],
    });
    return id;
  });

  // communities
  const communities = COMMUNITY_SEEDS.map((c) => ({ id: `comm-${c.slug}`, slug: c.slug, name: c.name, description: c.description, kind: c.kind, joinCode: c.joinCode, requiresApproval: !!c.requiresApproval, tags: c.tags, emoji: c.emoji, color: c.color, createdAt: iso(daysAgo(30)) }));
  const cid = (slug: string) => `comm-${slug}`;

  // circles and memberships
  const circles = CIRCLE_SEEDS.map((c, i) => ({ id: `circle-${i}`, communityId: cid(c.community), name: c.name, topic: c.topic, weekday: c.weekday, startTime: c.start, capacity: 8, isOpen: true, facilitatorId: c.name === 'Budget Besties' ? 'u-thandi' : members[(i * 5) % members.length] }));
  const communityMembers: World['communityMembers'] = [];
  const circleMembers: World['circleMembers'] = [];
  const addCommunity = (communityId: string, userId: string, role: 'member' | 'facilitator' | 'admin' = 'member', agreed = true) => {
    if (!communityMembers.some((m) => m.communityId === communityId && m.userId === userId))
      communityMembers.push({ communityId, userId, role, status: 'active', joinedAt: iso(daysAgo(24)), agreedAt: agreed ? iso(daysAgo(22)) : null });
  };
  circles.forEach((c, i) => {
    const size = 3 + (i % 4);
    let ids = Array.from({ length: size }, (_, k) => members[(i * 5 + k) % members.length]);
    if (c.name === 'Budget Besties') ids = [...ids, 'u-nomsa', 'u-thandi'];
    if (c.name === 'First Salary Sisters') ids = [...ids, 'u-thandi'];
    [...new Set([...ids, c.facilitatorId])].forEach((userId) => {
      circleMembers.push({ circleId: c.id, userId, agreedAt: iso(daysAgo(20)), joinedAt: iso(daysAgo(24)) });
      addCommunity(c.communityId, userId, userId === c.facilitatorId ? 'facilitator' : 'member');
    });
    if (users[c.facilitatorId].role === 'member') users[c.facilitatorId].role = 'facilitator';
  });
  // facilitators are facilitators of their community too, whichever Circle added them first
  circles.forEach((c) => { const m = communityMembers.find((x) => x.communityId === c.communityId && x.userId === c.facilitatorId); if (m && m.role === 'member') m.role = 'facilitator'; });
  // each community also has members who have not joined a Circle yet
  communities.forEach((c, i) => {
    const extra = 6 + ((i * 7) % 18);
    for (let k = 0; k < extra; k++) addCommunity(c.id, members[(i * 3 + k * 2 + 1) % members.length]);
  });
  addCommunity('comm-wits', 'u-admin', 'admin'); addCommunity('comm-wits', 'u-nomsa'); addCommunity('comm-wits', 'u-thandi', 'facilitator');
  addCommunity('comm-uj', 'u-nomsa'); addCommunity('comm-student-savers', 'u-nomsa');
  // a pending request so staff have something to approve
  const pendingIdx = communityMembers.findIndex((m) => m.communityId === 'comm-pps-yp' && m.userId === members[3]);
  if (pendingIdx >= 0) communityMembers.splice(pendingIdx, 1);
  communityMembers.push({ communityId: 'comm-pps-yp', userId: members[3], role: 'member', status: 'pending', joinedAt: iso(daysAgo(1)), agreedAt: null });
  const pendingKeys = new Set(['comm-pps-yp:' + members[3]]);
  const cm = communityMembers.filter((m) => !(m.status === 'pending') || pendingKeys.has(`${m.communityId}:${m.userId}`));
  communityMembers.length = 0; communityMembers.push(...cm);

  // sim members: a spread of effort points over four weeks so leaderboards and charts look alive
  members.forEach((id, i) => {
    const n = 4 + r.int(30);
    for (let k = 0; k < n; k++) {
      const src = r.pick(['lesson', 'lesson', 'quiz', 'action', 'weekly_target']);
      const pts = ({ lesson: 10, quiz: 5, action: 15, weekly_target: 25 } as Record<string, number>)[src];
      ev(id, src, `seed-${i}-${k}`, pts, daysAgo(r.int(i % 4 === 0 ? 28 : 12), 8 + r.int(12)));
    }
  });

  // Nomsa: first milestone done, a 4-week weekly-target streak (Tue + Thu each week), level Bud, 3 badges
  const lessonProgress: World['lessonProgress'] = {};
  const actionCompletions: World['actionCompletions'] = {};
  for (const l of COURSES[0].lessons) {
    lessonProgress[`u-nomsa:${l.slug}`] = { status: 'passed', quizScore: 100, startedAt: iso(daysAgo(4)), completedAt: iso(daysAgo(3)) };
    actionCompletions[`u-nomsa:${l.slug}:action`] = { status: 'done', at: iso(daysAgo(3)) };
    ev('u-nomsa', 'lesson', l.slug, 10, daysAgo(3)); ev('u-nomsa', 'quiz', l.slug, 5, daysAgo(3)); ev('u-nomsa', 'action', `${l.slug}:action`, 15, daysAgo(3));
  }
  const second = COURSES[1].lessons[0];
  lessonProgress[`u-nomsa:${second.slug}`] = { status: 'completed', quizScore: null, startedAt: iso(daysAgo(1)), completedAt: iso(daysAgo(1)) };
  ev('u-nomsa', 'lesson', second.slug, 10, daysAgo(1));
  ev('u-nomsa', 'onboarding', 'onboarding', 10, daysAgo(20));
  for (let wk = 1; wk <= 4; wk++) {
    for (const day of [1, 3]) for (const [src, pts] of [['lesson', 10], ['action', 15]] as const) ev('u-nomsa', src, `seed-wk${wk}-${day}-${src}`, pts, daysAgo(dow + wk * 7 - day, 10));
    ev('u-nomsa', 'weekly_target', `seed-week-${wk}`, 25, daysAgo(dow + wk * 7 - 3));
  }
  ev('u-nomsa', 'challenge', 'seed-ch-0', 20, daysAgo(10), 'comm-wits'); ev('u-nomsa', 'challenge', 'seed-ch-1', 20, daysAgo(11), 'comm-wits');
  const userBadges = [['started', 20], ['first-lesson', 14], ['founding-member', 20]].map(([slug, d], i) => ({ id: `ub-seed-${i}`, userId: 'u-nomsa', slug: slug as string, earnedAt: iso(daysAgo(d as number)) }));

  // channels + chat history
  const channels: World['channels'] = [];
  const messages: Message[] = [];
  let mid = 0;
  const poolFor = (communitySlug: string) => [...CHAT_POOLS[COMMUNITY_TOPIC[communitySlug] ?? 'general'], ...CHAT_POOLS.general, ...CHAT_POOLS.budget, ...CHAT_POOLS.savings];
  const seedChat = (channelId: string, authors: string[], pool: string[], count: number, welcome: string) => {
    const total = count;
    messages.push({ id: `msg-seed-${mid++}`, channelId, userId: null, body: welcome, replyTo: null, kind: 'system', pinned: true, deleted: false, at: iso(new Date(now.getTime() - (total + 2) * 95 * 60_000)) });
    // draw without repeating until the whole pool has been used
    const deck = [...new Set(pool)];
    for (let k = deck.length - 1; k > 0; k--) { const j = r.int(k + 1); [deck[k], deck[j]] = [deck[j], deck[k]]; }
    for (let k = 0; k < total; k++) {
      const body = deck[k % deck.length];
      const id = `msg-seed-${mid++}`;
      messages.push({ id, channelId, userId: authors[r.int(authors.length)], body, replyTo: k > 4 && r.next() < 0.12 ? `msg-seed-${mid - 3}` : null, kind: 'user', pinned: false, deleted: false, at: iso(new Date(now.getTime() - (total - k) * 95 * 60_000)) });
    }
  };
  const welcome = 'Welcome! Be kind, keep it private, and never share account numbers, ID numbers or exact amounts.';
  circles.forEach((c) => {
    const ch = { id: `chan-${c.id}`, kind: 'circle' as const, refId: c.id };
    channels.push(ch);
    const slug = communities.find((x) => x.id === c.communityId)!.slug;
    seedChat(ch.id, circleMembers.filter((m) => m.circleId === c.id).map((m) => m.userId).filter((u) => u !== 'u-nomsa'), poolFor(slug), 30 + r.int(21), welcome);
  });
  communities.forEach((c) => {
    const ch = { id: `chan-${c.id}`, kind: 'community' as const, refId: c.id };
    channels.push(ch);
    seedChat(ch.id, communityMembers.filter((m) => m.communityId === c.id && m.status === 'active' && m.userId !== 'u-nomsa').map((m) => m.userId), poolFor(c.slug), 14 + r.int(10), `Welcome to the ${c.name} lounge. ${welcome}`);
  });

  // everyone starts caught up: no misleading unread counts on first load
  const reads: World['reads'] = {};
  for (const ch of channels) for (const id of ['u-nomsa', 'u-thandi', 'u-admin', 'u-new']) reads[`${id}:${ch.id}`] = iso(now);

  // events + bookings
  const sisiEvents: World['events'] = [];
  const bookings: World['bookings'] = [];
  let bid = 0;
  for (const e of EVENT_SEEDS) {
    const startsAt = new Date(now.getTime() + e.dayOffset * 86400_000);
    startsAt.setUTCHours(e.hour - 2, 0, 0, 0);
    const id = `event-${e.slug}`;
    sisiEvents.push({ id, communityId: e.community ? cid(e.community) : null, type: e.type, title: e.title, description: e.description, agenda: e.agenda, hostName: e.hostName, hostRole: e.hostRole, startsAt: iso(startsAt), endsAt: iso(new Date(startsAt.getTime() + e.minutes * 60_000)), location: e.location, online: e.online, capacity: e.capacity, emoji: e.emoji, published: true });
    const past = e.dayOffset < 0;
    for (let k = 0; k < e.booked; k++) bookings.push({ id: `bk-${bid++}`, eventId: id, userId: members[(k * 3 + e.title.length) % members.length], status: past ? 'checked_in' : 'booked', ticketCode: ('S' + (1000 + bid * 7919).toString(36) + 'XQ').toUpperCase().slice(0, 10), waitlistPosition: null, at: iso(daysAgo(2 + (k % 5))) });
    for (let k = 0; k < (e.waitlisted ?? 0); k++) bookings.push({ id: `bk-${bid++}`, eventId: id, userId: members[(e.booked * 3 + k * 3 + e.title.length + 1) % members.length], status: 'waitlisted', ticketCode: ('S' + (2000 + bid * 7919).toString(36) + 'WL').toUpperCase().slice(0, 10), waitlistPosition: k + 1, at: iso(daysAgo(1)) });
  }
  // de-duplicate (event, user) pairs created by the modular spread above
  const seen = new Set<string>();
  const uniqueBookings = bookings.filter((b) => { const k = `${b.eventId}:${b.userId}`; if (seen.has(k)) return false; seen.add(k); return true; });
  const waitByEvent: Record<string, number> = {};
  uniqueBookings.forEach((b) => { if (b.status === 'waitlisted') b.waitlistPosition = (waitByEvent[b.eventId] = (waitByEvent[b.eventId] ?? 0) + 1); });

  // circle sessions: two past, four upcoming
  const sessions: World['sessions'] = [];
  const rsvps: World['rsvps'] = {};
  circles.forEach((c) => {
    for (let wk = -2; wk <= 3; wk++) {
      const startsAt = nextWeekdayAt(now, c.weekday, c.startTime, wk);
      const id = `session-${c.id}-${wk + 2}`;
      sessions.push({ id, communityId: c.communityId, circleId: c.id, title: `${c.name}: ${c.topic}`, startsAt: iso(startsAt), endsAt: iso(new Date(startsAt.getTime() + 35 * 60_000)), location: 'Online (link in the Circle chat)', seriesId: `series-${c.id}`, cancelled: false });
      if (startsAt.getTime() > now.getTime()) circleMembers.filter((m) => m.circleId === c.id).slice(0, 4).forEach((m) => { rsvps[`${id}:${m.userId}`] = 'going'; });
    }
  });
  rsvps[`session-circle-2-2:u-nomsa`] = 'going';

  // challenges + season
  const challenges: World['challenges'] = CHALLENGE_SEEDS.map((c, i) => ({ id: `ch-${i}`, communityId: null, ...c, weekStart: iso(daysAgo(dow + i * 7)).slice(0, 10) }));
  const seasons: World['seasons'] = [{ id: 'season-spring-2026', name: 'Spring Season 2026', startsOn: '2026-10-05', endsOn: '2026-11-01', prizeText: 'Bragging rights and a Campus Cup Champion badge for every member of the winning community.', communityIds: ['comm-wits', 'comm-uj', 'comm-pps-yp'], awardedAt: null }];

  // community feed: announcements + shared milestones from members who opted in
  const feed: World['feed'] = [];
  const feedReactions: World['feedReactions'] = [];
  const feedNotes: World['feedNotes'] = [];
  let fid = 0;
  communities.forEach((c) => {
    const mods = communityMembers.filter((m) => m.communityId === c.id && m.role !== 'member').map((m) => m.userId);
    const poster = mods[0] ?? 'u-admin';
    [...(ANNOUNCEMENTS.default.slice(0, 1)), ...(ANNOUNCEMENTS[c.slug] ?? [])].forEach((text, k) => feed.push({ id: `fp-${fid++}`, userId: poster, communityId: c.id, kind: 'announcement', text, pinned: k === 0, at: iso(daysAgo(6 - k)) }));
    const sharers = communityMembers.filter((m) => m.communityId === c.id && m.status === 'active' && users[m.userId].shareMilestones && m.userId !== 'u-nomsa').map((m) => m.userId).slice(0, 8);
    sharers.forEach((u, k) => {
      const first = users[u].displayName.split(' ')[0];
      const choice = k % 4;
      const [kind, text, ref] = choice === 0 ? ['badge', FEED_TEMPLATES.badge(first, 'Budget Builder'), 'budget-builder'] as const
        : choice === 1 ? ['milestone', FEED_TEMPLATES.milestone(first, 'the Cash-flow check'), 'cash-flow-check'] as const
        : choice === 2 ? ['level', FEED_TEMPLATES.level(first, 'Sprout'), 'sprout'] as const
        : ['weekly', FEED_TEMPLATES.weekly(first, 3 + (k % 3)), 'glow-3w'] as const;
      const id = `fp-${fid++}`;
      feed.push({ id, userId: u, communityId: null, kind, text, refSlug: ref, at: iso(daysAgo(k * 0.7 + 0.3 + r.next() * 0.4, 9 + r.int(10))) });
      sharers.filter((x) => x !== u).slice(0, 1 + r.int(4)).forEach((x) => feedReactions.push({ postId: id, userId: x, emoji: r.pick(REACTIONS) }));
      if (r.next() < 0.5) feedNotes.push({ id: `fn-${fid++}`, postId: id, userId: sharers[(k + 1) % sharers.length], body: r.pick(NOTE_PRESETS), at: iso(daysAgo(k * 0.7)) });
    });
  });

  return {
    version: WORLD_VERSION, clockOffsetMs: 0, users, communities, communityMembers, circles, circleMembers, lessonProgress, actionCompletions,
    milestonesDone: { 'u-nomsa': { 'cash-flow-check': iso(daysAgo(3)) } },
    pointEvents: events, userBadges,
    surveys: [{ userId: 'u-nomsa', kind: 'pre', answers: [2, 2, 2, 1, 3], at: iso(daysAgo(20)) }, { userId: 'u-nomsa', kind: 'post', answers: [3, 3, 3, 2, 4], at: iso(daysAgo(1)) }],
    glossaryLookups: { 'u-nomsa': ['net-pay', 'gross-pay', 'cash-flow'] },
    feedback: [],
    topicSuggestions: [
      { id: 't-1', userId: members[0], body: 'How does a car loan work?', voters: members.slice(0, 7), at: iso(daysAgo(6)) },
      { id: 't-2', userId: members[1], body: 'Stokvels vs savings accounts', voters: members.slice(2, 6), at: iso(daysAgo(5)) },
      { id: 't-3', userId: members[2], body: 'Doing my first tax return', voters: members.slice(4, 7), at: iso(daysAgo(3)) },
    ],
    shares: [], channels, messages, reactions: [], reports: [], blocks: [], mutes: [], reads,
    events: sisiEvents, bookings: uniqueBookings, sessions, rsvps, attendance: [], feed, feedReactions, feedNotes, challenges, challengeDone: [], seasons, askedShare: { 'u-nomsa': true },
    notifications: [{ id: 'n-seed-1', userId: 'u-nomsa', kind: 'welcome', title: 'Welcome back, Nomsa', body: 'You are 60 points from Bud level. One lesson gets you most of the way.', href: '/home', at: iso(daysAgo(0)), read: false }],
    analytics: [],
  };
}
