'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useChineseSpeech } from '../../lib/useChineseSpeech';
import type {
  WritingCharItem,
  WritingPagePayload,
  WritingWordItem,
} from '../../lib/writingRepo';
import Icon from '../ui/Icon';

function isHanziChar(ch: string): boolean {
  return /[\u3400-\u9fff\uF900-\uFAFF]/.test(ch);
}

/** Tách từ nhiều chữ Hán thành từng chữ đơn kèm pinyin tương ứng */
function splitWordToChars(
  hanzi: string,
  pinyin: string,
  meaning: string,
  charDictionary?: Record<string, WritingCharItem>,
): WritingCharItem[] {
  const cleanChars = Array.from(hanzi.trim()).filter(isHanziChar);
  const syllables = pinyin.trim().split(/\s+/).filter(Boolean);

  return cleanChars.map((ch, idx) => {
    const dictEntry = charDictionary?.[ch];
    const syllable =
      cleanChars.length === syllables.length && syllables[idx]
        ? syllables[idx]
        : dictEntry?.pinyin || syllables[idx] || pinyin;

    return {
      char: ch,
      pinyin: syllable,
      meaning: dictEntry?.meaning || meaning,
      strokeCount: dictEntry?.strokeCount,
    };
  });
}

type GridType = 'mizige' | 'tianzige' | 'fangge';
type GridColorKey = 'red' | 'gray' | 'cyan' | 'forest';
type LayoutMode = 'stroke_steps' | 'large_char';
type PickerTab = 'hsk' | 'decks' | 'custom';

type HanziStrokeData = {
  strokes: string[];
  medians?: number[][][];
};

const strokeDataCache = new Map<string, HanziStrokeData | null>();
const strokePromiseCache = new Map<string, Promise<HanziStrokeData | null>>();

