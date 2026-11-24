import { NextResponse } from 'next/server';

import { getPool } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const pool = getPool();
  if (!pool) {
    return NextResponse.json({ status: 'not_configured' }, { status: 503 });
  }

  try {
    await pool.query('SELECT 1');
    return NextResponse.json({ status: 'ok' });
  } catch {
    return NextResponse.json({ status: 'unavailable' }, { status: 503 });
  }
}