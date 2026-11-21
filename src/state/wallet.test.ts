import { describe, expect, it } from 'vitest';
import { CONTACTS, checkAddress, createWallet, lessonLoss, makeAddress, receive, resetWallet, send, undoTx, validateSend } from './wallet';

const rnd = (() => { let i = 0; return (n: number) => Array.from({ length: n }, () => (i += 7)); })();

describe('practice wallet', () => {
  it('makes addresses that pass the check, and catches a one-letter typo', () => {
    const a = makeAddress(rnd);
    expect(checkAddress(a)).toBe('ok');
    const typo = a.slice(0, 10) + (a[10] === 'q' ? 'p' : 'q') + a.slice(11);
    expect(checkAddress(typo)).toBe('typo');
    expect(checkAddress('hello')).toBe('format');
    expect(CONTACTS.every((c) => checkAddress(c.address) === 'ok')).toBe(true);
  });

  it('starts with 100 coins and loses at most the balance in lessons', () => {
    const w = createWallet(0, rnd);
    expect(w.balance).toBe(100);
    expect(w.seed).toHaveLength(12);
    const { wallet, tx } = lessonLoss(w, -30, 'x', 1);
    expect(wallet.balance).toBe(70);
    expect(lessonLoss(wallet, 'all', 'x', 2).wallet.balance).toBe(0);
    expect(lessonLoss(wallet, -500, 'x', 2).wallet.balance).toBe(0);
    expect(undoTx(wallet, tx.id).balance).toBe(100);
  });

  it('sends with a fee, receives and resets', () => {
    const w = createWallet(0, rnd);
    expect(validateSend(w, CONTACTS[0].address, 100)).toBe('funds');
    expect(validateSend(w, w.address, 5)).toBe('self');
    expect(validateSend(w, CONTACTS[0].address, 0)).toBe('amount');
    const sent = send(w, CONTACTS[0].address, 20, 1);
    expect(sent.balance).toBe(79);
    expect(sent.history[0].note).toBe('Mia');
    const got = receive(sent, CONTACTS[1], 10, 2);
    expect(got.balance).toBe(89);
    expect(resetWallet(got, 3).balance).toBe(100);
  });
});
