const PUNCTUATION = /[\s，。？！、,.?!；;：:“”"'‘’…·—\-（）()《》]/g;

const isPunctuation = (char: string) => /[\s，。？！、,.?!；;：:“”"'‘’…·—\-（）()《》]/.test(char);

const DIGITS = '零一二三四五六七八九';

function numberToChinese(n: number): string {
  if (n < 10) return DIGITS[n];
  if (n < 20) return `十${n % 10 ? DIGITS[n % 10] : ''}`;
  if (n < 100) return `${DIGITS[Math.floor(n / 10)]}十${n % 10 ? DIGITS[n % 10] : ''}`;
  return String(n)
    .split('')
    .map((d) => DIGITS[Number(d)])
    .join('');
}

/** Bỏ dấu câu/khoảng trắng và đổi chữ số (7点 → 七点) để so sánh với câu mẫu. */
export function normalizeChinese(text: string) {
  return text.replace(/\d+/g, (m) => numberToChinese(Number(m))).replace(PUNCTUATION, '');
}

export type RubyToken = { char: string; pinyin?: string; /** Vị trí trong các chữ Hán (không tính dấu câu), -1 nếu là dấu câu. */ index: number };

/** Ghép pinyin vào từng chữ Hán để hiển thị bằng thẻ <ruby>. */
export function toRuby(hanzi: string, syllables: string): RubyToken[] {
  const pinyin = syllables.trim().split(/\s+/);
  let k = 0;
  return Array.from(hanzi).map((char) => {
    if (isPunctuation(char)) return { char, index: -1 };
    const token = { char, pinyin: pinyin[k], index: k };
    k += 1;
    return token;
  });
}

export type Attempt = { score: number; transcript: string; hits: boolean[] };

/**
 * Chấm điểm câu nói: so khớp từng chữ Hán của câu mẫu với văn bản nhận dạng được
 * (dãy con chung dài nhất), trừ nhẹ điểm cho chữ thừa.
 */
export function scoreAttempt(targetHanzi: string, transcript: string): Attempt {
  const goal = Array.from(normalizeChinese(targetHanzi));
  const said = Array.from(normalizeChinese(transcript));
  const rows = goal.length + 1;
  const cols = said.length + 1;
  const lcs: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));

  for (let i = goal.length - 1; i >= 0; i -= 1) {
    for (let j = said.length - 1; j >= 0; j -= 1) {
      lcs[i][j] = goal[i] === said[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const hits = new Array<boolean>(goal.length).fill(false);
  let i = 0;
  let j = 0;
  while (i < goal.length && j < said.length) {
    if (goal[i] === said[j]) {
      hits[i] = true;
      i += 1;
      j += 1;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      i += 1;
    } else {
      j += 1;
    }
  }

  const matched = hits.filter(Boolean).length;
  const extra = Math.max(0, said.length - matched);
  const raw = goal.length === 0 ? 0 : (matched / goal.length) * 100 - extra * 5;
  return { score: Math.max(0, Math.min(100, Math.round(raw))), transcript, hits };
}
