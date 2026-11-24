import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

import { getSessionUser } from '../../../../../lib/auth';
import { getPool } from '../../../../../lib/db';
import { removeStoredReadingImage } from '../../../../../lib/readingImages';

export const runtime = 'nodejs';

type RouteContext = { params: { id: string } };
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const extensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function parseId(value: string) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function hasValidSignature(bytes: Buffer, mimeType: string) {
  if (mimeType === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === 'image/webp') return bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  return false;
}

async function getAdminPool() {
  const user = await getSessionUser();
  if (user?.role !== 'admin') return null;
  return getPool();
}

export async function POST(request: Request, { params }: RouteContext) {
  const pool = await getAdminPool();
  if (!pool) return NextResponse.json({ error: 'Chỉ quản trị viên mới được tải ảnh lên.' }, { status: 403 });

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_FILE_SIZE + 64 * 1024) {
    return NextResponse.json({ error: 'Ảnh không được vượt quá 5 MB.' }, { status: 413 });
  }

  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: 'Mã bài đọc không hợp lệ.' }, { status: 400 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Form tải ảnh không hợp lệ.' }, { status: 400 });
  }

  const file = formData.get('image');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'Chọn một ảnh để tải lên.' }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Ảnh không được vượt quá 5 MB.' }, { status: 413 });
  }

  const extension = extensions[file.type];
  if (!extension) {
    return NextResponse.json({ error: 'Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.' }, { status: 415 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!hasValidSignature(bytes, file.type)) {
    return NextResponse.json({ error: 'Nội dung file không khớp định dạng ảnh.' }, { status: 415 });
  }

  try {
    const existing = await pool.query<{ image_url: string | null }>(
      'SELECT image_url FROM bai_doc WHERE id = $1',
      [id],
    );
    if (!existing.rows[0]) return NextResponse.json({ error: 'Không tìm thấy bài đọc.' }, { status: 404 });

    const fileName = `${randomUUID()}.${extension}`;
    const directory = path.join(process.cwd(), 'public', 'uploads', 'readings');
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, fileName), bytes, { flag: 'wx' });

    const imageUrl = `/uploads/readings/${fileName}`;
    try {
      await pool.query('UPDATE bai_doc SET image_url = $1, updated_at = now() WHERE id = $2', [imageUrl, id]);
    } catch (error) {
      await removeStoredReadingImage(imageUrl);
      throw error;
    }

    await removeStoredReadingImage(existing.rows[0].image_url);
    return NextResponse.json({ imageUrl });
  } catch {
    return NextResponse.json({ error: 'Không thể lưu ảnh cho bài đọc.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const pool = await getAdminPool();
  if (!pool) return NextResponse.json({ error: 'Chỉ quản trị viên mới được gỡ ảnh.' }, { status: 403 });

  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: 'Mã bài đọc không hợp lệ.' }, { status: 400 });

  try {
    const result = await pool.query<{ image_url: string | null }>(
      'UPDATE bai_doc SET image_url = NULL, updated_at = now() WHERE id = $1 RETURNING image_url',
      [id],
    );
    if (!result.rowCount) return NextResponse.json({ error: 'Không tìm thấy bài đọc.' }, { status: 404 });
    await removeStoredReadingImage(result.rows[0].image_url);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Không thể gỡ ảnh.' }, { status: 500 });
  }
}