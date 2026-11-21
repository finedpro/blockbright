import { lessonSchema, type Lesson } from './schema';
import blockchain1 from './lessons/blockchain-1.json';
import money1 from './lessons/money-1.json';
import risk1 from './lessons/risk-1.json';
import rules1 from './lessons/rules-1.json';
import scams1 from './lessons/scams-1.json';
import sendDemo from './lessons/send-demo.json';
import wallets1 from './lessons/wallets-1.json';

/** All lessons, validated against the schema when the app starts (and by `npm run check`). */
export const LESSONS: Lesson[] = [money1, blockchain1, wallets1, sendDemo, scams1, risk1, rules1].map((l) => lessonSchema.parse(l));

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
