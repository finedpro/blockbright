import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LogoMark } from './components/Art';
import { Icon } from './components/Icon';
import { applyDocumentLanguage } from './i18n';
import { getLanguage, visibleLanguages } from './i18n/languages';
import { AboutPage } from './pages/AboutPage';
import { GlossaryPage } from './pages/GlossaryPage';
import { HomePage } from './pages/HomePage';
import { LandingPage } from './pages/LandingPage';
import { LessonPage } from './pages/LessonPage';
import { FinalTestPage } from './pages/FinalTestPage';
import { ReviewPage } from './pages/ReviewPage';
import { RulesPage } from './pages/RulesPage';
import { SettingsPage } from './pages/SettingsPage';
import { useAppState } from './state/AppState';

type Route =
  | { page: 'landing' }
  | { page: 'learn' }
  | { page: 'lesson'; id: string }
  | { page: 'review' }
  | { page: 'final' }
  | { page: 'rules' }
  | { page: 'glossary' }
  | { page: 'settings' }
  | { page: 'about' };

function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/');
  switch (parts[0]) {
    case 'learn':
      return { page: 'learn' };
    case 'lesson':
      return parts[1] ? { page: 'lesson', id: parts[1] } : { page: 'learn' };
    case 'review':
      return { page: 'review' };
    case 'final':
      return { page: 'final' };
    case 'rules':
      return { page: 'rules' };
    case 'glossary':
      return { page: 'glossary' };
    case 'settings':
      return { page: 'settings' };
    case 'about':
      return { page: 'about' };
    default:
      return { page: 'landing' };
  }
}

function navigate(path: string) {
  window.location.hash = path;
}

export default function App() {
  const { t, i18n } = useTranslation();
  const { setLanguage } = useAppState();
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHash = () => {
      const next = parseHash(window.location.hash);
      // In-page anchors on the landing page (e.g. #how) are not routes.
      if (window.location.hash.startsWith('#/') || window.location.hash === '' || next.page !== 'landing') {
        setRoute(next);
        window.scrollTo({ top: 0 });
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const changeLanguage = (code: string) => {
    void i18n.changeLanguage(code);
    applyDocumentLanguage(code);
    setLanguage(code);
  };

  const language = getLanguage(i18n.language);
  const inApp = route.page !== 'landing';
  const navItems = [
    { path: '/learn', icon: 'book', label: t('nav.home'), active: ['learn', 'lesson', 'review', 'final', 'rules'].includes(route.page) },
    { path: '/glossary', icon: 'cards', label: t('nav.glossary'), active: route.page === 'glossary' },
    { path: '/settings', icon: 'settings', label: t('nav.settings'), active: route.page === 'settings' },
    { path: '/about', icon: 'info', label: t('nav.about'), active: route.page === 'about' },
  ];

  return (
    <div className={`app ${inApp ? 'in-app' : 'on-landing'}`}>
      <a className="skip-link" href="#main">{t('app.skipToContent')}</a>
      <header className="site-header">
        <div className="wrap header-inner">
          <a className="brand" href="#/">
            <LogoMark size={30} />
            <span>{t('app.name')}</span>
          </a>
          <nav aria-label="Main" className="top-nav">
            <ul>
              {navItems.map((item) => (
                <li key={item.path}>
                  <a href={`#${item.path}`} aria-current={item.active ? 'page' : undefined}>{item.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="header-actions">
            <label className="lang-select">
              <span className="sr-only">{t('nav.language')}</span>
              <Icon name="globe" size={18} />
              <select value={language.code} onChange={(e) => changeLanguage(e.target.value)}>
                {visibleLanguages(import.meta.env.DEV).map((l) => (
                  <option key={l.code} value={l.code}>{l.code === 'rtl-test' ? 'RTL' : l.code.toUpperCase()}</option>
                ))}
              </select>
            </label>
            {!inApp && (
              <a className="btn btn-primary header-cta" href="#/learn">{t('nav.start')}</a>
            )}
          </div>
        </div>
      </header>

      {language.status === 'beta' && inApp && <p className="beta-banner wrap">{t('app.betaTranslation')}</p>}

      <main id="main" tabIndex={-1}>
        {route.page === 'landing' && <LandingPage onStart={() => navigate('/lesson/money-1')} />}
        {inApp && (
          <div className="wrap app-main">
            {route.page === 'learn' && <HomePage onOpenLesson={(id) => navigate(`/lesson/${id}`)} onNavigate={navigate} />}
            {route.page === 'review' && <ReviewPage onExit={() => navigate('/learn')} />}
            {route.page === 'final' && <FinalTestPage onExit={() => navigate('/learn')} />}
            {route.page === 'rules' && <RulesPage onExit={() => navigate('/learn')} />}
            {route.page === 'lesson' && <LessonPage key={route.id} id={route.id} onExit={() => navigate('/learn')} />}
            {route.page === 'glossary' && <GlossaryPage />}
            {route.page === 'settings' && <SettingsPage onLanguage={changeLanguage} />}
            {route.page === 'about' && <AboutPage />}
          </div>
        )}
      </main>

      <footer className="site-footer">
        <div className="wrap footer-inner">
          <span>{t('app.footer')}</span>
          <span>{t('app.notAdvice')} · {t('app.publishedBy')} · <a href="#/about">{t('nav.about')}</a></span>
        </div>
      </footer>

      {inApp && !['lesson', 'review', 'final'].includes(route.page) && (
        <nav aria-label="App" className="tab-bar">
          {navItems.map((item) => (
            <a key={item.path} href={`#${item.path}`} aria-current={item.active ? 'page' : undefined}>
              <Icon name={item.icon} size={22} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
