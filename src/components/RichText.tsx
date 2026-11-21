import { createContext, useContext, type ElementType } from 'react';
import { parseRichText } from '../content/richText';
import { Term } from './Term';

/** For the English term rule: which text key holds the first use of each term in this lesson. */
export const TermOwnersContext = createContext<Map<string, string> | null>(null);

interface RichTextProps {
  text: string;
  /** The text's key, used to decide where a term is first used. */
  textKey?: string;
  as?: ElementType;
  className?: string;
}

export function RichText({ text, textKey, as: Tag = 'span', className }: RichTextProps) {
  const owners = useContext(TermOwnersContext);
  const seenHere = new Set<string>();
  const segments = parseRichText(text);
  // Punctuation right after a term stays on the same line as the term.
  const glued = new Map<number, string>();
  segments.forEach((seg, i) => {
    const next = segments[i + 1];
    if (seg.kind !== 'text' && next?.kind === 'text') {
      const m = /^[.,:;!?)\]\u201d\u201c"\u00bb%]+/.exec(next.text);
      if (m) glued.set(i + 1, m[0]);
    }
  });
  return (
    <Tag className={className}>
      {segments.map((seg, i) => {
        if (seg.kind === 'text') {
          const cut = glued.get(i)?.length ?? 0;
          return cut < seg.text.length ? <span key={i}>{seg.text.slice(cut)}</span> : null;
        }
        const firstHere = !seenHere.has(seg.id);
        seenHere.add(seg.id);
        const first = firstHere && (owners ? owners.get(seg.id) === textKey : false);
        const tail = glued.get(i + 1);
        const term = <Term id={seg.id} form={seg.form} first={first} />;
        return tail ? (
          <span key={i} className="term-glue">{term}{tail}</span>
        ) : (
          <span key={i} className="term-wrap">{term}</span>
        );
      })}
    </Tag>
  );
}
