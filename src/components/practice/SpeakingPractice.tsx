'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

import type { SpeakingSentence, ToneItem } from '../../data/practiceData';
import { scoreAttempt, toRuby } from '../../lib/chineseText';
import type { Attempt } from '../../lib/chineseText';
import { useChineseSpeech } from '../../lib/useChineseSpeech';
import Icon from '../ui/Icon';
import SpeakButton from './SpeakButton';
import VoiceNotice from './VoiceNotice';

/* Web Speech API — nhận dạng giọng nói (Chrome/Edge dùng tiền tố webkit). */
type RecognitionResultList = ArrayLike<ArrayLike<{ transcript: string }>>;
interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: RecognitionResultList }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type RecognitionCtor = new () => RecognitionLike;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function messageFor(error: string | null) {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Trình duyệt đang chặn micro. Hãy cho phép dùng micro rồi thử lại.';
    case 'network':
      return 'Không kết nối được dịch vụ nhận dạng giọng nói (cần có Internet).';
    case 'audio-capture':
      return 'Không tìm thấy micro trên máy.';
    default:
      return 'Mình chưa nghe rõ. Hãy nói to, rõ ràng rồi thử lại nhé.';
  }
}

function verdict(score: number) {
  if (score >= 90) return { tone: 'great', label: 'Tuyệt vời!' };
  if (score >= 70) return { tone: 'good', label: 'Khá tốt!' };
  return { tone: 'try', label: 'Cần luyện thêm' };
}

type Phase = 'idle' | 'recording' | 'scoring' | 'result' | 'recorded' | 'error';

