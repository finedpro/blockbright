import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Icon } from '../components/Icon';
import { lessonNamespace } from '../content/lessons';
import { useAppState } from '../state/AppState';
import { CONTACTS, SEND_FEE, checkAddress, isPending, validateSend, type Contact, type WalletTx } from '../state/wallet';

type Tab = 'send' | 'receive' | 'seed' | 'history';

const short = (a: string) => `${a.slice(0, 7)}…${a.slice(-4)}`;

/** Address with the first and last four characters highlighted: the part people should compare. */
function Address({ value }: { value: string }) {
  return (
    <code className="address">
      <mark>{value.slice(0, 4)}</mark>
      {value.slice(4, -4)}
      <mark>{value.slice(-4)}</mark>
    </code>
  );
}

export function WalletPage() {
  const { t } = useTranslation();
  const { wallet } = useAppState();
  const [tab, setTab] = useState<Tab>('send');
  const [now, setNow] = useState(Date.now());
  const pending = wallet.history.some((tx) => isPending(tx, now));
  useEffect(() => {
    if (!pending) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [pending]);

  return (
    <section className="wallet-page">
      <h1>{t('wallet.title')}</h1>
      <p className="muted">{t('wallet.intro')}</p>

      <div className="wallet-card">
        <span className="wallet-label">{t('wallet.balanceLabel')}</span>
        <span className="wallet-balance"><Icon name="coin" size={26} /> {wallet.balance}</span>
        <span className="wallet-label">{t('wallet.address')}</span>
        <Address value={wallet.address} />
        <CopyButton text={wallet.address} />
      </div>

      <div className="segmented wallet-tabs" role="tablist">
        {(['send', 'receive', 'seed', 'history'] as Tab[]).map((k) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'selected' : ''} onClick={() => setTab(k)}>
            {t(`wallet.tab.${k}`)}
          </button>
        ))}
      </div>

      {tab === 'send' && <SendPanel onSent={() => { setNow(Date.now()); setTab('history'); }} />}
      {tab === 'receive' && <ReceivePanel onAsked={() => { setNow(Date.now()); setTab('history'); }} />}
      {tab === 'seed' && <SeedPanel />}
      {tab === 'history' && <HistoryPanel now={now} />}
    </section>
  );
}

function CopyButton({ text }: { text: string }) {
  const { t } = useTranslation();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="link-button copy-button"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => setDone(true), () => setDone(false));
      }}
    >
      {done ? t('wallet.copied') : t('wallet.copy')}
    </button>
  );
}

function SendPanel({ onSent }: { onSent(): void }) {
  const { t } = useTranslation();
  const { wallet, sendCoins } = useAppState();
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('10');
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState(false);
  const value = Number(amount);
  const address = to.trim().toLowerCase();
  const contact = CONTACTS.find((c) => c.address === address);

  const toReview = () => {
    const check = checkAddress(to);
    if (check !== 'ok') return setError(check === 'typo' ? t('wallet.err.typo') : t('wallet.err.address'));
    const e = validateSend(wallet, to, value);
    if (e) return setError(t(`wallet.err.${e}`));
    setError(null);
    setReview(true);
  };

  if (review) {
    return (
      <div className="wallet-panel">
        <h2>{t('wallet.reviewTitle')}</h2>
        <dl className="review-list">
          <dt>{t('wallet.to')}</dt>
          <dd>{contact ? <strong>{contact.name}</strong> : <span className="warn-text">{t('wallet.unknownAddress')}</span>}<Address value={address} /></dd>
          <dt>{t('wallet.amount')}</dt>
          <dd>{value}</dd>
          <dt>{t('wallet.fee')}</dt>
          <dd>{SEND_FEE}</dd>
          <dt>{t('wallet.total')}</dt>
          <dd><strong>{value + SEND_FEE}</strong></dd>
        </dl>
        <p className="sure-note is-warn"><Icon name="alert" size={18} />{t('wallet.irreversible')}</p>
        <div className="actions">
          <button type="button" className="btn btn-outline" onClick={() => setReview(false)}>{t('wallet.edit')}</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              sendCoins(address, value);
              setReview(false);
              setTo('');
              onSent();
            }}
          >
            <Icon name="send" size={18} />
            {t('wallet.confirm')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-panel">
      <p className="muted">{t('wallet.pickFriend')}</p>
      <div className="contact-row">
        {CONTACTS.map((c) => (
          <button key={c.name} type="button" className={`contact ${address === c.address ? 'is-picked' : ''}`} onClick={() => { setTo(c.address); setError(null); }}>
            <span className="contact-avatar" aria-hidden="true">{c.name[0]}</span>
            {c.name}
          </button>
        ))}
      </div>
      <label className="field">
        <span>{t('wallet.addressField')}</span>
        <input type="text" inputMode="text" autoComplete="off" autoCapitalize="off" spellCheck={false} value={to} placeholder="bb1…" onChange={(e) => { setTo(e.target.value); setError(null); }} />
      </label>
      <label className="field field-small">
        <span>{t('wallet.amount')}</span>
        <input type="number" inputMode="numeric" min={1} step={1} value={amount} onChange={(e) => { setAmount(e.target.value); setError(null); }} />
      </label>
      <p className="muted small">{t('wallet.feeNote', { count: SEND_FEE })}</p>
      {error && <p className="field-error" role="alert"><Icon name="alert" size={16} />{error}</p>}
      <button type="button" className="btn btn-primary" onClick={toReview}>{t('wallet.review')}</button>
      <p className="muted small">{t('wallet.typoTip')}</p>
    </div>
  );
}

