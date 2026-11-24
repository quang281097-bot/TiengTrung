import type { PoolClient } from 'pg';

import type { ImportantVocabularyItem } from './readingVocabulary';

export const readingVocabularyJsonSql = `COALESCE(
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'hanzi', word.hanzi,
        'pinyin', word.pinyin,
        'meaningVi', COALESCE(link.contextual_meaning_vi, sense.meaning_vi, '')
      )
      ORDER BY link.position
    )
    FROM bai_doc_tu_vung link
    JOIN tu_vung word ON word.id = link.word_id
    LEFT JOIN tu_vung_nghia sense ON sense.id = link.sense_id
    WHERE link.reading_id = r.id
  ),
  r.important_vocabulary
)`;

export async function syncReadingVocabulary(
  client: PoolClient,
  readingId: number,
  hskLevel: number,
  vocabulary: ImportantVocabularyItem[],
) {
  await client.query('DELETE FROM bai_doc_tu_vung WHERE reading_id = $1', [readingId]);

  for (const [index, item] of vocabulary.entries()) {
    const wordResult = await client.query<{ id: number }>(
      `INSERT INTO tu_vung (hanzi, pinyin, hsk_level)
       VALUES ($1, $2, $3)
       ON CONFLICT (hanzi, pinyin) DO UPDATE
         SET hsk_level = CASE
           WHEN tu_vung.hsk_level IS NULL THEN EXCLUDED.hsk_level
           ELSE least(tu_vung.hsk_level, EXCLUDED.hsk_level)
         END
       RETURNING id`,
      [item.hanzi, item.pinyin, hskLevel],
    );
    const wordId = wordResult.rows[0].id;

    const senseResult = await client.query<{ id: number }>(
      `INSERT INTO tu_vung_nghia (word_id, meaning_vi, position)
       SELECT $1, $2, COALESCE(max(position) + 1, 1)
       FROM tu_vung_nghia
       WHERE word_id = $1
       ON CONFLICT (word_id, meaning_vi) DO UPDATE
         SET meaning_vi = EXCLUDED.meaning_vi
       RETURNING id`,
      [wordId, item.meaningVi],
    );

    await client.query(
      `INSERT INTO bai_doc_tu_vung (reading_id, word_id, sense_id, position)
       VALUES ($1, $2, $3, $4)`,
      [readingId, wordId, senseResult.rows[0].id, index + 1],
    );
  }
}
