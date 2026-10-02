/* Idempotent seed: `pnpm seed`. Needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (in .env.local or the environment). */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { COURSES, MILESTONES } from '../lib/content/courses';
import { BADGES } from '../lib/content/badges';
import { GLOSSARY, markTerms, slugify } from '../lib/content/glossary';
import { TRACKS } from '../lib/content/life-tracks';
import { CHALLENGES, CHAT_LINES, CIRCLES, COMMUNITIES, MEMBER_NAMES, REWARDS, SAFETY } from '../lib/content/seed-data';

config({ path: '.env.local' });
config();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
const db = createClient(url, key, { auth: { persistSession: false } });
const PASSWORD = 'SisiDemo2026!';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ok = (r: { data: any; error: any }, what: string): any => { if (r.error) throw new Error(`${what}: ${r.error.message}`); return r.data ?? []; };

let seed = 42;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];
const daysAgo = (d: number, h = 12) => new Date(Date.now() - d * 86400_000 - (12 - h) * 3600_000).toISOString();

const DEMO = [
  { email: 'nomsa@demo.sisi.app', name: 'Nomsa Dlamini', nick: 'Nomsa', role: 'member' },
  { email: 'new@demo.sisi.app', name: '', nick: '', role: 'member' },
  { email: 'thandi@demo.sisi.app', name: 'Thandi Mokoena', nick: 'Thandi', role: 'facilitator' },
  { email: 'admin@demo.sisi.app', name: 'Sisi Admin', nick: 'Admin', role: 'pps_admin' },
];

async function ensureUser(email: string, name: string, existing: Map<string, string>) {
  if (existing.has(email)) return existing.get(email)!;
  const r = await db.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true, user_metadata: { display_name: name } });
  if (r.error) throw new Error(`createUser ${email}: ${r.error.message}`);
  return r.data.user.id;
}

async function content() {
  ok(await db.from('badges').upsert(BADGES.map((b, i) => ({ slug: b.slug, name: b.name, description: b.description, meaning_line: b.meaning, rarity: b.rarity, sort: i })), { onConflict: 'slug' }), 'badges');
  const [pathway] = ok(await db.from('pathways').upsert({ slug: 'milestones', name: 'Money Milestones' }, { onConflict: 'slug' }).select('id'), 'pathway');
  const ms = ok(await db.from('milestones').upsert(MILESTONES.map((m, i) => ({ pathway_id: pathway.id, slug: m.slug, title: m.title, sort: i, badge_slug: m.badge })), { onConflict: 'slug' }).select('id,slug'), 'milestones');
  const msId = new Map(ms.map((m: any) => [m.slug, m.id]));
  for (const [ci, c] of COURSES.entries()) {
    const [course] = ok(await db.from('courses').upsert({ slug: c.slug, title: c.title, topic: c.topic, level: c.level, sort: ci, milestone_id: c.milestone ? msId.get(c.milestone) : null }, { onConflict: 'slug' }).select('id'), 'course');
    for (const [li, l] of c.lessons.entries()) {
      const terms = GLOSSARY.map((g) => g.term);
      const cards = l.cards.map((c) => ({ ...c, body: markTerms(c.body, terms) }));
      const [lesson] = ok(await db.from('lessons').upsert({ course_id: course.id, slug: l.slug, title: l.title, format: 'cards', cards, takeaway: l.takeaway, duration_sec: l.durationSec, sort: li }, { onConflict: 'course_id,slug' }).select('id'), 'lesson');
      ok(await db.from('lesson_sources').delete().eq('lesson_id', lesson.id), 'sources reset');
      if (l.sources.length) ok(await db.from('lesson_sources').insert(l.sources.map((x) => ({ lesson_id: lesson.id, title: x.title, url: x.url ?? null }))), 'sources');
      const have = ok(await db.from('quiz_questions').select('id,prompt').eq('lesson_id', lesson.id), 'quiz read');
      for (const q of l.quiz) {
        const row = { lesson_id: lesson.id, prompt: q.prompt, options: q.options, correct_index: q.correct, explanation: q.explanation };
        const prev = have.find((h: any) => h.prompt === q.prompt);
        ok(prev ? await db.from('quiz_questions').update(row).eq('id', prev.id) : await db.from('quiz_questions').insert(row), 'quiz');
      }
      const act = ok(await db.from('actions').select('id').eq('lesson_id', lesson.id).eq('title', l.action.title), 'action read');
      if (!act.length) ok(await db.from('actions').insert({ lesson_id: lesson.id, title: l.action.title, description: l.action.description }), 'action');
    }
  }
  ok(await db.from('rewards').upsert(REWARDS, { onConflict: 'slug' }), 'rewards');
  for (const s of SAFETY) {
    const prev = ok(await db.from('safety_resources').select('id').eq('name', s.name), 'safety read');
    if (!prev.length) ok(await db.from('safety_resources').insert({ ...s, verified: false }), 'safety'); // every number must be verified by the team
  }
  ok(await db.from('glossary_terms').upsert(GLOSSARY.map((g) => ({ slug: slugify(g.term), term: g.term, definition: g.definition, money_example: g.example })), { onConflict: 'slug' }), 'glossary');
  const lessonRows = ok(await db.from('lessons').select('id,slug'), 'lessons');
  const lid = new Map(lessonRows.map((l: any) => [l.slug, l.id]));
  ok(await db.from('life_tracks').upsert(TRACKS.map((t) => ({ slug: t.slug, name: t.name, description: t.description, first_pathway: t.firstPathway, lesson_ids: t.lessons.map((x) => lid.get(x)).filter(Boolean) })), { onConflict: 'slug' }), 'life tracks');
  console.log('content ✓');
}

