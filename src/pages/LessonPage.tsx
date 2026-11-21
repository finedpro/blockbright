import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BRAND } from '../components/Art';
import { Icon } from '../components/Icon';
import { RichText, TermOwnersContext } from '../components/RichText';
import { Quiz, type QuizResult } from '../components/Quiz';
import { Simulation } from '../components/Simulation';
import { ENGLISH_GLOSSARY, showsEnglishTerm, termEntry } from '../content/glossary';
import { getLesson, lessonNamespace } from '../content/lessons';
import { firstTermOwners, termIdsIn } from '../content/richText';
import { lessonTextKeys } from '../content/schema';
import { useAppState } from '../state/AppState';

type Step = { kind: 'hook' } | { kind: 'card'; key: string } | { kind: 'try' } | { kind: 'check' } | { kind: 'remember' };

export function LessonPage({ id, onExit }: { id: string; onExit(): void }) {
  const lesson = getLesson(id);
  const ns = lessonNamespace(id);
  const { t, i18n } = useTranslation();
  const { t: lt } = useTranslation(ns);
  const { recordLesson } = useAppState();
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);

  const steps = useMemo<Step[]>(
    () =>
      lesson
        ? [{ kind: 'hook' }, ...lesson.cards.map((key) => ({ kind: 'card' as const, key })), { kind: 'try' }, { kind: 'check' }, { kind: 'remember' }]
        : [],
    [lesson],
  );

  const language = i18n.language;
  const owners = useMemo(() => {
    if (!lesson) return new Map<string, string>();
    return firstTermOwners(lessonTextKeys(lesson).map((key) => ({ key, text: lt(key) })));
    // lt changes with the language
  }, [lesson, lt]);

  const lessonTerms = useMemo(() => {
    if (!lesson) return [];
    const ids = new Set<string>();
    for (const key of lessonTextKeys(lesson)) for (const termId of termIdsIn(lt(key))) ids.add(termId);
    return [...ids];
  }, [lesson, lt]);

  if (!lesson) return <p>Lesson not found.</p>;

  const step = steps[stepIndex];
  const stepLabel = (s: Step) =>
    t(`lesson.steps.${s.kind === 'card' ? 'learn' : s.kind}`);
  const go = (delta: number) => {
    setStepIndex((i) => Math.min(Math.max(i + delta, 0), steps.length - 1));
    window.scrollTo({ top: 0 });
  };

  const finish = () => {
    if (result) {
      recordLesson(lesson.id, { completed: true, ...result, completedAt: new Date().toISOString() });
    }
    onExit();
  };

  return (
    <TermOwnersContext.Provider value={owners}>
      <article className="lesson">
        <header className="lesson-header">
          <button type="button" className="back-button" onClick={onExit}><Icon name="back" size={20} />{t('lesson.backToLessons')}</button>
          <p className="muted">{t('home.module', { number: lesson.module })} · {t(`modules.m${lesson.module}`)}</p>
          <h1><RichText text={lt(lesson.title)} textKey={lesson.title} /></h1>
          <div className="progress" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={stepIndex + 1}>
            {steps.map((_, i) => (
              <span key={i} className={i <= stepIndex ? 'seg is-done' : 'seg'} />
            ))}
          </div>
          <p className="muted step-label">
            {stepLabel(step)} · {t('lesson.stepOf', { current: stepIndex + 1, total: steps.length })}
          </p>
        </header>

        {step.kind === 'hook' && <RichText as="p" className="hook" text={lt(lesson.hook)} textKey={lesson.hook} />}

        {step.kind === 'card' && <RichText as="p" className="card" text={lt(step.key)} textKey={step.key} />}

        {step.kind === 'try' && <Simulation key={language} lesson={lesson} ns={ns} onDone={() => go(1)} />}

        {step.kind === 'check' && (
          <Quiz
            key={language}
            questions={lesson.quiz}
            ns={ns}
            onDone={(r) => {
              setResult(r);
              go(1);
            }}
          />
        )}

        {step.kind === 'remember' && (
          <section className="remember">
            <h2>{t('results.rememberTitle')}</h2>
            <ol className="takeaways">
              {lesson.takeaways.map((k, i) => (
                <li key={k}>
                  <span className="takeaway-num" style={{ background: [BRAND.orange, BRAND.yellow, BRAND.mint][i % 3] }}>{i + 1}</span>
                  <RichText text={lt(k)} textKey={k} />
                </li>
              ))}
            </ol>
            <h2>{t('remember.newTerms')}</h2>
            <dl className="term-list">
              {lessonTerms.map((termId) => (
                <div key={termId}>
                  <dt>
                    {termEntry(termId, language).term}
                    {showsEnglishTerm(language) && <span className="term-english" lang="en"> ({ENGLISH_GLOSSARY[termId]?.term})</span>}
                  </dt>
                  <dd>{termEntry(termId, language).definition}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <nav className="lesson-nav" aria-label={t('lesson.stepOf', { current: stepIndex + 1, total: steps.length })}>
          {stepIndex > 0 && step.kind !== 'remember' && (
            <button type="button" className="btn btn-outline" onClick={() => go(-1)}>{t('lesson.back')}</button>
          )}
          {(step.kind === 'hook' || step.kind === 'card') && (
            <button type="button" className="btn btn-primary" onClick={() => go(1)}>{t('lesson.next')}</button>
          )}
          {step.kind === 'remember' && (
            <button type="button" className="btn btn-primary" onClick={finish}>{t('lesson.finish')}</button>
          )}
        </nav>
      </article>
    </TermOwnersContext.Provider>
  );
}
