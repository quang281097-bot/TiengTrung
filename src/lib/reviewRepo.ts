import { DEMO_USER_ID, getPool } from './db';

export type ReviewWordExample = {
  hanzi: string;
  pinyin: string;
  meaningVi: string;
};

export type ReviewWordItem = {
  id: number;
  hanzi: string;
  pinyin: string;
  meaningVi: string;
  hskLevel: number;
  partOfSpeech: string;
  status: 'unlearned' | 'learning' | 'memorized';
  reps: number;
  example?: ReviewWordExample;
};

export type ReviewNotebookDeck = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  badge: string;
  hskLevel: number;
  kind: 'hsk' | 'topic' | 'custom';
  words: ReviewWordItem[];
};

export type ReviewPageData = {
  notebooks: ReviewNotebookDeck[];
  totalWords: number;
  totalMemorized: number;
  totalLearning: number;
  streakDays: number;
};

const HSK_NOTEBOOK_META: Record<number, { title: string; subtitle: string; badge: string }> = {
  1: { title: 'Sổ tay HSK 1', subtitle: '500+ từ vựng giao tiếp sơ cấp nền tảng (Chuẩn Hanzii HSK 3.0)', badge: 'HSK 1' },
  2: { title: 'Sổ tay HSK 2', subtitle: '750+ từ vựng sinh hoạt & hội thoại hàng ngày', badge: 'HSK 2' },
  3: { title: 'Sổ tay HSK 3', subtitle: '950+ từ vựng trung cấp & giao tiếp công việc', badge: 'HSK 3' },
  4: { title: 'Sổ tay HSK 4', subtitle: '980+ từ vựng thảo luận chuyên đề & xã hội', badge: 'HSK 4' },
  5: { title: 'Sổ tay HSK 5', subtitle: '1.440+ từ vựng báo chí, văn hóa & học thuật', badge: 'HSK 5' },
  6: { title: 'Sổ tay HSK 6', subtitle: '1.210+ từ vựng cao cấp & diễn đạt tinh tế', badge: 'HSK 6' },
  7: { title: 'Sổ tay HSK 7-9', subtitle: '5.610+ từ vựng & thành ngữ HSK 3.0 Cao cấp (Chuẩn Hanzii)', badge: 'HSK 7-9' },
};

