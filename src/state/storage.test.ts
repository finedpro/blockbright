import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_STATE, STORAGE_KEY, clearState, loadState, saveState } from './storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
    clearState();
  });

  it('returns an empty state when nothing is stored', () => {
    expect(loadState()).toEqual(EMPTY_STATE);
  });

  it('saves and loads under one versioned key', () => {
    saveState({ ...EMPTY_STATE, language: 'et', lessons: { x: { completed: true, score: 2, total: 2, sureButWrong: 0 } } });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).language).toBe('et');
    expect(loadState().lessons.x.score).toBe(2);
  });

  it('ignores corrupted or foreign data', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadState()).toEqual(EMPTY_STATE);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99 }));
    expect(loadState()).toEqual(EMPTY_STATE);
  });

  it('keeps working when storage throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    saveState({ ...EMPTY_STATE, explainLevel: 'detailed' });
    expect(loadState().explainLevel).toBe('detailed');
    spy.mockRestore();
  });

  it('clears everything on reset', () => {
    saveState({ ...EMPTY_STATE, explainLevel: 'detailed' });
    clearState();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
