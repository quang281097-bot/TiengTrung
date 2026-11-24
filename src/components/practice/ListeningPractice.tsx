'use client';

import { useState } from 'react';

import type { ListeningTrack } from '../../data/practiceData';
import { useChineseSpeech } from '../../lib/useChineseSpeech';
import Icon from '../ui/Icon';
import Dialogue from './Dialogue';
import QuizQuestion from './QuizQuestion';
import Toggle from './Toggle';
import VoiceNotice from './VoiceNotice';

const RATES = [
  { label: 'Chậm', value: 0.7 },
  { label: 'Vừa', value: 0.9 },
  { label: 'Nhanh', value: 1.1 },
];

export default function ListeningPractice({ tracks, tips }: { tracks: ListeningTrack[]; tips: string[] }) {
  const speech = useChineseSpeech();
  const { speak, stop } = speech;

  const [trackIndex, setTrackIndex] = useState(0);
  const [rate, setRate] = useState(0.9);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMeaning, setShowMeaning] = useState(false);
  const [answers, setAnswers] = useState<Record<string, Record<string, number>>>({});

  const track = tracks[trackIndex];
  const key = `track:${track.id}`;
  const items = track.lines.map((line) => ({ text: line.hanzi, voice: line.speaker }));
  const isPlaying = speech.activeKey === key;
  const playingLine = isPlaying
    ? speech.activeIndex
    : speech.activeKey?.startsWith(`${key}:`)
      ? Number(speech.activeKey.slice(key.length + 1))
      : -1;

  const trackAnswers = answers[track.id] ?? {};
  const correct = track.questions.filter((q) => trackAnswers[q.id] === q.answer).length;
  const answered = Object.keys(trackAnswers).length;

  const togglePlay = () => (isPlaying ? stop() : speak(items, { key, rate }));

  const changeRate = (value: number) => {
    setRate(value);
    // Đang phát thì đọc tiếp từ câu hiện tại với tốc độ mới.
    if (isPlaying) speak(items, { key, rate: value, startIndex: Math.max(0, speech.activeIndex) });
  };

  const selectTrack = (index: number) => {
    stop();
    setTrackIndex(index);
    setShowTranscript(false);
  };

  const statusOf = (t: ListeningTrack, index: number) => {
    const done = Object.keys(answers[t.id] ?? {}).length === t.questions.length;
    if (done) {
      const score = t.questions.filter((q) => answers[t.id]?.[q.id] === q.answer).length;
      return `Đã xong · đúng ${score}/${t.questions.length}`;
    }
    if (index === trackIndex) return 'Đang nghe';
    return `${t.lines.length} câu · ${t.questions.length} câu hỏi`;
  };

  return (
    <div className="lx-row lx-row-practice">
      <div className="lx-stack">
        <article className="lx-card lx-player">
          <div className="lx-player-top">
            <div className="lx-player-art" aria-hidden="true">
              <span lang="zh-CN">{track.art}</span>
            </div>
            <div className="lx-player-info">
              <p className="lx-recent-crumb">
                {track.level} <span aria-hidden="true">/</span> {track.situation}
              </p>
              <h2 className="lx-player-title">{track.title}</h2>
              <p className="lx-card-meta" lang="zh-CN">
                {track.hanziTitle}
              </p>
            </div>
          </div>

          <div className="lx-player-controls">
            <button
              type="button"
              className={`lx-play${isPlaying ? ' is-playing' : ''}`}
              onClick={togglePlay}
              disabled={!speech.supported}
              aria-label={isPlaying ? 'Dừng phát' : 'Phát bài nghe'}
            >
              <Icon name={isPlaying ? 'stop' : 'play'} size={22} />
            </button>

            <div className="lx-player-progress">
              <div className="lx-segments" aria-hidden="true">
                {track.lines.map((line, i) => (
                  <span
                    key={`${line.hanzi}-${i}`}
                    className={playingLine === i ? 'is-now' : playingLine > i && isPlaying ? 'is-past' : undefined}
                  />
                ))}
              </div>
              <span className="lx-card-meta" aria-live="polite">
                {isPlaying
                  ? `Đang đọc câu ${speech.activeIndex + 1} / ${track.lines.length}`
                  : `${track.lines.length} câu · bấm phát để nghe cả hội thoại`}
              </span>
            </div>

            <div className="lx-segmented" role="group" aria-label="Tốc độ đọc">
              {RATES.map((r) => (
                <button key={r.label} type="button" aria-pressed={rate === r.value} onClick={() => changeRate(r.value)}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <VoiceNotice speech={speech} />

          <div className="lx-transcript">
            <div className="lx-transcript-head">
              <h3 className="lx-card-title">Lời thoại</h3>
              <div className="lx-toggles">
                <Toggle pressed={showTranscript} onChange={setShowTranscript}>
                  Hiện lời thoại
                </Toggle>
                {showTranscript && (
                  <>
                    <Toggle pressed={showPinyin} onChange={setShowPinyin}>
                      Pinyin
                    </Toggle>
                    <Toggle pressed={showMeaning} onChange={setShowMeaning}>
                      Nghĩa
                    </Toggle>
                  </>
                )}
              </div>
            </div>

            {showTranscript ? (
              <Dialogue
                speakers={track.speakers}
                lines={track.lines}
                showPinyin={showPinyin}
                showMeaning={showMeaning}
                playingIndex={playingLine}
                onPlayLine={(i) => speak([items[i]], { key: `${key}:${i}`, rate })}
              />
            ) : (
              <p className="lx-transcript-hidden">
                <Icon name="headphones" size={18} />
                Lời thoại đang ẩn. Hãy nghe và trả lời câu hỏi trước, rồi mở lời thoại để kiểm tra.
              </p>
            )}
          </div>
        </article>

        <article className="lx-card lx-quiz-card">
          <div className="lx-card-head">
            <h2 className="lx-card-title">Câu hỏi nghe hiểu</h2>
            <span className="lx-card-meta">
              Đã trả lời {answered}/{track.questions.length}
              {answered > 0 && ` · đúng ${correct}`}
            </span>
          </div>
          <div className="lx-quiz-list">
            {track.questions.map((question, i) => (
              <QuizQuestion
                key={question.id}
                index={i}
                question={question}
                selected={trackAnswers[question.id]}
                onSelect={(option) =>
                  setAnswers((prev) => ({ ...prev, [track.id]: { ...(prev[track.id] ?? {}), [question.id]: option } }))
                }
              />
            ))}
          </div>
        </article>
      </div>

      <aside className="lx-stack">
        <section className="lx-card lx-side-card">
          <h2 className="lx-card-title">Danh sách bài nghe</h2>
          <ul className="lx-playlist">
            {tracks.map((t, i) => (
              <li key={t.id}>
                <button
                  type="button"
                  className={`lx-playlist-item${i === trackIndex ? ' is-current' : ''}`}
                  onClick={() => selectTrack(i)}
                  aria-current={i === trackIndex ? 'true' : undefined}
                >
                  <span className="lx-playlist-art" lang="zh-CN" aria-hidden="true">
                    {t.art}
                  </span>
                  <span className="lx-playlist-copy">
                    <strong>{t.title}</strong>
                    <small>{statusOf(t, i)}</small>
                  </span>
                  <Icon name={i === trackIndex ? 'headphones' : 'chevron-right'} size={16} />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="lx-card lx-side-card">
          <h2 className="lx-card-title">Mẹo luyện nghe</h2>
          <ol className="lx-tips">
            {tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ol>
        </section>
      </aside>
    </div>
  );
}
