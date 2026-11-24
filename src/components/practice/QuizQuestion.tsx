'use client';

import type { QuizItem } from '../../data/practiceData';
import Icon from '../ui/Icon';

export default function QuizQuestion({
  index,
  question,
  selected,
  onSelect,
}: {
  index: number;
  question: QuizItem;
  selected: number | undefined;
  onSelect: (option: number) => void;
}) {
  const answered = selected !== undefined;
  const correct = selected === question.answer;

  return (
    <fieldset className="lx-question">
      <legend>
        <span className="lx-question-index">Câu {index + 1}</span>
        {question.prompt}
      </legend>

      <div className="lx-options">
        {question.options.map((option, i) => {
          let state = '';
          if (answered) {
            if (i === question.answer) state = ' is-correct';
            else if (i === selected) state = ' is-wrong';
            else state = ' is-dim';
          }
          return (
            <button
              key={option}
              type="button"
              className={`lx-option${state}`}
              onClick={() => onSelect(i)}
              disabled={answered}
              aria-pressed={selected === i}
            >
              <span className="lx-option-key" aria-hidden="true">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="lx-option-text">{option}</span>
              {answered && i === question.answer && <Icon name="check" size={16} strokeWidth={2.2} />}
              {answered && i === selected && !correct && <Icon name="x" size={16} strokeWidth={2.2} />}
            </button>
          );
        })}
      </div>

      {answered && (
        <p className={`lx-feedback${correct ? ' is-correct' : ' is-wrong'}`} role="status">
          {correct ? 'Chính xác!' : `Chưa đúng. Đáp án là “${question.options[question.answer]}”.`}
        </p>
      )}
    </fieldset>
  );
}
