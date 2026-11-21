import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../components/Icon';
import { Quiz, type QuizItem } from '../components/Quiz';
import { getLesson, lessonNamespace } from '../content/lessons';
import { useAppState } from '../state/AppState';
import { dueReviews } from '../state/storage';

/** Spaced review: up to three questions that are due again. */
export function ReviewPage({ onExit }: { onExit(): void }) {
  const { t, i18n } = useTranslation();
  const { state, recordAnswers } = useAppState();
  const [items] = useState<QuizItem[]>(() =>
    dueReviews(state.review, Date.now()).flatMap((key) => {
      const [lessonId, questionId] = key.split(':');
      const lesson = getLesson(lessonId);
      const question = lesson?.quiz.find((q) => q.id === questionId);
      return lesson && question ? [{ question, ns: lessonNamespace(lessonId), lessonId }] : [];
    }),
  );
  const [done, setDone] = useState(false);

  return (
    <section className="review-page">
      <button type="button" className="back-button" onClick={onExit}><Icon name="back" size={20} />{t('lesson.backToLessons')}</button>
      <h1>{t('review.title')}</h1>
      <p className="muted">{t('review.intro')}</p>
      {items.length === 0 || done ? (
        <div className="empty-card">
          <Icon name="check" size={28} strokeWidth={2.2} />
          <p>{done ? t('review.done') : t('review.nothing')}</p>
          <button type="button" className="btn btn-primary" onClick={onExit}>{t('lesson.backToLessons')}</button>
        </div>
      ) : (
        <Quiz
          key={i18n.language}
          items={items}
          onDone={(r) => {
            recordAnswers(r.answers);
            setDone(true);
          }}
        />
      )}
    </section>
  );
}