export async function getReviewPageData(userId?: string): Promise<ReviewPageData> {
  const pool = getPool();
  const effectiveUserId = userId ?? DEMO_USER_ID;

  const notebooksByLevel = new Map<number, ReviewNotebookDeck>();
  const customNotebooks: ReviewNotebookDeck[] = [];
  for (const lv of [1, 2, 3, 4, 5, 6, 7]) {
    const meta = HSK_NOTEBOOK_META[lv];
    notebooksByLevel.set(lv, {
      id: `hsk-${lv}`,
      slug: `hsk-${lv}`,
      title: meta.title,
      subtitle: meta.subtitle,
      badge: meta.badge,
      hskLevel: lv,
      kind: 'hsk',
      words: [],
    });
  }

  let streakDays = 0;

  if (pool) {
    try {
      const [wordsRes, examplesRes, reviewStatesRes, userRes, customDecksRes, customWordsRes] =
        await Promise.all([
        pool.query(
          `SELECT w.id, w.hanzi, w.pinyin,
                  COALESCE((
                    SELECT s.meaning_vi
                    FROM tu_vung_nghia s
                    WHERE s.word_id = w.id
                    ORDER BY s.position, s.id
                    LIMIT 1
                  ), '') AS "meaningVi",
                  COALESCE((
                    SELECT s.part_of_speech
                    FROM tu_vung_nghia s
                    WHERE s.word_id = w.id
                    ORDER BY s.position, s.id
                    LIMIT 1
                  ), 'Từ vựng') AS "partOfSpeech",
                  COALESCE(w.hsk_level, 1) AS "hskLevel"
           FROM tu_vung w
           WHERE w.hsk_level IS NOT NULL
           ORDER BY COALESCE(w.hsk_level, 1) ASC, w.id ASC`,
        ),
        pool.query(
          `SELECT v.word_id AS "wordId", s.hanzi, s.pinyin, s.meaning_vi AS "meaningVi"
           FROM vi_du_tu_vung v
           JOIN cau_tieng_trung s ON s.id = v.sentence_id
           ORDER BY v.word_id ASC, v.position ASC`,
        ),
        pool.query(
          `SELECT word_id AS "wordId", state, reps
           FROM the_on_tap
           WHERE user_id = $1`,
          [effectiveUserId],
        ),
        pool.query(
          `SELECT CASE WHEN last_study_date >= local_today(id) - 1 THEN current_streak ELSE 0 END AS streak
           FROM nguoi_dung WHERE id = $1`,
          [effectiveUserId],
        ),
        pool.query(
          `SELECT id, title
           FROM bo_tu_vung
           WHERE owner_id = $1 AND kind = 'custom'
           ORDER BY created_at ASC, id ASC`,
          [effectiveUserId],
        ),
        pool.query(
          `SELECT d.id AS "deckId", w.id, w.hanzi, w.pinyin,
                  COALESCE((
                    SELECT s.meaning_vi
                    FROM tu_vung_nghia s
                    WHERE s.word_id = w.id
                    ORDER BY s.position, s.id
                    LIMIT 1
                  ), '') AS "meaningVi",
                  COALESCE((
                    SELECT s.part_of_speech
                    FROM tu_vung_nghia s
                    WHERE s.word_id = w.id
                    ORDER BY s.position, s.id
                    LIMIT 1
                  ), 'Từ vựng') AS "partOfSpeech",
                  COALESCE(w.hsk_level, 1) AS "hskLevel"
           FROM bo_tu_vung d
           JOIN tu_trong_bo_tu_vung dw ON dw.deck_id = d.id
           JOIN tu_vung w ON w.id = dw.word_id
           WHERE d.owner_id = $1 AND d.kind = 'custom'
           ORDER BY d.id ASC, dw.position ASC, w.id ASC`,
          [effectiveUserId],
        ),
      ]);

      if (userRes.rows[0]?.streak) {
        streakDays = Number(userRes.rows[0].streak) || 0;
      }

      const exampleMap = new Map<number, ReviewWordExample>();
      for (const row of examplesRes.rows) {
        if (!exampleMap.has(row.wordId)) {
          exampleMap.set(row.wordId, {
            hanzi: row.hanzi,
            pinyin: row.pinyin || '',
            meaningVi: row.meaningVi || '',
          });
        }
      }

      const stateMap = new Map<
        number,
        { status: 'unlearned' | 'learning' | 'memorized'; reps: number }
      >();
      for (const row of reviewStatesRes.rows) {
        const reps = Number(row.reps) || 0;
        const rawState = String(row.state || '');
        const status: 'unlearned' | 'learning' | 'memorized' =
          rawState === 'review' && reps >= 2
            ? 'memorized'
            : reps >= 1 || rawState === 'learning' || rawState === 'relearning'
              ? 'learning'
              : 'unlearned';
        stateMap.set(row.wordId, { status, reps });
      }

      for (const row of wordsRes.rows) {
        const lv = Math.min(7, Math.max(1, Number(row.hskLevel) || 1));
        const deck = notebooksByLevel.get(lv);
        if (!deck) continue;

        const st = stateMap.get(row.id);
        const ex = exampleMap.get(row.id);

        const item: ReviewWordItem = {
          id: Number(row.id),
          hanzi: row.hanzi,
          pinyin: row.pinyin,
          meaningVi: row.meaningVi,
          hskLevel: lv,
          partOfSpeech: row.partOfSpeech || 'Từ vựng',
          status: st?.status ?? 'unlearned',
          reps: st?.reps ?? 0,
        };
        if (ex) item.example = ex;

        deck.words.push(item);
      }

      const customDecks = new Map<number, ReviewNotebookDeck>();
      for (const row of customDecksRes.rows) {
        const id = Number(row.id);
        const deck: ReviewNotebookDeck = {
          id: `custom-${id}`,
          slug: `custom-${id}`,
          title: row.title,
          subtitle: 'Sổ tay cá nhân của bạn',
          badge: 'Cá nhân',
          hskLevel: 1,
          kind: 'custom',
          words: [],
        };
        customDecks.set(id, deck);
        customNotebooks.push(deck);
      }

      for (const row of customWordsRes.rows) {
        const deck = customDecks.get(Number(row.deckId));
        if (!deck) continue;

        const st = stateMap.get(row.id);
        const ex = exampleMap.get(row.id);
        const item: ReviewWordItem = {
          id: Number(row.id),
          hanzi: row.hanzi,
          pinyin: row.pinyin,
          meaningVi: row.meaningVi,
          hskLevel: Math.min(7, Math.max(1, Number(row.hskLevel) || 1)),
          partOfSpeech: row.partOfSpeech || 'Từ vựng',
          status: st?.status ?? 'unlearned',
          reps: st?.reps ?? 0,
        };
        if (ex) item.example = ex;
        deck.words.push(item);
      }

    } catch (error) {
      console.error('[reviewRepo] Lỗi tải dữ liệu ôn tập từ PostgreSQL:', error);
    }
  }

  const notebooks = [...notebooksByLevel.values(), ...customNotebooks].filter(
    (n) => n.words.length > 0 || n.kind === 'custom',
  );
  const allWords = notebooks.flatMap((n) => n.words);
  const totalWords = allWords.length;
  const totalMemorized = allWords.filter((w) => w.status === 'memorized').length;
  const totalLearning = allWords.filter((w) => w.status === 'learning').length;

  return {
    notebooks,
    totalWords,
    totalMemorized,
    totalLearning,
    streakDays,
  };
}
