import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '../components/Icon';
import { ReadAloud } from '../components/ReadAloud';
import { spotRound, type Channel, type SpotMessage } from '../content/spot';
import { useAppState } from '../state/AppState';

const CHANNEL_ICON: Record<Channel, IconName> = { sms: 'send', email: 'info', game: 'blocks', dm: 'eye', social: 'cards' };

/** Scam spotter: judge real-looking messages as scam or safe, one at a time. */
export function SpotPage({ onExit }: { onExit(): void }) {
  const { t } = useTranslation('spot');
  const { t: tu } = useTranslation();
  const { state, recordSpot } = useAppState();
  const [round, setRound] = useState<SpotMessage[] | null>(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const start = () => {
    setRound(spotRound());
    setIndex(0);
    setAnswer(null);
    setScore(0);
    setDone(false);
  };

  const pick = (saysScam: boolean, m: SpotMessage) => {
    setAnswer(saysScam);
    if (saysScam === m.scam) setScore((s) => s + 1);
  };

  const next = () => {
    if (!round) return;
    if (index + 1 < round.length) {
      setIndex(index + 1);
      setAnswer(null);
    } else {
      recordSpot(score, round.length);
      setDone(true);
    }
  };

  return (
    <section className="spot-page">
      <button type="button" className="back-button" onClick={onExit}><Icon name="back" size={20} />{tu('lesson.backToLessons')}</button>
      <div className="spot-head">
        <h1>{t('title')}</h1>
        <ReadAloud target={bodyRef} resetKey={`${index}-${answer}-${done}`} />
      </div>
      <div ref={bodyRef} className="spot-body">

      {!round && (
        <div className="spot-intro">
          <p>{t('intro')}</p>
          {state.spotBest && <p className="muted">{t('best', { score: state.spotBest.score, total: state.spotBest.total })}</p>}
          <button type="button" className="btn btn-primary" onClick={start}>{t('start')}<Icon name="arrow" size={16} /></button>
        </div>
      )}

      {round && !done && (() => {
        const m = round[index];
        const right = answer !== null && answer === m.scam;
        return (
          <div className="spot-round">
            <p className="muted spot-count">{t('count', { current: index + 1, total: round.length })}</p>
            <div className={`phone-msg channel-${m.channel}`}>
              <div className="phone-msg-head">
                <span className="phone-msg-icon"><Icon name={CHANNEL_ICON[m.channel]} size={16} /></span>
                <span className="phone-msg-from">{t(`m.${m.id}.from`)}</span>
                <span className="phone-msg-channel">{t(`channel.${m.channel}`)}</span>
              </div>
              <p className="phone-msg-text">{t(`m.${m.id}.text`)}</p>
            </div>

            {answer === null ? (
              <div className="spot-buttons">
                <button type="button" className="btn spot-scam" onClick={() => pick(true, m)}><Icon name="alert" size={18} />{t('scam')}</button>
                <button type="button" className="btn spot-safe" onClick={() => pick(false, m)}><Icon name="check" size={18} />{t('safe')}</button>
              </div>
            ) : (
              <div className={`feedback ${right ? 'tone-good' : 'tone-bad'}`} aria-live="polite">
                <p className="feedback-verdict">{right ? t('right') : t('wrong')} {m.scam ? t('itWasScam') : t('itWasSafe')}</p>
                <p>{t(`m.${m.id}.why`)}</p>
                <button type="button" className="btn btn-primary" onClick={next}>{t('next')}</button>
              </div>
            )}
          </div>
        );
      })()}

      {round && done && (
        <div className="spot-done">
          <div className="final-result is-pass">
            <span className="result-score">{score} / {round.length}</span>
            <p>{t('done', { score, total: round.length })}</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={start}>{t('again')}</button>
        </div>
      )}
      </div>
    </section>
  );
}
