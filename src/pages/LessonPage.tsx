import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BRAND } from '../components/Art';
import { Icon } from '../components/Icon';
import { RichText, TermOwnersContext } from '../components/RichText';
import { BadAdvice, BeforeCheck, Story, Walkthrough } from '../components/Activities';
import { Quiz, type QuizResult } from '../components/Quiz';
import { Simulation } from '../components/Simulation';
import { ENGLISH_GLOSSARY, showsEnglishTerm, termEntry } from '../content/glossary';
import { getLesson, lessonNamespace } from '../content/lessons';
import { firstTermOwners, termIdsIn } from '../content/richText';
import { lessonTextKeys, type LessonCard } from '../content/schema';
import { useAppState } from '../state/AppState';

type Step =
  | { kind: 'before' }
  | { kind: 'hook' }
  | { kind: 'card'; card: LessonCard }
  | { kind: 'story' }
  | { kind: 'try' }
  | { kind: 'advice' }
  | { kind: 'check' }
  | { kind: 'remember' };

const STEP_LABEL: Record<Step['kind'], string> = {
  before: 'before',
  hook: 'hook',
  card: 'learn',
  story: 'story',
  try: 'try',
  advice: 'advice',
  check: 'check',
  remember: 'remember',
};

export function LessonPage({ id, onExit }: { id: string; onExit(): void }) {
  const lesson = getLesson(id);
  const ns = lessonNamespace(id);
  const { t, i18n } = useTranslation();
  const { t: lt } = useTranslation(ns);
  const { recordLesson, recordAnswers } = useAppState();
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [beforeCorrect, setBeforeCorrect] = useState<number | null>(null);

  const steps = useMemo<Step[]>(() => {
    if (!lesson) return [];
    const list: Step[] = [];
    if (lesson.before?.length) list.push({ kind: 'before' });
    list.push({ kind: 'hook' }, ...lesson.cards.map((card) => ({ kind: 'card' as const, card })));
    if (lesson.story) list.push({ kind: 'story' });
    list.push({ kind: 'try' });
    if (lesson.badAdvice) list.push({ kind: 'advice' });
    list.push({ kind: 'check' }, { kind: 'remember' });
    return list;
  }, [lesson]);

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
  const stepLabel = (s: Step) => t(`lesson.steps.${STEP_LABEL[s.kind]}`);
  const beforeQuestions = lesson.quiz.filter((q) => lesson.before?.includes(q.id));
  const go = (delta: number) => {
    setStepIndex((i) => Math.min(Math.max(i + delta, 0), steps.length - 1));
    window.scrollTo({ top: 0 });
  };

  const finish = () => {
    if (result) {
      const { score, total, sureButWrong } = result;
      recordLesson(lesson.id, { completed: true, score, total, sureButWrong, completedAt: new Date().toISOString() });
    }
    onExit();
  };

  return (
    <TermOwnersContext.Provider value={owners}>
      <article className="lesson">
        <header className="lesson-header">
          <div className="lesson-top">
            <button type="button" className="icon-button" onClick={onExit} aria-label={t('lesson.backToLessons')} title={t('lesson.backToLessons')}>
              <Icon name="back" size={20} />
            </button>
            <div className="lesson-title">
              <p className="muted">{t('home.module', { number: lesson.module })} · {t(`modules.m${lesson.module}`)}</p>
              <h1><RichText text={lt(lesson.title)} textKey={lesson.title} /></h1>
            </div>
            <span className="step-count">{stepIndex + 1}/{steps.length}</span>
          </div>
          <div className="progress" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={stepIndex + 1}>
            {steps.map((_, i) => (
              <span key={i} className={i <= stepIndex ? 'seg is-done' : 'seg'} />
            ))}
          </div>
          <p className="muted step-label">{stepLabel(step)}</p>
        </header>

        {step.kind === 'before' && (
          <BeforeCheck
            key={language}
            questions={beforeQuestions}
            ns={ns}
            onDone={(n) => {
              setBeforeCorrect(n);
              go(1);
            }}
          />
        )}

        {step.kind === 'hook' && <RichText as="p" className="hook" text={lt(lesson.hook)} textKey={lesson.hook} />}

        {step.kind === 'card' && typeof step.card === 'string' && <RichText as="p" className="card" text={lt(step.card)} textKey={step.card} />}

        {step.kind === 'card' && typeof step.card !== 'string' && step.card.kind === 'analogy' && (
          <div className="card card-analogy">
            <p className="activity-tag"><Icon name="key" size={16} />{t('lesson.analogy')}</p>
            <RichText as="p" text={lt(step.card.key)} textKey={step.card.key} />
          </div>
        )}

        {step.kind === 'card' && typeof step.card !== 'string' && step.card.kind === 'walkthrough' && (
          <Walkthrough key={`${stepIndex}-${language}`} title={step.card.title} frames={step.card.frames} ns={ns} />
        )}

        {step.kind === 'story' && lesson.story && <Story key={language} story={lesson.story} ns={ns} />}

        {step.kind === 'try' && <Simulation key={language} lesson={lesson} ns={ns} onDone={() => go(1)} />}

        {step.kind === 'advice' && lesson.badAdvice && <BadAdvice key={language} advice={lesson.badAdvice} ns={ns} onDone={() => go(1)} />}

        {step.kind === 'check' && (
          <Quiz
            key={language}
            items={lesson.quiz.map((question) => ({ question, ns, lessonId: lesson.id }))}
            before={beforeCorrect !== null && lesson.before ? { ids: lesson.before, correct: beforeCorrect } : undefined}
            onDone={(r) => {
              setResult(r);
              recordAnswers(r.answers);
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
            {lesson.talk && lesson.talk.length > 0 && (
              <div className="talk">
                <h2><Icon name="info" size={20} /> {t('talk.title')}</h2>
                <p className="muted">{t('talk.intro')}</p>
                <ul>
                  {lesson.talk.map((k) => (
                    <li key={k}><RichText text={lt(k)} textKey={k} /></li>
                  ))}
                </ul>
              </div>
            )}
            <details className="term-details">
            <summary>{t('remember.newTerms')} ({lessonTerms.length})</summary>
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
            </details>
          </section>
        )}

        <nav className={`lesson-nav ${['hook', 'card', 'story', 'remember'].includes(step.kind) ? 'is-sticky' : ''}`} aria-label={t('lesson.stepOf', { current: stepIndex + 1, total: steps.length })}>
          {stepIndex > 0 && step.kind !== 'remember' && steps[stepIndex - 1].kind !== 'before' && (
            <button type="button" className="btn btn-outline" onClick={() => go(-1)}>{t('lesson.back')}</button>
          )}
          {(step.kind === 'hook' || step.kind === 'card' || step.kind === 'story') && (
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
