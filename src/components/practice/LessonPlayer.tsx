'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';

import type { LessonData } from '../../data/practiceData';
import { useChineseSpeech } from '../../lib/useChineseSpeech';
import Icon from '../ui/Icon';
import Dialogue from './Dialogue';
import QuizQuestion from './QuizQuestion';
import SpeakButton from './SpeakButton';
import Toggle from './Toggle';
import VoiceNotice from './VoiceNotice';

const DIALOGUE_KEY = 'lesson-dialogue';

export default function LessonPlayer({ lesson, aside }: { lesson: LessonData; aside: ReactNode }) {
  const speech = useChineseSpeech();
  const { speak, stop } = speech;
  const lastStep = lesson.steps.length - 1;
  const stageRef = useRef<HTMLElement>(null);

  const [step, setStep] = useState(lesson.startStep);
  const [completed, setCompleted] = useState<number[]>(() => Array.from({ length: lesson.startStep }, (_, i) => i));
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMeaning, setShowMeaning] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const percent = Math.round((completed.length / lesson.steps.length) * 100);
  const correct = lesson.quiz.filter((q) => answers[q.id] === q.answer).length;
  const answeredAll = lesson.quiz.every((q) => answers[q.id] !== undefined);

  const goTo = (target: number) => {
    stop();
    setStep(target);
    const stage = stageRef.current;
    if (stage && stage.getBoundingClientRect().top < 0) stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const goNext = () => {
    const next = Math.min(step + 1, lastStep);
    setCompleted((prev) => {
      const done = new Set(prev);
      done.add(step);
      if (next === lastStep) done.add(lastStep);
      return Array.from(done);
    });
    goTo(next);
  };

  const dialogueItems = lesson.dialogue.map((line) => ({ text: line.hanzi, voice: line.speaker }));
  const dialoguePlaying = speech.activeKey === DIALOGUE_KEY;
  const playingLine = dialoguePlaying
    ? speech.activeIndex
    : speech.activeKey?.startsWith(`${DIALOGUE_KEY}:`)
      ? Number(speech.activeKey.slice(DIALOGUE_KEY.length + 1))
      : -1;

  const current = lesson.steps[step];

  let content: ReactNode;
  if (step === 0) {
    content = (
      <ul className="lx-word-grid">
        {lesson.vocabulary.map((word) => (
          <li key={word.hanzi} className="lx-word">
            <div className="lx-word-copy">
              <span className="lx-word-hanzi" lang="zh-CN">
                {word.hanzi}
              </span>
              <span className="lx-word-pinyin">{word.pinyin}</span>
              <span className="lx-word-meaning">{word.meaning}</span>
            </div>
            <SpeakButton speech={speech} text={word.hanzi} label={`Nghe “${word.hanzi}”`} />
          </li>
        ))}
      </ul>
    );
  } else if (step === 1) {
    content = (
      <ol className="lx-patterns">
        {lesson.patterns.map((pattern) => (
          <li key={pattern.hanzi} className="lx-pattern">
            <span className="lx-pattern-structure">{pattern.structure}</span>
            <div className="lx-pattern-row">
              <p className="lx-sentence" lang="zh-CN">
                {pattern.hanzi}
              </p>
              <SpeakButton speech={speech} text={pattern.hanzi} label="Nghe câu mẫu" />
            </div>
            <p className="lx-pinyin">{pattern.pinyin}</p>
            <p className="lx-meaning">{pattern.meaning}</p>
          </li>
        ))}
      </ol>
    );
  } else if (step === 2) {
    content = (
      <>
        <div className="lx-stage-tools">
          <button
            type="button"
            className="lx-button lx-button-soft"
            onClick={() => (dialoguePlaying ? stop() : speak(dialogueItems, { key: DIALOGUE_KEY }))}
            disabled={!speech.supported}
          >
            <Icon name={dialoguePlaying ? 'stop' : 'play'} size={15} />
            {dialoguePlaying ? 'Dừng' : 'Nghe cả đoạn'}
          </button>
          <div className="lx-toggles">
            <Toggle pressed={showPinyin} onChange={setShowPinyin}>
              Pinyin
            </Toggle>
            <Toggle pressed={showMeaning} onChange={setShowMeaning}>
              Nghĩa tiếng Việt
            </Toggle>
          </div>
        </div>
        <Dialogue
          speakers={lesson.speakers}
          lines={lesson.dialogue}
          showPinyin={showPinyin}
          showMeaning={showMeaning}
          playingIndex={playingLine}
          onPlayLine={(i) => speak([dialogueItems[i]], { key: `${DIALOGUE_KEY}:${i}` })}
        />
      </>
    );
  } else if (step === 3) {
    content = (
      <div className="lx-quiz-list">
        {lesson.quiz.map((question, i) => (
          <QuizQuestion
            key={question.id}
            index={i}
            question={question}
            selected={answers[question.id]}
            onSelect={(option) => setAnswers((prev) => ({ ...prev, [question.id]: option }))}
          />
        ))}
        {answeredAll && (
          <p className="lx-quiz-score" role="status">
            Bạn trả lời đúng <strong>{correct} / {lesson.quiz.length}</strong> câu.
          </p>
        )}
      </div>
    );
  } else {
    content = (
      <div className="lx-summary">
        <span className="lx-summary-badge" aria-hidden="true">
          <Icon name="check" size={26} strokeWidth={2.4} />
        </span>
        <h3>Bạn đã hoàn thành {lesson.title.split(':')[0]}!</h3>
        <p>Ôn lại từ vựng ngay hôm nay để nhớ lâu hơn, rồi luyện nói các câu trong bài.</p>
        <dl className="lx-summary-stats">
          <div>
            <dt>Từ mới</dt>
            <dd>{lesson.vocabulary.length}</dd>
          </div>
          <div>
            <dt>Mẫu câu</dt>
            <dd>{lesson.patterns.length}</dd>
          </div>
          <div>
            <dt>Luyện tập</dt>
            <dd>
              {answeredAll ? `${correct}/${lesson.quiz.length}` : '—'}
            </dd>
          </div>
        </dl>
        <div className="lx-summary-actions">
          <Link href="/review" className="lx-button">
            Ôn tập từ vựng
            <Icon name="arrow-right" size={15} />
          </Link>
          <Link href="/speaking" className="lx-button lx-button-ghost">
            Luyện nói bài này
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="lx-card lx-steps" aria-label="Tiến độ bài học">
        <ol className="lx-steps-list">
          {lesson.steps.map((item, i) => {
            const isDone = completed.includes(i);
            const isCurrent = i === step;
            return (
              <li key={item.label}>
                <button
                  type="button"
                  className={`lx-step${isCurrent ? ' is-current' : ''}${isDone ? ' is-done' : ''}`}
                  onClick={() => goTo(i)}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <span className="lx-step-dot">
                    {isDone && !isCurrent ? <Icon name="check" size={13} strokeWidth={2.4} /> : i + 1}
                  </span>
                  <span className="lx-step-label">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="lx-progress-row">
          <span>
            Đã hoàn thành {completed.length} / {lesson.steps.length} phần
          </span>
          <strong>{percent}%</strong>
        </div>
        <div
          className="lx-progress"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Tiến độ bài học"
        >
          <span style={{ width: `${percent}%` }} />
        </div>
      </section>

      <div className="lx-row lx-row-practice">
        <article className="lx-card lx-stage" ref={stageRef}>
          <header className="lx-stage-head">
            <p className="lx-stage-kicker">
              Phần {step + 1} / {lesson.steps.length}
            </p>
            <h2 className="lx-stage-title">{current.label}</h2>
            <p className="lx-stage-intro">{current.intro}</p>
          </header>

          <VoiceNotice speech={speech} />

          <div className="lx-stage-body" key={step}>
            {content}
          </div>

          <footer className="lx-stage-foot">
            <button type="button" className="lx-button lx-button-ghost" onClick={() => goTo(step - 1)} disabled={step === 0}>
              <Icon name="arrow-left" size={15} />
              Phần trước
            </button>
            {step < lastStep ? (
              <button type="button" className="lx-button" onClick={goNext}>
                {step === lastStep - 1 ? 'Xem tổng kết' : 'Phần tiếp theo'}
                <Icon name="arrow-right" size={15} />
              </button>
            ) : (
              <Link href="/" className="lx-button lx-button-ghost">
                Về trang chủ
              </Link>
            )}
          </footer>
        </article>

        <aside className="lx-stack">{aside}</aside>
      </div>
    </>
  );
}
