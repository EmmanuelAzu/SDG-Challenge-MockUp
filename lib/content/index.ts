import { COURSES, MILESTONES } from './courses';
import { BADGES } from './badges';
import { GLOSSARY, markTerms, slugify } from './glossary';
import { TRACKS } from './life-tracks';
import type { Card, Question } from './types';

export type Lesson = {
  /** Unique across the whole catalogue (the lesson slug). */
  id: string;
  slug: string;
  courseSlug: string;
  courseTitle: string;
  topic: string;
  milestone: string | null;
  title: string;
  takeaway: string;
  durationSec: number;
  cards: Card[];
  quiz: Question[];
  action: { id: string; title: string; description: string };
  sources: { title: string; url?: string }[];
  /** A real review only; never invented. */
  review: { by: string; on: string } | null;
  format: 'cards' | 'video' | 'reel';
  videoUrl?: string;
};

const terms = GLOSSARY.map((g) => g.term);

export const LESSONS: Lesson[] = COURSES.flatMap((c) =>
  c.lessons.map((l) => ({
    id: l.slug, slug: l.slug, courseSlug: c.slug, courseTitle: c.title, topic: c.topic, milestone: c.milestone,
    title: l.title, takeaway: l.takeaway, durationSec: l.durationSec,
    cards: l.cards.map((x) => ({ ...x, body: markTerms(x.body, terms) })),
    quiz: l.quiz, action: { id: `${l.slug}:action`, ...l.action }, sources: l.sources, review: null, format: 'cards' as const,
  })),
);

export const lessonById = (id: string) => LESSONS.find((l) => l.id === id);
export const courseLessons = (courseSlug: string) => LESSONS.filter((l) => l.courseSlug === courseSlug);
export const lessonsForMilestone = (slug: string) => LESSONS.filter((l) => l.milestone === slug);
export { COURSES, MILESTONES, BADGES, GLOSSARY, TRACKS, slugify };
export const badgeBySlug = (slug: string) => BADGES.find((b) => b.slug === slug);
export const glossaryBySlug = (slug: string) => GLOSSARY.find((g) => slugify(g.term) === slug);

/** Topics in demand order (from the survey). */
export const TOPICS = ['Building wealth', 'Investing', 'Tax', 'Insurance', 'Credit & debt', 'Saving', 'Retirement', 'Budgeting', 'Bank fees & adult accounts', 'Family & black tax', 'Spot the scam'] as const;
