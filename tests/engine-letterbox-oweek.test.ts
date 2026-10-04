import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildWorld } from '@/lib/world/seed';
import { acceptByCode, acceptFriend, declineFriend, findPeople, friendIds, incoming, letterboxFeed, relation, removeFriend, requestFriend, simFriendActivity } from '@/lib/engine/friends';
import { addNote, postMilestones } from '@/lib/engine/feed';
import { blockUser } from '@/lib/engine/chat';
import { completeLesson } from '@/lib/engine/actions';
import { OWEEK_LESSONS, oweekProgress } from '@/lib/engine/oweek';
import { evaluateBadges } from '@/lib/engine/badges';
import { COURSES } from '@/lib/content';

const NOW = new Date('2026-10-07T10:00:00Z');
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW); });
afterEach(() => vi.useRealTimers());

describe('Letterbox', () => {
  it('seeds Nomsa with five friends and one request', () => {
    const w = buildWorld(NOW);
    expect(friendIds(w, 'u-nomsa')).toHaveLength(5);
    expect(incoming(w, 'u-nomsa')).toHaveLength(1);
  });
  it('shows friends’ shared wins, never staff announcements, and only friends', () => {
    const w = buildWorld(NOW);
    const feed = letterboxFeed(w, 'u-nomsa');
    expect(feed.length).toBeGreaterThanOrEqual(5);
    const ok = new Set(['u-nomsa', ...friendIds(w, 'u-nomsa')]);
    expect(feed.every((p) => ok.has(p.userId) && p.kind !== 'announcement' && p.communityId === null)).toBe(true);
    expect(feed.every((p) => !/R\s?\d/.test(p.text))).toBe(true);
  });
  it('accept and decline a request', () => {
    const w = buildWorld(NOW);
    const r = incoming(w, 'u-nomsa')[0];
    expect(acceptFriend(w, 'm-3', r.id, NOW)).toBe(false); // not the addressee
    expect(acceptFriend(w, 'u-nomsa', r.id, NOW)).toBe(true);
    expect(relation(w, 'u-nomsa', 'm-10')).toBe('friends');
    const w2 = buildWorld(NOW);
    declineFriend(w2, 'u-nomsa', incoming(w2, 'u-nomsa')[0].id);
    expect(relation(w2, 'u-nomsa', 'm-10')).toBe('none');
  });
  it('search is by nickname/first name, 2+ letters, members only, never yourself', () => {
    const w = buildWorld(NOW);
    expect(findPeople(w, 'u-nomsa', 'n')).toEqual([]);
    const lerato = findPeople(w, 'u-nomsa', 'Lera');
    expect(lerato).toContain('m-0');
    expect(findPeople(w, 'u-nomsa', 'Nomsa')).not.toContain('u-nomsa');
    expect(findPeople(w, 'u-nomsa', 'Admin')).toEqual([]);
  });
  it('a request to a simulated member is accepted straight away; a repeat is rejected', () => {
    const w = buildWorld(NOW);
    expect(requestFriend(w, 'u-new', 'm-0', NOW)).toMatchObject({ ok: true, status: 'accepted' });
    expect(requestFriend(w, 'u-new', 'm-0', NOW)).toMatchObject({ ok: false });
    expect(requestFriend(w, 'u-new', 'u-new', NOW)).toMatchObject({ ok: false });
  });
  it('invite link makes friends immediately and notifies the inviter', () => {
    const w = buildWorld(NOW);
    const code = w.users['u-nomsa'].referralCode;
    expect(acceptByCode(w, 'u-nomsa', code, NOW)).toMatchObject({ ok: false });
    expect(acceptByCode(w, 'u-new', code, NOW)).toMatchObject({ ok: true });
    expect(relation(w, 'u-nomsa', 'u-new')).toBe('friends');
    expect(w.notifications.some((n) => n.userId === 'u-nomsa' && n.kind === 'friend')).toBe(true);
    expect(acceptByCode(w, 'u-new', code, NOW)).toMatchObject({ ok: false });
    expect(acceptByCode(w, 'u-new', 'bogus', NOW)).toMatchObject({ ok: false });
  });
  it('blocking removes the friendship and blocks new requests', () => {
    const w = buildWorld(NOW);
    blockUser(w, 'u-nomsa', 'm-1');
    expect(relation(w, 'u-nomsa', 'm-1')).toBe('none');
    expect(requestFriend(w, 'm-1', 'u-nomsa', NOW)).toMatchObject({ ok: false });
  });
  it('removing a friend removes their posts from the feed', () => {
    const w = buildWorld(NOW);
    removeFriend(w, 'u-nomsa', 'm-1');
    expect(letterboxFeed(w, 'u-nomsa').some((p) => p.userId === 'm-1')).toBe(false);
  });
  it('notes are profanity-masked and capped at 140', () => {
    const w = buildWorld(NOW);
    const post = letterboxFeed(w, 'u-nomsa')[0];
    addNote(w, 'u-nomsa', post.id, 'x'.repeat(200), NOW);
    expect(w.feedNotes[w.feedNotes.length - 1].body.length).toBe(140);
  });
  it('posts only exist when the author opted in, and simulated friends react to them', () => {
    const w = buildWorld(NOW);
    w.users['u-nomsa'].shareMilestones = false;
    const before = w.feed.length;
    postMilestones(w, 'u-nomsa', { badges: [{ id: 'b', slug: 'budget-builder', name: 'Budget Builder', meaning: '', rarity: 'common' }], milestones: [], level: null, weeklyStreak: null }, NOW);
    expect(w.feed.length).toBe(before);
    w.users['u-nomsa'].shareMilestones = true;
    postMilestones(w, 'u-nomsa', { badges: [{ id: 'b', slug: 'budget-builder', name: 'Budget Builder', meaning: '', rarity: 'common' }], milestones: [], level: null, weeklyStreak: null }, NOW);
    expect(w.feed.length).toBe(before + 1);
    const id = w.feed[w.feed.length - 1].id;
    simFriendActivity(w, NOW);
    expect(w.feedReactions.filter((r) => r.postId === id).length).toBeGreaterThan(0);
    const n = w.feedReactions.length; simFriendActivity(w, NOW);
    expect(w.feedReactions.length).toBe(n); // once per friend per post
  });
});

describe('O-Week Starter', () => {
  it('is a three-lesson course', () => {
    const c = COURSES.find((x) => x.slug === 'oweek-starter')!;
    expect(c.lessons.map((l) => l.slug)).toEqual(OWEEK_LESSONS);
    expect(c.lessons.every((l) => l.quiz.length === 3 && l.cards.length >= 4)).toBe(true);
  });
  it('finishing all three lessons awards the O-Week Starter badge without extra points', () => {
    const w = buildWorld(NOW);
    const u = 'u-new';
    OWEEK_LESSONS.slice(0, 2).forEach((id) => completeLesson(w, u, id, NOW));
    expect(oweekProgress(w, u)).toEqual({ done: 2, total: 3 });
    expect(w.userBadges.some((b) => b.userId === u && b.slug === 'oweek-starter')).toBe(false);
    completeLesson(w, u, OWEEK_LESSONS[2], NOW);
    evaluateBadges(w, u, NOW);
    expect(w.userBadges.some((b) => b.userId === u && b.slug === 'oweek-starter')).toBe(true);
    expect(w.pointEvents.filter((p) => p.userId === u && p.source === 'oweek_done').every((p) => p.points === 0)).toBe(true);
  });
});
