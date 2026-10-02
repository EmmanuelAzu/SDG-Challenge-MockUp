export type Card = { title: string; body: string; callout?: string };
export type Question = { prompt: string; options: string[]; correct: number; explanation: string };
export type LessonContent = {
  slug: string; title: string; takeaway: string; durationSec: number;
  cards: Card[]; quiz: Question[]; action: { title: string; description: string }; sources: { title: string; url?: string }[];
};
export type CourseContent = { slug: string; title: string; topic: string; level: string; milestone: string | null; lessons: LessonContent[] };

export type RawLesson = Omit<LessonContent, 'sources'>;
export type RawCourse = Omit<CourseContent, 'lessons'> & { lessons: RawLesson[] };
