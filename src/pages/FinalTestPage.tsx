import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GoldenRules } from '../components/GoldenRules';
import { Icon } from '../components/Icon';
import { Quiz, type QuizItem, type QuizResult } from '../components/Quiz';
import { LESSONS, lessonNamespace } from '../content/lessons';
import { useAppState } from '../state/AppState';

/** Up to two questions from every lesson, in module order. */
export function finalTestItems(): QuizItem[] {
  return [...LESSONS]
    .sort((a, b) => a.module - b.module)
    .flatMap((lesson) => lesson.quiz.slice(0, 2).map((question) => ({ question, ns: lessonNamespace(lesson.id), lessonId: lesson.id })));
}

const PASS_SHARE = 0.8;

export function FinalTestPage({ onExit }: { onExit(): void }) {
  const { t, i18n } = useTranslation();
  const { state, recordAnswers, recordFinalTest } = useAppState();
  const items = useMemo(finalTestItems, []);
  const [phase, setPhase] = useState<'intro' | 'test' | 'result'>(state.finalTest ? 'result' : 'intro');
  const [result, setResult] = useState<QuizResult | null>(null);
  const done = LESSONS.filter((l) => state.lessons[l.id]?.completed).length;
  const best = state.finalTest;
  const score = result?.score ?? best?.score ?? 0;
  const total = result?.total ?? best?.total ?? items.length;
  const passed = score >= Math.ceil(total * PASS_SHARE);

  return (
    <section className="final-page">
      <button type="button" className="back-button no-print" onClick={onExit}><Icon name="back" size={20} />{t('lesson.backToLessons')}</button>
      <h1>{t('final.title')}</h1>

      {phase === 'intro' && (
        <div className="final-intro">
          <p>{t('final.intro', { count: items.length })}</p>
          {done < LESSONS.length && <p className="sure-note is-warn"><Icon name="alert" size={18} />{t('final.notAllDone', { done, total: LESSONS.length })}</p>}
          <button type="button" className="btn btn-primary" onClick={() => setPhase('test')}>{t('final.start')}<Icon name="arrow" size={16} /></button>
        </div>
      )}

      {phase === 'test' && (
        <Quiz
          key={i18n.language}
          items={items}
          onDone={(r) => {
            setResult(r);
            recordAnswers(r.answers);
            recordFinalTest(r.score, r.total);
            setPhase('result');
          }}
        />
      )}

      {phase === 'result' && (
        <>
          <div className={`final-result ${passed ? 'is-pass' : 'is-retry'}`}>
            <span className="result-score">{score} / {total}</span>
            <p>{passed ? t('final.passed') : t('final.retry', { need: Math.ceil(total * PASS_SHARE) })}</p>
            <button type="button" className="btn btn-outline" onClick={() => { setResult(null); setPhase('test'); }}>{t('final.again')}</button>
          </div>
          <GoldenRules />
        </>
      )}
    </section>
  );
}
