import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';

import { getPool } from '../../../../lib/db';
import { hashSessionToken, SESSION_COOKIE, sessionCookieOptions, verifyPassword } from '../../../../lib/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: { username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Thông tin đăng nhập không hợp lệ.' }, { status: 400 });
  }

  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!username || !password) {
    return NextResponse.json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu.' }, { status: 400 });
  }

  const pool = getPool();
  if (!pool) {
    return NextResponse.json({ error: 'Database chưa được cấu hình.' }, { status: 503 });
  }

  try {
    const result = await pool.query<{
      id: string;
      password_hash: string | null;
      role: 'admin' | 'learner';
    }>(
      `SELECT id, password_hash, role
       FROM nguoi_dung
       WHERE lower(email) = lower($1)
       LIMIT 1`,
      [username],
    );

    const user = result.rows[0];
    if (!user?.password_hash || !(await verifyPassword(password, user.password_hash))) {
      return NextResponse.json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng.' }, { status: 401 });
    }

    const token = randomBytes(32).toString('base64url');
    await pool.query(
      `INSERT INTO phien_dang_nhap (user_id, token_hash, expires_at)
        VALUES ($1, $2, now() + interval '30 days')`,
      [user.id, hashSessionToken(token)],
    );

    const response = NextResponse.json({ role: user.role });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch {
    return NextResponse.json({ error: 'Không thể đăng nhập lúc này.' }, { status: 500 });
  }
}