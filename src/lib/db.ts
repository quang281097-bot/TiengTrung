import { Pool } from 'pg';

/** ID người học mẫu trong database/seed.sql, dùng tới khi có đăng nhập thật. */
export const DEMO_USER_ID = process.env.DEMO_USER_ID ?? '11111111-1111-4111-8111-111111111111';

const globalForPg = globalThis as unknown as { pgPool?: Pool };

/** Trả về pool dùng chung, hoặc null nếu chưa cấu hình DATABASE_URL. */
export function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  globalForPg.pgPool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  return globalForPg.pgPool;
}
