import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Lesson, QuizQuestion } from '../content/schema';
import { BRAND, Cube } from './Art';
import { Icon } from './Icon';
import { RichText } from './RichText';

/** Before/after: the same questions, asked quickly before the lesson. No feedback yet. */
export function BeforeCheck({ questions, ns, onDone }: { questions: QuizQuestion[]; ns: string; onDone(correct: number): void }) {
  const { t } = useTranslation();
  const { t: lt } = useTranslation(ns);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const q = questions[index];

  const next = () => {
    const isCorrect = q.options.find((o) => o.id === answer)?.correct ?? false;
    const total = correct + (isCorrect ? 1 : 0);
    setCorrect(total);
    setAnswer(null);
    if (index + 1 < questions.length) setIndex(index + 1);
    else onDone(total);
  };

  return (
    <section className="before-check">
      <p className="activity-tag"><Icon name="eye" size={16} />{t('beforeAfter.title')}</p>
      <p className="muted">{t('beforeAfter.intro')}</p>
      <p className="muted">{t('quiz.question', { current: index + 1, total: questions.length })}</p>
      <fieldset>
        <legend><RichText text={lt(q.prompt)} textKey={q.prompt} /></legend>
        {q.options.map((o) => (
          <label key={o.id} className="option">
            <input type="radio" name={`before-${q.id}`} checked={answer === o.id} onChange={() => setAnswer(o.id)} />
            <RichText text={lt(`${q.id}.${o.id}`)} textKey={`${q.id}.${o.id}`} />
          </label>
        ))}
      </fieldset>
      <button type="button" className="btn btn-primary" disabled={!answer} onClick={next}>
        {index + 1 < questions.length ? t('quiz.next') : t('beforeAfter.start')}
      </button>
    </section>
  );
}

/** A step-through walkthrough: one frame at a time, with dots. */
export function Walkthrough({ title, frames, ns }: { title: string; frames: string[]; ns: string }) {
  const { t } = useTranslation();
  const { t: lt } = useTranslation(ns);
  const [i, setI] = useState(0);
  const colors = [BRAND.blue, BRAND.orange, BRAND.yellow, BRAND.mint];
  return (
    <section className="walkthrough">
      <p className="activity-tag"><Icon name="cards" size={16} />{t('walkthrough.tag')}</p>
      <h2><RichText text={lt(title)} textKey={title} /></h2>
      <div className="wt-frame" aria-live="polite">
        <svg width="70" height="62" viewBox="0 0 96 84" aria-hidden="true" className="wt-cube">
          <Cube cx={48} cy={30} w={34} color={colors[i % colors.length]} className="anim-float" />
        </svg>
        <div>
          <span className="wt-count">{t('walkthrough.step', { current: i + 1, total: frames.length })}</span>
          <RichText as="p" text={lt(frames[i])} textKey={frames[i]} />
        </div>
      </div>
      <div className="wt-dots" aria-hidden="true">
        {frames.map((f, k) => <span key={f} className={k <= i ? 'is-on' : ''} />)}
      </div>
      <div className="actions">
        <button type="button" className="btn btn-outline" disabled={i === 0} onClick={() => setI(i - 1)}>{t('walkthrough.prev')}</button>
        <button type="button" className="btn btn-primary" disabled={i === frames.length - 1} onClick={() => setI(i + 1)}>{t('walkthrough.next')}</button>
      </div>
    </section>
  );
}

/** True story with sources and a reveal of what would have prevented it. */
export function Story({ story, ns }: { story: NonNullable<Lesson['story']>; ns: string }) {
  const { t } = useTranslation();
  const { t: lt } = useTranslation(ns);
  const [open, setOpen] = useState(false);
  return (
    <section className="story">
      <p className="activity-tag"><Icon name="book" size={16} />{t('story.tag')}</p>
      <h2><RichText text={lt(story.title)} textKey={story.title} /></h2>
      <RichText as="p" text={lt(story.body)} textKey={story.body} />
      <div className="story-question">
        <p className="label"><RichText text={lt(story.question)} textKey={story.question} /></p>
        {!open && <button type="button" className="btn btn-yellow" onClick={() => setOpen(true)}>{t('story.reveal')}</button>}
        {open && <RichText as="p" text={lt(story.answer)} textKey={story.answer} />}
      </div>
      <p className="sources">
        {t('story.sources')}:{' '}
        {story.sources.map((s, i) => (
          <span key={s.url}>
            {i > 0 && ' · '}
            <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>
          </span>
        ))}
      </p>
    </section>
  );
}

/** Spot the bad advice: tap each line you think is wrong or dangerous, then check. */
export function BadAdvice({ advice, ns, onDone }: { advice: NonNullable<Lesson['badAdvice']>; ns: string; onDone(): void }) {
  const { t } = useTranslation();
  const { t: lt } = useTranslation(ns);
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);
  const toggle = (id: string) =>
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const right = advice.lines.filter((l) => marked.has(l.id) === l.bad).length;

  return (
    <section className="bad-advice">
      <p className="activity-tag"><Icon name="alert" size={16} />{t('advice.tag')}</p>
      <RichText as="p" className="advice-intro" text={lt(advice.intro)} textKey={advice.intro} />
      <div className="advice-post">
        <div className="advice-author"><span className="advice-avatar" aria-hidden="true" />{advice.author}</div>
        <p className="muted advice-hint">{t('advice.hint')}</p>
        <ul>
          {advice.lines.map((l) => {
            const isMarked = marked.has(l.id);
            const state = checked ? (l.bad === isMarked ? 'is-right' : 'is-missed') : '';
            return (
              <li key={l.id}>
                <button type="button" aria-pressed={isMarked} disabled={checked} className={`advice-line ${isMarked ? 'is-marked' : ''} ${state}`} onClick={() => toggle(l.id)}>
                  <span className="advice-flag" aria-hidden="true">{isMarked ? <Icon name="alert" size={16} strokeWidth={2.2} /> : null}</span>
                  <RichText text={lt(`advice.${l.id}.text`)} textKey={`advice.${l.id}.text`} />
                </button>
                {checked && (
                  <p className={`advice-why ${l.bad ? 'is-bad' : 'is-ok'}`}>
                    <strong>{l.bad ? t('advice.isBad') : t('advice.isOk')}</strong>{' '}
                    <RichText text={lt(`advice.${l.id}.why`)} textKey={`advice.${l.id}.why`} />
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      {!checked ? (
        <button type="button" className="btn btn-primary" onClick={() => setChecked(true)}>{t('advice.check')}</button>
      ) : (
        <>
          <p className="sure-note is-good" aria-live="polite"><Icon name="check" size={18} />{t('advice.score', { right, total: advice.lines.length })}</p>
          <button type="button" className="btn btn-primary" onClick={onDone}>{t('lesson.next')}</button>
        </>
      )}
    </section>
  );
}
