import { NextResponse } from 'next/server';

import { getPool } from '../../../lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const pool = getPool();
  if (!pool) return NextResponse.json({ error: 'Database chưa được cấu hình.' }, { status: 503 });

  const params = new URL(request.url).searchParams;
  const query = params.get('q')?.trim() ?? '';
  const rawLevel = params.get('level');
  const hskLevel = rawLevel === null ? null : Number(rawLevel);

  if (query.length > 100) {
    return NextResponse.json({ error: 'Từ khóa tìm kiếm tối đa 100 ký tự.' }, { status: 400 });
  }
  if (hskLevel !== null && (!Number.isInteger(hskLevel) || hskLevel < 1 || hskLevel > 9)) {
    return NextResponse.json({ error: 'Cấp HSK không hợp lệ.' }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `SELECT w.id, w.hanzi, w.traditional, w.pinyin, w.hsk_level AS "hskLevel",
              count(*) OVER()::int AS total,
              COALESCE(
                jsonb_agg(
                  jsonb_build_object(
                    'id', sense.id,
                    'meaningVi', sense.meaning_vi,
                    'partOfSpeech', sense.part_of_speech,
                    'position', sense.position
                  )
                  ORDER BY sense.position, sense.id
                ) FILTER (WHERE sense.id IS NOT NULL),
                '[]'::jsonb
              ) AS meanings
       FROM tu_vung w
       LEFT JOIN tu_vung_nghia sense ON sense.word_id = w.id
       WHERE ($1::text = '' OR
              w.hanzi ILIKE $2 OR
              coalesce(w.traditional, '') ILIKE $2 OR
              w.pinyin ILIKE $2 OR
              w.pinyin_search ILIKE $2 OR
              EXISTS (
                SELECT 1
                FROM tu_vung_nghia matched_sense
                WHERE matched_sense.word_id = w.id
                  AND matched_sense.meaning_vi ILIKE $2
              ))
         AND ($3::smallint IS NULL OR w.hsk_level = $3)
       GROUP BY w.id
       ORDER BY w.hsk_level NULLS LAST, w.hanzi, w.pinyin
       LIMIT 100`,
      [query, `%${query}%`, hskLevel],
    );

    const total = Number(result.rows[0]?.total ?? 0);
    return NextResponse.json({ words: result.rows, total });
  } catch (error) {
    console.error('[api/vocabulary] Không thể tra từ điển:', error);
    return NextResponse.json({ error: 'Không thể tra từ điển lúc này.' }, { status: 500 });
  }
}
