import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { getSessionUser } from '../../../../../lib/auth';
import { getPool } from '../../../../../lib/db';

export const runtime = 'nodejs';

type RouteContext = { params: { id: string } };

function parseId(value: string) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function revalidateLearningPages() {
  revalidatePath('/');
  revalidatePath('/dashboard');
  revalidatePath('/practice');
  revalidatePath('/profile');
}

export async function POST(_request: Request, { params }: RouteContext) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Hãy đăng nhập để lưu tiến độ.' }, { status: 401 });

  const pool = getPool();
  if (!pool) return NextResponse.json({ error: 'Database chưa được cấu hình.' }, { status: 503 });

  const readingId = parseId(params.id);
  if (!readingId) return NextResponse.json({ error: 'Mã bài đọc không hợp lệ.' }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const prev = await client.query<{ completed: boolean; estMinutes: number }>(
      `SELECT (p.completed_at IS NOT NULL) AS completed, coalesce(r.est_minutes, 4)::int AS "estMinutes"
       FROM bai_doc r
       LEFT JOIN tien_do_bai_doc p ON p.reading_id = r.id AND p.user_id = $1
       WHERE r.id = $2`,
      [user.id, readingId],
    );

    if (!prev.rows[0]) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Không tìm thấy bài đọc.' }, { status: 404 });
    }

    const wasCompleted = Boolean(prev.rows[0].completed);
    const estSeconds = Math.max(60, prev.rows[0].estMinutes * 60);

    const result = await client.query(
      `INSERT INTO tien_do_bai_doc (user_id, reading_id, started_at, last_activity_at, completed_at)
       VALUES ($1, $2, now(), now(), now())
       ON CONFLICT (user_id, reading_id) DO UPDATE SET
         last_activity_at = now(),
         completed_at = now()
       RETURNING completed_at IS NOT NULL AS completed`,
      [user.id, readingId],
    );

    if (!wasCompleted) {
      await client.query(`SELECT record_activity($1, 'reading', $2, 1)`, [user.id, estSeconds]);
    }

    await client.query('COMMIT');
    revalidateLearningPages();
    return NextResponse.json({ completed: result.rows[0]?.completed ?? true });
  } catch {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: 'Không thể lưu tiến độ bài đọc.' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Hãy đăng nhập để thay đổi tiến độ.' }, { status: 401 });

  const pool = getPool();
  if (!pool) return NextResponse.json({ error: 'Database chưa được cấu hình.' }, { status: 503 });

  const readingId = parseId(params.id);
  if (!readingId) return NextResponse.json({ error: 'Mã bài đọc không hợp lệ.' }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const prev = await client.query<{ completed: boolean; completedToday: boolean; estMinutes: number }>(
      `SELECT (p.completed_at IS NOT NULL) AS completed,
              ((p.completed_at AT TIME ZONE user_tz($1))::date = local_today($1)) AS "completedToday",
              coalesce(r.est_minutes, 4)::int AS "estMinutes"
       FROM bai_doc r
       LEFT JOIN tien_do_bai_doc p ON p.reading_id = r.id AND p.user_id = $1
       WHERE r.id = $2`,
      [user.id, readingId],
    );

    await client.query(
      `UPDATE tien_do_bai_doc
       SET completed_at = NULL, last_activity_at = now()
       WHERE user_id = $1 AND reading_id = $2`,
      [user.id, readingId],
    );

    if (prev.rows[0]?.completed && prev.rows[0]?.completedToday) {
      const estSeconds = Math.max(60, prev.rows[0].estMinutes * 60);
      await client.query(
        `UPDATE hoat_dong_hang_ngay
         SET seconds = greatest(0, seconds - $2),
             items = greatest(0, items - 1)
         WHERE user_id = $1 AND day = local_today($1) AND activity = 'reading'`,
        [user.id, estSeconds],
      );
      await client.query(
        `DELETE FROM hoat_dong_hang_ngay
         WHERE user_id = $1 AND day = local_today($1) AND seconds = 0 AND items = 0`,
        [user.id],
      );
      await client.query(
        `UPDATE nguoi_dung u
         SET current_streak = CASE
               WHEN EXISTS (SELECT 1 FROM hoat_dong_hang_ngay a WHERE a.user_id = u.id AND a.day = local_today(u.id) AND a.seconds > 0)
               THEN u.current_streak
               ELSE greatest(0, u.current_streak - 1)
             END,
             last_study_date = (SELECT max(day) FROM hoat_dong_hang_ngay a WHERE a.user_id = u.id AND a.seconds > 0),
             updated_at = now()
         WHERE u.id = $1`,
        [user.id],
      );
    }

    await client.query('COMMIT');
    revalidateLearningPages();
    return NextResponse.json({ completed: false });
  } catch {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: 'Không thể bỏ trạng thái đã học.' }, { status: 500 });
  } finally {
    client.release();
  }
}
