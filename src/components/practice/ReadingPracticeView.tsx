'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import type { ReadingRecord } from '../../lib/readingRepository';
import { useChineseSpeech } from '../../lib/useChineseSpeech';
import Icon from '../ui/Icon';
import SpeakButton from './SpeakButton';
import Toggle from './Toggle';
import VoiceNotice from './VoiceNotice';

const HSK_LEVELS = [1, 2, 3, 4, 5, 6];
const FALLBACK_MEANINGS = ['trường học', 'cuối tuần', 'thời tiết', 'thư viện', 'gia đình', 'kế hoạch'];

function makeQuestions(reading: ReadingRecord | null, readings: ReadingRecord[]) {
  if (!reading) return [];
  const meanings = [...new Set([
    ...readings.flatMap((item) => item.importantVocabulary ?? []).map((item) => item.meaningVi),
    ...FALLBACK_MEANINGS,
  ])];

  return (reading.importantVocabulary ?? []).slice(0, 3).map((item, index) => {
    const wrongAnswers = meanings.filter((meaning) => meaning !== item.meaningVi);
    const selectedWrongAnswers = Array.from({ length: 3 }, (_, offset) =>
      wrongAnswers[(reading.id * 7 + index * 3 + offset * 5) % wrongAnswers.length],
    );
    const correctIndex = (reading.id + index) % 4;
    const options = [...selectedWrongAnswers];
    options.splice(correctIndex, 0, item.meaningVi);
    return { id: `${reading.id}-${index}`, hanzi: item.hanzi, answer: item.meaningVi, options, correctIndex };
  });
}

