import en from './glossary/en.json';
import et from './glossary/et.json';
import fi from './glossary/fi.json';

export interface GlossaryEntry {
  term: string;
  definition: string;
}

export type Glossary = Record<string, GlossaryEntry>;

/**
 * The English glossary is the locked source: the English term shown beside every
 * translated term always comes from here, so a translation cannot change it.
 */
export const ENGLISH_GLOSSARY: Glossary = en;

const GLOSSARIES: Record<string, Glossary> = { en, et, fi, 'rtl-test': en };

export const TERM_IDS = Object.keys(ENGLISH_GLOSSARY);

export function glossaryFor(language: string): Glossary {
  return GLOSSARIES[language] ?? ENGLISH_GLOSSARY;
}

export function termEntry(id: string, language: string): GlossaryEntry {
  return glossaryFor(language)[id] ?? ENGLISH_GLOSSARY[id] ?? { term: id, definition: '' };
}

/** Whether a language shows the English term beside its own term. */
export function showsEnglishTerm(language: string): boolean {
  return language !== 'en' && language !== 'rtl-test';
}
