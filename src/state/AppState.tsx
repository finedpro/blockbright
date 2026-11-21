import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  clearState,
  loadState,
  saveState,
  type ExplainLevel,
  type LessonProgress,
  type StoredState,
  updateReview,
} from './storage';
import * as W from './wallet';

function withWallet(s: StoredState): StoredState {
  return s.wallet ? s : { ...s, wallet: W.createWallet(Date.now()) };
}

interface AppStateValue {
  state: StoredState;
  setLanguage(code: string): void;
  setExplainLevel(level: ExplainLevel): void;
  recordLesson(id: string, progress: LessonProgress): void;
  recordAnswers(answers: { lessonId: string; questionId: string; correct: boolean }[]): void;
  recordFinalTest(score: number, total: number): void;
  resetProgress(): void;
  wallet: W.Wallet;
  /** Applies a lesson loss and returns its transaction id (for rewind). */
  loseCoins(coins: number | 'all', note: string): string;
  undoLesson(txId: string): void;
  sendCoins(to: string, amount: number): void;
  receiveCoins(from: W.Contact, amount: number): void;
  resetWallet(): void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredState>(() => {
    const loaded = loadState();
    const ready = withWallet(loaded);
    if (ready !== loaded) saveState(ready);
    return ready;
  });

  const update = useCallback((fn: (s: StoredState) => StoredState) => {
    setState((prev) => {
      const next = withWallet(fn(prev));
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
      recordAnswers: (answers) => update((s) => ({ ...s, review: updateReview(s.review, answers, Date.now()) })),
      recordFinalTest: (score, total) =>
        update((s) => ({
          ...s,
          finalTest: !s.finalTest || score >= s.finalTest.score ? { score, total, completedAt: new Date().toISOString() } : s.finalTest,
        })),
      wallet: state.wallet ?? W.createWallet(0),
      loseCoins: (coins, note) => {
        const id = W.newId();
        update((s) => ({ ...s, wallet: W.lessonLoss(s.wallet!, coins, note, Date.now(), id).wallet }));
        return id;
      },
      undoLesson: (txId) => update((s) => ({ ...s, wallet: W.undoTx(s.wallet!, txId) })),
      sendCoins: (to, amount) => update((s) => ({ ...s, wallet: W.send(s.wallet!, to, amount, Date.now()) })),
      receiveCoins: (from, amount) => update((s) => ({ ...s, wallet: W.receive(s.wallet!, from, amount, Date.now()) })),
      resetWallet: () => update((s) => ({ ...s, wallet: W.resetWallet(s.wallet!, Date.now()) })),
      resetProgress: () => {
        const keepLanguage = state.language;
        const fresh = clearState();
        const next = withWallet({ ...fresh, language: keepLanguage });
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
