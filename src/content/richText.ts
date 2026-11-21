/**
 * Lesson text marks glossary terms as [[id]] or [[id|form in this sentence]].
 * The second form lets translators use the right grammatical case
 * (e.g. Estonian [[address|aadressi]], Finnish [[address|osoitteen]]).
 */
export type Segment = { kind: 'text'; text: string } | { kind: 'term'; id: string; form?: string };

const TERM_PATTERN = /\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g;

export function parseRichText(text: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  for (const match of text.matchAll(TERM_PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) segments.push({ kind: 'text', text: text.slice(last, index) });
    segments.push({ kind: 'term', id: match[1], form: match[2] });
    last = index + match[0].length;
  }
  if (last < text.length) segments.push({ kind: 'text', text: text.slice(last) });
  return segments;
}

export function termIdsIn(text: string): string[] {
  return [...text.matchAll(TERM_PATTERN)].map((m) => m[1]);
}

/** Text with term markup removed, for search and screen-reader labels. */
export function plainText(text: string): string {
  return text.replace(TERM_PATTERN, (_m, id: string, form?: string) => form ?? id);
}

/**
 * The English term rule: in each lesson, the first use of a term shows the English term
 * in brackets. Given the lesson's texts in reading order, returns for each term the key
 * of the text where it first appears.
 */
export function firstTermOwners(texts: { key: string; text: string }[]): Map<string, string> {
  const owners = new Map<string, string>();
  for (const { key, text } of texts) {
    for (const id of termIdsIn(text)) if (!owners.has(id)) owners.set(id, key);
  }
  return owners;
}
