import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { getSessionUser } from '../../../../lib/auth';
import { getPool } from '../../../../lib/db';
import { removeStoredReadingImage } from '../../../../lib/readingImages';
import { parseImportantVocabulary } from '../../../../lib/readingVocabulary';
import { syncReadingVocabulary } from '../../../../lib/readingVocabularyDb';

export const runtime = 'nodejs';

type RouteContext = { params: { id: string } };

function parseId(value: string) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

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

async function adminContext() {
  const user = await getSessionUser();
  if (user?.role !== 'admin') return null;
  return { user, pool: getPool() };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const context = await adminContext();
  if (!context) return NextResponse.json({ error: 'Chỉ quản trị viên mới được sửa bài đọc.' }, { status: 403 });
  if (!context.pool) return NextResponse.json({ error: 'Database chưa được cấu hình.' }, { status: 503 });

  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: 'Mã bài đọc không hợp lệ.' }, { status: 400 });

  try {
    const parsed = parseReading(await request.json());
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const client = await context.pool.connect();
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
        `UPDATE bai_doc SET course_id = $1, slug = $2, title_vi = $3, title_zh = $4,
           passage_zh = $5, pinyin = $6, translation_vi = $7, important_vocabulary = $8::jsonb,
           est_minutes = $9, is_published = $10, updated_at = now()
         WHERE id = $11 RETURNING id`,
        [course.rows[0].id, parsed.slug, parsed.title, parsed.titleZh, parsed.passageZh,
          parsed.pinyin, parsed.translationVi, JSON.stringify(parsed.importantVocabulary),
          parsed.estMinutes, parsed.isPublished, id],
      );
      if (!result.rowCount) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Không tìm thấy bài đọc.' }, { status: 404 });
      }
      await syncReadingVocabulary(client, id, parsed.hskLevel, parsed.importantVocabulary);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    revalidatePath('/practice');
    revalidatePath('/practice/manage');
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Không thể cập nhật bài đọc. Kiểm tra slug có bị trùng không.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const context = await adminContext();
  if (!context) return NextResponse.json({ error: 'Chỉ quản trị viên mới được xóa bài đọc.' }, { status: 403 });
  if (!context.pool) return NextResponse.json({ error: 'Database chưa được cấu hình.' }, { status: 503 });

  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: 'Mã bài đọc không hợp lệ.' }, { status: 400 });

  try {
    const image = await context.pool.query<{ image_url: string | null }>('SELECT image_url FROM bai_doc WHERE id = $1', [id]);
    if (!image.rows[0]) return NextResponse.json({ error: 'Không tìm thấy bài đọc.' }, { status: 404 });
    const result = await context.pool.query('DELETE FROM bai_doc WHERE id = $1', [id]);
    if (!result.rowCount) return NextResponse.json({ error: 'Không tìm thấy bài đọc.' }, { status: 404 });
    await removeStoredReadingImage(image.rows[0].image_url);
    revalidatePath('/practice');
    revalidatePath('/practice/manage');
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Không thể xóa bài đọc.' }, { status: 500 });
  }
}