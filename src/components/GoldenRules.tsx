import { useTranslation } from 'react-i18next';
import { BRAND, LogoMark } from './Art';
import { Icon } from './Icon';

export const GOLDEN_RULES = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'] as const;
const COLORS = [BRAND.blue, BRAND.orange, BRAND.yellow, BRAND.mint];

/** The golden rules card. Prints on one page (browser print → Save as PDF to download). */
export function GoldenRules() {
  const { t } = useTranslation();
  return (
    <div className="golden-wrap">
      <article className="golden" aria-labelledby="golden-title">
        <header className="golden-head">
          <LogoMark size={36} />
          <div>
            <h2 id="golden-title">{t('rules.title')}</h2>
            <p>{t('rules.subtitle')}</p>
          </div>
        </header>
        <ol>
          {GOLDEN_RULES.map((r, i) => (
            <li key={r}>
              <span className="golden-num" style={{ background: COLORS[i % COLORS.length], color: i % 4 === 0 ? '#fff' : BRAND.ink }}>{i + 1}</span>
              <span>
                <strong>{t(`rules.${r}.title`)}</strong>
                <span className="golden-text">{t(`rules.${r}.text`)}</span>
              </span>
            </li>
          ))}
        </ol>
        <footer className="golden-foot">{t('rules.footer')}</footer>
      </article>
      <button type="button" className="btn btn-primary no-print" onClick={() => window.print()}>
        <Icon name="send" size={18} />
        {t('rules.print')}
      </button>
      <p className="muted no-print">{t('rules.printHint')}</p>
    </div>
  );
}
