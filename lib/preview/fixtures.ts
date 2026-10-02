/* Dev-only demo data for `SISI_PREVIEW=1` (design review without a Supabase project). Never enabled in production. */
import { COURSES, MILESTONES } from '@/lib/content/courses';
import { BADGES } from '@/lib/content/badges';
import { GLOSSARY, slugify, markTerms } from '@/lib/content/glossary';
import { TRACKS } from '@/lib/content/life-tracks';
import { CIRCLES, CHAT_LINES } from '@/lib/content/seed-data';

export const ME = 'u-nomsa';
const iso = (daysAgo: number, hour = 10) => new Date(Date.now() - daysAgo * 86400_000 - (12 - hour) * 3600_000).toISOString();

const courses = COURSES.map((c, ci) => ({
  id: `c${ci}`, slug: c.slug, title: c.title, topic: c.topic, level: c.level, sort: ci, milestone_slug: c.milestone,
  lessons: c.lessons.map((l, li) => ({
    id: `l-${l.slug}`, slug: l.slug, title: l.title, sort: li, duration_sec: l.durationSec, course_id: `c${ci}`, format: 'cards', video_url: null, transcript: null,
    takeaway: l.takeaway, cards: l.cards.map((x) => ({ ...x, body: markTerms(x.body, GLOSSARY.map((g) => g.term)) })),
    actions: [{ id: `a-${l.slug}`, lesson_id: `l-${l.slug}`, title: l.action.title, description: l.action.description }],
    quiz: l.quiz.map((q, qi) => ({ id: `q-${l.slug}-${qi}`, lesson_id: `l-${l.slug}`, prompt: q.prompt, options: q.options, correct_index: q.correct, explanation: q.explanation })),
    sources: l.sources,
  })),
}));
const lessons = courses.flatMap((c) => c.lessons);

const milestones = MILESTONES.map((m, i) => ({
  id: `m${i}`, slug: m.slug, title: m.title, sort: i,
  courses: courses.filter((c) => c.milestone_slug === m.slug).map((c) => ({ slug: c.slug, title: c.title, sort: c.sort, lessons: c.lessons.map((l) => ({ id: l.id, slug: l.slug, title: l.title, sort: l.sort, actions: l.actions.map((a) => ({ id: a.id, title: a.title })) })) })),
}));

// Nomsa has finished the first course (milestone 1) and is mid-way through the second.
const done = courses[0].lessons;
const lesson_progress = [
  ...done.map((l) => ({ user_id: ME, lesson_id: l.id, status: 'passed', quiz_score: 100, completed_at: iso(3) })),
  { user_id: ME, lesson_id: courses[1].lessons[0].id, status: 'completed', quiz_score: null, completed_at: iso(1) },
];
const action_completions = done.map((l) => ({ user_id: ME, action_id: l.actions[0].id, status: 'done' }));

const point_events = [
  { source: 'onboarding', points: 10, created_at: iso(20) },
  ...[1, 2, 3, 4].flatMap((w) => [
    { source: 'lesson', points: 10, created_at: iso(w * 7 + 2) }, { source: 'action', points: 15, created_at: iso(w * 7 + 2) },
    { source: 'lesson', points: 10, created_at: iso(w * 7) }, { source: 'action', points: 15, created_at: iso(w * 7) },
    { source: 'weekly_target', points: 25, created_at: iso(w * 7 - 1) },
  ]),
  { source: 'lesson', points: 10, created_at: iso(1) }, { source: 'challenge', points: 20, created_at: iso(2) },
].map((e, i) => ({ id: `p${i}`, user_id: ME, ...e }));

const rarityOf = (r: string) => r;
const badges = BADGES.map((b, i) => ({ slug: b.slug, name: b.name, description: b.description, meaning_line: b.meaning, rarity: rarityOf(b.rarity), sort: i }));

const people = ['Thandi M', 'Lerato', 'Zanele', 'Aisha', 'Palesa', 'Naledi'];
const circle_rows = CIRCLES.filter((c) => c.community === 'wits').map((c, i) => ({
  circle_id: `circle-${i}`, community_id: 'comm-wits', name: c.name, topic: c.topic, weekday: c.weekday, start_time: `${c.start}:00`, capacity: 8, is_open: true,
  facilitator_name: people[i], members: [6, 7, 5, 4][i], is_member: c.name === 'Budget Besties',
}));

const messages = Array.from({ length: 14 }, (_, k) => ({
  id: `msg-${k}`, channel_id: 'chan-1', user_id: k % 4 === 0 ? ME : `u-${k % 5}`, body: CHAT_LINES[k * 2], reply_to: k === 6 ? 'msg-5' : null, kind: 'user', pinned: k === 3, deleted_at: null,
  created_at: new Date(Date.now() - (14 - k) * 47 * 60_000 - (k < 7 ? 86400_000 : 0)).toISOString(),
}));
messages.unshift({ id: 'msg-sys', channel_id: 'chan-1', user_id: null as unknown as string, body: 'Welcome to your Circle. Be kind, keep it private, and never share account numbers or exact amounts.', reply_to: null, kind: 'system', pinned: false, deleted_at: null, created_at: iso(3) });

