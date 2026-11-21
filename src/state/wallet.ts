/**
 * The practice wallet. Practice coins have no value and never leave this device.
 * Addresses use a made-up "bb1" format with a one-character checksum, so a typo is
 * caught the way many real wallets catch it. The seed phrase is 12 everyday words
 * and cannot open any real wallet.
 */

export const START_BALANCE = 100;
export const SEND_FEE = 1;
/** How long a new transaction stays "pending" before it counts as confirmed. */
export const CONFIRM_MS = 6000;

const CHARS = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const BODY_LENGTH = 26;

const WORDS = [
  'apple', 'river', 'candle', 'tiger', 'window', 'garden', 'rocket', 'pencil', 'forest', 'cookie', 'planet', 'violin',
  'harbor', 'lemon', 'bridge', 'castle', 'meadow', 'turtle', 'silver', 'jacket', 'island', 'mirror', 'orange', 'pillow',
  'rabbit', 'saddle', 'thunder', 'velvet', 'wagon', 'yellow', 'anchor', 'basket', 'cactus', 'dragon', 'engine', 'falcon',
  'ginger', 'helmet', 'igloo', 'jungle', 'kettle', 'ladder', 'magnet', 'needle', 'oyster', 'parrot', 'quartz', 'ribbon',
  'shadow', 'ticket', 'umbrella', 'valley', 'walrus', 'zipper', 'bottle', 'canyon', 'desert', 'feather', 'glacier', 'hammer',
  'lantern', 'marble', 'noodle', 'orbit',
];

export type TxKind = 'start' | 'lesson' | 'send' | 'receive' | 'reset';

export interface WalletTx {
  id: string;
  /** When it was made (ms since epoch). */
  at: number;
  /** Change to the balance, fee included. Negative = coins left the wallet. */
  amount: number;
  kind: TxKind;
  /** Lesson title key or contact name, shown in the history. */
  note?: string;
  /** For sends: the receiving address. */
  to?: string;
  fee?: number;
}

export interface Wallet {
  balance: number;
  address: string;
  seed: string[];
  history: WalletTx[];
}

export interface Contact {
  name: string;
  address: string;
}

function checksum(body: string): string {
  let sum = 0;
  for (let i = 0; i < body.length; i++) sum += (CHARS.indexOf(body[i]) + 1) * (2 * i + 1); // odd weights: any single wrong character changes the checksum
  return CHARS[sum % CHARS.length];
}

/** Builds a valid practice address from any random numbers. */
export function makeAddress(random: (n: number) => number[]): string {
  const body = random(BODY_LENGTH).map((n) => CHARS[n % CHARS.length]).join('');
  return `bb1${body}${checksum(body)}`;
}

export type AddressCheck = 'ok' | 'empty' | 'format' | 'typo';

export function checkAddress(raw: string): AddressCheck {
  const a = raw.trim().toLowerCase();
  if (!a) return 'empty';
  if (!a.startsWith('bb1') || a.length !== 3 + BODY_LENGTH + 1) return 'format';
  const body = a.slice(3, -1);
  if ([...body].some((c) => !CHARS.includes(c))) return 'format';
  return checksum(body) === a.slice(-1) ? 'ok' : 'typo';
}

/** Fixed made-up friends, the same on every device. */
function fixedRandom(seed: number) {
  let x = seed;
  return (n: number) =>
    Array.from({ length: n }, () => {
      x = (x * 1103515245 + 12345) % 2147483648;
      return x >> 8;
    });
}
export const CONTACTS: Contact[] = [
  { name: 'Mia', address: makeAddress(fixedRandom(11)) },
  { name: 'Leo', address: makeAddress(fixedRandom(23)) },
  { name: 'Sara', address: makeAddress(fixedRandom(37)) },
];

function cryptoRandom(n: number): number[] {
  const arr = new Uint32Array(n);
  globalThis.crypto.getRandomValues(arr);
  return [...arr];
}

export function newId(): string {
  return cryptoRandom(2).map((n) => n.toString(36)).join('');
}

export function createWallet(now: number, random: (n: number) => number[] = cryptoRandom): Wallet {
  const seed = random(12).map((n) => WORDS[n % WORDS.length]);
  return {
    balance: START_BALANCE,
    address: makeAddress(random),
    seed,
    history: [{ id: newId(), at: now, amount: START_BALANCE, kind: 'start' }],
  };
}

/** Coins lost in a lesson: a number below zero, or "all". The balance never goes below zero. */
export function lessonLoss(wallet: Wallet, coins: number | 'all', note: string, now: number, id = newId()): { wallet: Wallet; tx: WalletTx } {
  const lost = coins === 'all' ? wallet.balance : Math.min(wallet.balance, Math.abs(coins));
  const tx: WalletTx = { id, at: now, amount: -lost, kind: 'lesson', note };
  return { wallet: { ...wallet, balance: wallet.balance - lost, history: [tx, ...wallet.history] }, tx };
}

/** Takes a transaction back out of the history (lesson rewind only). */
export function undoTx(wallet: Wallet, id: string): Wallet {
  const tx = wallet.history.find((t) => t.id === id);
  if (!tx || tx.kind !== 'lesson') return wallet;
  return { ...wallet, balance: wallet.balance - tx.amount, history: wallet.history.filter((t) => t.id !== id) };
}

export type SendError = 'address' | 'self' | 'amount' | 'funds';

export function validateSend(wallet: Wallet, to: string, amount: number): SendError | null {
  if (checkAddress(to) !== 'ok') return 'address';
  if (to.trim().toLowerCase() === wallet.address) return 'self';
  if (!Number.isInteger(amount) || amount < 1) return 'amount';
  if (amount + SEND_FEE > wallet.balance) return 'funds';
  return null;
}

export function send(wallet: Wallet, to: string, amount: number, now: number): Wallet {
  const address = to.trim().toLowerCase();
  const contact = CONTACTS.find((c) => c.address === address);
  const tx: WalletTx = { id: newId(), at: now, amount: -(amount + SEND_FEE), kind: 'send', to: address, fee: SEND_FEE, note: contact?.name };
  return { ...wallet, balance: wallet.balance + tx.amount, history: [tx, ...wallet.history] };
}

export function receive(wallet: Wallet, from: Contact, amount: number, now: number): Wallet {
  const tx: WalletTx = { id: newId(), at: now, amount, kind: 'receive', note: from.name };
  return { ...wallet, balance: wallet.balance + amount, history: [tx, ...wallet.history] };
}

export function resetWallet(wallet: Wallet, now: number): Wallet {
  const tx: WalletTx = { id: newId(), at: now, amount: START_BALANCE - wallet.balance, kind: 'reset' };
  return { ...wallet, balance: START_BALANCE, history: [tx, ...wallet.history].slice(0, 50) };
}

export function isPending(tx: WalletTx, now: number): boolean {
  return (tx.kind === 'send' || tx.kind === 'receive') && now - tx.at < CONFIRM_MS;
}
