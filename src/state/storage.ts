/**
 * Everything Blockbright remembers lives here, on this device only, under one versioned key.
 * Nothing is ever sent anywhere. If storage is blocked (private mode, strict settings),
 * the app keeps working with an in-memory copy for the current visit.
 */
export const STORAGE_KEY = 'blockbright.v1';

export type ExplainLevel = 'simple' | 'detailed';
export type Confidence = 'unsure' | 'fairly' | 'certain';

export interface LessonProgress {
  completed: boolean;
  /** Correct answers in the lesson quiz, from the latest attempt. */
  score: number;
  total: number;
  /** Answers given as "certain" or "fairly sure" that were wrong. */
  sureButWrong: number;
  completedAt?: string;
}

/** Spaced review: one entry per quiz question, keyed "lessonId:questionId". */
export interface ReviewItem {
  /** When the question is due again (ms since epoch). */
  due: number;
  /** Days until the next review after a correct answer. */
  interval: number;
}

export interface StoredState {
  version: 1;
  language?: string;
  explainLevel: ExplainLevel;
  lessons: Record<string, LessonProgress>;
  review?: Record<string, ReviewItem>;
  /** Best score in the final test, if taken. */
  finalTest?: { score: number; total: number; completedAt: string };
}

export const EMPTY_STATE: StoredState = { version: 1, explainLevel: 'simple', lessons: {}, review: {} };

const DAY = 24 * 60 * 60 * 1000;
const FIRST_INTERVAL = 3;
const MAX_INTERVAL = 60;

export function reviewKey(lessonId: string, questionId: string): string {
  return `${lessonId}:${questionId}`;
}

/**
 * Updates the review queue after answers. A wrong answer is due again right away
 * and starts over; a right one waits 3 days, then twice as long each time.
 */
export function updateReview(
  review: Record<string, ReviewItem> | undefined,
  answers: { lessonId: string; questionId: string; correct: boolean }[],
  now: number,
): Record<string, ReviewItem> {
  const next = { ...(review ?? {}) };
  for (const a of answers) {
    const key = reviewKey(a.lessonId, a.questionId);
    const prev = next[key];
    if (!a.correct) {
      next[key] = { due: now, interval: FIRST_INTERVAL };
    } else {
      const interval = prev ? Math.min(prev.interval * 2, MAX_INTERVAL) : FIRST_INTERVAL;
      next[key] = { due: now + (prev ? prev.interval : FIRST_INTERVAL) * DAY, interval };
    }
  }
  return next;
}

/** Keys of review items that are due, oldest first. */
export function dueReviews(review: Record<string, ReviewItem> | undefined, now: number, limit = 3): string[] {
  return Object.entries(review ?? {})
    .filter(([, item]) => item.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .slice(0, limit)
    .map(([key]) => key);
}

let memoryCopy: StoredState = structuredClone(EMPTY_STATE);

function getStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

function isStoredState(value: unknown): value is StoredState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<StoredState>;
  return v.version === 1 && typeof v.lessons === 'object' && v.lessons !== null;
}

export function loadState(): StoredState {
  const storage = getStorage();
  if (!storage) return memoryCopy;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return memoryCopy;
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredState(parsed)) return memoryCopy;
    memoryCopy = { ...EMPTY_STATE, ...parsed };
    return memoryCopy;
  } catch {
    return memoryCopy;
  }
}

export function saveState(state: StoredState): void {
  memoryCopy = state;
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: keep the in-memory copy only.
  }
}

export function clearState(): StoredState {
  memoryCopy = structuredClone(EMPTY_STATE);
  const storage = getStorage();
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return memoryCopy;
}
