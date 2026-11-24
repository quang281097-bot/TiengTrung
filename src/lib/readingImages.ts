import { unlink } from 'node:fs/promises';
import path from 'node:path';

export function getStoredReadingImagePath(imageUrl: string | null | undefined): string | null {
  if (!imageUrl?.startsWith('/uploads/readings/')) return null;
  const fileName = path.basename(imageUrl);
  if (!/^[a-f0-9-]+\.(?:jpg|png|webp)$/.test(fileName)) return null;
  return path.join(process.cwd(), 'public', 'uploads', 'readings', fileName);
}

export async function removeStoredReadingImage(imageUrl: string | null | undefined) {
  const filePath = getStoredReadingImagePath(imageUrl);
  if (!filePath) return;
  try {
    await unlink(filePath);
  } catch {
    return;
  }
}