async function people() {
  const existing = new Map<string, string>();
  for (let page = 1; ; page++) {
    const { data } = await db.auth.admin.listUsers({ page, perPage: 200 });
    data.users.forEach((u) => u.email && existing.set(u.email, u.id));
    if (data.users.length < 200) break;
  }
  const demoIds: Record<string, string> = {};
  for (const d of DEMO) demoIds[d.email] = await ensureUser(d.email, d.name, existing);
  const members: { id: string; name: string }[] = [];
  for (const [i, name] of MEMBER_NAMES.slice(0, 25).entries()) {
    if (name.startsWith('Nomsa') || name.startsWith('Thandi')) continue;
    const email = `${name.split(' ')[0].toLowerCase()}.${i}@seed.sisi.app`;
    members.push({ id: await ensureUser(email, name, existing), name });
  }

  // profiles
  const consent = new Date().toISOString();
  for (const d of DEMO) {
    const isNew = d.email.startsWith('new@');
    ok(await db.from('profiles').update({ display_name: d.name, nickname: d.nick || null, role: d.role, onboarded_at: isNew ? null : daysAgo(20), consented_at: isNew ? null : consent, show_on_leaderboard: d.email.startsWith('nomsa'), goals: isNew ? [] : ['first-budget'], life_track: isNew ? null : 'student', weekly_target: 2, focus_mode: false, xp: 0 }).eq('id', demoIds[d.email]), 'demo profile');
  }
  for (const [i, m] of members.entries()) {
    ok(await db.from('profiles').update({ display_name: m.name, nickname: i % 3 === 0 ? m.name.split(' ')[0] + ['✨', '💗', ''][i % 3] : null, onboarded_at: daysAgo(25), consented_at: consent, show_on_leaderboard: i % 5 < 2 /* ~40% opted in */, life_track: pick(['student', 'first-payslip', 'rent-independence', 'invest-small']), weekly_target: 1 + (i % 3) }).eq('id', m.id), 'profile');
  }

  // reset demo users' own progress so demos can be re-run
  for (const email of ['nomsa@demo.sisi.app', 'new@demo.sisi.app']) {
    const id = demoIds[email];
    for (const t of ['lesson_progress', 'action_completions', 'user_milestones', 'point_events', 'user_badges', 'confidence_surveys', 'invest_checklist', 'invest_sim_runs', 'challenge_completions']) await db.from(t).delete().eq('user_id', id);
  }
  ok(await db.from('community_members').delete().eq('user_id', demoIds['new@demo.sisi.app']), 'reset new');
  ok(await db.from('circle_members').delete().eq('user_id', demoIds['new@demo.sisi.app']), 'reset new');

  // communities + circles
  const comm = ok(await db.from('communities').upsert(COMMUNITIES.map((c) => ({ ...c })), { onConflict: 'slug' }).select('id,slug'), 'communities');
  const cid = new Map(comm.map((c: any) => [c.slug, c.id]));
  const circleIds: { id: string; community: string; members: string[] }[] = [];
  const winX = [[0, 6], [6, 12], [12, 18], [18, 24], [3, 8], [15, 20], [9, 14]];
  const thandi = demoIds['thandi@demo.sisi.app'];
  for (const [i, c] of CIRCLES.entries()) {
    const [a, b] = winX[i];
    const crew = members.slice(a, b);
    const facilitator = c.name === 'Budget Besties' ? thandi : crew[0].id;
    const prev = ok(await db.from('circles').select('id').eq('community_id', cid.get(c.community)!).eq('name', c.name), 'circle read');
    const row = { community_id: cid.get(c.community)!, name: c.name, topic: c.topic, weekday: c.weekday, start_time: c.start, facilitator_id: facilitator, capacity: 8, is_open: true };
    const id = prev.length ? (ok(await db.from('circles').update(row).eq('id', prev[0].id).select('id'), 'circle')[0].id) : ok(await db.from('circles').insert(row).select('id'), 'circle')[0].id;
    let ids = crew.map((m) => m.id);
    if (c.name === 'Budget Besties') ids = [...ids, demoIds['nomsa@demo.sisi.app'], thandi];
    if (c.name !== 'Budget Besties') ids = [...ids, ...(i === 0 ? [thandi] : [])];
    ids = [...new Set(ids)];
    circleIds.push({ id, community: c.community, members: ids });
    if (crew[0] && facilitator === crew[0].id) ok(await db.from('profiles').update({ role: 'facilitator' }).eq('id', crew[0].id), 'facilitator role');
    ok(await db.from('circle_members').upsert(ids.map((u) => ({ circle_id: id, user_id: u, agreed_rules_at: consent })), { onConflict: 'circle_id,user_id' }), 'circle_members');
    const cm = ids.map((u) => ({ community_id: cid.get(c.community)!, user_id: u, role: u === facilitator ? 'facilitator' : 'member', status: 'active' }));
    ok(await db.from('community_members').upsert(cm, { onConflict: 'community_id,user_id', ignoreDuplicates: true }), 'community_members');
  }
  ok(await db.from('community_members').upsert({ community_id: cid.get('wits')!, user_id: demoIds['admin@demo.sisi.app'], role: 'admin', status: 'active' }, { onConflict: 'community_id,user_id' }), 'admin member');

  // challenges for this week and last
  for (const [i, ch] of CHALLENGES.entries()) {
    const week = new Date(Date.now() - i * 7 * 86400_000).toISOString().slice(0, 10);
    const prev = ok(await db.from('challenges').select('id').eq('title', ch.title), 'ch read');
    if (!prev.length) ok(await db.from('challenges').insert({ ...ch, week_start: week, community_id: null }), 'challenge');
  }

  // Campus Cup: first season, all three communities entered
  const prevSeason = ok(await db.from('campus_cup_seasons').select('id').eq('name', 'Spring Season 2026'), 'season read');
  const season = prevSeason[0] ?? ok(await db.from('campus_cup_seasons').insert({ name: 'Spring Season 2026', starts_on: '2026-10-05', ends_on: '2026-11-01', prize_text: 'Bragging rights and a Campus Cup Champion badge for every member of the winning community.' }).select('id'), 'season')[0];
  ok(await db.from('campus_cup_entries').upsert(['wits', 'uj', 'pps-yp'].map((slug) => ({ season_id: season.id, community_id: cid.get(slug)! })), { onConflict: 'season_id,community_id' }), 'cup entries');

  // points over the last 4 weeks so leaderboards look alive
  const allIds = members.map((m) => m.id);
  let n = 0;
  for (const [i, id] of allIds.entries()) {
    const activity = 4 + Math.floor(rnd() * 30);
    const rows = Array.from({ length: activity }, () => {
      const src = pick(['lesson', 'lesson', 'quiz', 'action', 'weekly_target']) as 'lesson';
      const pts = { lesson: 10, quiz: 5, action: 15, weekly_target: 25 }[src];
      return { user_id: id, community_id: null, source: src, source_id: `seed-${i}-${n++}`, points: pts, created_at: daysAgo(Math.floor(rnd() * (i % 4 === 0 ? 28 : 12)), 8 + Math.floor(rnd() * 12)) };
    });
    ok(await db.from('point_events').upsert(rows, { onConflict: 'user_id,source,source_id', ignoreDuplicates: true }), 'points');
  }

  // Nomsa: mid-journey (first milestone done, 3 badges, a streak)
  const nomsa = demoIds['nomsa@demo.sisi.app'];
  const course1 = ok(await db.from('courses').select('id,lessons(id,actions(id))').eq('slug', COURSES[0].slug), 'nomsa course')[0] as any;
  const when = daysAgo(3);
  for (const l of course1.lessons) {
    ok(await db.from('lesson_progress').upsert({ user_id: nomsa, lesson_id: l.id, status: 'passed', quiz_score: 100, completed_at: when }), 'np');
    for (const a of l.actions) ok(await db.from('action_completions').upsert({ user_id: nomsa, action_id: a.id, status: 'done', completed_at: when }), 'na');
    for (const [src, pts] of [['lesson', 10], ['quiz', 5], ['action', 15]] as const) ok(await db.from('point_events').upsert({ user_id: nomsa, source: src, source_id: l.id, points: pts, created_at: when }, { onConflict: 'user_id,source,source_id' }), 'npts');
  }
  const m1 = ok(await db.from('milestones').select('id').eq('slug', 'cash-flow-check'), 'm1')[0];
  ok(await db.from('user_milestones').upsert({ user_id: nomsa, milestone_id: m1.id }), 'nm');
  // 4-week weekly-target streak (target 2): two active days in each of the last four weeks, plus the +25 bonus each week
  for (let w = 1; w <= 4; w++) {
    const wk = `seed-week-${w}`;
    const dow = (new Date().getUTCDay() + 6) % 7; // 0 = Monday
    for (const day of [1, 3]) { // Tuesday and Thursday of that ISO week
      const when2 = daysAgo(dow + w * 7 - day, 10);
      for (const [src, pts] of [['lesson', 10], ['action', 15]] as const) ok(await db.from('point_events').upsert({ user_id: nomsa, source: src, source_id: `${wk}-${day}-${src}`, points: pts, created_at: when2 }, { onConflict: 'user_id,source,source_id' }), 'nweek');
    }
    ok(await db.from('point_events').upsert({ user_id: nomsa, source: 'weekly_target', source_id: wk, points: 25, created_at: daysAgo(dow + w * 7 - 3) }, { onConflict: 'user_id,source,source_id' }), 'ntarget');
  }
  for (const [i, pts] of [[0, 20], [1, 20]] as const) ok(await db.from('point_events').upsert({ user_id: nomsa, source: 'challenge', source_id: `seed-ch-${i}`, points: pts, created_at: daysAgo(10 + i) }, { onConflict: 'user_id,source,source_id' }), 'nch');
  for (const slug of ['started', 'first-lesson', 'founding-member']) ok(await db.from('user_badges').upsert({ user_id: nomsa, badge_slug: slug }, { onConflict: 'user_id,badge_slug', ignoreDuplicates: true }), 'nb');
  ok(await db.from('point_events').upsert({ user_id: nomsa, source: 'onboarding', source_id: 'onboarding', points: 10, created_at: daysAgo(20) }, { onConflict: 'user_id,source,source_id' }), 'nob');

  // chat: 30–60 messages per Circle, only when the channel is empty
  for (const c of circleIds) {
    let ch = ok(await db.from('channels').select('id').eq('circle_id', c.id).eq('kind', 'circle'), 'chan read')[0];
    if (!ch) ch = ok(await db.from('channels').insert({ kind: 'circle', circle_id: c.id }).select('id'), 'channel')[0];
    const { count } = await db.from('messages').select('*', { count: 'exact', head: true }).eq('channel_id', ch.id);
    if (count) continue;
    const total = 30 + Math.floor(rnd() * 31);
    const authors = c.members.filter((m) => m !== demoIds['new@demo.sisi.app']);
    const rows = Array.from({ length: total }, (_, k) => ({
      channel_id: ch.id, user_id: pick(authors), body: CHAT_LINES[(k * 7 + Math.floor(rnd() * 5)) % CHAT_LINES.length], kind: 'user',
      created_at: new Date(Date.now() - (total - k) * 95 * 60_000).toISOString(),
    }));
    ok(await db.from('messages').insert(rows), 'messages');
    ok(await db.from('messages').insert({ channel_id: ch.id, user_id: null, kind: 'system', body: 'Welcome to your Circle. Be kind, keep it private, and never share account numbers or exact amounts.', pinned: true, created_at: new Date(Date.now() - (total + 2) * 95 * 60_000).toISOString() }), 'welcome');
  }
  console.log('people, circles, points, chat ✓');
}

(async () => {
  await content();
  await people();
  console.log('Seed complete. Demo logins: nomsa@/new@/thandi@/admin@demo.sisi.app  password:', PASSWORD);
})().catch((e) => { console.error(e); process.exit(1); });
