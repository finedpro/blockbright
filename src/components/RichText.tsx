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
  return (
    <Tag className={className}>
      {parseRichText(text).map((seg, i) => {
        if (seg.kind === 'text') return <span key={i}>{seg.text}</span>;
        const firstHere = !seenHere.has(seg.id);
        seenHere.add(seg.id);
        const first = firstHere && (owners ? owners.get(seg.id) === textKey : false);
        return <Term key={i} id={seg.id} form={seg.form} first={first} />;
      })}
    </Tag>
  );
}
