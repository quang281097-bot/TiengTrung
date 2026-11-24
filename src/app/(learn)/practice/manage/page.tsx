import { redirect } from 'next/navigation';

import ReadingManager from '../../../../components/reading/ReadingManager';
import { getSessionUser } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export default async function ManageReadingsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/practice');

  return <ReadingManager />;
}