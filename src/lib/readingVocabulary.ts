export type ImportantVocabularyItem = {
  hanzi: string;
  pinyin: string;
  meaningVi: string;
};

export function parseImportantVocabulary(value: unknown): ImportantVocabularyItem[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 30) return null;

  const items: ImportantVocabularyItem[] = [];
  const seen = new Set<string>();
  for (const rawItem of value) {
    if (!rawItem || typeof rawItem !== 'object') return null;
    const item = rawItem as Record<string, unknown>;
    const hanzi = typeof item.hanzi === 'string' ? item.hanzi.trim() : '';
    const pinyin = typeof item.pinyin === 'string' ? item.pinyin.trim() : '';
    const meaningVi = typeof item.meaningVi === 'string' ? item.meaningVi.trim() : '';
    if (!hanzi || !pinyin || !meaningVi || hanzi.length > 80 || pinyin.length > 160 || meaningVi.length > 240) {
      return null;
    }
    const key = `${hanzi}\u0000${pinyin}`;
    if (seen.has(key)) return null;
    seen.add(key);
    items.push({ hanzi, pinyin, meaningVi });
  }

  return items;
}