export default function ReadingPracticeView({ readings, isSignedIn }: { readings: ReadingRecord[]; isSignedIn: boolean }) {
  const router = useRouter();
  const speech = useChineseSpeech();
  const [selectedHsk, setSelectedHsk] = useState(1);
  const [activeReadingId, setActiveReadingId] = useState<number | null>(readings[0]?.id ?? null);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');
  const [exerciseAnswers, setExerciseAnswers] = useState<Record<string, number>>({});
  const [completedIds, setCompletedIds] = useState<Set<number>>(
    () => new Set(readings.filter((reading) => reading.completed).map((reading) => reading.id)),
  );
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'ready' | 'error'>('idle');
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingUrlRef = useRef<string | null>(null);

  const levelReadings = readings.filter((reading) => reading.hskLevel === selectedHsk);
  const currentReading = levelReadings.find((reading) => reading.id === activeReadingId) ?? levelReadings[0] ?? null;
  const lines = currentReading
    ? currentReading.passageZh.split('\n').filter(Boolean).map((text, index) => ({
        text: text.trim(),
        pinyin: (currentReading.pinyin || '').split('\n')[index]?.trim() ?? '',
        meaning: (currentReading.translationVi || '').split('\n')[index]?.trim() ?? '',
      }))
    : [];
  useEffect(() => {
    setCompletedIds(new Set(readings.filter((reading) => reading.completed).map((reading) => reading.id)));
  }, [readings]);

  const questions = makeQuestions(currentReading, readings);
  const answeredQuestions = questions.filter((question) => exerciseAnswers[question.id] !== undefined);
  const correctAnswers = answeredQuestions.filter((question) => exerciseAnswers[question.id] === question.correctIndex).length;

  useEffect(() => () => {
    const recorder = recorderRef.current;
    if (recorder?.state === 'recording') {
      recorder.onstop = null;
      recorder.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current);
  }, []);

  function clearRecording() {
    const recorder = recorderRef.current;
    if (recorder?.state === 'recording') {
      recorder.onstop = null;
      recorder.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current);
    recordingUrlRef.current = null;
    setRecordingUrl(null);
    setRecordingState('idle');
    setRecordingError('');
  }

  async function startRecording() {
    setRecordingError('');
    clearRecording();
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setRecordingState('error');
      setRecordingError('Trình duyệt này chưa hỗ trợ ghi âm.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      streamRef.current = stream;
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        if (!chunks.length) {
          setRecordingState('idle');
          return;
        }
        const recording = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(recording);
        recordingUrlRef.current = url;
        setRecordingUrl(url);
        setRecordingState('ready');
      };
      recorder.start();
      setRecordingState('recording');
    } catch {
      setRecordingState('error');
      setRecordingError('Không truy cập được microphone. Hãy cấp quyền ghi âm cho trình duyệt.');
    }
  }

  async function toggleCompleted() {
    if (!currentReading || !isSignedIn || isSavingProgress) return;
    setIsSavingProgress(true);
    const currentlyCompleted = completedIds.has(currentReading.id);
    try {
      const response = await fetch(`/api/readings/${currentReading.id}/progress`, {
        method: currentlyCompleted ? 'DELETE' : 'POST',
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Không thể lưu tiến độ.');
      setCompletedIds((ids) => {
        const next = new Set(ids);
        if (result.completed) next.add(currentReading.id);
        else next.delete(currentReading.id);
        return next;
      });
      router.refresh();
    } finally {
      setIsSavingProgress(false);
    }
  }

  function chooseLevel(level: number) {
    speech.stop();
    clearRecording();
    setSelectedHsk(level);
    setActiveReadingId(readings.find((reading) => reading.hskLevel === level)?.id ?? null);
  }

  return (
    <div className="lx-practice-container">
      <nav className="lx-hsk-tabs" aria-label="Chọn cấp độ HSK">
        {HSK_LEVELS.map((level) => {
          const active = selectedHsk === level;
          const count = readings.filter((reading) => reading.hskLevel === level).length;
          return (
            <button
              key={level}
              type="button"
              className={`lx-hsk-tab-btn${active ? ' is-active' : ''}`}
              aria-pressed={active}
              onClick={() => chooseLevel(level)}
            >
              <span className="lx-hsk-tab-title">HSK {level}</span>
              <span className="lx-hsk-tab-count">{count} bài</span>
            </button>
          );
        })}
      </nav>

      <div className="lx-row lx-row-practice">
        <div className="lx-stack">
          {currentReading ? (
            <article className="lx-card lx-stage">
              <header className="lx-stage-head">
                <p className="lx-stage-kicker">HSK {currentReading.hskLevel} · {currentReading.estMinutes} PHÚT ĐỌC</p>
                <h2 className="lx-stage-title">
                  {currentReading.title}
                  {currentReading.titleZh && <span className="lx-title-hanzi" lang="zh-CN">{currentReading.titleZh}</span>}
                </h2>
                <p className="lx-stage-intro">Đọc chữ Hán, nghe phát âm và đối chiếu pinyin cùng bản dịch.</p>
              </header>

              {currentReading.imageUrl && (
                <figure className="lx-reading-illustration">
                  <Image
                    src={currentReading.imageUrl}
                    alt={`Minh họa: ${currentReading.title}`}
                    width={1200}
                    height={720}
                    sizes="(max-width: 900px) 100vw, 680px"
                    priority
                  />
                </figure>
              )}

              <VoiceNotice speech={speech} />

              <div className="lx-stage-tools">
                <button
                  type="button"
                  className="lx-button"
                  style={{ background: 'var(--lx-forest)' }}
                  onClick={() => speech.activeKey === `passage:${currentReading.id}`
                    ? speech.stop()
                    : speech.speak(currentReading.passageZh, { key: `passage:${currentReading.id}`, rate: 0.85 })}
                >
                  <Icon name={speech.activeKey === `passage:${currentReading.id}` ? 'stop' : 'volume'} size={16} />
                  {speech.activeKey === `passage:${currentReading.id}` ? 'Dừng đọc' : 'Đọc toàn bộ bài'}
                </button>
                <div className="lx-toggles">
                  <Toggle pressed={showPinyin} onChange={setShowPinyin}>Pinyin</Toggle>
                  <Toggle pressed={showMeaning} onChange={setShowMeaning}>Bản dịch tiếng Việt</Toggle>
                  <button
                    type="button"
                    className="lx-toggle"
                    aria-pressed={fontSize === 'large'}
                    onClick={() => setFontSize((size) => size === 'normal' ? 'large' : 'normal')}
                  >
                    <span className="lx-toggle-dot" aria-hidden="true" />Cỡ chữ lớn
                  </button>
                </div>
              </div>

              <ol className="lx-reading-lines">
                {lines.map((line, index) => (
                  <li className="lx-reading-line" key={`${currentReading.id}-${index}`}>
                    <div className="lx-reading-text-wrap">
                      <p className={`lx-reading-zh${fontSize === 'large' ? ' is-large' : ''}`} lang="zh-CN">{line.text}</p>
                      {showPinyin && line.pinyin && <p className="lx-pinyin lx-reading-pinyin">{line.pinyin}</p>}
                      {showMeaning && line.meaning && <p className="lx-meaning lx-reading-vi">{line.meaning}</p>}
                    </div>
                    <SpeakButton speech={speech} text={line.text} speakKey={`line:${currentReading.id}:${index}`} rate={0.85} label="Nghe câu này" small />
                  </li>
                ))}
              </ol>

              <section className="lx-reading-recording" aria-labelledby="reading-recording-title">
                <div className="lx-reading-vocabulary-heading">
                  <div>
                    <p className="lx-stage-kicker">LUYỆN PHÁT ÂM</p>
                    <h3 id="reading-recording-title">Ghi âm bài đọc</h3>
                    <p className="lx-reading-recording-hint">Bản ghi chỉ lưu tạm trên thiết bị hiện tại.</p>
                  </div>
                  <button
                    type="button"
                    className={`lx-button${recordingState === 'recording' ? ' is-recording' : ''}`}
                    onClick={() => recordingState === 'recording' ? recorderRef.current?.stop() : void startRecording()}
                  >
                    <Icon name={recordingState === 'recording' ? 'stop' : 'mic'} size={16} />
                    {recordingState === 'recording' ? 'Dừng ghi âm' : recordingState === 'ready' ? 'Ghi lại' : 'Bắt đầu ghi âm'}
                  </button>
                </div>
                {recordingUrl && (
                  <div className="lx-reading-recording-playback">
                    <audio controls preload="metadata" src={recordingUrl} />
                    <button type="button" className="lx-button lx-button-ghost" onClick={clearRecording}>Xóa bản ghi</button>
                  </div>
                )}
                {recordingError && <p className="lx-reading-recording-error" role="alert">{recordingError}</p>}
              </section>

              {!!currentReading.importantVocabulary?.length && (
                <section className="lx-reading-vocabulary" aria-labelledby="reading-vocabulary-title">
                  <header className="lx-reading-vocabulary-heading">
                    <div>
                      <p className="lx-stage-kicker">ÔN TỪ TRONG BÀI</p>
                      <h3 id="reading-vocabulary-title">Từ vựng quan trọng</h3>
                    </div>
                    <span>{currentReading.importantVocabulary.length} từ</span>
                  </header>
                  <ul className="lx-reading-vocabulary-list">
                    {currentReading.importantVocabulary.map((item, index) => (
                      <li key={`${item.hanzi}-${index}`}>
                        <div className="lx-reading-vocabulary-copy">
                          <strong lang="zh-CN">{item.hanzi}</strong>
                          <span className="lx-pinyin">{item.pinyin}</span>
                          <span className="lx-meaning">{item.meaningVi}</span>
                        </div>
                        <SpeakButton speech={speech} text={item.hanzi} speakKey={`vocab:${currentReading.id}:${index}`} rate={0.85} label={`Nghe từ ${item.hanzi}`} small />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {!!questions.length && (
                <section className="lx-reading-exercises" aria-labelledby="reading-exercises-title">
                  <header className="lx-reading-vocabulary-heading">
                    <div>
                      <p className="lx-stage-kicker">SAU KHI ĐỌC</p>
                      <h3 id="reading-exercises-title">Bài tập</h3>
                    </div>
                    <span>Đúng {correctAnswers}/{questions.length} câu</span>
                  </header>
                  <div className="lx-reading-exercise-list">
                    {questions.map((question, index) => {
                      const chosenIndex = exerciseAnswers[question.id];
                      const answered = chosenIndex !== undefined;
                      return (
                        <article className="lx-reading-exercise" key={question.id}>
                          <p className="lx-reading-exercise-question">
                            <span>{index + 1}.</span> Từ <strong lang="zh-CN">{question.hanzi}</strong> trong bài có nghĩa là gì?
                          </p>
                          <div className="lx-reading-exercise-options" role="group" aria-label={`Đáp án câu ${index + 1}`}>
                            {question.options.map((option, optionIndex) => {
                              const chosen = chosenIndex === optionIndex;
                              const correct = optionIndex === question.correctIndex;
                              const stateClass = answered && correct ? 'is-correct' : chosen && !correct ? 'is-incorrect' : '';
                              return (
                                <button
                                  key={`${question.id}-${optionIndex}`}
                                  type="button"
                                  className={`lx-reading-exercise-option ${stateClass}`.trim()}
                                  aria-pressed={chosen}
                                  onClick={() => setExerciseAnswers((answers) => ({ ...answers, [question.id]: optionIndex }))}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>
                          {answered && (
                            <p className={`lx-reading-exercise-feedback${chosenIndex === question.correctIndex ? ' is-correct' : ' is-incorrect'}`} role="status">
                              {chosenIndex === question.correctIndex ? 'Chính xác.' : `Chưa đúng. Đáp án: ${question.answer}.`}
                            </p>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}

              <footer className="lx-stage-foot">
                {isSignedIn ? (
                  <button
                    type="button"
                    className={`lx-reading-complete-button${completedIds.has(currentReading.id) ? ' is-completed' : ''}`}
                    onClick={() => void toggleCompleted()}
                    disabled={isSavingProgress}
                  >
                    <Icon name="check" size={16} />
                    {completedIds.has(currentReading.id) ? 'Đã học xong' : 'Đánh dấu đã học xong'}
                  </button>
                ) : (
                  <span className="lx-card-meta">Đăng nhập để lưu tiến độ đã học.</span>
                )}
                <button
                  type="button"
                  className="lx-button lx-button-ghost"
                  disabled={levelReadings.findIndex((reading) => reading.id === currentReading.id) >= levelReadings.length - 1}
                  onClick={() => {
                    const index = levelReadings.findIndex((reading) => reading.id === currentReading.id);
                    const nextReading = levelReadings[index + 1];
                    if (nextReading) {
                      speech.stop();
                      clearRecording();
                      setActiveReadingId(nextReading.id);
                    }
                  }}
                >
                  Bài tiếp theo <Icon name="arrow-right" size={15} />
                </button>
              </footer>
            </article>
          ) : (
            <article className="lx-card lx-stage"><p className="lx-card-meta">Chưa có bài đọc ở cấp độ HSK {selectedHsk}.</p></article>
          )}
        </div>

        <aside className="lx-stack">
          <section className="lx-card lx-side-card">
            <div className="lx-card-head">
              <h2 className="lx-card-title">Bài đọc liên quan · HSK {selectedHsk}</h2>
              <span className="lx-card-meta">{levelReadings.length} bài</span>
            </div>
            <ul className="lx-playlist">
              {levelReadings.map((reading, index) => {
                const active = reading.id === currentReading?.id;
                return (
                  <li key={reading.id}>
                    <button
                      type="button"
                      className={`lx-playlist-item${active ? ' is-current' : ''}`}
                      aria-current={active ? 'true' : undefined}
                      onClick={() => {
                        speech.stop();
                        clearRecording();
                        setActiveReadingId(reading.id);
                      }}
                    >
                      <span className="lx-playlist-art" lang="zh-CN">{reading.titleZh?.slice(0, 2) || `B${index + 1}`}</span>
                      <span className="lx-playlist-copy">
                        <strong>{reading.title}</strong>
                        <small>{reading.estMinutes} phút · {reading.passageZh.length} chữ Hán</small>
                        {completedIds.has(reading.id) && <b className="lx-playlist-completed"><Icon name="check" size={12} /> Đã học</b>}
                      </span>
                      <Icon name={active ? 'book' : 'chevron-right'} size={16} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}