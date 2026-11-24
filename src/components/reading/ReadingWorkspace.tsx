'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import Icon from '../ui/Icon';

type Reading = {
  id: number;
  hskLevel: number;
  title: string;
  titleZh: string | null;
  passageZh: string;
  pinyin: string;
  translationVi: string;
  importantVocabulary: { hanzi: string; pinyin: string; meaningVi: string }[];
  estMinutes: number;
};

const levels = [1, 2, 3, 4, 5, 6];

export default function ReadingWorkspace({ isAdmin }: { isAdmin: boolean }) {
  const [level, setLevel] = useState(1);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError('');

    fetch(`/api/readings?level=${level}`, { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? 'Không tải được bài đọc.');
        setReadings(result.readings);
        setSelectedId(result.readings[0]?.id ?? null);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof Error && requestError.name === 'AbortError') return;
        setError(requestError instanceof Error ? requestError.message : 'Không tải được bài đọc.');
        setReadings([]);
        setSelectedId(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [level]);

  const selected = readings.find((reading) => reading.id === selectedId) ?? null;

  function playPassage() {
    if (!selected || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(selected.passageZh);
    utterance.lang = 'zh-CN';
    window.speechSynthesis.speak(utterance);
  }

  function playWord(word: string) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'zh-CN';
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="reading-page">
      <header className="reading-heading">
        <div>
          <p className="reading-eyebrow">ĐỌC HIỂU · 6 CẤP ĐỘ</p>
          <h1>Luyện đọc tiếng Trung</h1>
          <p>Chọn cấp độ, đọc đoạn văn theo thứ tự từ dễ đến nâng cao.</p>
        </div>
        {isAdmin && (
          <Link className="reading-admin-link" href="/practice/manage">
            <Icon name="pen" size={16} />
            Quản lý bài đọc
          </Link>
        )}
      </header>

      <nav className="reading-level-tabs" aria-label="Chọn cấp độ HSK">
        {levels.map((item) => {
          const count = item === level ? readings.length : null;
          return (
            <button
              key={item}
              type="button"
              className={level === item ? 'is-active' : ''}
              aria-pressed={level === item}
              onClick={() => setLevel(item)}
            >
              <span>HSK {item}</span>
              {count !== null && <small>{count} bài</small>}
            </button>
          );
        })}
      </nav>

      <div className="reading-workspace">
        <aside className="reading-list" aria-label={`Danh sách bài đọc HSK ${level}`}>
          <div className="reading-list-heading">
            <div>
              <span className="reading-list-kicker">CẤP ĐỘ {level}</span>
              <h2>Danh sách bài đọc</h2>
            </div>
            {!isLoading && <span className="reading-count">{readings.length}</span>}
          </div>

          {isLoading ? (
            <p className="reading-state">Đang tải bài đọc...</p>
          ) : error ? (
            <p className="reading-state is-error" role="alert">{error}</p>
          ) : readings.length ? (
            <ol className="reading-article-list">
              {readings.map((reading, index) => (
                <li key={reading.id}>
                  <button
                    type="button"
                    className={`reading-article-item${selectedId === reading.id ? ' is-selected' : ''}`}
                    aria-current={selectedId === reading.id ? 'true' : undefined}
                    onClick={() => setSelectedId(reading.id)}
                  >
                    <span className="reading-number">{String(index + 1).padStart(2, '0')}</span>
                    <span className="reading-item-copy">
                      <strong>{reading.title}</strong>
                      <small>{reading.estMinutes} phút đọc</small>
                    </span>
                    <Icon name="chevron-right" size={16} />
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <div className="reading-state">
              Chưa có bài đọc HSK {level}.
              {isAdmin && <span> Bạn có thể thêm bài trong khu quản lý.</span>}
            </div>
          )}
        </aside>

        <article className="reading-reader">
          {selected ? (
            <>
              <div className="reading-reader-topline">
                <span>HSK {selected.hskLevel} · BÀI {String(readings.findIndex((item) => item.id === selected.id) + 1).padStart(2, '0')}</span>
                <span>{selected.estMinutes} phút</span>
              </div>
              <div className="reading-title-row">
                <div>
                  <h2>{selected.title}</h2>
                  {selected.titleZh && <p lang="zh-Hans">{selected.titleZh}</p>}
                </div>
                <button className="reading-audio-button" type="button" onClick={playPassage} aria-label="Nghe đọc đoạn văn">
                  <Icon name="volume" size={18} />
                  <span>Nghe bài</span>
                </button>
              </div>

              <div className="reading-display-options" role="group" aria-label="Tùy chọn hiển thị">
                <button type="button" aria-pressed={showPinyin} onClick={() => setShowPinyin((value) => !value)}>
                  Pinyin <span>{showPinyin ? 'Bật' : 'Tắt'}</span>
                </button>
                <button type="button" aria-pressed={showTranslation} onClick={() => setShowTranslation((value) => !value)}>
                  Bản dịch <span>{showTranslation ? 'Bật' : 'Tắt'}</span>
                </button>
              </div>

              <section className="reading-passage" aria-label="Đoạn văn tiếng Trung">
                <p lang="zh-Hans">{selected.passageZh}</p>
                {showPinyin && selected.pinyin && <p className="reading-pinyin">{selected.pinyin}</p>}
                {showTranslation && selected.translationVi && <p className="reading-translation">{selected.translationVi}</p>}
              </section>

              <section className="reading-vocabulary" aria-labelledby="reading-vocabulary-heading">
                <header className="reading-vocabulary-heading">
                  <div>
                    <p className="reading-list-kicker">ÔN TỪ TRONG BÀI</p>
                    <h3 id="reading-vocabulary-heading">Từ vựng quan trọng</h3>
                  </div>
                  <span>{selected.importantVocabulary.length} từ</span>
                </header>
                {selected.importantVocabulary.length ? (
                  <ul className="reading-vocabulary-list">
                    {selected.importantVocabulary.map((item, index) => (
                      <li key={`${item.hanzi}-${index}`}>
                        <button
                          className="reading-word-item"
                          type="button"
                          lang="zh-Hans"
                          onClick={() => playWord(item.hanzi)}
                          aria-label={`Đọc từ ${item.hanzi}: ${item.meaningVi}`}
                          title="Nghe phát âm từ này"
                        >
                          <strong className="reading-word-hanzi">{item.hanzi}</strong>
                          <span className="reading-word-pinyin">{item.pinyin}</span>
                          <span className="reading-word-meaning">{item.meaningVi}</span>
                          <span className="reading-word-audio"><Icon name="volume" size={15} /> Nghe</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="reading-vocabulary-empty">Bài đọc này chưa có từ vựng trọng tâm.</p>
                )}
              </section>

              <footer className="reading-reader-footer">
                <p>Đọc thành tiếng một lượt, sau đó bật bản dịch để tự kiểm tra.</p>
                <button type="button" onClick={() => setShowTranslation((value) => !value)}>
                  {showTranslation ? 'Ẩn bản dịch' : 'Xem bản dịch'}
                  <Icon name="arrow-right" size={15} />
                </button>
              </footer>
            </>
          ) : (
            <div className="reading-empty-reader">
              <Icon name="read" size={28} />
              <h2>{isLoading ? 'Đang mở bài đọc' : 'Chọn một bài để bắt đầu'}</h2>
              <p>Nội dung, pinyin và bản dịch sẽ hiển thị tại đây.</p>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}