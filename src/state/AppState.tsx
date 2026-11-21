import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  clearState,
  loadState,
  saveState,
  type ExplainLevel,
  type LessonProgress,
  type StoredState,
} from './storage';

interface AppStateValue {
  state: StoredState;
  setLanguage(code: string): void;
  setExplainLevel(level: ExplainLevel): void;
  recordLesson(id: string, progress: LessonProgress): void;
  resetProgress(): void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredState>(() => loadState());

  const update = useCallback((fn: (s: StoredState) => StoredState) => {
    setState((prev) => {
      const next = fn(prev);
      saveState(next);
      return next;
    });
  }, []);

  const value = useMemo<AppStateValue>(
    () => ({
      state,
      setLanguage: (code) => update((s) => ({ ...s, language: code })),
      setExplainLevel: (level) => update((s) => ({ ...s, explainLevel: level })),
      recordLesson: (id, progress) => update((s) => ({ ...s, lessons: { ...s.lessons, [id]: progress } })),
      resetProgress: () => {
        const keepLanguage = state.language;
        const fresh = clearState();
        const next = { ...fresh, language: keepLanguage };
        saveState(next);
        setState(next);
      },
    }),
    [state, update],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}
