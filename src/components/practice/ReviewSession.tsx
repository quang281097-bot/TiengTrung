'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ReviewCard } from '../../data/practiceData';
import { useChineseSpeech } from '../../lib/useChineseSpeech';
import Icon from '../ui/Icon';
import SpeakButton from './SpeakButton';
import VoiceNotice from './VoiceNotice';

type Rating = 'again' | 'hard' | 'good' | 'easy';

const RATINGS: { id: Rating; label: string; next: string }[] = [
  { id: 'again', label: 'Quên', next: '< 1 phút' },
  { id: 'hard', label: 'Khó', next: '10 phút' },
  { id: 'good', label: 'Nhớ', next: '1 ngày' },
  { id: 'easy', label: 'Dễ', next: '4 ngày' },
];

export default function ReviewSession({ cards }: { cards: ReviewCard[] }) {
  const speech = useChineseSpeech();
  const { stop } = speech;

  const [deck, setDeck] = useState(cards);
  const [queue, setQueue] = useState<string[]>(() => cards.map((c) => c.id));
  const [flipped, setFlipped] = useState(false);
  /** Lần chấm đầu tiên của mỗi thẻ trong phiên. */
  const [results, setResults] = useState<Record<string, Rating>>({});

  const byId = useMemo(() => new Map(deck.map((c) => [c.id, c])), [deck]);
  const card = queue.length > 0 ? byId.get(queue[0]) : undefined;
  const doneCount = deck.length - new Set(queue).size;
  const percent = deck.length ? Math.round((doneCount / deck.length) * 100) : 0;

  const rate = useCallback(
    (rating: Rating) => {
      if (!card) return;
      stop();
      setResults((prev) => (prev[card.id] ? prev : { ...prev, [card.id]: rating }));
      setQueue((prev) => {
        const [head, ...rest] = prev;
        return rating === 'again' ? [...rest, head] : rest;
      });
      setFlipped(false);
    },
    [card, stop],
  );

  const restart = (ids: string[]) => {
    stop();
    const subset = cards.filter((c) => ids.includes(c.id));
    setDeck(subset);
    setQueue(subset.map((c) => c.id));
    setResults({});
    setFlipped(false);
  };

  useEffect(() => {
    if (!card) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === ' ' && !target?.closest('button, a')) {
        event.preventDefault();
        setFlipped((f) => !f);
        return;
      }
      const n = Number(event.key);
      if (flipped && n >= 1 && n <= RATINGS.length) {
        event.preventDefault();
        rate(RATINGS[n - 1].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [card, flipped, rate]);

  if (!card) {
    const tally = (r: Rating) => Object.values(results).filter((v) => v === r).length;
    const remembered = tally('good') + tally('easy');
    const needMore = deck.filter((c) => results[c.id] === 'again' || results[c.id] === 'hard');

    return (
      <article className="lx-card lx-review lx-review-done">
        <span className="lx-summary-badge" aria-hidden="true">
          <Icon name="check" size={26} strokeWidth={2.4} />
        </span>
        <h2 className="lx-stage-title">Hoàn thành phiên ôn tập!</h2>
        <p className="lx-stage-intro">
          Bạn đã ôn {deck.length} thẻ, nhớ ngay {remembered} thẻ ({Math.round((remembered / deck.length) * 100)}%).
        </p>

        <dl className="lx-summary-stats">
          <div>
            <dt>Nhớ / Dễ</dt>
            <dd>{remembered}</dd>
          </div>
          <div>
            <dt>Khó</dt>
            <dd>{tally('hard')}</dd>
          </div>
          <div>
            <dt>Quên</dt>
            <dd>{tally('again')}</dd>
          </div>
        </dl>

        {needMore.length > 0 && (
          <div className="lx-review-weak">
            <p className="lx-card-meta">Cần ôn thêm</p>
            <ul>
              {needMore.map((c) => (
                <li key={c.id}>
                  <span lang="zh-CN">{c.hanzi}</span> {c.meaning}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="lx-summary-actions">
          {needMore.length > 0 ? (
            <button type="button" className="lx-button" onClick={() => restart(needMore.map((c) => c.id))}>
              <Icon name="rotate" size={15} />
              Ôn lại {needMore.length} từ khó
            </button>
          ) : (
            <button type="button" className="lx-button" onClick={() => restart(cards.map((c) => c.id))}>
              <Icon name="rotate" size={15} />
              Ôn lại từ đầu
            </button>
          )}
          <Link href="/" className="lx-button lx-button-ghost">
            Về trang chủ
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className="lx-card lx-review">
      <div className="lx-card-head">
        <span className="lx-chip">{card.deck}</span>
        <span className="lx-card-meta">
          Đã ôn {doneCount} / {deck.length} thẻ
        </span>
      </div>
      <div
        className="lx-progress"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Tiến độ phiên ôn tập"
      >
        <span style={{ width: `${percent}%` }} />
      </div>

      <VoiceNotice speech={speech} />

      <button
        type="button"
        className={`lx-flashcard${flipped ? ' is-flipped' : ''}`}
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? `Úp thẻ ${card.hanzi}` : `Lật thẻ ${card.hanzi} để xem nghĩa`}
      >
        <span className="lx-flash-hanzi" lang="zh-CN">
          {card.hanzi}
        </span>
        {flipped ? (
          <span className="lx-flash-back" key={card.id}>
            <span className="lx-flash-pinyin">{card.pinyin}</span>
            <span className="lx-flash-meaning">{card.meaning}</span>
            <span className="lx-flash-example">
              <span lang="zh-CN">{card.example.hanzi}</span>
              <span>{card.example.pinyin}</span>
              <span>{card.example.meaning}</span>
            </span>
          </span>
        ) : (
          <span className="lx-flash-hint">Bạn có nhớ nghĩa của từ này? Bấm để lật thẻ (phím Space)</span>
        )}
      </button>

      <div className="lx-review-tools">
        <SpeakButton speech={speech} text={card.hanzi} label={`Nghe “${card.hanzi}”`} speakKey={`card:${card.id}`} />
        <span>Nghe từ</span>
        {flipped && (
          <>
            <SpeakButton
              speech={speech}
              text={card.example.hanzi}
              label="Nghe câu ví dụ"
              speakKey={`example:${card.id}`}
            />
            <span>Nghe câu ví dụ</span>
          </>
        )}
      </div>

      {flipped ? (
        <div className="lx-rate" role="group" aria-label="Bạn nhớ từ này thế nào?">
          {RATINGS.map((r, i) => (
            <button key={r.id} type="button" className={`lx-rate-btn tone-${r.id}`} onClick={() => rate(r.id)}>
              <strong>{r.label}</strong>
              <small>Ôn lại sau {r.next}</small>
              <kbd aria-hidden="true">{i + 1}</kbd>
            </button>
          ))}
        </div>
      ) : (
        <button type="button" className="lx-button lx-review-flip" onClick={() => setFlipped(true)}>
          Lật thẻ
        </button>
      )}
    </article>
  );
}
