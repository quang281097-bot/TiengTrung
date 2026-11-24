import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { getSessionUser } from '../../../../lib/auth';
import { DEMO_USER_ID, getPool } from '../../../../lib/db';

export async function POST(request: Request) {
  const pool = getPool();
  if (!pool) {
    return NextResponse.json({ ok: false, error: 'Database chưa sẵn sàng' }, { status: 500 });
  }

  try {
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.id ?? DEMO_USER_ID;
    const body = await request.json();
    const action = body.action || 'rate_word';

    if (action === 'create_deck') {
      const title = String(body.title || '').trim();
      if (!title || title.length > 60) {
        return NextResponse.json(
          { ok: false, error: 'Tên sổ tay phải có từ 1 đến 60 ký tự.' },
          { status: 400 },
        );
      }

      const result = await pool.query(
        `INSERT INTO bo_tu_vung (owner_id, kind, title)
         VALUES ($1, 'custom', $2)
         RETURNING id, title`,
        [userId, title],
      );
      revalidatePath('/review');
      return NextResponse.json({ ok: true, deck: result.rows[0] });
    }

    if (action === 'add_dictionary_word') {
      const rawDeckId = body.deckId;
      const deckId =
        typeof rawDeckId === 'string' && /^custom-\d+$/.test(rawDeckId)
          ? Number(rawDeckId.slice('custom-'.length))
          : null;
      const wordId = Number(body.wordId);
      if (deckId === null || !Number.isInteger(wordId) || wordId < 1) {
        return NextResponse.json(
          { ok: false, error: 'Sổ tay hoặc từ vựng không hợp lệ.' },
          { status: 400 },
        );
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const deckRes = await client.query(
          `SELECT id
           FROM bo_tu_vung
           WHERE id = $1 AND owner_id = $2 AND kind = 'custom'
           FOR UPDATE`,
          [deckId, userId],
        );
        if (deckRes.rowCount === 0) {
          await client.query('ROLLBACK');
          return NextResponse.json(
            { ok: false, error: 'Không tìm thấy sổ tay cá nhân.' },
            { status: 404 },
          );
        }

        const wordRes = await client.query(
          `SELECT w.id, w.hanzi, w.pinyin, COALESCE(w.hsk_level, 1) AS "hskLevel",
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
                  ), 'Từ vựng') AS "partOfSpeech"
           FROM tu_vung w
           WHERE w.id = $1`,
          [wordId],
        );
        if (wordRes.rowCount === 0) {
          await client.query('ROLLBACK');
          return NextResponse.json(
            { ok: false, error: 'Không tìm thấy từ trong từ điển.' },
            { status: 404 },
          );
        }

        await client.query(
          `INSERT INTO tu_trong_bo_tu_vung (deck_id, word_id, position)
           VALUES (
             $1,
             $2,
             COALESCE((SELECT max(position) + 1 FROM tu_trong_bo_tu_vung WHERE deck_id = $1), 0)
           )
           ON CONFLICT (deck_id, word_id) DO NOTHING`,
          [deckId, wordId],
        );
        await client.query('COMMIT');
        revalidatePath('/review');
        return NextResponse.json({ ok: true, word: wordRes.rows[0] });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    if (action === 'add_word') {
      const hanzi = String(body.hanzi || '').trim();
      const pinyin = String(body.pinyin || '').trim();
      const meaningVi = String(body.meaningVi || '').trim();
      const rawHskLevel = body.hskLevel;
      const hskLevel =
        rawHskLevel === null || rawHskLevel === undefined || rawHskLevel === ''
          ? null
          : Number(rawHskLevel);
      const exHanzi = String(body.exHanzi || '').trim();
      const exPinyin = String(body.exPinyin || '').trim();
      const exVi = String(body.exVi || '').trim();
      const rawDeckId = body.deckId;
      const deckId =
        typeof rawDeckId === 'string' && /^custom-\d+$/.test(rawDeckId)
          ? Number(rawDeckId.slice('custom-'.length))
          : null;

      if (!hanzi || !meaningVi) {
        return NextResponse.json(
          { ok: false, error: 'Vui lòng nhập đầy đủ Chữ Hán và Nghĩa tiếng Việt.' },
          { status: 400 },
        );
      }
      if (hskLevel !== null && (!Number.isInteger(hskLevel) || hskLevel < 1 || hskLevel > 7)) {
        return NextResponse.json({ ok: false, error: 'Cấp HSK không hợp lệ.' }, { status: 400 });
      }
      if (rawDeckId !== undefined && deckId === null) {
        return NextResponse.json({ ok: false, error: 'Sổ tay không hợp lệ.' }, { status: 400 });
      }

      const client = await pool.connect();
      let word: Record<string, unknown>;
      try {
        await client.query('BEGIN');
        if (deckId !== null) {
          const deckRes = await client.query(
            `SELECT id
             FROM bo_tu_vung
             WHERE id = $1 AND owner_id = $2 AND kind = 'custom'
             FOR UPDATE`,
            [deckId, userId],
          );
          if (deckRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json(
              { ok: false, error: 'Không tìm thấy sổ tay cá nhân.' },
              { status: 404 },
            );
          }
        }

        const wordRes = await client.query(
          `INSERT INTO tu_vung (hanzi, pinyin, hsk_level)
           VALUES ($1, $2, $3)
         ON CONFLICT (hanzi, pinyin) DO UPDATE
           SET hsk_level = COALESCE(tu_vung.hsk_level, EXCLUDED.hsk_level)
           RETURNING id, hanzi, pinyin, hsk_level AS "hskLevel"`,
          [hanzi, pinyin || hanzi, hskLevel],
        );
        const dictionaryWord = wordRes.rows[0];

        await client.query(
          `INSERT INTO tu_vung_nghia (word_id, meaning_vi, position)
           VALUES (
             $1,
             $2,
             COALESCE((SELECT max(position) + 1 FROM tu_vung_nghia WHERE word_id = $1), 1)
           )
           ON CONFLICT (word_id, meaning_vi) DO NOTHING`,
          [dictionaryWord.id, meaningVi],
        );

        if (deckId !== null) {
          await client.query(
            `INSERT INTO tu_trong_bo_tu_vung (deck_id, word_id, position)
             VALUES (
               $1,
               $2,
               COALESCE((SELECT max(position) + 1 FROM tu_trong_bo_tu_vung WHERE deck_id = $1), 0)
             )
             ON CONFLICT (deck_id, word_id) DO NOTHING`,
            [deckId, dictionaryWord.id],
          );
        }

        if (exHanzi) {
          const sentRes = await client.query(
            `INSERT INTO cau_tieng_trung (hanzi, pinyin, meaning_vi, hsk_level)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [exHanzi, exPinyin, exVi, hskLevel],
          );
          await client.query(
            `INSERT INTO vi_du_tu_vung (word_id, sentence_id, position)
             VALUES ($1, $2, 0)
             ON CONFLICT DO NOTHING`,
            [dictionaryWord.id, sentRes.rows[0].id],
          );
        }

        const meaningRes = await client.query(
          `SELECT meaning_vi AS "meaningVi"
           FROM tu_vung_nghia
           WHERE word_id = $1 AND meaning_vi = $2`,
          [dictionaryWord.id, meaningVi],
        );
        await client.query('COMMIT');
        word = { ...dictionaryWord, ...meaningRes.rows[0] };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      revalidatePath('/review');
      return NextResponse.json({ ok: true, word, deckId: rawDeckId ?? null });
    }

    if (action === 'complete_session') {
      const wordsCount = Math.max(1, Number(body.wordsCount) || 5);
      const seconds = Math.max(60, Number(body.seconds) || wordsCount * 15);
      await pool.query(`SELECT record_activity($1, 'review', $2, $3)`, [
        userId,
        seconds,
        wordsCount,
      ]);
      revalidatePath('/');
      revalidatePath('/dashboard');
      revalidatePath('/review');
      revalidatePath('/profile');
      return NextResponse.json({ ok: true });
    }

    // Default: rate_word / toggle_status
    const wordId = Number(body.wordId);
    const rating: 'again' | 'hard' | 'good' | 'easy' = body.rating || 'good';

    if (!wordId) {
      return NextResponse.json({ ok: false, error: 'Thiếu wordId' }, { status: 400 });
    }

    const state =
      rating === 'easy' || rating === 'good'
        ? 'review'
        : rating === 'hard'
          ? 'learning'
          : 'relearning';
    const intervalDays =
      rating === 'easy' ? 4 : rating === 'good' ? 2 : rating === 'hard' ? 0.5 : 0.05;
    const repsIncrement = rating === 'again' ? 0 : 1;

    await pool.query(
      `INSERT INTO the_on_tap (user_id, word_id, state, due_at, interval_days, ease, reps, lapses, last_reviewed_at)
       VALUES ($1, $2, $3, now() + ($4 || ' days')::interval, $4, 2.5, $5, CASE WHEN $6 = 'again' THEN 1 ELSE 0 END, now())
       ON CONFLICT (user_id, word_id) DO UPDATE
         SET state = $3,
             due_at = now() + ($4 || ' days')::interval,
             interval_days = $4,
             reps = CASE WHEN $6 = 'again' THEN 0 ELSE GREATEST(the_on_tap.reps + 1, 2) END,
             lapses = CASE WHEN $6 = 'again' THEN the_on_tap.lapses + 1 ELSE the_on_tap.lapses END,
             last_reviewed_at = now()`,
      [userId, wordId, state, intervalDays, rating === 'again' ? 0 : 2, rating],
    );

    await pool.query(
      `INSERT INTO lich_su_on_tap (user_id, word_id, rating, state_before, interval_before, interval_after, duration_ms, reviewed_at)
       VALUES ($1, $2, $3, 'new', 0, $4, 3000, now())`,
      [userId, wordId, rating, intervalDays],
    );

    await pool.query(`SELECT record_activity($1, 'review', 20, 1)`, [userId]);

    revalidatePath('/review');
    revalidatePath('/');
    return NextResponse.json({
      ok: true,
      status: rating === 'easy' || rating === 'good' ? 'memorized' : rating === 'hard' ? 'learning' : 'unlearned',
    });
  } catch (error) {
    console.error('[api/review/progress] Lỗi lưu tiến độ ôn tập:', error);
    return NextResponse.json({ ok: false, error: 'Không thể lưu tiến độ' }, { status: 500 });
  }
}
