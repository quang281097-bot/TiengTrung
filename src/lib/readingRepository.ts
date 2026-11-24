import { getPool } from './db';

export type ReadingRecord = {
  id: number;
  hskLevel: number;
  slug: string;
  title: string;
  titleZh: string | null;
  passageZh: string;
  pinyin: string;
  translationVi: string;
  importantVocabulary: { hanzi: string; pinyin: string; meaningVi: string }[];
  imageUrl: string | null;
  estMinutes: number;
  isPublished: boolean;
  completed: boolean;
};

export async function getPublishedReadings(userId?: string): Promise<ReadingRecord[]> {
  const pool = getPool();
  if (!pool) return [];

  try {
    const result = await pool.query(
      `SELECT r.id, c.hsk_level AS "hskLevel", r.slug, r.title_vi AS title,
              r.title_zh AS "titleZh", r.passage_zh AS "passageZh", r.pinyin,
              r.translation_vi AS "translationVi", r.important_vocabulary AS "importantVocabulary",
              r.image_url AS "imageUrl", r.est_minutes AS "estMinutes", r.is_published AS "isPublished",
              (p.completed_at IS NOT NULL) AS completed
       FROM bai_doc r
       JOIN khoa_hoc c ON c.id = r.course_id
       LEFT JOIN tien_do_bai_doc p ON p.reading_id = r.id AND p.user_id = $1
       WHERE r.is_published = true
       ORDER BY c.hsk_level ASC, r.id ASC`,
      [userId ?? null],
    );
    return result.rows;
  } catch (error) {
    console.error('[readingRepository] Không thể tải bài đọc:', error);
    return [];
  }
}