function ReceivePanel({ onAsked }: { onAsked(): void }) {
  const { t } = useTranslation();
  const { wallet, receiveCoins } = useAppState();
  const ask = (c: Contact) => {
    receiveCoins(c, 10);
    onAsked();
  };
  return (
    <div className="wallet-panel">
      <p>{t('wallet.receiveText')}</p>
      <Address value={wallet.address} />
      <div className="contact-row">
        {CONTACTS.map((c) => (
          <button key={c.name} type="button" className="btn btn-outline" onClick={() => ask(c)}>
            {t('wallet.ask', { name: c.name })}
          </button>
        ))}
      </div>
    </div>
  );
}

function SeedPanel() {
  const { t } = useTranslation();
  const { wallet } = useAppState();
  const [show, setShow] = useState(false);
  return (
    <div className="wallet-panel">
      <p className="sure-note is-warn"><Icon name="key" size={18} />{t('wallet.seedWarn')}</p>
      {show ? (
        <>
          <ol className="seed-grid">
            {wallet.seed.map((w, i) => <li key={i}><span>{i + 1}</span>{w}</li>)}
          </ol>
          <button type="button" className="btn btn-outline" onClick={() => setShow(false)}>{t('wallet.hide')}</button>
        </>
      ) : (
        <button type="button" className="btn btn-primary" onClick={() => setShow(true)}><Icon name="eye" size={18} />{t('wallet.show')}</button>
      )}
    </div>
  );
}

function txText(tx: WalletTx, t: TFunction): string {
  switch (tx.kind) {
    case 'start': return t('wallet.kind.start');
    case 'reset': return t('wallet.kind.reset');
    case 'lesson': return t('wallet.kind.lesson', { title: tx.note ? t('title', { ns: lessonNamespace(tx.note) }) : '' });
    case 'receive': return t('wallet.kind.receive', { name: tx.note ?? '' });
    case 'send': return tx.note ? t('wallet.kind.send', { name: tx.note }) : t('wallet.kind.send', { name: short(tx.to ?? '') });
  }
}

function HistoryPanel({ now }: { now: number }) {
  const { t } = useTranslation();
  const { wallet, resetWallet } = useAppState();
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <div className="wallet-panel">
      <ul className="tx-list">
        {wallet.history.map((tx) => {
          const pending = isPending(tx, now);
          return (
            <li key={tx.id} className={pending ? 'is-pending' : ''}>
              <span className="tx-text">
                {txText(tx, t)}
                <small>{pending ? t('wallet.pending') : new Date(tx.at).toLocaleString()}</small>
              </span>
              <span className={`tx-amount ${tx.amount < 0 ? 'is-out' : 'is-in'}`}>{tx.amount > 0 ? '+' : ''}{tx.amount}</span>
            </li>
          );
        })}
      </ul>
      {confirmReset ? (
        <div className="reset-confirm">
          <p>{t('wallet.resetConfirm')}</p>
          <div className="actions">
            <button type="button" className="btn btn-outline" onClick={() => setConfirmReset(false)}>{t('wallet.cancel')}</button>
            <button type="button" className="btn btn-primary" onClick={() => { resetWallet(); setConfirmReset(false); }}>{t('wallet.resetYes')}</button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn btn-outline" onClick={() => setConfirmReset(true)}>{t('wallet.reset')}</button>
      )}
    </div>
  );
}
