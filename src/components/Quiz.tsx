import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { QuizQuestion } from '../content/schema';
import type { Confidence } from '../state/storage';
import { RichText } from './RichText';

export interface QuizResult {
  score: number;
  total: number;
  sureButWrong: number;
}

interface QuizProps {
  questions: QuizQuestion[];
  ns: string;
  onDone(result: QuizResult): void;
}

const CONFIDENCE: Confidence[] = ['unsure', 'fairly', 'certain'];

/** Quiz with a confidence check and feedback aimed at the belief behind each wrong answer. */
export function Quiz({ questions, ns, onDone }: QuizProps) {
  const { t } = useTranslation();
  const { t: lt } = useTranslation(ns);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [sureButWrong, setSureButWrong] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = questions[index];
  const picked = q.options.find((o) => o.id === answer);

  const check = () => {
    if (!picked || !confidence) return;
    setChecked(true);
    if (picked.correct) setScore((s) => s + 1);
    else if (confidence !== 'unsure') setSureButWrong((n) => n + 1);
  };

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setAnswer(null);
      setConfidence(null);
      setChecked(false);
    } else {
      setFinished(true);
    }
  };

  if (finished) {
    return (
      <section className="quiz-results" aria-live="polite">
        <h3>{t('quiz.resultsTitle')}</h3>
        <p className="score">{t('quiz.score', { score, total: questions.length })}</p>
        <p>{t('quiz.sureButWrong', { count: sureButWrong })}</p>
        <button type="button" className="primary" onClick={() => onDone({ score, total: questions.length, sureButWrong })}>
          {t('lesson.next')}
        </button>
      </section>
    );
  }

  return (
    <section className="quiz">
      <p className="muted">{t('quiz.question', { current: index + 1, total: questions.length })}</p>
      <fieldset disabled={checked}>
        <legend><RichText text={lt(q.prompt)} textKey={q.prompt} /></legend>
        {q.options.map((o) => {
          const state = checked ? (o.correct ? 'is-correct' : o.id === answer ? 'is-wrong' : '') : '';
          return (
            <label key={o.id} className={`option ${state}`}>
              <input type="radio" name={`q-${q.id}`} value={o.id} checked={answer === o.id} onChange={() => setAnswer(o.id)} />
              <RichText text={lt(`${q.id}.${o.id}`)} textKey={`${q.id}.${o.id}`} />
            </label>
          );
        })}
      </fieldset>

      <fieldset disabled={checked} className="confidence">
        <legend>{t('quiz.howSure')}</legend>
        <div className="segmented">
          {CONFIDENCE.map((c) => (
            <label key={c} className={confidence === c ? 'selected' : ''}>
              <input type="radio" name={`conf-${q.id}`} value={c} checked={confidence === c} onChange={() => setConfidence(c)} />
              {t(`quiz.confidence.${c}`)}
            </label>
          ))}
        </div>
      </fieldset>

      {!checked && (
        <>
          <p className="muted hint">{!answer ? t('quiz.pickAnswer') : !confidence ? t('quiz.pickConfidence') : ' '}</p>
          <button type="button" className="primary" disabled={!answer || !confidence} onClick={check}>
            {t('quiz.check')}
          </button>
        </>
      )}

      {checked && picked && (
        <div className={`feedback ${picked.correct ? 'tone-good' : 'tone-bad'}`} aria-live="polite">
          <p className="feedback-verdict">{picked.correct ? t('quiz.correct') : t('quiz.notQuite')}</p>
          {!picked.correct && picked.misconception && (
            <p>
              <span className="label">{t('quiz.commonBelief')}: </span>
              <RichText text={lt(picked.misconception)} textKey={picked.misconception} />
            </p>
          )}
          <RichText as="p" text={lt(q.explanation)} textKey={q.explanation} />
          <button type="button" className="primary" onClick={next}>
            {index + 1 < questions.length ? t('quiz.next') : t('lesson.next')}
          </button>
        </div>
      )}
    </section>
  );
}
