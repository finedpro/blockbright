import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { applyDocumentLanguage, initI18n } from './i18n';
import { detectLanguage, getLanguage } from './i18n/languages';
import { AppStateProvider } from './state/AppState';
import { loadState } from './state/storage';
import '@fontsource-variable/inter';
import '@fontsource-variable/sora';
import '@fontsource/jetbrains-mono/500.css';
import './styles.css';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });

const saved = loadState().language;
const savedLanguage = saved && (import.meta.env.DEV || getLanguage(saved).status !== 'dev') ? getLanguage(saved).code : undefined;
const language = savedLanguage ?? detectLanguage(navigator.languages ?? [navigator.language]);

void initI18n(language).then(() => {
  applyDocumentLanguage(language);
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppStateProvider>
        <App />
      </AppStateProvider>
    </StrictMode>,
  );
});