function fetchHanziStrokes(char: string): Promise<HanziStrokeData | null> {
  if (strokeDataCache.has(char)) {
    return Promise.resolve(strokeDataCache.get(char) ?? null);
  }
  const existing = strokePromiseCache.get(char);
  if (existing) return existing;

  const promise = fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(char)}.json`)
    .then((res) => (res.ok ? res.json() : null))
    .then((json: HanziStrokeData | null) => {
      const valid = json && Array.isArray(json.strokes) ? json : null;
      strokeDataCache.set(char, valid);
      strokePromiseCache.delete(char);
      return valid;
    })
    .catch(() => {
      strokeDataCache.set(char, null);
      strokePromiseCache.delete(char);
      return null;
    });

  strokePromiseCache.set(char, promise);
  return promise;
}

const GRID_COLORS: Record<
  GridColorKey,
  { name: string; border: string; dashed: string; dot: string; badgeBg: string }
> = {
  red: {
    name: 'Đỏ truyền thống',
    border: '#ef4444',
    dashed: '#fca5a5',
    dot: '#ef4444',
    badgeBg: '#fef2f2',
  },
  gray: {
    name: 'Xám bút chì',
    border: '#64748b',
    dashed: '#cbd5e1',
    dot: '#64748b',
    badgeBg: '#f8fafc',
  },
  cyan: {
    name: 'Xanh ngọc bích',
    border: '#0284c7',
    dashed: '#7dd3fc',
    dot: '#0284c7',
    badgeBg: '#f0f9ff',
  },
  forest: {
    name: 'Xanh tùng DoDo.',
    border: '#1f4334',
    dashed: '#86b39d',
    dot: '#1f4334',
    badgeBg: '#eef5f0',
  },
};

const GRID_TYPES: { id: GridType; label: string; zh: string; desc: string }[] = [
  { id: 'mizige', label: 'Ô Mễ', zh: '米字格', desc: 'Kẻ ngang, dọc & 2 đường chéo' },
  { id: 'tianzige', label: 'Ô Điền', zh: '田字格', desc: 'Chia 4 góc cân đối' },
  { id: 'fangge', label: 'Ô vuông', zh: '方格', desc: 'Khung trơn luyện nâng cao' },
];

function HanziGridCell({
  char,
  strokes,
  mode,
  stepIndex = 0,
  gridType,
  gridColor,
  isLarge = false,
}: {
  char: string;
  strokes: string[] | null;
  mode: 'master' | 'step' | 'trace' | 'blank';
  stepIndex?: number;
  gridType: GridType;
  gridColor: GridColorKey;
  isLarge?: boolean;
}) {
  const palette = GRID_COLORS[gridColor];
  const borderStrokeWidth = isLarge ? 20 : 28;
  const dashedStrokeWidth = isLarge ? 10 : 16;

  return (
    <div className={`ws-grid-cell${isLarge ? ' is-large' : ''}`}>
      <svg viewBox="0 0 1024 1024" className="ws-grid-svg" aria-hidden="true">
        <rect
          x="0"
          y="0"
          width="1024"
          height="1024"
          fill="#ffffff"
          stroke={palette.border}
          strokeWidth={borderStrokeWidth}
        />

        {(gridType === 'mizige' || gridType === 'tianzige') && (
          <g stroke={palette.dashed} strokeWidth={dashedStrokeWidth} strokeDasharray="28,24">
            <line x1="512" y1="0" x2="512" y2="1024" />
            <line x1="0" y1="512" x2="1024" y2="512" />
          </g>
        )}

        {gridType === 'mizige' && (
          <g stroke={palette.dashed} strokeWidth={dashedStrokeWidth} strokeDasharray="28,24">
            <line x1="0" y1="0" x2="1024" y2="1024" />
            <line x1="1024" y1="0" x2="0" y2="1024" />
          </g>
        )}

        {mode !== 'blank' && strokes && strokes.length > 0 && (
          <g transform="translate(102, 820) scale(0.8, -0.8)">
            {mode === 'master' &&
              strokes.map((d, idx) => <path key={idx} d={d} fill="#0f172a" />)}

            {mode === 'trace' &&
              strokes.map((d, idx) => <path key={idx} d={d} fill="#cbd5e1" />)}

            {mode === 'step' &&
              strokes.map((d, idx) => {
                if (idx > stepIndex) return null;
                return (
                  <path
                    key={idx}
                    d={d}
                    fill={idx === stepIndex ? '#e11d48' : '#475569'}
                  />
                );
              })}
          </g>
        )}

        {mode !== 'blank' && (!strokes || strokes.length === 0) && (
          <text
            x="512"
            y="545"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="740"
            fontFamily="'Noto Serif SC', 'Kaiti SC', 'KaiTi', 'Songti SC', 'SimSun', 'Microsoft YaHei', serif"
            fill={
              mode === 'master'
                ? '#0f172a'
                : mode === 'step'
                  ? '#e11d48'
                  : '#cbd5e1'
            }
          >
            {char}
          </text>
        )}

        {mode === 'step' && (
          <text
            x="64"
            y="148"
            fontSize="118"
            fontWeight="700"
            fill="#94a3b8"
            fontFamily="system-ui, sans-serif"
          >
            {stepIndex + 1}
          </text>
        )}
      </svg>
    </div>
  );
}

function CharacterWorksheetRow({
  item,
  strokes,
  layoutMode,
  gridType,
  gridColor,
  showPinyin,
  showMeaning,
  showStrokeCount,
  onSelectInspect,
}: {
  item: WritingCharItem;
  strokes: string[] | null;
  layoutMode: LayoutMode;
  gridType: GridType;
  gridColor: GridColorKey;
  showPinyin: boolean;
  showMeaning: boolean;
  showStrokeCount: boolean;
  onSelectInspect?: (item: WritingCharItem) => void;
}) {
  const totalStrokes = strokes?.length ?? item.strokeCount ?? 0;

  if (layoutMode === 'large_char') {
    const stepCells = Math.min(totalStrokes, 9);
    const remainingTopTrace = Math.max(0, 9 - stepCells);

    return (
      <div className="ws-char-block is-large-layout">
        <div className="ws-char-header is-large-bar">
          <div className="ws-char-meta-left">
            <button
              type="button"
              className="ws-char-title-btn"
              onClick={() => onSelectInspect?.(item)}
              title="Nhấn để xem thứ tự nét & tập viết trực tiếp"
            >
              {item.char}
            </button>
            {showPinyin && item.pinyin && (
              <span className="ws-char-pinyin-pill">{item.pinyin}</span>
            )}
            {showStrokeCount && totalStrokes > 0 && (
              <span className="ws-char-stroke-count">{totalStrokes} nét</span>
            )}
          </div>
          {showMeaning && item.meaning && (
            <span className="ws-char-meaning">{item.meaning}</span>
          )}
        </div>

        <div className="ws-large-grid">
          <div className="ws-large-master-col">
            <HanziGridCell
              char={item.char}
              strokes={strokes}
              mode="master"
              gridType={gridType}
              gridColor={gridColor}
              isLarge
            />
          </div>
          <div className="ws-large-right-col">
            <div className="ws-cells-row is-nine">
              {Array.from({ length: stepCells }).map((_, idx) => (
                <HanziGridCell
                  key={`step-${idx}`}
                  char={item.char}
                  strokes={strokes}
                  mode="step"
                  stepIndex={idx}
                  gridType={gridType}
                  gridColor={gridColor}
                />
              ))}
              {Array.from({ length: remainingTopTrace }).map((_, idx) => (
                <HanziGridCell
                  key={`top-trace-${idx}`}
                  char={item.char}
                  strokes={strokes}
                  mode="trace"
                  gridType={gridType}
                  gridColor={gridColor}
                />
              ))}
            </div>
            <div className="ws-cells-row is-nine is-second-row">
              {Array.from({ length: 4 }).map((_, idx) => (
                <HanziGridCell
                  key={`trace-${idx}`}
                  char={item.char}
                  strokes={strokes}
                  mode="trace"
                  gridType={gridType}
                  gridColor={gridColor}
                />
              ))}
              {Array.from({ length: 5 }).map((_, idx) => (
                <HanziGridCell
                  key={`blank-${idx}`}
                  char={item.char}
                  strokes={strokes}
                  mode="blank"
                  gridType={gridType}
                  gridColor={gridColor}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: stroke_steps (12 columns per row)
  const stepCount = Math.min(totalStrokes, 8);
  const row1Traces = Math.max(0, 12 - 1 - stepCount);

  return (
    <div className="ws-char-block">
      <div className="ws-char-header">
        <div className="ws-char-meta-left">
          <button
            type="button"
            className="ws-char-inline-tag"
            onClick={() => onSelectInspect?.(item)}
            title="Nhấn để xem hướng dẫn phát âm & tập viết từng nét"
          >
            {item.char}
          </button>
          {showPinyin && item.pinyin && (
            <span className="ws-char-pinyin">{item.pinyin}</span>
          )}
          {showStrokeCount && totalStrokes > 0 && (
            <span className="ws-char-stroke-count">({totalStrokes} nét)</span>
          )}
        </div>
        {showMeaning && item.meaning && (
          <span className="ws-char-meaning">{item.meaning}</span>
        )}
      </div>

      <div className="ws-cells-row is-twelve">
        <HanziGridCell
          char={item.char}
          strokes={strokes}
          mode="master"
          gridType={gridType}
          gridColor={gridColor}
        />
        {Array.from({ length: stepCount }).map((_, idx) => (
          <HanziGridCell
            key={`step-${idx}`}
            char={item.char}
            strokes={strokes}
            mode="step"
            stepIndex={idx}
            gridType={gridType}
            gridColor={gridColor}
          />
        ))}
        {Array.from({ length: row1Traces }).map((_, idx) => (
          <HanziGridCell
            key={`r1-trace-${idx}`}
            char={item.char}
            strokes={strokes}
            mode="trace"
            gridType={gridType}
            gridColor={gridColor}
          />
        ))}
      </div>

      <div className="ws-cells-row is-twelve is-second-row">
        {Array.from({ length: 6 }).map((_, idx) => (
          <HanziGridCell
            key={`r2-trace-${idx}`}
            char={item.char}
            strokes={strokes}
            mode="trace"
            gridType={gridType}
            gridColor={gridColor}
          />
        ))}
        {Array.from({ length: 6 }).map((_, idx) => (
          <HanziGridCell
            key={`r2-blank-${idx}`}
            char={item.char}
            strokes={strokes}
            mode="blank"
            gridType={gridType}
            gridColor={gridColor}
          />
        ))}
      </div>
    </div>
  );
}

/** Bảng luyện viết tay trực tiếp trên màn hình & xem hoạt ảnh từng nét */
function InteractivePracticeModal({
  item,
  strokes,
  gridType,
  gridColor,
  onClose,
  onSpeak,
}: {
  item: WritingCharItem;
  strokes: string[] | null;
  gridType: GridType;
  gridColor: GridColorKey;
  onClose: () => void;
  onSpeak: (text: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const [userStrokesCount, setUserStrokesCount] = useState(0);
  const [showGhostTrace, setShowGhostTrace] = useState(true);
  const [animStep, setAnimStep] = useState<number>(strokes ? strokes.length - 1 : 0);
  const [isPlayingAnim, setIsPlayingAnim] = useState(false);

  const totalStrokes = strokes?.length ?? item.strokeCount ?? 0;

  useEffect(() => {
    setAnimStep(strokes && strokes.length > 0 ? strokes.length - 1 : 0);
  }, [strokes, item.char]);

  useEffect(() => {
    if (!isPlayingAnim || !strokes || strokes.length === 0) return;
    const timer = window.setInterval(() => {
      setAnimStep((prev) => {
        if (prev >= strokes.length - 1) {
          setIsPlayingAnim(false);
          return strokes.length - 1;
        }
        return prev + 1;
      });
    }, 650);
    return () => window.clearInterval(timer);
  }, [isPlayingAnim, strokes]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setUserStrokesCount(0);
  }, []);

  useEffect(() => {
    clearCanvas();
  }, [item.char, clearCanvas]);

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    isDrawingRef.current = true;
    const pt = getPoint(e);
    ctx.strokeStyle = '#163124';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pt = getPoint(e);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    setUserStrokesCount((c) => c + 1);
  };

  const startStrokeAnimation = () => {
    setAnimStep(0);
    setIsPlayingAnim(true);
  };

  return (
    <div className="ws-modal-backdrop" onClick={onClose}>
      <div className="ws-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="ws-modal-header">
          <div>
            <span className="ws-modal-eyebrow">Luyện viết tương tác &amp; Thứ tự nét</span>
            <h3 className="ws-modal-title">
              Chữ <span className="ws-modal-hanzi">{item.char}</span> · {item.pinyin}
            </h3>
            <p className="ws-modal-subtitle">
              Nghĩa: <strong>{item.meaning || 'Chữ Hán'}</strong>{' '}
              {totalStrokes > 0 ? `· Tổng số: ${totalStrokes} nét chuẩn` : ''}
            </p>
          </div>
          <div className="ws-modal-header-actions">
            <button
              type="button"
              className="ws-btn-secondary"
              onClick={() => onSpeak(item.char)}
            >
              <Icon name="volume" size={16} />
              Phát âm
            </button>
            <button
              type="button"
              className="ws-modal-close"
              onClick={onClose}
              aria-label="Đóng"
            >
              <Icon name="x" size={18} />
            </button>
          </div>
        </div>

        <div className="ws-modal-body">
          {/* Cột trái: Mô phỏng từng nét */}
          <div className="ws-modal-col">
            <div className="ws-modal-col-head">
              <span>1. Minh họa thứ tự nét ({strokes ? `${animStep + 1}/${strokes.length}` : 'Chữ mẫu'})</span>
              <div className="ws-modal-mini-btns">
                <button
                  type="button"
                  className="ws-chip-action"
                  onClick={startStrokeAnimation}
                >
                  <Icon name="play" size={13} />
                  Chạy từng nét
                </button>
              </div>
            </div>

            <div className="ws-modal-stage">
              <HanziGridCell
                char={item.char}
                strokes={strokes}
                mode={strokes && strokes.length > 0 ? 'step' : 'master'}
                stepIndex={animStep}
                gridType={gridType}
                gridColor={gridColor}
                isLarge
              />
            </div>

            {strokes && strokes.length > 1 && (
              <div className="ws-stroke-stepper">
                {strokes.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`ws-stroke-dot${idx === animStep ? ' is-active' : idx < animStep ? ' is-done' : ''}`}
                    onClick={() => {
                      setIsPlayingAnim(false);
                      setAnimStep(idx);
                    }}
                  >
                    Nét {idx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cột phải: Bảng tập viết tay bằng chuột / cảm ứng */}
          <div className="ws-modal-col">
            <div className="ws-modal-col-head">
              <span>2. Viết thử bằng chuột / màn hình cảm ứng ({userStrokesCount} nét đã viết)</span>
              <div className="ws-modal-mini-btns">
                <button
                  type="button"
                  className="ws-chip-action"
                  onClick={() => setShowGhostTrace((v) => !v)}
                >
                  {showGhostTrace ? 'Ẩn chữ mờ' : 'Hiện chữ mờ'}
                </button>
                <button
                  type="button"
                  className="ws-chip-action is-danger"
                  onClick={clearCanvas}
                >
                  Xóa viết lại
                </button>
              </div>
            </div>

            <div className="ws-modal-stage is-canvas-stage">
              <HanziGridCell
                char={item.char}
                strokes={strokes}
                mode={showGhostTrace ? 'trace' : 'blank'}
                gridType={gridType}
                gridColor={gridColor}
                isLarge
              />
              <canvas
                ref={canvasRef}
                width={600}
                height={600}
                className="ws-drawing-canvas"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              />
            </div>

            <p className="ws-canvas-hint">
              Mẹo: Dùng chuột hoặc bút cảm ứng tô theo nét chữ mờ trên khung {GRID_TYPES.find((g) => g.id === gridType)?.label}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WritingWorksheet({ data }: { data: WritingPagePayload }) {
  const speech = useChineseSpeech();

  // Danh sách chữ Hán được chọn để tạo phiếu in A4
  const [characters, setCharacters] = useState<WritingCharItem[]>(data.starterCharacters);
  const [strokeMap, setStrokeMap] = useState<Record<string, string[] | null>>({});

  // Cấu hình 1: Mẫu chữ
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('stroke_steps');

  // Cấu hình 2: Chọn từ vựng
  const [pickerTab, setPickerTab] = useState<PickerTab>('hsk');
  const [selectedHsk, setSelectedHsk] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hskVisibleCount, setHskVisibleCount] = useState(100);
  const [selectedDeckId, setSelectedDeckId] = useState<string>(data.decks[0]?.id ?? '');
  const [customText, setCustomText] = useState<string>('');

  // Cấu hình 3: Định dạng bản in
  const [isFormatOpen, setIsFormatOpen] = useState<boolean>(true);
  const [charsPerPage, setCharsPerPage] = useState<number>(6);
  const [gridType, setGridType] = useState<GridType>('mizige');
  const [gridColor, setGridColor] = useState<GridColorKey>('red');
  const [showPinyin, setShowPinyin] = useState<boolean>(true);
  const [showMeaning, setShowMeaning] = useState<boolean>(true);
  const [showStrokeCount, setShowStrokeCount] = useState<boolean>(true);
  const [authorName, setAuthorName] = useState<string>('');
  const [sheetTitle, setSheetTitle] = useState<string>('Luyện viết chữ Hán theo thứ tự nét');

  // Xem trước & Modal luyện viết trực tiếp
  const [inspectChar, setInspectChar] = useState<WritingCharItem | null>(null);
  const previewWrapRef = useRef<HTMLDivElement | null>(null);
  const [previewScale, setPreviewScale] = useState<number>(1);

  // Tự động tải dữ liệu nét chữ SVG (hanzi-writer-data) cho các chữ trong danh sách
  useEffect(() => {
    let cancelled = false;
    const uniqueChars = Array.from(new Set(characters.map((c) => c.char)));
    const missing = uniqueChars.filter((ch) => !(ch in strokeMap));
    if (missing.length === 0) return;

    Promise.all(
      missing.map(async (ch) => {
        const res = await fetchHanziStrokes(ch);
        return [ch, res?.strokes ?? null] as const;
      }),
    ).then((entries) => {
      if (cancelled) return;
      setStrokeMap((prev) => {
        const next = { ...prev };
        for (const [ch, strokes] of entries) {
          next[ch] = strokes;
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [characters, strokeMap]);

  // Tính toán tỷ lệ co giãn tờ A4 (794px = 210mm) vừa khít cột phải
  useEffect(() => {
    const el = previewWrapRef.current;
    if (!el) return;
    const updateScale = () => {
      const w = el.clientWidth;
      if (w > 0) {
        setPreviewScale(Math.min(1, (w - 8) / 794));
      }
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleLayoutChange = (mode: LayoutMode) => {
    setLayoutMode(mode);
    setCharsPerPage(mode === 'large_char' ? 4 : 6);
  };

  // Lọc danh sách từ vựng HSK theo cấp độ và từ khóa
  const filteredHskWords = useMemo(() => {
    const list = data.wordsByLevel[selectedHsk] ?? [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (w) =>
        w.hanzi.toLowerCase().includes(q) ||
        w.pinyin.toLowerCase().includes(q) ||
        w.meaning.toLowerCase().includes(q),
    );
  }, [data.wordsByLevel, selectedHsk, searchQuery]);
  const visibleHskWords = filteredHskWords.slice(0, hskVisibleCount);

  const activeDeck = useMemo(
    () => data.decks.find((d) => d.id === selectedDeckId) ?? data.decks[0] ?? null,
    [data.decks, selectedDeckId],
  );

  const selectedCharSet = useMemo(() => new Set(characters.map((c) => c.char)), [characters]);

  const addCharsToSheet = useCallback((items: WritingCharItem[]) => {
    setCharacters((prev) => {
      const existing = new Set(prev.map((p) => p.char));
      const additions: WritingCharItem[] = [];
      for (const item of items) {
        if (!existing.has(item.char)) {
          existing.add(item.char);
          additions.push(item);
        }
      }
      return additions.length > 0 ? [...prev, ...additions] : prev;
    });
  }, []);

  const handleAddWord = (word: WritingWordItem) => {
    const split = splitWordToChars(word.hanzi, word.pinyin, word.meaning, data.charDictionary);
    addCharsToSheet(split);
  };

  const handleAddDeck = () => {
    if (!activeDeck) return;
    const allChars: WritingCharItem[] = [];
    for (const w of activeDeck.words) {
      allChars.push(...splitWordToChars(w.hanzi, w.pinyin, w.meaning, data.charDictionary));
    }
    addCharsToSheet(allChars);
  };

  const handleAddCustomText = () => {
    const raw = customText.trim();
    if (!raw) return;
    const extracted = Array.from(raw).filter((ch) => /[\u3400-\u9fff\uF900-\uFAFF]/.test(ch));
    if (extracted.length === 0) return;

    const items: WritingCharItem[] = extracted.map((ch) => {
      const dict = data.charDictionary[ch];
      return {
        char: ch,
        pinyin: dict?.pinyin ?? '',
        meaning: dict?.meaning ?? '',
        strokeCount: dict?.strokeCount,
      };
    });
    addCharsToSheet(items);
    setCustomText('');
  };

  const handleRemoveChar = (index: number) => {
    setCharacters((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Chia trang A4 theo charsPerPage
  const pages = useMemo(() => {
    if (characters.length === 0) return [];
    const result: WritingCharItem[][] = [];
    for (let i = 0; i < characters.length; i += charsPerPage) {
      result.push(characters.slice(i, i + charsPerPage));
    }
    return result;
  }, [characters, charsPerPage]);

  const charsPerPageOptions = layoutMode === 'large_char' ? [2, 3, 4] : [4, 5, 6];

  return (
    <div className="ws-page">
      {/* Thanh tiêu đề & tác vụ nhanh */}
      <header className="ws-topbar ws-no-print">
        <div className="ws-topbar-left">
          <div className="ws-title-row">
            <span className="ws-icon-badge">
              <Icon name="pen" size={18} />
            </span>
            <h1 className="ws-title">Tập viết chữ Hán</h1>
            <span className="ws-a4-badge">Chuẩn khổ A4 · Thứ tự nét</span>
          </div>
          <p className="ws-subtitle">
            Tạo phiếu luyện viết chữ Hán theo từng nét bút đỏ (Ô Mễ / Ô Điền / Ô Vuông), tải PDF miễn phí hoặc nhấn vào từng chữ để tập viết trực tiếp trên màn hình.
          </p>
        </div>

        <div className="ws-topbar-actions">
          {characters.length > 0 && (
            <button
              type="button"
              className="ws-btn-outline"
              onClick={() => setInspectChar(characters[0])}
            >
              <Icon name="pen" size={16} />
              Viết thử trên màn hình
            </button>
          )}
          <button
            type="button"
            className="ws-btn-print"
            onClick={handlePrint}
            disabled={characters.length === 0}
          >
            <Icon name="read" size={16} />
            In / Tải PDF · {characters.length} chữ
          </button>
        </div>
      </header>

      {/* Bố cục 2 cột: Cột trái điều khiển (5 phần) - Cột phải Xem trước A4 (7 phần) */}
      <div className="ws-main-grid">
        {/* CỘT TRÁI: 3 BƯỚC CẤU HÌNH */}
        <aside className="ws-controls-col ws-no-print">
          {/* BƯỚC 1: MẪU CHỮ */}
          <section className="ws-card">
            <div className="ws-card-head">
              <span className="ws-step-num">1</span>
              <h2 className="ws-card-title">Mẫu chữ</h2>
            </div>

            <div className="ws-layout-grid">
              <button
                type="button"
                className={`ws-layout-option${layoutMode === 'stroke_steps' ? ' is-active' : ''}`}
                onClick={() => handleLayoutChange('stroke_steps')}
              >
                <div className="ws-layout-opt-top">
                  <span className="ws-layout-opt-name">Theo thứ tự nét</span>
                  {layoutMode === 'stroke_steps' && <span className="ws-check-dot">✓</span>}
                </div>
                <p className="ws-layout-opt-desc">Mẫu → từng nét đỏ → hàng tô theo</p>
              </button>

              <button
                type="button"
                className={`ws-layout-option${layoutMode === 'large_char' ? ' is-active' : ''}`}
                onClick={() => handleLayoutChange('large_char')}
              >
                <div className="ws-layout-opt-top">
                  <span className="ws-layout-opt-name">Ô chữ lớn</span>
                  {layoutMode === 'large_char' && <span className="ws-check-dot">✓</span>}
                </div>
                <p className="ws-layout-opt-desc">Ô lớn bên trái, nét nhỏ + hàng tô bên phải</p>
              </button>
            </div>
          </section>

          {/* BƯỚC 2: CHỌN TỪ VỰNG */}
          <section className="ws-card">
            <div className="ws-card-head is-between">
              <div className="ws-card-head-left">
                <span className="ws-step-num">2</span>
                <h2 className="ws-card-title">Chọn từ vựng</h2>
              </div>
              <span className="ws-selected-count-badge">Đã chọn: {characters.length} chữ</span>
            </div>

            {/* 3 Tabs nguồn từ vựng */}
            <div className="ws-picker-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={pickerTab === 'hsk'}
                className={`ws-picker-tab${pickerTab === 'hsk' ? ' is-active' : ''}`}
                onClick={() => setPickerTab('hsk')}
              >
                HSK 1 - 9
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={pickerTab === 'decks'}
                className={`ws-picker-tab${pickerTab === 'decks' ? ' is-active' : ''}`}
                onClick={() => setPickerTab('decks')}
              >
                Bộ từ &amp; Bài học
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={pickerTab === 'custom'}
                className={`ws-picker-tab${pickerTab === 'custom' ? ' is-active' : ''}`}
                onClick={() => setPickerTab('custom')}
              >
                Nhập tự do
              </button>
            </div>

            {/* Nội dung Tab 1: Từ điển HSK */}
            {pickerTab === 'hsk' && (
              <div className="ws-picker-panel">
                <div className="ws-hsk-pills">
                  {[1, 2, 3, 4, 5, 6, 7].map((lv) => (
                    <button
                      key={lv}
                      type="button"
                      className={`ws-hsk-pill${selectedHsk === lv ? ' is-active' : ''}`}
                      onClick={() => {
                        setSelectedHsk(lv);
                        setHskVisibleCount(100);
                      }}
                    >
                      {lv === 7 ? 'HSK 7–9' : `HSK ${lv}`}
                    </button>
                  ))}
                </div>

                <div className="ws-search-box">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setHskVisibleCount(100);
                    }}
                    placeholder="Tìm chữ Hán, pinyin hoặc nghĩa tiếng Việt..."
                    className="ws-search-input"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="ws-search-clear"
                      onClick={() => {
                        setSearchQuery('');
                        setHskVisibleCount(100);
                      }}
                      aria-label="Xóa tìm kiếm"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="ws-word-grid">
                  {visibleHskWords.map((word) => {
                    const charsInWord = Array.from(word.hanzi).filter((ch) =>
                      /[\u3400-\u9fff\uF900-\uFAFF]/.test(ch),
                    );
                    const allAdded =
                      charsInWord.length > 0 && charsInWord.every((ch) => selectedCharSet.has(ch));

                    return (
                      <button
                        key={word.id}
                        type="button"
                        onClick={() => handleAddWord(word)}
                        className={`ws-word-item${allAdded ? ' is-added' : ''}`}
                      >
                        <div className="ws-word-info">
                          <div className="ws-word-top">
                            <span className="ws-word-hanzi">{word.hanzi}</span>
                            <span className="ws-word-pinyin">{word.pinyin}</span>
                          </div>
                          <span className="ws-word-meaning">{word.meaning}</span>
                        </div>
                        <span className="ws-word-add-icon">{allAdded ? '✓' : '+'}</span>
                      </button>
                    );
                  })}

                  {filteredHskWords.length === 0 && (
                    <div className="ws-empty-words">Không tìm thấy từ vựng phù hợp.</div>
                  )}
                </div>
                {visibleHskWords.length < filteredHskWords.length && (
                  <button
                    type="button"
                    className="ws-btn-add-all"
                    onClick={() => setHskVisibleCount((count) => count + 100)}
                  >
                    Hiển thị thêm ({filteredHskWords.length - visibleHskWords.length} từ còn lại)
                  </button>
                )}
              </div>
            )}

            {/* Nội dung Tab 2: Bộ từ & Bài học */}
            {pickerTab === 'decks' && (
              <div className="ws-picker-panel">
                <div className="ws-deck-bar">
                  <select
                    value={selectedDeckId}
                    onChange={(e) => setSelectedDeckId(e.target.value)}
                    className="ws-deck-select"
                  >
                    {data.decks.map((deck) => (
                      <option key={deck.id} value={deck.id}>
                        {deck.title} ({deck.words.length} từ)
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="ws-btn-add-all"
                    onClick={handleAddDeck}
                    disabled={!activeDeck}
                  >
                    + Thêm tất cả
                  </button>
                </div>

                {activeDeck && (
                  <>
                    <p className="ws-deck-subtitle">{activeDeck.subtitle}</p>
                    <div className="ws-word-grid">
                      {activeDeck.words.map((word) => {
                        const charsInWord = Array.from(word.hanzi).filter((ch) =>
                          /[\u3400-\u9fff\uF900-\uFAFF]/.test(ch),
                        );
                        const allAdded =
                          charsInWord.length > 0 &&
                          charsInWord.every((ch) => selectedCharSet.has(ch));

                        return (
                          <button
                            key={word.id}
                            type="button"
                            onClick={() => handleAddWord(word)}
                            className={`ws-word-item${allAdded ? ' is-added' : ''}`}
                          >
                            <div className="ws-word-info">
                              <div className="ws-word-top">
                                <span className="ws-word-hanzi">{word.hanzi}</span>
                                <span className="ws-word-pinyin">{word.pinyin}</span>
                              </div>
                              <span className="ws-word-meaning">{word.meaning}</span>
                            </div>
                            <span className="ws-word-add-icon">{allAdded ? '✓' : '+'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Nội dung Tab 3: Nhập tự do */}
            {pickerTab === 'custom' && (
              <div className="ws-picker-panel">
                <textarea
                  rows={3}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Gõ hoặc dán chữ Hán bất kỳ vào đây (Ví dụ: 永远学习中文, 天道酬勤, 恭喜发财)..."
                  className="ws-custom-textarea"
                />
                <button
                  type="button"
                  onClick={handleAddCustomText}
                  disabled={!customText.trim()}
                  className="ws-btn-custom-add"
                >
                  + Thêm các chữ này vào bản in
                </button>
                <p className="ws-custom-note">
                  Hệ thống tự động lọc chữ Hán, tra cứu phiên âm Pinyin, nghĩa tiếng Việt và tải dữ liệu thứ tự nét chuẩn.
                </p>
              </div>
            )}

            {/* Khay các chữ sẽ in */}
            <div className="ws-selected-tray">
              <div className="ws-tray-head">
                <span className="ws-tray-label">Các chữ sẽ in ({characters.length}):</span>
                <div className="ws-tray-actions">
                  {characters.length === 0 && (
                    <button
                      type="button"
                      className="ws-tray-restore"
                      onClick={() => setCharacters(data.starterCharacters)}
                    >
                      Khôi phục 6 chữ mẫu
                    </button>
                  )}
                  {characters.length > 0 && (
                    <button
                      type="button"
                      className="ws-tray-clear"
                      onClick={() => setCharacters([])}
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>
              </div>

              {characters.length === 0 ? (
                <p className="ws-tray-empty">
                  Chưa có chữ nào. Hãy bấm chọn từ vựng ở trên để thêm vào trang in.
                </p>
              ) : (
                <div className="ws-chip-list">
                  {characters.map((item, idx) => (
                    <div key={`${item.char}-${idx}`} className="ws-char-chip">
                      <button
                        type="button"
                        className="ws-chip-inspect"
                        onClick={() => setInspectChar(item)}
                        title="Nhấn để xem thứ tự nét & luyện viết tay"
                      >
                        <span className="ws-chip-hanzi">{item.char}</span>
                        {item.pinyin && <span className="ws-chip-pinyin">{item.pinyin}</span>}
                      </button>
                      <button
                        type="button"
                        className="ws-chip-remove"
                        onClick={() => handleRemoveChar(idx)}
                        aria-label={`Xóa chữ ${item.char}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* BƯỚC 3: ĐỊNH DẠNG BẢN IN */}
          <section className="ws-card">
            <button
              type="button"
              className="ws-card-head is-collapsible"
              onClick={() => setIsFormatOpen((v) => !v)}
            >
              <div className="ws-card-head-left">
                <span className="ws-step-num">3</span>
                <h2 className="ws-card-title">Định dạng bản in</h2>
              </div>
              <span className="ws-collapse-summary">
                {GRID_TYPES.find((g) => g.id === gridType)?.label} · {charsPerPage} chữ/trang{' '}
                {isFormatOpen ? '▴' : '▾'}
              </span>
            </button>

            {isFormatOpen && (
              <div className="ws-format-body">
                {/* Số chữ mỗi trang */}
                <div className="ws-field-row">
                  <span className="ws-field-label">Số chữ mỗi trang:</span>
                  <div className="ws-count-pills">
                    {charsPerPageOptions.map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`ws-count-pill${charsPerPage === n ? ' is-active' : ''}`}
                        onClick={() => setCharsPerPage(n)}
                      >
                        {n} chữ
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kiểu ô kẻ */}
                <div className="ws-field-group">
                  <span className="ws-field-label">Kiểu ô kẻ chuẩn thư pháp:</span>
                  <div className="ws-gridtype-options">
                    {GRID_TYPES.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        className={`ws-gridtype-btn${gridType === g.id ? ' is-active' : ''}`}
                        onClick={() => setGridType(g.id)}
                      >
                        <svg viewBox="0 0 36 36" className="ws-gridtype-icon" aria-hidden="true">
                          <rect
                            x="2"
                            y="2"
                            width="32"
                            height="32"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          />
                          {(g.id === 'mizige' || g.id === 'tianzige') && (
                            <g stroke="currentColor" strokeWidth="1.4" strokeDasharray="3,2" opacity="0.65">
                              <line x1="18" y1="2" x2="18" y2="34" />
                              <line x1="2" y1="18" x2="34" y2="18" />
                            </g>
                          )}
                          {g.id === 'mizige' && (
                            <g stroke="currentColor" strokeWidth="1.4" strokeDasharray="3,2" opacity="0.65">
                              <line x1="2" y1="2" x2="34" y2="34" />
                              <line x1="34" y1="2" x2="2" y2="34" />
                            </g>
                          )}
                        </svg>
                        <span className="ws-gridtype-name">{g.label}</span>
                        <span className="ws-gridtype-zh">{g.zh}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Màu ô kẻ */}
                <div className="ws-field-group">
                  <span className="ws-field-label">Màu ô kẻ:</span>
                  <div className="ws-color-options">
                    {(Object.keys(GRID_COLORS) as GridColorKey[]).map((key) => {
                      const c = GRID_COLORS[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`ws-color-pill${gridColor === key ? ' is-active' : ''}`}
                          onClick={() => setGridColor(key)}
                        >
                          <span className="ws-color-dot" style={{ backgroundColor: c.dot }} />
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hiện trên phiếu */}
                <div className="ws-field-row">
                  <span className="ws-field-label">Hiện trên phiếu:</span>
                  <div className="ws-toggle-pills">
                    <button
                      type="button"
                      className={`ws-toggle-pill${showPinyin ? ' is-active' : ''}`}
                      onClick={() => setShowPinyin((v) => !v)}
                    >
                      {showPinyin ? '✓ ' : ''}Pinyin
                    </button>
                    <button
                      type="button"
                      className={`ws-toggle-pill${showMeaning ? ' is-active' : ''}`}
                      onClick={() => setShowMeaning((v) => !v)}
                    >
                      {showMeaning ? '✓ ' : ''}Nghĩa
                    </button>
                    <button
                      type="button"
                      className={`ws-toggle-pill${showStrokeCount ? ' is-active' : ''}`}
                      onClick={() => setShowStrokeCount((v) => !v)}
                    >
                      {showStrokeCount ? '✓ ' : ''}Số nét
                    </button>
                  </div>
                </div>

                {/* Họ tên & Tiêu đề */}
                <div className="ws-inputs-grid">
                  <label className="ws-input-field">
                    <span>Họ tên trên vở</span>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                    />
                  </label>
                  <label className="ws-input-field">
                    <span>Tiêu đề bài</span>
                    <input
                      type="text"
                      value={sheetTitle}
                      onChange={(e) => setSheetTitle(e.target.value)}
                      placeholder="Luyện viết chữ Hán"
                    />
                  </label>
                </div>
              </div>
            )}
          </section>
        </aside>

        {/* CỘT PHẢI: XEM TRƯỚC BẢN IN A4 & KHU VỰC IN THỰC TẾ */}
        <section className="ws-preview-col">
          <div className="ws-preview-toolbar ws-no-print">
            <div>
              <h2 className="ws-preview-title">Xem trước bản in A4</h2>
              <p className="ws-preview-subtitle">
                Tự động căn vừa khung · Chuẩn tỷ lệ khổ A4 (210mm × 297mm) · Nhấn vào chữ bất kỳ để xem nét động
              </p>
            </div>
            <div className="ws-preview-actions">
              <span className="ws-page-count-badge">{pages.length || 1} trang A4</span>
              <button
                type="button"
                className="ws-btn-print is-compact"
                onClick={handlePrint}
                disabled={characters.length === 0}
              >
                <Icon name="read" size={15} />
                In / Tải PDF
              </button>
            </div>
          </div>

          <div ref={previewWrapRef} className="ws-a4-stage">
            {pages.length === 0 ? (
              <div className="ws-empty-sheet ws-no-print">
                <p>Hãy chọn ít nhất 1 chữ Hán ở cột bên trái để tạo phiếu luyện viết A4.</p>
                <button
                  type="button"
                  className="ws-btn-outline"
                  onClick={() => setCharacters(data.starterCharacters)}
                >
                  Nạp lại 6 chữ mẫu (永 远 学 习 汉 字)
                </button>
              </div>
            ) : (
              pages.map((pageChars, pageIdx) => (
                <div
                  key={pageIdx}
                  className="ws-a4-scale-box"
                  style={{
                    height: `${Math.round(1123 * previewScale)}px`,
                  }}
                >
                  <div
                    className="ws-a4-sheet"
                    style={{
                      transform: `scale(${previewScale})`,
                    }}
                  >
                    {/* Phần đầu trang giấy A4 */}
                    <header className="ws-sheet-header">
                      <div className="ws-sheet-title-block">
                        <h3 className="ws-sheet-title">
                          {sheetTitle || 'Luyện viết chữ Hán theo thứ tự nét'}
                        </h3>
                        <p className="ws-sheet-brand">
                          DoDo. · Phiếu tập viết chữ Hán tiêu chuẩn ({GRID_TYPES.find((g) => g.id === gridType)?.label}{' '}
                          {GRID_TYPES.find((g) => g.id === gridType)?.zh})
                        </p>
                      </div>
                      <div className="ws-sheet-meta">
                        <div className="ws-sheet-meta-item">
                          <span>Họ tên:</span>
                          <strong className="ws-sheet-underline">
                            {authorName || '\u00A0'}
                          </strong>
                        </div>
                        <div className="ws-sheet-meta-item">
                          <span>Ngày:</span>
                          <strong className="ws-sheet-underline is-short">{'\u00A0'}</strong>
                        </div>
                      </div>
                    </header>

                    {/* Danh sách các dòng chữ Hán trên trang */}
                    <div className="ws-sheet-body">
                      {pageChars.map((item, idx) => (
                        <CharacterWorksheetRow
                          key={`${item.char}-${idx}`}
                          item={item}
                          strokes={strokeMap[item.char] ?? null}
                          layoutMode={layoutMode}
                          gridType={gridType}
                          gridColor={gridColor}
                          showPinyin={showPinyin}
                          showMeaning={showMeaning}
                          showStrokeCount={showStrokeCount}
                          onSelectInspect={(ch) => setInspectChar(ch)}
                        />
                      ))}
                    </div>

                    {/* Chân trang giấy A4 */}
                    <footer className="ws-sheet-footer">
                      <span>DoDo. · Học mỗi ngày, tiến xa hơn</span>
                      <span>
                        Trang {pageIdx + 1} / {pages.length}
                      </span>
                    </footer>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Phần hướng dẫn & Câu hỏi thường gặp (chuẩn thiết kế tinhtiemxan.com/worksheet) */}
      <section className="ws-guide-section ws-no-print">
        <div className="ws-guide-header">
          <h2>Tập viết chữ Hán đúng thứ tự nét · In phiếu A4 miễn phí</h2>
          <p>
            Chữ Hán được cấu tạo từ các nét cơ bản theo quy tắc bút thuận chặt chẽ (ngang trước sổ sau, phẩy trước mác sau, trên trước dưới sau, trái trước phải sau). Luyện viết theo từng nét giúp chữ cân đối, nhớ mặt chữ lâu và tăng tốc độ viết tay.
          </p>
        </div>

        <div className="ws-tips-grid">
          <article className="ws-tip-card">
            <h3>1. Phân rã từng nét bút đỏ</h3>
            <p>
              Hàng đầu tiên hiển thị chữ mẫu hoàn chỉnh, tiếp theo là từng bước viết lũy tiến: các nét đã viết màu xám đậm và <strong>nét hiện tại được tô đỏ</strong> giúp người học nhìn rõ thứ tự đặt bút.
            </p>
          </article>
          <article className="ws-tip-card">
            <h3>2. Hàng chữ mờ &amp; ô trống tự luyện</h3>
            <p>
              Hàng thứ hai kết hợp 6 ô chữ in mờ để bạn tô đè lên làm quen khung chữ, theo sau là 6 ô trống hoàn toàn để tự viết lại bằng trí nhớ.
            </p>
          </article>
          <article className="ws-tip-card">
            <h3>3. Ba kiểu ô kẻ chuẩn thư pháp</h3>
            <p>
              Hỗ trợ đầy đủ <strong>Ô Mễ (米字格)</strong> cho người mới bắt đầu căn tâm chữ, <strong>Ô Điền (田字格)</strong> cho trình độ trung cấp và <strong>Ô Vuông (方格)</strong> để luyện viết tự nhiên.
            </p>
          </article>
          <article className="ws-tip-card">
            <h3>4. Xuất PDF khổ A4 sắc nét</h3>
            <p>
              Toàn bộ ô lưới và nét chữ được dựng bằng đồ họa Vector (SVG), đảm bảo khi bấm <strong>In / Tải PDF</strong> luôn đạt độ phân giải sắc nét tuyệt đối trên giấy A4 thực tế.
            </p>
          </article>
        </div>
      </section>

      {/* Modal luyện viết trực tiếp & xem hoạt ảnh nét */}
      {inspectChar && (
        <InteractivePracticeModal
          item={inspectChar}
          strokes={strokeMap[inspectChar.char] ?? null}
          gridType={gridType}
          gridColor={gridColor}
          onClose={() => setInspectChar(null)}
          onSpeak={(text) => speech.speak(text, { key: `ws-${text}` })}
        />
      )}
    </div>
  );
}
