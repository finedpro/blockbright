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

export interface StoredState {
  version: 1;
  language?: string;
  explainLevel: ExplainLevel;
  lessons: Record<string, LessonProgress>;
}

export const EMPTY_STATE: StoredState = { version: 1, explainLevel: 'simple', lessons: {} };

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
