/** Scam spotter: short messages to judge as scam or safe. Texts live in locales/<lng>/spot.json. */
export type Channel = 'sms' | 'email' | 'game' | 'dm' | 'social';

export interface SpotMessage {
  id: string;
  channel: Channel;
  scam: boolean;
}

export const SPOT_MESSAGES: SpotMessage[] = [
  { id: 'parcel', channel: 'sms', scam: true },
  { id: 'skins', channel: 'game', scam: true },
  { id: 'library', channel: 'dm', scam: false },
  { id: 'update', channel: 'email', scam: false },
  { id: 'mentor', channel: 'dm', scam: true },
  { id: 'mum', channel: 'sms', scam: true },
  { id: 'sportsDay', channel: 'social', scam: false },
  { id: 'verify', channel: 'email', scam: true },
  { id: 'gg', channel: 'game', scam: false },
  { id: 'giveaway', channel: 'dm', scam: true },
  { id: 'card', channel: 'sms', scam: false },
  { id: 'job', channel: 'dm', scam: true },
];

export const SPOT_ROUND = 8;

/** A shuffled round with at least two safe messages, so "always scam" doesn't win. */
export function spotRound(random: () => number = Math.random): SpotMessage[] {
  for (;;) {
    const shuffled = [...SPOT_MESSAGES].sort(() => random() - 0.5).slice(0, SPOT_ROUND);
    if (shuffled.filter((m) => !m.scam).length >= 2) return shuffled;
  }
}
