import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { plainText } from '../content/richText';
import type { Lesson, SimChoice } from '../content/schema';
import { useAppState } from '../state/AppState';
import { CoinPath } from './Art';
import { Icon } from './Icon';
import { RichText } from './RichText';

interface SimulationProps {
  lesson: Lesson;
  ns: string;
  /** Called once the learner has made at least one choice and finished the story. */
  onDone(): void;
}

/**
 * "Explain every step": a "Why?" link before each action, and a consequence card after it
 * (what happened, why, how it works, in real life) written for that exact choice.
 */
export function Simulation({ lesson, ns, onDone }: SimulationProps) {
  const { t } = useTranslation();
  const { t: lt, i18n } = useTranslation(ns);
  const { state } = useAppState();
  const [nodeId, setNodeId] = useState(lesson.simulation.start);
  const [chosen, setChosen] = useState<SimChoice | null>(null);
  const [whyOpen, setWhyOpen] = useState<string | null>(null);
  const [showWhatIf, setShowWhatIf] = useState(false);
  const detailed = state.explainLevel === 'detailed';
  const [moreOpen, setMoreOpen] = useState(detailed);

  const node = lesson.simulation.nodes[nodeId];

  const choose = (choice: SimChoice) => {
    setChosen(choice);
    setWhyOpen(null);
    setShowWhatIf(false);
    setMoreOpen(detailed);
  };

  const rewind = () => {
    setChosen(null);
    setShowWhatIf(false);
  };

  const proceed = () => {
    if (chosen?.next) {
      setNodeId(chosen.next);
      setChosen(null);
      setShowWhatIf(false);
    } else {
      onDone();
    }
  };

  const has = (key: string) => i18n.exists(key, { ns });

  return (
    <div className="sim">
      <p className="practice-badge"><Icon name="coin" size={14} />{t('lesson.practiceCoins')}</p>
      <RichText as="p" className="sim-prompt" text={lt(node.prompt)} textKey={node.prompt} />

      {!chosen && (
        <ul className="choice-list">
          {node.choices.map((c) => (
            <li key={c.id} className="choice">
              <button type="button" className="choice-button" onClick={() => choose(c)}>
                <RichText text={lt(c.label)} textKey={c.label} />
              </button>
              <button
                type="button"
                className="why-link"
                aria-expanded={whyOpen === c.id}
                onClick={() => setWhyOpen(whyOpen === c.id ? null : c.id)}
              >
                {t('sim.why')}
              </button>
              {whyOpen === c.id && (
                <p className="why-text">
                  <span className="label">{t('sim.whyTitle')}: </span>
                  <RichText text={lt(c.before)} textKey={c.before} />
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {chosen && (
        <section className={`consequence tone-${chosen.tone}`} aria-live="polite">
          <div className="consequence-head">
            <p className="tone-badge">
              <Icon name={chosen.tone === 'good' ? 'check' : 'alert'} size={16} strokeWidth={2.2} />
              {t(`sim.tone.${chosen.tone}`)}
            </p>
            <p className="you-chose">{t('sim.youChose', { choice: plainText(lt(chosen.label)) })}</p>
          </div>
          <CoinPath tone={chosen.tone} from={t('sim.you')} to={chosen.tone === 'bad' ? t('sim.unknown') : t('sim.friend')} />
          <dl className="explain">
            <dt>{t('sim.whatHappened')}</dt>
            <dd><RichText text={lt(`${chosen.explain}.what`)} textKey={`${chosen.explain}.what`} /></dd>
            <dt>{t('sim.whyItHappened')}</dt>
            <dd><RichText text={lt(`${chosen.explain}.why`)} textKey={`${chosen.explain}.why`} /></dd>
            <dt>{t('sim.howItWorks')}</dt>
            <dd><RichText text={lt(`${chosen.explain}.how`)} textKey={`${chosen.explain}.how`} /></dd>
            <dt>{t('sim.inRealLife')}</dt>
            <dd className="real-life"><RichText text={lt(`${chosen.explain}.realLife`)} textKey={`${chosen.explain}.realLife`} /></dd>
          </dl>
          {has(`${chosen.explain}.more`) && (
            <div className="more">
              <button type="button" className="link-button" aria-expanded={moreOpen} onClick={() => setMoreOpen((v) => !v)}>
                {moreOpen ? t('sim.showLess') : t('sim.tellMeMore')}
              </button>
              {moreOpen && <RichText as="p" text={lt(`${chosen.explain}.more`)} textKey={`${chosen.explain}.more`} />}
            </div>
          )}

          {showWhatIf && (
            <ul className="what-if">
              {node.choices
                .filter((c) => c.id !== chosen.id)
                .map((c) => (
                  <li key={c.id} className={`tone-${c.tone}`}>
                    <strong><RichText text={lt(c.label)} textKey={c.label} /></strong>
                    <span className="tone-inline"> · {t(`sim.tone.${c.tone}`)}</span>
                    <RichText as="p" text={lt(`${c.explain}.what`)} textKey={`${c.explain}.what`} />
                  </li>
                ))}
            </ul>
          )}

          <div className="actions">
            <button type="button" className="btn btn-outline" onClick={rewind}>{t('sim.rewind')}</button>
            {!showWhatIf && (
              <button type="button" className="btn btn-outline" onClick={() => setShowWhatIf(true)}>{t('sim.whatIf')}</button>
            )}
            <button type="button" className="btn btn-primary" onClick={proceed}>{t('sim.continue')}</button>
          </div>
        </section>
      )}
    </div>
  );
}
