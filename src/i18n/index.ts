import i18next, { type Resource } from 'i18next';
import ICU from 'i18next-icu';
import { initReactI18next } from 'react-i18next';
import { LANGUAGES, SOURCE_LANGUAGE, getLanguage } from './languages';

// Every locale file is src/locales/<language>/<namespace>.json
const files = import.meta.glob<Record<string, unknown>>('../locales/*/*.json', { eager: true, import: 'default' });

function buildResources(): Resource {
  const resources: Resource = {};
  for (const [path, data] of Object.entries(files)) {
    const match = path.match(/locales\/([^/]+)\/([^/]+)\.json$/);
    if (!match) continue;
    const [, lng, ns] = match;
    resources[lng] ??= {};
    resources[lng][ns] = data as Record<string, unknown>;
  }
  // The RTL test locale reuses English text so the right-to-left layout can be checked.
  if (resources[SOURCE_LANGUAGE]) resources['rtl-test'] = resources[SOURCE_LANGUAGE];
  return resources;
}

export const NAMESPACES = ['ui'];

export function initI18n(language: string) {
  return i18next
    .use(ICU)
    .use(initReactI18next)
    .init({
      resources: buildResources(),
      lng: language,
      fallbackLng: SOURCE_LANGUAGE,
      supportedLngs: LANGUAGES.map((l) => l.code),
      defaultNS: 'ui',
      ns: NAMESPACES,
      interpolation: { escapeValue: false },
      returnNull: false,
    });
}

/** Keep <html lang> and <html dir> in step with the selected language. */
export function applyDocumentLanguage(code: string) {
  const lang = getLanguage(code);
  document.documentElement.lang = lang.code === 'rtl-test' ? 'en' : lang.code;
  document.documentElement.dir = lang.dir;
}

export default i18next;