export default function SpeakingPractice({
  topic,
  sentences,
  tones,
}: {
  topic: string;
  sentences: SpeakingSentence[];
  tones: ToneItem[];
}) {
  const speech = useChineseSpeech();
  const { stop } = speech;

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [heard, setHeard] = useState('');
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);
  const [best, setBest] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    sentences.forEach((s) => {
      if (s.best !== undefined) initial[s.id] = s.best;
    });
    return initial;
  });
  const [support, setSupport] = useState({ checked: false, score: false, record: false });

  const recognitionRef = useRef<RecognitionLike | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const sentence = sentences[index];
  const tokens = useMemo(() => toRuby(sentence.hanzi, sentence.syllables), [sentence]);

  useEffect(() => {
    setSupport({
      checked: true,
      score: getRecognitionCtor() !== null,
      record: typeof window.MediaRecorder !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia),
    });
  }, []);

  const replaceRecording = useCallback((url: string | null) => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = url;
    setAudioUrl(url);
  }, []);

  const releaseMic = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  /** Dừng ghi âm; bản ghi được lưu trong recorder.onstop. */
  const stopRecorder = useCallback(() => {
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    else releaseMic();
  }, [releaseMic]);

  /** Huỷ mọi thứ đang chạy mà không chấm điểm (đổi câu, rời trang). */
  const cancelAll = useCallback(() => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      recognition.onend = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.abort();
    }
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null;
      recorder.stop();
    }
    releaseMic();
  }, [releaseMic]);

  useEffect(
    () => () => {
      cancelAll();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    },
    [cancelAll],
  );

  const resetAttempt = () => {
    setPhase('idle');
    setAttempt(null);
    setError(null);
    setHeard('');
    replaceRecording(null);
  };

  const selectSentence = (next: number) => {
    cancelAll();
    stop();
    setIndex(next);
    resetAttempt();
  };

  const start = async () => {
    stop();
    cancelAll();
    resetAttempt();
    const target = sentence;

    if (support.record) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        };
        recorder.onstop = () => {
          replaceRecording(URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })));
          releaseMic();
        };
        recorder.start();
        recorderRef.current = recorder;
      } catch {
        releaseMic();
        setError(messageFor('not-allowed'));
        setPhase('error');
        return;
      }
    }

    const Recognition = getRecognitionCtor();
    if (!Recognition) {
      setPhase('recording');
      return;
    }

    const recognition = new Recognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    let transcript = '';
    let failure: string | null = null;
    recognition.onresult = (event) => {
      transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join('');
      setHeard(transcript);
    };
    recognition.onerror = (event) => {
      failure = event.error;
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      stopRecorder();
      if (!transcript) {
        setError(messageFor(failure));
        setPhase('error');
        return;
      }
      const result = scoreAttempt(target.hanzi, transcript);
      setAttempt(result);
      setBest((prev) => ({ ...prev, [target.id]: Math.max(prev[target.id] ?? 0, result.score) }));
      setPhase('result');
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setPhase('recording');
    } catch {
      stopRecorder();
      setError('Không khởi động được nhận dạng giọng nói. Hãy thử lại.');
      setPhase('error');
    }
  };

  const finish = () => {
    if (recognitionRef.current) {
      setPhase('scoring');
      recognitionRef.current.stop();
    } else {
      stopRecorder();
      setPhase('recorded');
    }
  };

  const recording = phase === 'recording';
  const unsupported = support.checked && !support.score && !support.record;
  const micLabel = recording
    ? support.score
      ? 'Đang nghe… nói xong bấm để dừng'
      : 'Đang ghi âm… bấm để dừng'
    : phase === 'scoring'
      ? 'Đang chấm điểm…'
      : phase === 'idle'
        ? 'Bấm để nói'
        : 'Bấm để nói lại';
  const result = attempt ? verdict(attempt.score) : null;

  return (
    <div className="lx-row lx-row-practice">
      <div className="lx-stack">
        <article className="lx-card lx-speak-card">
          <div className="lx-card-head">
            <p className="lx-recent-crumb">{topic}</p>
            <div className="lx-pager">
              <button
                type="button"
                className="lx-icon-button"
                onClick={() => selectSentence(index - 1)}
                disabled={index === 0}
                aria-label="Câu trước"
              >
                <Icon name="chevron-left" size={18} />
              </button>
              <span className="lx-card-meta">
                Câu {index + 1} / {sentences.length}
              </span>
              <button
                type="button"
                className="lx-icon-button"
                onClick={() => selectSentence(index + 1)}
                disabled={index === sentences.length - 1}
                aria-label="Câu tiếp theo"
              >
                <Icon name="chevron-right" size={18} />
              </button>
            </div>
          </div>

          <p className="lx-ruby" lang="zh-CN">
            <span className="lx-sr-only">{sentence.hanzi}</span>
            {tokens.map((token, i) =>
              token.index < 0 ? (
                <span key={i} className="lx-ruby-punct" aria-hidden="true">
                  {token.char}
                </span>
              ) : (
                <ruby
                  key={i}
                  aria-hidden="true"
                  className={attempt ? (attempt.hits[token.index] ? 'is-hit' : 'is-miss') : undefined}
                >
                  {token.char}
                  <rt>{token.pinyin}</rt>
                </ruby>
              ),
            )}
          </p>
          <p className="lx-speak-meaning">{sentence.meaning}</p>

          <div className="lx-speak-actions">
            <button
              type="button"
              className="lx-button lx-button-soft"
              onClick={() =>
                speech.activeKey === `model:${sentence.id}`
                  ? stop()
                  : speech.speak(sentence.hanzi, { key: `model:${sentence.id}`, rate: slow ? 0.6 : 0.9 })
              }
              disabled={!speech.supported || recording}
            >
              <Icon name={speech.activeKey === `model:${sentence.id}` ? 'stop' : 'volume'} size={15} />
              Nghe mẫu
            </button>
            <label className="lx-check">
              <input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} />
              Đọc chậm
            </label>
          </div>

          <VoiceNotice speech={speech} />

          <div className="lx-mic-wrap">
            <button
              type="button"
              className={`lx-mic${recording ? ' is-recording' : ''}`}
              onClick={recording ? finish : start}
              disabled={phase === 'scoring' || unsupported}
              aria-label={micLabel}
            >
              <Icon name={recording ? 'stop' : 'mic'} size={28} />
            </button>
            <p className="lx-mic-label" aria-live="polite">
              {micLabel}
            </p>
            {recording && heard && (
              <p className="lx-heard" lang="zh-CN">
                {heard}
              </p>
            )}
          </div>

          {support.checked && !support.score && !unsupported && (
            <p className="lx-notice" role="note">
              Trình duyệt này chưa hỗ trợ chấm điểm giọng nói. Hãy dùng Chrome hoặc Edge (cần Internet). Bạn vẫn có thể
              ghi âm và nghe lại giọng của mình.
            </p>
          )}
          {unsupported && (
            <p className="lx-notice" role="note">
              Trình duyệt này không hỗ trợ micro. Hãy dùng Chrome hoặc Edge để luyện nói.
            </p>
          )}

          {phase === 'error' && error && (
            <p className="lx-notice is-error" role="alert">
              {error}
            </p>
          )}

          {attempt && result && (
            <div className={`lx-result tone-${result.tone}`} role="status">
              <div className="lx-score" style={{ '--score': attempt.score } as CSSProperties}>
                <strong>{attempt.score}</strong>
                <span>điểm</span>
              </div>
              <div className="lx-result-copy">
                <p className="lx-result-label">{result.label}</p>
                <p className="lx-card-meta">
                  Máy nghe được: <span lang="zh-CN">{attempt.transcript}</span>
                </p>
                <p className="lx-result-hint">
                  {attempt.hits.every(Boolean)
                    ? 'Tất cả các chữ đều khớp với câu mẫu.'
                    : 'Chữ màu đỏ là chỗ chưa khớp. Nghe mẫu rồi thử lại nhé.'}
                </p>
              </div>
            </div>
          )}

          {(phase === 'result' || phase === 'recorded' || phase === 'error') && audioUrl && (
            <div className="lx-playback">
              <span className="lx-card-meta">Giọng của bạn</span>
              <audio controls src={audioUrl} />
            </div>
          )}

          {(phase === 'result' || phase === 'recorded') && index < sentences.length - 1 && (
            <button type="button" className="lx-button lx-speak-next" onClick={() => selectSentence(index + 1)}>
              Câu tiếp theo
              <Icon name="arrow-right" size={15} />
            </button>
          )}
        </article>

        <section className="lx-card lx-tip">
          <span className="lx-tip-icon" aria-hidden="true">
            <Icon name="bulb" size={18} />
          </span>
          <div>
            <h2 className="lx-card-title">Mẹo phát âm</h2>
            <p>{sentence.tip}</p>
          </div>
        </section>
      </div>

      <aside className="lx-stack">
        <section className="lx-card lx-side-card">
          <h2 className="lx-card-title">Các câu trong bài</h2>
          <ol className="lx-sentence-list">
            {sentences.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`lx-sentence-item${i === index ? ' is-current' : ''}`}
                  onClick={() => selectSentence(i)}
                  aria-current={i === index ? 'true' : undefined}
                >
                  <span className="lx-sentence-hanzi" lang="zh-CN">
                    {s.hanzi}
                  </span>
                  <span className="lx-sentence-vi">{s.meaning}</span>
                  {best[s.id] !== undefined ? (
                    <span className={`lx-badge tone-${verdict(best[s.id]).tone}`}>{best[s.id]}</span>
                  ) : (
                    <span className="lx-badge">Mới</span>
                  )}
                </button>
              </li>
            ))}
          </ol>
        </section>

        <section className="lx-card lx-side-card">
          <h2 className="lx-card-title">Bốn thanh điệu</h2>
          <p className="lx-card-meta">Bấm vào từng thanh để nghe.</p>
          <ul className="lx-tones">
            {tones.map((t) => (
              <li key={t.tone}>
                <button
                  type="button"
                  className={`lx-tone${speech.activeKey === `tone:${t.tone}` ? ' is-active' : ''}`}
                  onClick={() => speech.speak(t.hanzi, { key: `tone:${t.tone}`, rate: 0.7 })}
                  disabled={!speech.supported}
                >
                  <svg viewBox="0 0 40 30" width="40" height="30" aria-hidden="true">
                    <path d={t.contour} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
                  </svg>
                  <span className="lx-tone-mark">
                    {t.mark} <span lang="zh-CN">{t.hanzi}</span>
                  </span>
                  <span className="lx-tone-meaning">
                    Thanh {t.tone} · {t.hint}
                    <br />
                    {t.meaning}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
