import { describe, expect, it } from 'vitest';
import { firstTermOwners, parseRichText, plainText, termIdsIn } from './richText';

describe('rich text terms', () => {
  it('parses plain and inflected terms', () => {
    expect(parseRichText('Send to the [[address|aadressi]] now')).toEqual([
      { kind: 'text', text: 'Send to the ' },
      { kind: 'term', id: 'address', form: 'aadressi' },
      { kind: 'text', text: ' now' },
    ]);
    expect(termIdsIn('[[wallet]] and [[private-key|key]]')).toEqual(['wallet', 'private-key']);
    expect(plainText('Your [[address|aadress]] and [[fee]]')).toBe('Your aadress and fee');
  });

  it('assigns each term to the first text that uses it', () => {
    const owners = firstTermOwners([
      { key: 'hook', text: 'Paste the [[address]].' },
      { key: 'card1', text: 'An [[address]] belongs to a [[wallet]].' },
    ]);
    expect(owners.get('address')).toBe('hook');
    expect(owners.get('wallet')).toBe('card1');
  });
});
