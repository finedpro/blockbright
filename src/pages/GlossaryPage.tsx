import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ENGLISH_GLOSSARY, TERM_IDS, showsEnglishTerm, termEntry } from '../content/glossary';

export function GlossaryPage() {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const language = i18n.language;
  const collator = new Intl.Collator(language === 'rtl-test' ? 'en' : language);

  const q = query.trim().toLowerCase();
  const entries = TERM_IDS.map((id) => ({ id, native: termEntry(id, language), english: ENGLISH_GLOSSARY[id] }))
    .filter(
      (e) =>
        !q ||
        e.native.term.toLowerCase().includes(q) ||
        e.english.term.toLowerCase().includes(q) ||
        e.native.definition.toLowerCase().includes(q),
    )
    .sort((a, b) => collator.compare(a.native.term, b.native.term));

  return (
    <section>
      <h1>{t('glossary.title')}</h1>
      <p className="lead">{t('glossary.intro')}</p>
      <label className="search">
        <span className="sr-only">{t('glossary.search')}</span>
        <input type="search" placeholder={t('glossary.search')} value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      {entries.length === 0 && <p className="muted">{t('glossary.empty')}</p>}
      <dl className="term-list">
        {entries.map((e) => (
          <div key={e.id}>
            <dt>
              {e.native.term}
              {showsEnglishTerm(language) && <span className="term-english" lang="en"> ({e.english.term})</span>}
            </dt>
            <dd>{e.native.definition}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
