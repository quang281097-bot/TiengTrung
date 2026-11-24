'use client';

import type { ChineseSpeech } from '../../lib/useChineseSpeech';
import Icon from '../ui/Icon';

export default function SpeakButton({
  speech,
  text,
  label,
  speakKey,
  rate,
  small = false,
}: {
  speech: ChineseSpeech;
  text: string;
  label: string;
  speakKey?: string;
  rate?: number;
  small?: boolean;
}) {
  const key = speakKey ?? `say:${text}`;
  const active = speech.activeKey === key;

  return (
    <button
      type="button"
      className={`lx-speak${active ? ' is-active' : ''}${small ? ' is-small' : ''}`}
      onClick={() => (active ? speech.stop() : speech.speak(text, { key, rate }))}
      disabled={!speech.supported}
      aria-label={active ? 'Dừng đọc' : label}
      title={active ? 'Dừng đọc' : label}
    >
      <Icon name={active ? 'stop' : 'volume'} size={small ? 14 : 16} />
    </button>
  );
}
