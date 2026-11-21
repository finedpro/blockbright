import { describe, expect, it } from 'vitest';
import { dueReviews, updateReview } from './storage';

const DAY = 24 * 60 * 60 * 1000;

describe('spaced review', () => {
  it('makes a wrong answer due now and a right one due in 3 days', () => {
    const r = updateReview({}, [
      { lessonId: 'a', questionId: 'q1', correct: false },
      { lessonId: 'a', questionId: 'q2', correct: true },
    ], 1000);
    expect(r['a:q1'].due).toBe(1000);
    expect(r['a:q2'].due).toBe(1000 + 3 * DAY);
    expect(dueReviews(r, 1000)).toEqual(['a:q1']);
  });

  it('doubles the wait after each right answer and resets after a wrong one', () => {
    let r = updateReview({}, [{ lessonId: 'a', questionId: 'q', correct: true }], 0);
    r = updateReview(r, [{ lessonId: 'a', questionId: 'q', correct: true }], 0);
    expect(r['a:q'].interval).toBe(6);
    r = updateReview(r, [{ lessonId: 'a', questionId: 'q', correct: true }], 0);
    expect(r['a:q'].due).toBe(6 * DAY);
    r = updateReview(r, [{ lessonId: 'a', questionId: 'q', correct: false }], 5);
    expect(r['a:q']).toEqual({ due: 5, interval: 3 });
  });

  it('returns at most the limit, oldest first', () => {
    const r = { x: { due: 3, interval: 3 }, y: { due: 1, interval: 3 }, z: { due: 2, interval: 3 }, w: { due: 9, interval: 3 } };
    expect(dueReviews(r, 5, 2)).toEqual(['y', 'z']);
  });
});
