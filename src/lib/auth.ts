import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

import { getPool } from './db';

export const SESSION_COOKIE = 'tiengtrung_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'learner';
};

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, saltHex, keyHex] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !saltHex || !keyHex) return false;

  const expectedKey = Buffer.from(keyHex, 'hex');
  if (expectedKey.length !== 64) return false;

  const actualKey = await deriveKey(password, Buffer.from(saltHex, 'hex'));
  return timingSafeEqual(actualKey, expectedKey);
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function getSessionToken(): string | null {
  return cookies().get(SESSION_COOKIE)?.value ?? null;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = getSessionToken();
  const pool = getPool();
  if (!token || !pool) return null;

  const result = await pool.query<SessionUser>(
    `SELECT u.id, u.email, u.display_name AS "displayName", u.role
     FROM nguoi_dung u
     JOIN phien_dang_nhap s ON s.user_id = u.id
     WHERE s.token_hash = $1 AND s.expires_at > now()
     LIMIT 1`,
    [hashSessionToken(token)],
  );

  return result.rows[0] ?? null;
}