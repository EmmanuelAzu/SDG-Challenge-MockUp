import { CHALLENGES, CIRCLES, COMMUNITIES, MEMBER_NAMES } from '@/lib/content/seed-data';
import { COURSES } from '@/lib/content';
import { TRACKS } from '@/lib/content/life-tracks';
import { DEFAULT_REMINDER_DAYS } from '@/lib/engine/actions';
import type { PointEvent, User, World } from './types';

export const WORLD_VERSION = 1;
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
  return { next, pick: <T,>(a: readonly T[]): T => a[Math.floor(next() * a.length)] };
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
  users['u-nomsa'] = base('u-nomsa', 'nomsa@demo.sisi.app', 'Nomsa Dlamini', { nickname: 'Nomsa', showOnLeaderboard: true, color: '#D81B60' });
  users['u-new'] = base('u-new', 'new@demo.sisi.app', '', { lifeTrack: null, goals: [], consentedAt: null, onboardedAt: null, color: '#7E57C2' });
  users['u-thandi'] = base('u-thandi', 'thandi@demo.sisi.app', 'Thandi Mokoena', { role: 'facilitator', nickname: 'Thandi', color: '#0F7B5F' });
  users['u-admin'] = base('u-admin', 'admin@demo.sisi.app', 'Sisi Admin', { role: 'pps_admin', nickname: 'Admin', color: '#AD1457' });

  const members = MEMBER_NAMES.filter((n) => !n.startsWith('Nomsa') && !n.startsWith('Thandi')).slice(0, 25).map((name, i) => {
    const id = `m-${i}`;
    users[id] = base(id, `${name.split(' ')[0].toLowerCase()}.${i}@seed.sisi.app`, name, {
      sim: true, nickname: i % 3 === 0 ? name.split(' ')[0] : '', showOnLeaderboard: i % 5 < 2, lifeTrack: r.pick(TRACKS).slug, weeklyTarget: ((i % 3) + 1) as 1 | 2 | 3, color: COLORS[i % COLORS.length],
    });
    return id;
  });

  // communities, circles, memberships
  const communities = COMMUNITIES.map((c) => ({ id: `comm-${c.slug}`, slug: c.slug, name: c.name, description: c.description, kind: c.kind as 'university' | 'workplace', joinCode: c.join_code, requiresApproval: c.requires_approval as boolean }));
  const windows = [[0, 6], [6, 12], [12, 18], [18, 24], [3, 8], [15, 20], [9, 14]];
  const circles = CIRCLES.map((c, i) => ({
    id: `circle-${i}`, communityId: `comm-${c.community}`, name: c.name, topic: c.topic, weekday: c.weekday, startTime: c.start, capacity: 8, isOpen: true,
    facilitatorId: c.name === 'Budget Besties' ? 'u-thandi' : members[windows[i][0]],
  }));
  const communityMembers: World['communityMembers'] = [];
  const circleMembers: World['circleMembers'] = [];
  circles.forEach((c, i) => {
    let ids = members.slice(windows[i][0], windows[i][1]);
    if (c.name === 'Budget Besties') ids = [...ids, 'u-nomsa', 'u-thandi'];
    if (i === 0) ids = [...ids, 'u-thandi'];
    [...new Set(ids)].forEach((userId) => {
      circleMembers.push({ circleId: c.id, userId, agreedAt: iso(daysAgo(20)), joinedAt: iso(daysAgo(24)) });
      if (!communityMembers.some((m) => m.communityId === c.communityId && m.userId === userId))
        communityMembers.push({ communityId: c.communityId, userId, role: userId === c.facilitatorId ? 'facilitator' : 'member', status: 'active', joinedAt: iso(daysAgo(24)) });
    });
    if (users[c.facilitatorId].role === 'member') users[c.facilitatorId].role = 'facilitator';
  });
  communityMembers.push({ communityId: 'comm-wits', userId: 'u-admin', role: 'admin', status: 'active', joinedAt: iso(daysAgo(25)) });
  communityMembers.push({ communityId: 'comm-uj', userId: 'u-nomsa', role: 'member', status: 'active', joinedAt: iso(daysAgo(18)) });

  // members: a spread of effort points over four weeks so leaderboards and charts look alive
  members.forEach((id, i) => {
    const n = 4 + Math.floor(r.next() * 30);
    for (let k = 0; k < n; k++) {
      const src = r.pick(['lesson', 'lesson', 'quiz', 'action', 'weekly_target']);
      const pts = ({ lesson: 10, quiz: 5, action: 15, weekly_target: 25 } as Record<string, number>)[src];
      ev(id, src, `seed-${i}-${k}`, pts, daysAgo(Math.floor(r.next() * (i % 4 === 0 ? 28 : 12)), 8 + Math.floor(r.next() * 12)));
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
  ev('u-nomsa', 'challenge', 'seed-ch-0', 20, daysAgo(10)); ev('u-nomsa', 'challenge', 'seed-ch-1', 20, daysAgo(11));

  const userBadges = [['started', 20], ['first-lesson', 14], ['founding-member', 20]].map(([slug, d], i) => ({ id: `ub-seed-${i}`, userId: 'u-nomsa', slug: slug as string, earnedAt: iso(daysAgo(d as number)) }));

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
    shares: [],
    notifications: [{ id: 'n-seed-1', userId: 'u-nomsa', kind: 'welcome', title: 'Welcome back, Nomsa', body: 'You are 60 points from Bud level. One lesson gets you most of the way.', href: '/home', at: iso(daysAgo(0)), read: false }],
    analytics: [],
  };
}

export { CHALLENGES };
