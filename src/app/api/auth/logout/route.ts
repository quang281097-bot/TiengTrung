import { NextResponse } from 'next/server';

import { getPool } from '../../../../lib/db';
import { getSessionToken, hashSessionToken, SESSION_COOKIE, sessionCookieOptions } from '../../../../lib/auth';

export const runtime = 'nodejs';

export async function POST() {
  const token = getSessionToken();
  const pool = getPool();
  if (token && pool) {
    await pool.query('DELETE FROM phien_dang_nhap WHERE token_hash = $1', [hashSessionToken(token)]);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}