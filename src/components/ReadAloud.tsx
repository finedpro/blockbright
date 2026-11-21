import { useEffect, useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';

const VOICE_LANG: Record<string, string> = { en: 'en-GB', et: 'et-EE', fi: 'fi-FI' };
const BLOCKS = 'p, li, legend, dt, dd, h1, h2, h3, label, summary, .choice-button, .phone-msg-from';
const SKIP = 'button:not(.choice-button):not(.term-button), .why-link, .term-english, .term-pop, svg, [data-noread], [hidden], .sources';

function supported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/** Text of the area, block by block, without buttons, icons and English term hints. */
export function readableText(root: HTMLElement): string[] {
  const clone = root.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(SKIP).forEach((el) => el.remove());
  clone.querySelectorAll(BLOCKS).forEach((el) => el.append('\n'));
  return (clone.textContent ?? '')
    .split('\n')
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function findVoice(lang: string): SpeechSynthesisVoice | null | undefined {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return undefined; // not loaded yet
  const prefix = lang.slice(0, 2);
  return voices.find((v) => v.lang.replace('_', '-') === lang) ?? voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ?? null;
}

/**
 * Reads the given area aloud with the device's own voice (Web Speech API).
 * Nothing is sent anywhere. Hidden when the device has no voice for the current language.
 */
export function ReadAloud({ target, resetKey }: { target: RefObject<HTMLElement | null>; resetKey: string }) {
  const { t, i18n } = useTranslation();
  const lang = VOICE_LANG[i18n.language] ?? 'en-GB';
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null | undefined>(() => (supported() ? findVoice(lang) : null));
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!supported()) return;
    const update = () => setVoice(findVoice(lang));
    update();
    window.speechSynthesis.addEventListener('voiceschanged', update);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', update);
  }, [lang]);

  // Stop when the step changes or the page closes.
  useEffect(() => {
    return () => {
      if (supported()) window.speechSynthesis.cancel();
      setSpeaking(false);
    };
  }, [resetKey]);

  if (!supported() || voice === null) return null;

  const toggle = () => {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    if (!target.current) return;
    const lines = readableText(target.current);
    if (!lines.length) return;
    synth.cancel();
    lines.forEach((line, i) => {
      const u = new SpeechSynthesisUtterance(line);
      u.lang = lang;
      if (voice) u.voice = voice;
      u.rate = 0.95;
      if (i === lines.length - 1) {
        u.onend = () => setSpeaking(false);
        u.onerror = () => setSpeaking(false);
      }
      synth.speak(u);
    });
    setSpeaking(true);
  };

  return (
    <button type="button" className={`icon-button read-aloud ${speaking ? 'is-on' : ''}`} onClick={toggle} aria-pressed={speaking} aria-label={speaking ? t('read.stop') : t('read.start')} title={speaking ? t('read.stop') : t('read.start')}>
      <Icon name={speaking ? 'stop' : 'speaker'} size={20} />
    </button>
  );
}
