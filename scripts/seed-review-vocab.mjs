import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:Tony%40281097@localhost:5432/TiengTrung',
});

const HANZII_LEVELS = [
  { slug: '1', level: 1, title: 'HSK 1' },
  { slug: '2', level: 2, title: 'HSK 2' },
  { slug: '3', level: 3, title: 'HSK 3' },
  { slug: '4', level: 4, title: 'HSK 4' },
  { slug: '5', level: 5, title: 'HSK 5' },
  { slug: '6', level: 6, title: 'HSK 6' },
  { slug: '7-9', level: 7, title: 'HSK 7-9' },
];

const POS_MAP = [
  { tag: '(danh)', label: 'Danh từ' },
  { tag: '(động)', label: 'Động từ' },
  { tag: '(tính)', label: 'Tính từ' },
  { tag: '(phó)', label: 'Phó từ' },
  { tag: '(lượng)', label: 'Lượng từ' },
  { tag: '(đại)', label: 'Đại từ' },
  { tag: '(liên)', label: 'Liên từ' },
  { tag: '(giới)', label: 'Giới từ' },
  { tag: '(trợ)', label: 'Trợ từ' },
  { tag: '(thán)', label: 'Thán từ' },
  { tag: '(số)', label: 'Số từ' },
];

function extractPosAndMeaning(rawMeaning, rawEn, hanzi, level) {
  const m = String(rawMeaning || '').trim();
  const en = String(rawEn || '').trim();
  const foundPos = [];

  for (const item of POS_MAP) {
    if (m.toLowerCase().includes(item.tag)) {
      foundPos.push(item.label);
    }
  }

  if (foundPos.length === 0 && en) {
    if (/\(n\)/i.test(en)) foundPos.push('Danh từ');
    if (/\(v\)/i.test(en)) foundPos.push('Động từ');
    if (/\(adj\)/i.test(en)) foundPos.push('Tính từ');
    if (/\(adv\)/i.test(en)) foundPos.push('Phó từ');
  }

  let partOfSpeech = foundPos.slice(0, 2).join(' / ');
  if (!partOfSpeech) {
    partOfSpeech = hanzi.length >= 4 && level >= 6 ? 'Thành ngữ / Cụm từ' : 'Từ vựng';
  }

  // Làm gọn nghĩa tiếng Việt nhiều dòng thành chuỗi rõ ràng
  const cleanMeaning = m
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' · ');

  return {
    partOfSpeech,
    meaningVi: cleanMeaning || en || hanzi,
  };
}

async function fetchHanziiLevelWords(slug) {
  const limit = 1000;
  let page = 1;
  const all = [];

  while (true) {
    const url = `https://api.hanzii.net/api/notebooks/free/hsk_${slug}?page=${page}&limit=${limit}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        Origin: 'https://hanzii.net',
        Referer: 'https://hanzii.net/',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} khi tải ${url}`);
    }

    const json = await res.json();
    const list = Array.isArray(json.result) ? json.result : [];
    if (list.length === 0) break;

    all.push(...list);
    const total = Number(json.total) || all.length;
    if (all.length >= total || list.length < limit) break;
    page += 1;
  }

  return all;
}

