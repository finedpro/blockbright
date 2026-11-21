import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { QuizQuestion } from '../content/schema';
import type { Confidence } from '../state/storage';
import { BRAND, Cube } from './Art';
import { Icon } from './Icon';
import { RichText } from './RichText';

export interface QuizItem {
  question: QuizQuestion;
  /** i18n namespace of the lesson the question belongs to. */
  ns: string;
  lessonId: string;
}

export interface QuestionResult {
  lessonId: string;
  questionId: string;
  correct: boolean;
}

export interface QuizResult {
  score: number;
  total: number;
  sureButWrong: number;
  answers: QuestionResult[];
}

interface QuizProps {
  items: QuizItem[];
  onDone(result: QuizResult): void;
  /** Before/after: ids of the questions asked before the lesson, and how many were right then. */
  before?: { ids: string[]; correct: number };
}

const CONFIDENCE: Confidence[] = ['unsure', 'fairly', 'certain'];

/** Quiz with a confidence check and feedback aimed at the belief behind each wrong answer. */
export function Quiz({ items, onDone, before }: QuizProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<QuestionResult[]>([]);
  const [sureButWrong, setSureButWrong] = useState(0);
  const [finished, setFinished] = useState(false);

  const feedbackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (checked) feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [checked]);

  const item = items[index];
  const q = item.question;
  const lt = (key: string) => t(key, { ns: item.ns });
  const picked = q.options.find((o) => o.id === answer);
  const score = answers.filter((a) => a.correct).length;

  const check = () => {
    if (!picked || !confidence) return;
    setChecked(true);
    setAnswers((prev) => [...prev, { lessonId: item.lessonId, questionId: q.id, correct: picked.correct }]);
    if (!picked.correct && confidence !== 'unsure') setSureButWrong((n) => n + 1);
  };

  const next = () => {
    if (index + 1 < items.length) {
      setIndex(index + 1);
      setAnswer(null);
      setConfidence(null);
      setChecked(false);
    } else {
      setFinished(true);
    }
  };

  if (finished) {
    const afterCorrect = before ? answers.filter((a) => before.ids.includes(a.questionId) && a.correct).length : 0;
    return (
      <section className="quiz-results" aria-live="polite">
        <div className="result-card">
          <div className="result-copy">
            <span className="result-label">{t('quiz.resultsTitle')}</span>
            <span className="result-score">{score} / {items.length}</span>
            <span className="result-sub">{t('results.correct')}</span>
          </div>
          <svg width="110" height="100" viewBox="0 0 110 100" aria-hidden="true">
            <Cube cx={55} cy={34} w={38} color={BRAND.yellow} className="anim-float" />
            <g className="anim-pop" style={{ transformOrigin: '55px 22px' }}>
              <circle cx={55} cy={22} r={16} fill={BRAND.mint} stroke={BRAND.ink} strokeWidth={2.5} />
              <path d="M48 22 l5 5 l10 -11" fill="none" stroke={BRAND.ink} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </svg>
        </div>
        {before && (
          <div className="before-after">
            <div><span className="ba-label">{t('beforeAfter.before')}</span><span className="ba-value">{before.correct} / {before.ids.length}</span></div>
            <Icon name="arrow" size={20} />
            <div><span className="ba-label">{t('beforeAfter.after')}</span><span className="ba-value">{afterCorrect} / {before.ids.length}</span></div>
          </div>
        )}
        <p className={`sure-note ${sureButWrong ? 'is-warn' : 'is-good'}`}>
          <Icon name={sureButWrong ? 'alert' : 'check'} size={18} strokeWidth={2.2} />
          {t('quiz.sureButWrong', { count: sureButWrong })}
        </p>
        <button type="button" className="btn btn-primary btn-block" onClick={() => onDone({ score, total: items.length, sureButWrong, answers })}>
          {t('lesson.next')}
        </button>
      </section>
    );
  }

  return (
    <section className="quiz">
      <p className="muted">{t('quiz.question', { current: index + 1, total: items.length })}</p>
      <fieldset disabled={checked}>
        <legend><RichText text={lt(q.prompt)} textKey={q.prompt} /></legend>
        {q.options.filter((o) => !checked || o.correct || o.id === answer).map((o) => {
          const state = checked ? (o.correct ? 'is-correct' : o.id === answer ? 'is-wrong' : '') : '';
          return (
            <label key={o.id} className={`option ${state}`}>
              <input type="radio" name={`q-${item.lessonId}-${q.id}`} value={o.id} checked={answer === o.id} onChange={() => setAnswer(o.id)} />
              <RichText text={lt(`${q.id}.${o.id}`)} textKey={`${q.id}.${o.id}`} />
            </label>
          );
        })}
      </fieldset>

      <fieldset disabled={checked} className="confidence" hidden={checked}>
        <legend>{t('quiz.howSure')}</legend>
        <div className="segmented">
          {CONFIDENCE.map((c) => (
            <label key={c} className={confidence === c ? 'selected' : ''}>
              <input type="radio" name={`conf-${item.lessonId}-${q.id}`} value={c} checked={confidence === c} onChange={() => setConfidence(c)} />
              {t(`quiz.confidence.${c}`)}
            </label>
          ))}
        </div>
      </fieldset>

      {!checked && (
        <>
          <p className="muted hint">{!answer ? t('quiz.pickAnswer') : !confidence ? t('quiz.pickConfidence') : ' '}</p>
          <button type="button" className="btn btn-primary" disabled={!answer || !confidence} onClick={check}>
            {t('quiz.check')}
          </button>
        </>
      )}

      {checked && picked && (
        <div ref={feedbackRef} className={`feedback ${picked.correct ? 'tone-good' : 'tone-bad'}`} aria-live="polite">
          <p className="feedback-verdict">{picked.correct ? t('quiz.correct') : t('quiz.notQuite')}</p>
          {!picked.correct && picked.misconception && (
            <p>
              <span className="label">{t('quiz.commonBelief')}: </span>
              <RichText text={lt(picked.misconception)} textKey={picked.misconception} />
            </p>
          )}
          <RichText as="p" text={lt(q.explanation)} textKey={q.explanation} />
          <button type="button" className="btn btn-primary" onClick={next}>
            {index + 1 < items.length ? t('quiz.next') : t('lesson.next')}
          </button>
        </div>
      )}
    </section>
  );
}
