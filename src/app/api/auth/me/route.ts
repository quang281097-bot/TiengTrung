import { NextResponse } from 'next/server';

import { getSessionUser } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.json({
      user: user ? { displayName: user.displayName, role: user.role } : null,
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}