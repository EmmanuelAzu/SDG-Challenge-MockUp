'use client';
import { notFound, useParams } from 'next/navigation';
import { LessonPlayer } from '@/components/lesson-player';
import { lessonById } from '@/lib/content';

export default function LessonPage() {
  const { course, lesson } = useParams<{ course: string; lesson: string }>();
  const l = lessonById(lesson);
  if (!l || l.courseSlug !== course) notFound();
  return <LessonPlayer key={l.id} lessonId={l.id} />;
}
