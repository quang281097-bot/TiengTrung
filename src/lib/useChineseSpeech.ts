'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type SpeakItem = { text: string; /** Chọn giọng khác nhau cho từng người nói. */ voice?: number };

export type SpeakOptions = {
  /** Định danh của lượt đọc, để giao diện biết nút/câu nào đang được đọc. */
  key?: string;
  rate?: number;
  /** Bắt đầu đọc từ phần tử thứ mấy trong danh sách. */
  startIndex?: number;
};

export type ChineseSpeech = {
  supported: boolean;
  voicesReady: boolean;
  hasVoice: boolean;
  activeKey: string | null;
  /** Vị trí (trong danh sách gốc) của câu đang được đọc, -1 nếu không đọc. */
  activeIndex: number;
  speak: (items: string | SpeakItem[], options?: SpeakOptions) => void;
  stop: () => void;
};

/** Giọng phổ thông (Trung Quốc đại lục) trước, giọng tự nhiên/online được ưu tiên; bỏ giọng Quảng Đông. */
function pickMandarinVoices(all: SpeechSynthesisVoice[]) {
  const mandarin = all.filter((v) => /^(zh|cmn)([-_](cn|hans|tw|sg))?$/i.test(v.lang) || /^zh[-_]hans/i.test(v.lang));
  const rank = (v: SpeechSynthesisVoice) =>
    (/(cn|hans)/i.test(v.lang) ? 0 : 2) + (/(natural|online|google)/i.test(v.name) ? 0 : 1);
  return [...mandarin].sort((a, b) => rank(a) - rank(b));
}

/** Đọc tiếng Trung bằng giọng có sẵn của trình duyệt (Web Speech API). */
export function useChineseSpeech(): ChineseSpeech {
  const [supported, setSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voicesReady, setVoicesReady] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const token = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSupported(false);
      return;
    }
    const synth = window.speechSynthesis;
    const load = () => {
      const all = synth.getVoices();
      setVoices(pickMandarinVoices(all));
      if (all.length > 0) setVoicesReady(true);
    };
    load();
    synth.addEventListener('voiceschanged', load);
    // Một số trình duyệt không bao giờ phát sự kiện voiceschanged.
    const timer = window.setTimeout(() => setVoicesReady(true), 2000);
    return () => {
      synth.removeEventListener('voiceschanged', load);
      window.clearTimeout(timer);
      token.current += 1;
      synth.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    token.current += 1;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    setActiveKey(null);
    setActiveIndex(-1);
  }, []);

  const speak = useCallback(
    (items: string | SpeakItem[], options: SpeakOptions = {}) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      const synth = window.speechSynthesis;
      const list = typeof items === 'string' ? [{ text: items }] : items;
      const start = Math.max(0, Math.min(options.startIndex ?? 0, list.length - 1));
      const queue = list.slice(start);
      if (queue.length === 0) return;

      token.current += 1;
      const current = token.current;
      synth.cancel();
      setActiveKey(options.key ?? list.map((item) => item.text).join(''));
      setActiveIndex(start);

      const finish = () => {
        if (token.current !== current) return;
        setActiveKey(null);
        setActiveIndex(-1);
      };

      queue.forEach((item, i) => {
        const utterance = new SpeechSynthesisUtterance(item.text);
        const voice = voices.length > 0 ? voices[(item.voice ?? 0) % voices.length] : undefined;
        utterance.lang = voice?.lang ?? 'zh-CN';
        if (voice) utterance.voice = voice;
        utterance.rate = options.rate ?? 0.9;
        utterance.onstart = () => {
          if (token.current === current) setActiveIndex(start + i);
        };
        utterance.onerror = finish;
        if (i === queue.length - 1) utterance.onend = finish;
        synth.speak(utterance);
      });
    },
    [voices],
  );

  return useMemo(
    () => ({ supported, voicesReady, hasVoice: voices.length > 0, activeKey, activeIndex, speak, stop }),
    [supported, voicesReady, voices.length, activeKey, activeIndex, speak, stop],
  );
}
