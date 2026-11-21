import { useTranslation } from 'react-i18next';
import { MODULES, lessonNamespace, lessonsInModule } from '../content/lessons';
import { plainText } from '../content/richText';
import { useAppState } from '../state/AppState';

export function HomePage({ onOpenLesson }: { onOpenLesson(id: string): void }) {
  const { t } = useTranslation();
  const { state } = useAppState();

  return (
    <section>
      <h1>{t('home.title')}</h1>
      <p className="lead">{t('home.intro')}</p>
      <ol className="module-list">
        {MODULES.map((m) => {
          const lessons = lessonsInModule(m);
          return (
            <li key={m} className={`module ${lessons.length ? '' : 'is-empty'}`}>
              <p className="muted">{t('home.module', { number: m })}</p>
              <h2>{t(`modules.m${m}`)}</h2>
              {lessons.length === 0 && <p className="muted">{t('home.comingSoon')}</p>}
              {lessons.map((lesson) => {
                const progress = state.lessons[lesson.id];
                return (
                  <div key={lesson.id} className="lesson-row">
                    <span>{plainText(t(lesson.title, { ns: lessonNamespace(lesson.id) }))}</span>
                    {progress?.completed && (
                      <span className="done">{t('home.done', { score: progress.score, total: progress.total })}</span>
                    )}
                    <button type="button" className="primary" onClick={() => onOpenLesson(lesson.id)}>
                      {progress?.completed ? t('home.again') : t('home.start')}
                    </button>
                  </div>
                );
              })}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