export const tables: Record<string, any[]> = {
  profiles: [{ id: ME, display_name: 'Nomsa Dlamini', nickname: 'Nomsa', role: 'member', focus_mode: false, weekly_target: 2, life_track: 'student', xp: point_events.reduce((a, e) => a + e.points, 0), share_name_mode: 'first', show_on_leaderboard: true, referral_code: 'nomsa26', onboarded_at: iso(20) }],
  milestones, courses, lessons: lessons.map(({ actions, quiz, sources, ...l }) => l),
  quiz_questions: lessons.flatMap((l) => l.quiz), actions: lessons.flatMap((l) => l.actions),
  lesson_sources: lessons.flatMap((l) => l.sources.map((s) => ({ lesson_id: l.id, title: s.title, url: s.url ?? null }))),
  lesson_reviews: [], lesson_feedback: [], lesson_progress, action_completions,
  user_milestones: [{ user_id: ME, milestone_id: 'm0' }], point_events, badges,
  user_badges: ['started', 'first-lesson', 'founding-member'].map((s, i) => ({ id: `ub${i}`, user_id: ME, badge_slug: s, earned_at: iso(20 - i * 6) })),
  life_tracks: TRACKS.map((t) => ({ slug: t.slug, name: t.name, description: t.description, lesson_ids: t.lessons.map((s) => `l-${s}`) })),
  glossary_terms: GLOSSARY.map((g) => ({ slug: slugify(g.term), term: g.term, definition: g.definition, money_example: g.example })),
  glossary_lookups: [], topic_suggestions: [{ id: 't1', body: 'How does a car loan work?', votes: 7 }, { id: 't2', body: 'Stokvels vs savings accounts', votes: 4 }, { id: 't3', body: 'Doing my first tax return', votes: 3 }],
  confidence_surveys: [{ user_id: ME, kind: 'pre', answers: [2, 2, 2, 1, 3], created_at: iso(20) }, { user_id: ME, kind: 'post', answers: [3, 3, 3, 2, 4], created_at: iso(1) }],
  communities: [{ id: 'comm-wits', slug: 'wits', name: 'Wits University', description: 'Wits women building money confidence together.', kind: 'university' }, { id: 'comm-uj', slug: 'uj', name: 'University of Johannesburg', description: '', kind: 'university' }, { id: 'comm-pps', slug: 'pps-yp', name: 'PPS Young Professionals', description: '', kind: 'workplace' }],
  community_members: [{ user_id: ME, status: 'active', communities: { slug: 'wits', name: 'Wits University' } }, { user_id: ME, status: 'active', communities: { slug: 'uj', name: 'University of Johannesburg' } }],
  circle_members: [{ circle_id: 'circle-2', user_id: ME, agreed_rules_at: iso(10) }],
  challenges: [{ id: 'ch1', community_id: null, title: 'Track every rand for 3 days', description: 'Note down what you spend for three days. No judgement, just noticing.', points: 20, week_start: iso(1).slice(0, 10) }],
  challenge_completions: [], channels: [{ id: 'chan-1', circle_id: 'circle-2', kind: 'circle' }], messages, message_reactions: [{ message_id: 'msg-3', user_id: 'u-1', emoji: '💗' }, { message_id: 'msg-3', user_id: 'u-2', emoji: '💗' }, { message_id: 'msg-5', user_id: ME, emoji: '👏' }],
  circles: circle_rows.map((c) => ({ id: c.circle_id, name: c.name, facilitator_id: null })),
};

const names = ['Lerato', 'Zanele', 'Aisha', 'Palesa', 'Naledi', 'Ayanda', 'Kea', 'Lindiwe', 'Refilwe', 'Busi', 'Nomsa'];
export const rpcs: Record<string, (a: any) => any> = {
  circle_directory: (a) => circle_rows.filter((c) => !a.p_circle || c.circle_id === a.p_circle),
  circle_week_progress: () => [{ done: 4, total: 7 }],
  channel_people: () => [ME, 'u-0', 'u-1', 'u-2', 'u-3', 'u-4'].map((id, i) => ({ user_id: id, name: id === ME ? 'Nomsa' : names[i], avatar_url: null })),
  leaderboard_circles: (a) => circle_rows.map((c, i) => ({ circle_id: c.circle_id, name: c.name, members: c.members, avg_points: [212, 184.5, 167, 131][i] * (a.p_period === 'all' ? 3.2 : 1), rank: i + 1 })).sort((x, y) => x.rank - y.rank),
  leaderboard_individual: (a) => names.slice(0, 9).map((n, i) => ({ user_id: n === 'Nomsa' ? ME : `x${i}`, name: n, points: Math.round((260 - i * 23) * (a.p_period === 'all' ? 3 : 1)), rank: i + 1 })),
  public_badge: () => [{ badge_name: 'Budget Builder', meaning_line: 'Built my first budget', rarity: 'common', slug: 'budget-builder', earned_at: iso(2), who: 'Nomsa' }],
};
