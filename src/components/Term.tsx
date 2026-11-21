import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ENGLISH_GLOSSARY, showsEnglishTerm, termEntry } from '../content/glossary';

interface TermProps {
  id: string;
  /** The word as it appears in this sentence (inflected form). Defaults to the glossary term. */
  form?: string;
  /** First use in the lesson: show the English term in brackets. */
  first?: boolean;
}

/**
 * A glossary term in running text. Tap or hover shows the English term and a short definition.
 */
export function Term({ id, form, first = false }: TermProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const popId = useId();
  const ref = useRef<HTMLSpanElement>(null);
  const language = i18n.language;
  const entry = termEntry(id, language);
  const english = ENGLISH_GLOSSARY[id]?.term ?? id;
  const withEnglish = showsEnglishTerm(language);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  return (
    <span className="term" ref={ref}>
      <button
        type="button"
        className="term-button"
        aria-expanded={open}
        aria-controls={popId}
        onClick={() => setOpen((v) => !v)}
      >
        {form ?? entry.term}
      </button>
      {first && withEnglish && <span className="term-english"> ({english})</span>}
      {open && (
        <span className="term-pop" id={popId} role="note">
          {withEnglish && (
            <span className="term-pop-english">
              {t('term.english')}: <strong lang="en">{english}</strong>
            </span>
          )}
          <span className="term-pop-def">{entry.definition}</span>
        </span>
      )}
    </span>
  );
}
