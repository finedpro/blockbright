import { useTranslation } from 'react-i18next';
import { Cube, HeroArt, MODULE_COLORS, MODULE_ON, ModuleCube, BRAND } from '../components/Art';
import { Icon } from '../components/Icon';
import { MODULES, lessonsInModule } from '../content/lessons';

const PROMISES = [
  { key: 'coin', icon: 'coin', color: BRAND.blue, on: '#FFFFFF' },
  { key: 'account', icon: 'user-off', color: BRAND.yellow, on: BRAND.ink },
  { key: 'ads', icon: 'shield', color: BRAND.orange, on: BRAND.ink },
  { key: 'language', icon: 'globe', color: BRAND.mint, on: BRAND.ink },
];
const STEPS = ['hook', 'learn', 'try', 'check', 'remember'] as const;

export function LandingPage({ onStart }: { onStart(): void }) {
  const { t } = useTranslation();

  const startButton = (
    <button type="button" className="btn btn-primary btn-lg" onClick={onStart}>
      {t('landing.ctaStart')}
      <Icon name="arrow" size={18} />
    </button>
  );

  return (
    <div className="landing">
      <section className="hero wrap">
        <div className="hero-copy">
          <span className="pill rise">
            <span className="pill-dot" aria-hidden="true" />
            {t('landing.badge')}
          </span>
          <h1 className="hero-title rise r2">
            {t('landing.heroLead')} <span className="hero-accent">{t('landing.heroAccent')}</span>
          </h1>
          <p className="hero-text rise r3">{t('landing.heroText')}</p>
          <div className="actions rise r4">
            {startButton}
            <a className="btn btn-outline btn-lg" href="#how">{t('landing.ctaHow')}</a>
          </div>
          <p className="hero-note">{t('landing.heroNote')}</p>
        </div>
        <div className="hero-visual">
          <HeroArt label={t('landing.heroArtLabel')} badge={t('landing.practiceBadge')} badgeHref="#/wallet" />
        </div>
      </section>

      <section className="wrap section">
        <div className="promise-grid">
          {PROMISES.map((p, i) => (
            <div key={p.key} className={`promise rise r${i + 1}`} style={{ boxShadow: `6px 6px 0 ${p.color}` }}>
              <span className="promise-icon" style={{ background: p.color, color: p.on }}>
                <Icon name={p.icon} size={24} />
              </span>
              <h3>{t(`landing.promises.${p.key}.title`)}</h3>
              <p>{t(`landing.promises.${p.key}.text`)}</p>
              {p.key === 'coin' && (
                <a className="promise-link" href="#/wallet">{t('landing.tryWallet')} →</a>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="dark-band" id="how">
        <div className="wrap section">
          <h2 className="section-title">{t('landing.explainTitle')}</h2>
          <p className="section-text">{t('landing.explainText')}</p>
          <ol className="step-grid">
            {STEPS.map((s, i) => (
              <li key={s} className="step">
                <span className="step-num" style={{ background: MODULE_COLORS[i], color: MODULE_ON[i] }}>{i + 1}</span>
                <span className="step-title">{t(`lesson.steps.${s}`)}</span>
                <span className="step-text">{t(`landing.stepsDesc.${s}`)}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="wrap section">
        <div className="section-head">
          <h2 className="section-title">{t('landing.modulesTitle')}</h2>
          <p className="section-text">{t('landing.modulesText')}</p>
        </div>
        <div className="module-grid">
          {MODULES.map((m, i) => {
            const open = lessonsInModule(m).length > 0;
            return (
              <article key={m} className={`module-card ${open ? 'is-open' : ''}`}>
                <div className="module-card-top">
                  <ModuleCube index={i} />
                  <span className={`status ${open ? 'status-open' : ''}`}>{open ? t('home.openNow') : t('home.comingSoon')}</span>
                </div>
                <h3>
                  <span className="sr-only">{t('home.module', { number: m })}: </span>
                  {m}. {t(`modules.m${m}`)}
                </h3>
                <p>{t(`modulesDesc.m${m}`)}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="wrap section">
        <div className="parents">
          <div className="parents-copy">
            <h2 className="section-title">{t('landing.parentsTitle')}</h2>
            <p>{t('landing.parentsText')}</p>
          </div>
          <ul className="parents-list">
            <li><Icon name="lock" size={22} />{t('landing.parents1')}</li>
            <li><Icon name="shield" size={22} />{t('landing.parents2')}</li>
            <li><Icon name="globe" size={22} />{t('landing.parents3')}</li>
          </ul>
        </div>
      </section>

      <section className="wrap section final">
        <svg width="180" height="120" viewBox="0 0 180 120" aria-hidden="true">
          <Cube cx={50} cy={48} w={34} color={BRAND.blue} className="anim-float" />
          <Cube cx={130} cy={48} w={34} color={BRAND.orange} className="anim-float delay-1" />
          <Cube cx={90} cy={26} w={34} color={BRAND.yellow} className="anim-float delay-2" />
        </svg>
        <h2 className="section-title">{t('landing.finalTitle')}</h2>
        {startButton}
      </section>
    </div>
  );
}
