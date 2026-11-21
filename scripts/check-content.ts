/**
 * Content check, run before every build (`npm run check`). Fails the build when:
 * - a lesson file does not match the schema,
 * - a language is missing a key that English has, or has a key English does not,
 * - a simulation choice lacks any part of its explanation (what / why / how / realLife),
 * - a text refers to a glossary term that does not exist,
 * - a glossary language is missing a term or a definition,
 * - a text is not valid ICU message syntax.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { IntlMessageFormat } from 'intl-messageformat';
import { lessonSchema, lessonTextKeys } from '../src/content/schema';
import { termIdsIn } from '../src/content/richText';

const root = join(import.meta.dirname, '..');
const localesDir = join(root, 'src/locales');
const lessonsDir = join(root, 'src/content/lessons');
const glossaryDir = join(root, 'src/content/glossary');
const SOURCE = 'en';

const errors: string[] = [];
const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'));

function flatten(obj: unknown, prefix = '', out: Record<string, string> = {}): Record<string, string> {
  if (typeof obj === 'string') out[prefix] = obj;
  else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  }
  return out;
}

const languages = readdirSync(localesDir);
const namespaces = readdirSync(join(localesDir, SOURCE)).map((f) => f.replace(/\.json$/, ''));
const glossaryIds = new Set(Object.keys(readJson(join(glossaryDir, `${SOURCE}.json`)) as object));

// 1. Locale files: same keys as English, valid ICU, known glossary terms.
for (const ns of namespaces) {
  const source = flatten(readJson(join(localesDir, SOURCE, `${ns}.json`)));
  for (const lng of languages) {
    let texts: Record<string, string>;
    try {
      texts = flatten(readJson(join(localesDir, lng, `${ns}.json`)));
    } catch {
      errors.push(`${lng}/${ns}.json is missing`);
      continue;
    }
    for (const key of Object.keys(source)) if (!(key in texts)) errors.push(`${lng}/${ns}: missing key "${key}"`);
    for (const key of Object.keys(texts)) if (!(key in source)) errors.push(`${lng}/${ns}: extra key "${key}" (not in English)`);
    for (const [key, text] of Object.entries(texts)) {
      try {
        new IntlMessageFormat(text, lng === 'rtl-test' ? 'en' : lng).format({ count: 1, number: 1, score: 1, total: 1, current: 1, choice: 'x' });
      } catch (e) {
        errors.push(`${lng}/${ns}: "${key}" is not valid ICU: ${(e as Error).message}`);
      }
      for (const id of termIdsIn(text)) if (!glossaryIds.has(id)) errors.push(`${lng}/${ns}: "${key}" uses unknown term [[${id}]]`);
    }
  }
}

// 2. Lessons: schema, and every text the lesson needs exists in every language.
for (const file of readdirSync(lessonsDir)) {
  const parsed = lessonSchema.safeParse(readJson(join(lessonsDir, file)));
  if (!parsed.success) {
    errors.push(`lesson ${file}: ${parsed.error.issues.map((i) => i.message).join('; ')}`);
    continue;
  }
  const lesson = parsed.data;
  const ns = `lesson-${lesson.id}`;
  if (!namespaces.includes(ns)) {
    errors.push(`lesson ${lesson.id}: no English text file ${SOURCE}/${ns}.json`);
    continue;
  }
  for (const lng of languages) {
    let texts: Record<string, string>;
    try {
      texts = flatten(readJson(join(localesDir, lng, `${ns}.json`)));
    } catch {
      continue; // already reported above
    }
    for (const key of lessonTextKeys(lesson)) if (!(key in texts)) errors.push(`${lng}/${ns}: lesson needs "${key}"`);
  }
}

// 3. Glossary: every language has every term with a term and a definition.
for (const file of readdirSync(glossaryDir)) {
  const lng = file.replace(/\.json$/, '');
  const glossary = readJson(join(glossaryDir, file)) as Record<string, { term?: string; definition?: string }>;
  for (const id of glossaryIds) {
    const entry = glossary[id];
    if (!entry?.term || !entry.definition) errors.push(`glossary/${lng}: "${id}" needs a term and a definition`);
  }
  for (const id of Object.keys(glossary)) if (!glossaryIds.has(id)) errors.push(`glossary/${lng}: extra term "${id}" (not in English)`);
}
for (const lng of languages) {
  try {
    readFileSync(join(glossaryDir, `${lng}.json`));
  } catch {
    errors.push(`glossary/${lng}.json is missing`);
  }
}

if (errors.length) {
  console.error(`Content check failed with ${errors.length} problem(s):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`Content check passed: ${languages.length} languages, ${namespaces.length} namespaces, ${glossaryIds.size} glossary terms.`);