async function seedAllHanziiHsk() {
  console.log('=== Bắt đầu tải dữ liệu từ vựng HSK 1 - HSK 7-9 từ Hanzii.net ===');

  const client = await pool.connect();
  try {
    // 1. Đảm bảo 7 bộ sổ tay HSK 1 -> HSK 7-9 có trong bo_tu_vung
    const deckMap = new Map();
    for (const lv of HANZII_LEVELS) {
      const existing = await client.query(
        `SELECT id FROM bo_tu_vung WHERE title = $1 AND kind = 'hsk' LIMIT 1`,
        [lv.title],
      );
      if (existing.rows.length > 0) {
        deckMap.set(lv.level, existing.rows[0].id);
      } else {
        const ins = await client.query(
          `INSERT INTO bo_tu_vung (title, hsk_level, kind, created_at)
           VALUES ($1, $2, 'hsk', now())
           RETURNING id`,
          [lv.title, lv.level],
        );
        deckMap.set(lv.level, ins.rows[0].id);
      }
    }

    let grandTotal = 0;

    for (const lv of HANZII_LEVELS) {
      const rawWords = await fetchHanziiLevelWords(lv.slug);
      console.log(`-> Đã tải ${rawWords.length} từ của ${lv.title} từ Hanzii.net`);

      // Khử trùng lặp (hanzi, pinyin) trong cùng batch để UNNEST không bị lỗi ON CONFLICT DO UPDATE twice
      const dedupMap = new Map();
      for (const item of rawWords) {
        const hanzi = String(item.w || '').trim();
        const pinyin = String(item.p || '').trim() || hanzi;
        if (!hanzi) continue;
        const key = `${hanzi}___${pinyin}`;
        if (!dedupMap.has(key)) {
          const { partOfSpeech, meaningVi } = extractPosAndMeaning(
            item.m,
            item.m_en,
            hanzi,
            lv.level,
          );
          dedupMap.set(key, {
            hanzi,
            pinyin,
            meaningVi,
            partOfSpeech,
            hskLevel: lv.level,
          });
        }
      }

      const uniqueList = Array.from(dedupMap.values());
      const deckId = deckMap.get(lv.level);

      await client.query('BEGIN');

      // Chia theo lô 500 từ để INSERT nhanh qua UNNEST
      const chunkSize = 500;
      const insertedWordIds = [];

      for (let i = 0; i < uniqueList.length; i += chunkSize) {
        const slice = uniqueList.slice(i, i + chunkSize);
        const hanzis = slice.map((x) => x.hanzi);
        const pinyins = slice.map((x) => x.pinyin);
        const meanings = slice.map((x) => x.meaningVi);
        const posList = slice.map((x) => x.partOfSpeech);
        const levels = slice.map((x) => x.hskLevel);

        const res = await client.query(
          `WITH input AS (
             SELECT *
             FROM UNNEST($1::text[], $2::text[], $3::text[], $4::text[], $5::smallint[])
               AS words(hanzi, pinyin, meaning_vi, part_of_speech, hsk_level)
           ), upserted_words AS (
             INSERT INTO tu_vung (hanzi, pinyin, hsk_level)
             SELECT hanzi, pinyin, hsk_level FROM input
             ON CONFLICT (hanzi, pinyin) DO UPDATE
               SET hsk_level = LEAST(COALESCE(tu_vung.hsk_level, EXCLUDED.hsk_level), EXCLUDED.hsk_level)
             RETURNING id, hanzi, pinyin
           )
           INSERT INTO tu_vung_nghia (word_id, meaning_vi, part_of_speech, position)
           SELECT word.id, input.meaning_vi, input.part_of_speech, 1
           FROM input
           JOIN upserted_words word USING (hanzi, pinyin)
           ON CONFLICT (word_id, meaning_vi) DO UPDATE
             SET part_of_speech = COALESCE(EXCLUDED.part_of_speech, tu_vung_nghia.part_of_speech)
           RETURNING word_id AS id`,
          [hanzis, pinyins, meanings, posList, levels],
        );

        for (const r of res.rows) {
          insertedWordIds.push(r.id);
        }
      }

      // Liên kết vào bảng tu_trong_bo_tu_vung
      if (deckId && insertedWordIds.length > 0) {
        const uniqueIds = Array.from(new Set(insertedWordIds));
        const deckIds = uniqueIds.map(() => deckId);
        const positions = uniqueIds.map((_, idx) => Math.min(32760, idx + 1));

        await client.query(
          `INSERT INTO tu_trong_bo_tu_vung (deck_id, word_id, position)
           SELECT * FROM UNNEST($1::int[], $2::int[], $3::smallint[])
           ON CONFLICT (deck_id, word_id) DO UPDATE
             SET position = EXCLUDED.position`,
          [deckIds, uniqueIds, positions],
        );
      }

      await client.query('COMMIT');
      grandTotal += uniqueList.length;
      console.log(`   ✓ Đã nạp xong ${uniqueList.length} từ vào bảng tu_vung & sổ tay ${lv.title}`);
    }

    const summary = await client.query(
      `SELECT hsk_level, count(*)::int AS total
       FROM tu_vung
       GROUP BY hsk_level
       ORDER BY hsk_level ASC`,
    );
    console.log('\n=== THỐNG KÊ BẢNG tu_vung SAU KHI NẠP ===');
    console.table(summary.rows);
    console.log(`Tổng số lượt từ vựng HSK 1-9 đã xử lý: ${grandTotal}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedAllHanziiHsk().catch((err) => {
  console.error('Lỗi khi nạp từ vựng từ Hanzii:', err);
  process.exit(1);
});
