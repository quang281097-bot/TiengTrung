'use client';

import { useEffect, useState } from 'react';

type WordMeaning = {
  id: number;
  meaningVi: string;
  partOfSpeech: string | null;
  position: number;
};

type DictionaryWord = {
  id: number;
  hanzi: string;
  traditional: string | null;
  pinyin: string;
  hskLevel: number | null;
  meanings: WordMeaning[];
};

export default function DictionaryBrowser() {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('');
  const [words, setWords] = useState<DictionaryWord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (level) params.set('level', level);

      try {
        const response = await fetch(`/api/vocabulary?${params}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? 'Không thể tra từ điển.');
        setWords(result.words);
        setTotal(result.total);
      } catch (requestError) {
        if (requestError instanceof Error && requestError.name === 'AbortError') return;
        setError(requestError instanceof Error ? requestError.message : 'Không thể tra từ điển.');
        setWords([]);
        setTotal(0);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, level]);

  return (
    <div className="lx-dictionary">
      <header className="lx-dictionary-hero">
        <p className="lx-dictionary-eyebrow">Tra cứu tiếng Trung</p>
        <h1>Từ điển Trung – Việt</h1>
        <p>Tìm theo chữ Hán, pinyin hoặc nghĩa tiếng Việt; lọc từ vựng theo cấp HSK.</p>
      </header>

      <section className="lx-dictionary-tools" aria-label="Tìm kiếm từ điển">
        <label className="lx-dictionary-search">
          <span>Từ cần tra</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ví dụ: 朋友, péngyou, bạn bè"
            maxLength={100}
          />
        </label>
        <label className="lx-dictionary-level">
          <span>Cấp độ</span>
          <select value={level} onChange={(event) => setLevel(event.target.value)}>
            <option value="">Tất cả HSK</option>
            {Array.from({ length: 9 }, (_, index) => (
              <option key={index + 1} value={index + 1}>HSK {index + 1}</option>
            ))}
          </select>
        </label>
      </section>

      <div className="lx-dictionary-result-count" aria-live="polite">
        {isLoading ? 'Đang tìm từ...' : `${total} ${total === 1 ? 'kết quả' : 'kết quả'}`}
        {total > words.length && ` · đang hiển thị ${words.length} từ, hãy nhập thêm từ khóa để thu hẹp`}
      </div>

      {error ? (
        <p className="lx-dictionary-message is-error" role="alert">{error}</p>
      ) : !isLoading && words.length === 0 ? (
        <p className="lx-dictionary-message">Không tìm thấy từ phù hợp. Hãy thử từ khóa khác.</p>
      ) : (
        <ul className="lx-dictionary-list">
          {words.map((word) => (
            <li className="lx-dictionary-card" key={word.id}>
              <div className="lx-dictionary-word">
                <h2 lang="zh">{word.hanzi}</h2>
                {word.traditional && word.traditional !== word.hanzi && (
                  <span className="lx-dictionary-traditional" lang="zh">({word.traditional})</span>
                )}
                {word.hskLevel && <span className="lx-dictionary-badge">HSK {word.hskLevel}</span>}
              </div>
              <p className="lx-dictionary-pinyin">{word.pinyin || 'Chưa có pinyin'}</p>
              <ol className="lx-dictionary-meanings">
                {word.meanings.map((meaning) => (
                  <li key={meaning.id}>
                    {meaning.partOfSpeech && <span>{meaning.partOfSpeech} · </span>}
                    {meaning.meaningVi}
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
