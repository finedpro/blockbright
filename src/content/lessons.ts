import { lessonSchema, type Lesson } from './schema';
import sendDemo from './lessons/send-demo.json';

/** All lessons, validated against the schema when the app starts (and by `npm run check`). */
export const LESSONS: Lesson[] = [lessonSchema.parse(sendDemo)];

export const MODULES = [1, 2, 3, 4, 5, 6, 7] as const;

export function lessonNamespace(id: string): string {
  return `lesson-${id}`;
}

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function lessonsInModule(module: number): Lesson[] {
  return LESSONS.filter((l) => l.module === module);
}
