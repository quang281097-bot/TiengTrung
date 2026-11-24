import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { getSessionUser } from '../../../lib/auth';
import { getPool } from '../../../lib/db';
import { parseImportantVocabulary } from '../../../lib/readingVocabulary';
import { readingVocabularyJsonSql, syncReadingVocabulary } from '../../../lib/readingVocabularyDb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseReading(body: Record<string, unknown>) {
  const hskLevel = Number(body.hskLevel);
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const passageZh = typeof body.passageZh === 'string' ? body.passageZh.trim() : '';
  const estMinutes = Number(body.estMinutes ?? 5);

  if (![1, 2, 3, 4, 5, 6].includes(hskLevel)) return { error: 'HSK không hợp lệ.' } as const;
  if (!title || !passageZh) return { error: 'Tiêu đề và nội dung bài đọc là bắt buộc.' } as const;
  if (!Number.isInteger(estMinutes) || estMinutes < 1 || estMinutes > 180) {
    return { error: 'Thời lượng phải từ 1 đến 180 phút.' } as const;
  }

  const titleZh = typeof body.titleZh === 'string' ? body.titleZh.trim() : '';
  const pinyin = typeof body.pinyin === 'string' ? body.pinyin.trim() : '';
  const translationVi = typeof body.translationVi === 'string' ? body.translationVi.trim() : '';
  const isPublished = body.isPublished === true;
  const importantVocabulary = parseImportantVocabulary(body.importantVocabulary);
  if (!importantVocabulary) return { error: 'Danh sách từ vựng không hợp lệ (tối đa 30 từ).' } as const;
  if (isPublished && importantVocabulary.length === 0) {
    return { error: 'Thêm ít nhất một từ vựng trước khi xuất bản.' } as const;
  }
  const slugSource = typeof body.slug === 'string' ? body.slug : title;
  const slug = slugSource
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || `bai-doc-${Date.now()}`;

  return { hskLevel, title, titleZh, passageZh, pinyin, translationVi, importantVocabulary, estMinutes, isPublished, slug } as const;
}

export async function GET(request: Request) {
  const pool = getPool();
  if (!pool) return NextResponse.json({ error: 'Database chưa được cấu hình.' }, { status: 503 });

  const user = await getSessionUser();
  const url = new URL(request.url);
  const all = url.searchParams.get('all') === '1';
  if (all && user?.role !== 'admin') {
    return NextResponse.json({ error: 'Bạn không có quyền xem bản nháp.' }, { status: 403 });
  }

  const rawLevel = url.searchParams.get('level');
  const hskLevel = rawLevel === null ? null : Number(rawLevel);
  if (hskLevel !== null && ![1, 2, 3, 4, 5, 6].includes(hskLevel)) {
    return NextResponse.json({ error: 'HSK không hợp lệ.' }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `SELECT r.id, c.hsk_level AS "hskLevel", r.slug, r.title_vi AS title,
              r.title_zh AS "titleZh", r.passage_zh AS "passageZh", r.pinyin,
              r.translation_vi AS "translationVi", r.est_minutes AS "estMinutes",
              ${readingVocabularyJsonSql} AS "importantVocabulary", r.image_url AS "imageUrl",
              r.is_published AS "isPublished"
       FROM bai_doc r
       JOIN khoa_hoc c ON c.id = r.course_id
       WHERE ($1::smallint IS NULL OR c.hsk_level = $1)
         AND ($2::boolean OR r.is_published)
       ORDER BY c.hsk_level, r.id DESC`,
      [hskLevel, user?.role === 'admin'],
    );
    return NextResponse.json({ readings: result.rows });
  } catch {
    return NextResponse.json({ error: 'Không thể tải danh sách bài đọc.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Chỉ quản trị viên mới được thêm bài đọc.' }, { status: 403 });
  }

  const pool = getPool();
  if (!pool) return NextResponse.json({ error: 'Database chưa được cấu hình.' }, { status: 503 });

  try {
    const parsed = parseReading(await request.json());
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const client = await pool.connect();
    let readingId: number;
    try {
      await client.query('BEGIN');
      const course = await client.query(
        'SELECT id FROM khoa_hoc WHERE hsk_level = $1 ORDER BY position LIMIT 1',
        [parsed.hskLevel],
      );
      if (!course.rows[0]) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Chưa có khóa học HSK này.' }, { status: 404 });
      }

      const result = await client.query(
        `INSERT INTO bai_doc
           (course_id, slug, title_vi, title_zh, passage_zh, pinyin, translation_vi, important_vocabulary, est_minutes, is_published, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11)
         RETURNING id`,
        [course.rows[0].id, parsed.slug, parsed.title, parsed.titleZh, parsed.passageZh,
          parsed.pinyin, parsed.translationVi, JSON.stringify(parsed.importantVocabulary),
          parsed.estMinutes, parsed.isPublished, user.id],
      );
      readingId = result.rows[0].id;
      await syncReadingVocabulary(client, readingId, parsed.hskLevel, parsed.importantVocabulary);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    revalidatePath('/practice');
    revalidatePath('/practice/manage');
    return NextResponse.json({ id: readingId }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Không thể tạo bài đọc. Kiểm tra slug có bị trùng không.' }, { status: 500 });
  }
}