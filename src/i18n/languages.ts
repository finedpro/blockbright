/**
 * Supported languages. English is the source language.
 * status: "stable" = reviewed by a native speaker, "beta" = not yet reviewed,
 * "dev" = development-only test locale (never shown in production).
 */
export type LanguageStatus = 'stable' | 'beta' | 'dev';

export interface Language {
  code: string;
  /** Name of the language in that language. */
  name: string;
  dir: 'ltr' | 'rtl';
  status: LanguageStatus;
  /** Locale used for numbers and dates. */
  locale: string;
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', dir: 'ltr', status: 'stable', locale: 'en' },
  { code: 'et', name: 'Eesti', dir: 'ltr', status: 'beta', locale: 'et' },
  { code: 'fi', name: 'Suomi', dir: 'ltr', status: 'beta', locale: 'fi' },
  // Right-to-left layout test: English text in an RTL layout. Development builds only.
  { code: 'rtl-test', name: 'RTL test', dir: 'rtl', status: 'dev', locale: 'en' },
];

export const SOURCE_LANGUAGE = 'en';

export function visibleLanguages(isDev: boolean): Language[] {
  return LANGUAGES.filter((l) => isDev || l.status !== 'dev');
}

export function getLanguage(code: string): Language {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

/** Pick the best supported language from the browser's preferences. */
export function detectLanguage(preferred: readonly string[]): string {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split('-')[0];
    const match = LANGUAGES.find((l) => l.status !== 'dev' && l.code === base);
    if (match) return match.code;
  }
  return SOURCE_LANGUAGE;
}
