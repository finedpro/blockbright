import { useTranslation } from 'react-i18next';
import { ModuleCube, MODULE_COLORS, MODULE_ON } from '../components/Art';
import { Icon } from '../components/Icon';
import { MODULES, lessonNamespace, lessonsInModule } from '../content/lessons';
import { plainText } from '../content/richText';
import { useAppState } from '../state/AppState';

const MODULE_ICONS = ['coin', 'blocks', 'key', 'send', 'eye', 'trend', 'scale'];

export function HomePage({ onOpenLesson }: { onOpenLesson(id: string): void }) {
  const { t } = useTranslation();
  const { state } = useAppState();
  const openModules = MODULES.filter((m) => lessonsInModule(m).length > 0);
  const next = openModules.flatMap((m) => lessonsInModule(m)).find((l) => !state.lessons[l.id]?.completed) ?? lessonsInModule(openModules[0] ?? 4)[0];

  return (
    <section className="learn">
      {next && (
        <div className="next-card">
          <ModuleCube index={next.module - 1} size={84} />
          <div className="next-copy">
            <span className="next-label">{t('home.continueTitle')}</span>
            <span className="next-title">{plainText(t(next.title, { ns: lessonNamespace(next.id) }))}</span>
            <button type="button" className="btn btn-yellow" onClick={() => onOpenLesson(next.id)}>
              {state.lessons[next.id]?.completed ? t('home.again') : t('home.startHere')}
              <Icon name="arrow" size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="learn-head">
        <h1>{t('home.title')}</h1>
        <span className="muted">{t('home.openCount', { open: openModules.length, total: MODULES.length })}</span>
      </div>

      <ol className="path">
        {MODULES.map((m, i) => {
          const lessons = lessonsInModule(m);
          const open = lessons.length > 0;
          const progress = lessons[0] ? state.lessons[lessons[0].id] : undefined;
          const content = (
            <>
              <span className="path-icon" style={open ? { background: MODULE_COLORS[i], color: MODULE_ON[i] } : undefined}>
                <Icon name={progress?.completed ? 'check' : MODULE_ICONS[i]} size={22} strokeWidth={progress?.completed ? 2.4 : 1.9} />
              </span>
              <span className="path-copy">
                <span className="path-num">{t('home.module', { number: m })}</span>
                <span className="path-title">{t(`modules.m${m}`)}</span>
                {progress?.completed && <span className="path-done">{t('home.done', { score: progress.score, total: progress.total })}</span>}
              </span>
              <span className={`path-status ${open ? 'is-open' : ''}`}>{open ? (progress?.completed ? t('home.again') : t('home.start')) : t('home.comingSoon')}</span>
            </>
          );
          return (
            <li key={m}>
              {open ? (
                <button type="button" className="path-item is-open" onClick={() => onOpenLesson(lessons[0].id)}>
                  {content}
                </button>
              ) : (
                <div className="path-item">{content}</div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
