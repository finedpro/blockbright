import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { applyDocumentLanguage } from './i18n';
import { getLanguage } from './i18n/languages';
import { AboutPage } from './pages/AboutPage';
import { GlossaryPage } from './pages/GlossaryPage';
import { HomePage } from './pages/HomePage';
import { LessonPage } from './pages/LessonPage';
import { SettingsPage } from './pages/SettingsPage';
import { useAppState } from './state/AppState';

type Route = { page: 'home' } | { page: 'lesson'; id: string } | { page: 'glossary' } | { page: 'settings' } | { page: 'about' };

function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/');
  switch (parts[0]) {
    case 'lesson':
      return parts[1] ? { page: 'lesson', id: parts[1] } : { page: 'home' };
    case 'glossary':
      return { page: 'glossary' };
    case 'settings':
      return { page: 'settings' };
    case 'about':
      return { page: 'about' };
    default:
      return { page: 'home' };
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
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0 });
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
  const navItems: { path: string; label: string; active: boolean }[] = [
    { path: '/', label: t('nav.home'), active: route.page === 'home' || route.page === 'lesson' },
    { path: '/glossary', label: t('nav.glossary'), active: route.page === 'glossary' },
    { path: '/settings', label: t('nav.settings'), active: route.page === 'settings' },
    { path: '/about', label: t('nav.about'), active: route.page === 'about' },
  ];

  return (
    <div className="app">
      <a className="skip-link" href="#main">{t('app.skipToContent')}</a>
      <header className="site-header">
        <a className="brand" href="#/">
          <span className="brand-mark" aria-hidden="true" />
          {t('app.name')}
        </a>
        <nav aria-label="Main">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <a href={`#${item.path}`} aria-current={item.active ? 'page' : undefined}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      {language.status === 'beta' && (
        <p className="beta-banner">{t('app.betaTranslation')}</p>
      )}
      <main id="main" tabIndex={-1}>
        {route.page === 'home' && (
          <>
            <p className="tagline">{t('app.tagline')}</p>
            <HomePage onOpenLesson={(id) => navigate(`/lesson/${id}`)} />
          </>
        )}
        {route.page === 'lesson' && <LessonPage key={route.id} id={route.id} onExit={() => navigate('/')} />}
        {route.page === 'glossary' && <GlossaryPage />}
        {route.page === 'settings' && <SettingsPage onLanguage={changeLanguage} />}
        {route.page === 'about' && <AboutPage />}
      </main>
      <footer className="site-footer">
        <p>{t('app.footer')}</p>
      </footer>
    </div>
  );
}
