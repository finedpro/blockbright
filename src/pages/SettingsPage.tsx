import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { visibleLanguages } from '../i18n/languages';
import { useAppState } from '../state/AppState';
import type { ExplainLevel } from '../state/storage';

export function SettingsPage({ onLanguage }: { onLanguage(code: string): void }) {
  const { t, i18n } = useTranslation();
  const { state, setExplainLevel, resetProgress } = useAppState();
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const levels: ExplainLevel[] = ['simple', 'detailed'];

  return (
    <section>
      <h1>{t('settings.title')}</h1>

      <fieldset className="setting">
        <legend>{t('settings.language')}</legend>
        {visibleLanguages(import.meta.env.DEV).map((l) => (
          <label key={l.code} className="option">
            <input type="radio" name="language" checked={i18n.language === l.code} onChange={() => onLanguage(l.code)} />
            <span lang={l.code === 'rtl-test' ? 'en' : l.code}>{l.name}</span>
            {l.status === 'beta' && <span className="badge">{t('app.betaTranslation')}</span>}
          </label>
        ))}
      </fieldset>

      <fieldset className="setting">
        <legend>{t('settings.explainLevel')}</legend>
        {levels.map((level) => (
          <label key={level} className="option">
            <input type="radio" name="explain" checked={state.explainLevel === level} onChange={() => setExplainLevel(level)} />
            <span>
              <strong>{t(`settings.${level}`)}</strong>
              <span className="muted block">{t(`settings.${level}Hint`)}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="setting">
        <legend>{t('settings.progress')}</legend>
        <p className="muted">{t('settings.progressNote')}</p>
        {!confirming && (
          <button type="button" className="secondary" onClick={() => { setConfirming(true); setDone(false); }}>
            {t('settings.reset')}
          </button>
        )}
        {confirming && (
          <div className="actions">
            <button
              type="button"
              className="danger"
              onClick={() => {
                resetProgress();
                setConfirming(false);
                setDone(true);
              }}
            >
              {t('settings.resetConfirm')}
            </button>
            <button type="button" className="secondary" onClick={() => setConfirming(false)}>{t('settings.resetCancel')}</button>
          </div>
        )}
        {done && <p role="status">{t('settings.resetDone')}</p>}
      </fieldset>
    </section>
  );
}
