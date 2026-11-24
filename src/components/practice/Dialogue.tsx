'use client';

import type { DialogueLine, Speaker } from '../../data/practiceData';

export default function Dialogue({
  speakers,
  lines,
  showPinyin,
  showMeaning,
  playingIndex,
  onPlayLine,
}: {
  speakers: Speaker[];
  lines: DialogueLine[];
  showPinyin: boolean;
  showMeaning: boolean;
  playingIndex: number;
  onPlayLine: (index: number) => void;
}) {
  return (
    <ol className="lx-dialogue">
      {lines.map((line, i) => {
        const speaker = speakers[line.speaker];
        return (
          <li
            key={`${line.hanzi}-${i}`}
            className={`lx-line${line.speaker % 2 === 1 ? ' is-right' : ''}${playingIndex === i ? ' is-playing' : ''}`}
          >
            <span className="lx-avatar" aria-hidden="true" lang="zh-CN">
              {speaker.avatar}
            </span>
            <div className="lx-bubble">
              <span className="lx-bubble-name">{speaker.name}</span>
              <button
                type="button"
                className="lx-bubble-text"
                lang="zh-CN"
                onClick={() => onPlayLine(i)}
                title="Bấm để nghe câu này"
              >
                {line.hanzi}
              </button>
              {showPinyin && <p className="lx-pinyin">{line.pinyin}</p>}
              {showMeaning && <p className="lx-meaning">{line.meaning}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
