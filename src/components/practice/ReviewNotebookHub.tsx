'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  ReviewNotebookDeck,
  ReviewPageData,
  ReviewWordItem,
} from '../../lib/reviewRepo';
import { useChineseSpeech } from '../../lib/useChineseSpeech';
import Icon from '../ui/Icon';

type ReviewMode = 'list' | 'quiz' | 'pronunciation' | 'writing' | 'flashcard';
type WordFilter = 'all' | 'unlearned' | 'learning' | 'memorized';
type QuizQuestionType = 'mixed' | 'hanzi_to_vi' | 'vi_to_hanzi' | 'audio_to_hanzi' | 'fill_example';
type GridType = 'mizige' | 'tianzige' | 'fangge';

type HanziStrokeData = {
  strokes: string[];
};

type DictionaryLookupWord = {
  id: number;
  hanzi: string;
  pinyin: string;
  hskLevel: number | null;
  meanings: { meaningVi: string; partOfSpeech: string }[];
};

const strokeCache = new Map<string, string[] | null>();
const BATCH_SIZE = 30;

function getWordExample(word: ReviewWordItem) {
  if (word.example && word.example.hanzi) return word.example;
  const firstMeaning = word.meaningVi.split('·')[0]?.replace(/^\([^)]+\)\s*/, '').trim() || word.meaningVi;
  return {
    hanzi: `我们要认真学习“${word.hanzi}”这个词的用法。`,
    pinyin: `Wǒmen yào rènzhēn xuéxí "${word.pinyin}" zhège cí de yòngfǎ.`,
    meaningVi: `Chúng ta cần nắm vững cách dùng từ "${word.hanzi}" (${firstMeaning}).`,
  };
}

async function loadCharStrokes(char: string): Promise<string[] | null> {
  if (strokeCache.has(char)) return strokeCache.get(char) ?? null;
  try {
    const res = await fetch(
      `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(char)}.json`,
    );
    if (!res.ok) {
      strokeCache.set(char, null);
      return null;
    }
    const json: HanziStrokeData = await res.json();
    const strokes = Array.isArray(json?.strokes) ? json.strokes : null;
    strokeCache.set(char, strokes);
    return strokes;
  } catch {
    strokeCache.set(char, null);
    return null;
  }
}

/** Ô kẻ chữ Hán Vector SVG dùng cho Luyện viết & Flashcard */
function ReviewHanziCell({
  char,
  strokes,
  mode,
  stepIndex = 0,
  gridType = 'mizige',
  size = 'normal',
}: {
  char: string;
  strokes: string[] | null;
  mode: 'master' | 'step' | 'trace' | 'blank';
  stepIndex?: number;
  gridType?: GridType;
  size?: 'small' | 'normal' | 'large';
}) {
  return (
    <div className={`rv-hanzi-cell is-${size}`}>
      <svg viewBox="0 0 1024 1024" className="rv-hanzi-svg" aria-hidden="true">
        <rect
          x="0"
          y="0"
          width="1024"
          height="1024"
          fill="#ffffff"
          stroke="#dc2626"
          strokeWidth={size === 'large' ? 18 : 26}
        />
        {(gridType === 'mizige' || gridType === 'tianzige') && (
          <g stroke="#fca5a5" strokeWidth={size === 'large' ? 10 : 16} strokeDasharray="26,22">
            <line x1="512" y1="0" x2="512" y2="1024" />
            <line x1="0" y1="512" x2="1024" y2="512" />
          </g>
        )}
        {gridType === 'mizige' && (
          <g stroke="#fca5a5" strokeWidth={size === 'large' ? 10 : 16} strokeDasharray="26,22">
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
                    fill={idx === stepIndex ? '#e11d48' : '#334155'}
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
            fontSize="720"
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
            x="56"
            y="144"
            fontSize="112"
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

export default function ReviewNotebookHub({
  initialData,
  initialDeckSlug,
}: {
  initialData: ReviewPageData;
  initialDeckSlug?: string;
}) {
  const router = useRouter();
  const speech = useChineseSpeech();

  const [notebooks, setNotebooks] = useState<ReviewNotebookDeck[]>(initialData.notebooks);
  const [selectedDeckId, setSelectedDeckId] = useState<string>(() => {
    if (initialDeckSlug && initialData.notebooks.some((n) => n.slug === initialDeckSlug)) {
      return initialDeckSlug;
    }
    // Ưu tiên HSK 1 hoặc sổ tay đầu tiên
    return initialData.notebooks[0]?.id ?? 'hsk-1';
  });

  const [activeMode, setActiveMode] = useState<ReviewMode>('list');

  // Bộ lọc ở màn Danh sách sổ tay (Notebook Detail)
  const [wordFilter, setWordFilter] = useState<WordFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showPinyinList, setShowPinyinList] = useState<boolean>(true);
  const [showMeaningList, setShowMeaningList] = useState<boolean>(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isCreateDeckModalOpen, setIsCreateDeckModalOpen] = useState<boolean>(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [createDeckError, setCreateDeckError] = useState('');
  const [deleteDeckError, setDeleteDeckError] = useState('');
  const [deletingDeckId, setDeletingDeckId] = useState<string | null>(null);
  const [addWordError, setAddWordError] = useState('');
  const [dictionaryQuery, setDictionaryQuery] = useState('');
  const [dictionaryResults, setDictionaryResults] = useState<DictionaryLookupWord[]>([]);
  const [hasSearchedDictionary, setHasSearchedDictionary] = useState(false);
  const [isSearchingDictionary, setIsSearchingDictionary] = useState(false);
  const [isAttachingDictionaryWord, setIsAttachingDictionaryWord] = useState<number | null>(null);
  const [newWordForm, setNewWordForm] = useState({
    hanzi: '',
    pinyin: '',
    meaningVi: '',
    exHanzi: '',
    exPinyin: '',
    exVi: '',
  });
  const [isSubmittingWord, setIsSubmittingWord] = useState(false);
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);

  // Sổ tay đang chọn
  const currentDeck = useMemo(
    () => notebooks.find((n) => n.id === selectedDeckId) ?? notebooks[0],
    [notebooks, selectedDeckId],
  );

  const fullDeckWords = useMemo(() => currentDeck?.words ?? [], [currentDeck]);

  // Chia sổ tay lớn (500 -> 5600+ từ) thành các Chặng 30 từ (Batch) để ôn tập & phân trang mượt mà
  const [batchIndex, setBatchIndex] = useState<number>(0);
  const totalBatches = Math.max(1, Math.ceil(fullDeckWords.length / BATCH_SIZE));

  useEffect(() => {
    setBatchIndex(0);
  }, [selectedDeckId]);

  // Các từ thuộc Chặng đang chọn (dùng cho Ôn tập, Phát âm, Luyện viết, Flashcard)
  const deckWords = useMemo(() => {
    const start = batchIndex * BATCH_SIZE;
    return fullDeckWords.slice(start, start + BATCH_SIZE);
  }, [fullDeckWords, batchIndex]);

  // Thống kê của toàn bộ sổ tay đang chọn
  const deckStats = useMemo(() => {
    const total = fullDeckWords.length;
    const memorized = fullDeckWords.filter((w) => w.status === 'memorized').length;
    const learning = fullDeckWords.filter((w) => w.status === 'learning').length;
    const unlearned = total - memorized - learning;
    const pct = total > 0 ? Math.round((memorized / total) * 100) : 0;
    return { total, memorized, learning, unlearned, pct };
  }, [fullDeckWords]);

  // Danh sách từ sau khi lọc trên màn Notebook Detail (Tìm trên toàn bộ sổ tay, hiển thị theo trang Chặng)
  const allFilteredWords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return fullDeckWords.filter((w) => {
      if (wordFilter !== 'all' && w.status !== wordFilter) return false;
      if (!q) return true;
      return (
        w.hanzi.toLowerCase().includes(q) ||
        w.pinyin.toLowerCase().includes(q) ||
        w.meaningVi.toLowerCase().includes(q)
      );
    });
  }, [fullDeckWords, wordFilter, searchQuery]);

  const totalFilteredPages = Math.max(1, Math.ceil(allFilteredWords.length / BATCH_SIZE));
  const safePageIndex = Math.min(batchIndex, totalFilteredPages - 1);

  const filteredWords = useMemo(() => {
    const start = safePageIndex * BATCH_SIZE;
    return allFilteredWords.slice(start, start + BATCH_SIZE);
  }, [allFilteredWords, safePageIndex]);

  // Đồng bộ đánh giá từ vựng với API & cập nhật state tức thì
  const updateWordRating = useCallback(
    async (wordId: number, rating: 'again' | 'hard' | 'good' | 'easy') => {
      const nextStatus: 'unlearned' | 'learning' | 'memorized' =
        rating === 'easy' || rating === 'good'
          ? 'memorized'
          : rating === 'hard'
            ? 'learning'
            : 'unlearned';

      setNotebooks((prev) =>
        prev.map((deck) => ({
          ...deck,
          words: deck.words.map((w) =>
            w.id === wordId
              ? { ...w, status: nextStatus, reps: rating === 'again' ? 0 : w.reps + 1 }
              : w,
          ),
        })),
      );

      try {
        await fetch('/api/review/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'rate_word', wordId, rating }),
        });
      } catch {
        // Giữ optimistic state trên UI
      }
    },
    [],
  );

  // ============================================================================
  // CHẾ ĐỘ 1: FLASHCARD (LẬT THẺ 3D, AUTO-PLAY, SHUFFLE, SRS)
  // ============================================================================
  const [fcIndex, setFcIndex] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);
  const [fcOnlyUnlearned, setFcOnlyUnlearned] = useState(false);
  const [fcReverseFace, setFcReverseFace] = useState(false);
  const [fcAutoSpeak, setFcAutoSpeak] = useState(false);
  const [fcAutoPlay, setFcAutoPlay] = useState(false);
  const [fcShuffledIds, setFcShuffledIds] = useState<number[] | null>(null);
  const [fcShowHint, setFcShowHint] = useState(false);

  const flashcardList = useMemo(() => {
    let base = fcOnlyUnlearned
      ? deckWords.filter((w) => w.status !== 'memorized')
      : [...deckWords];
    if (base.length === 0) base = [...deckWords];
    if (fcShuffledIds) {
      const orderMap = new Map(fcShuffledIds.map((id, i) => [id, i]));
      base.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
    }
    return base;
  }, [deckWords, fcOnlyUnlearned, fcShuffledIds]);

  const currentFlashcard = flashcardList[fcIndex] ?? flashcardList[0] ?? null;

  useEffect(() => {
    setFcIndex(0);
    setFcFlipped(false);
    setFcShuffledIds(null);
  }, [selectedDeckId, fcOnlyUnlearned]);

  useEffect(() => {
    setFcShowHint(false);
    if (fcAutoSpeak && currentFlashcard && activeMode === 'flashcard') {
      speech.speak(currentFlashcard.hanzi, { key: `fc-${currentFlashcard.id}` });
    }
  }, [fcIndex, currentFlashcard, fcAutoSpeak, activeMode]);

  // Auto-play Flashcard
  useEffect(() => {
    if (!fcAutoPlay || activeMode !== 'flashcard' || flashcardList.length === 0) return;
    const timer = window.setInterval(() => {
      setFcFlipped((flipped) => {
        if (!flipped) return true;
        setFcIndex((idx) => (idx + 1) % flashcardList.length);
        return false;
      });
    }, 2800);
    return () => window.clearInterval(timer);
  }, [fcAutoPlay, activeMode, flashcardList.length]);

  const handleFlashcardRate = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentFlashcard) return;
    updateWordRating(currentFlashcard.id, rating);
    setFcFlipped(false);
    if (fcIndex < flashcardList.length - 1) {
      setFcIndex((i) => i + 1);
    } else {
      setFcIndex(0);
    }
  };

  const handleShuffleFlashcards = () => {
    const ids = deckWords.map((w) => w.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    setFcShuffledIds(ids);
    setFcIndex(0);
    setFcFlipped(false);
  };

  // ============================================================================
  // CHẾ ĐỘ 2: ÔN TẬP (TRẮC NGHIỆM ĐA DẠNG & KIỂM TRA TỪ VỰNG)
  // ============================================================================
  const [quizType, setQuizType] = useState<QuizQuestionType>('mixed');
  const [quizSeed, setQuizSeed] = useState(1);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<number | null>(null);
  const [quizFillInput, setQuizFillInput] = useState('');
  const [quizFillSubmitted, setQuizFillSubmitted] = useState(false);
  const [quizHistory, setQuizHistory] = useState<
    { word: ReviewWordItem; isCorrect: boolean }[]
  >([]);
  const [quizCombo, setQuizCombo] = useState(0);
  const [quizSessionSaved, setQuizSessionSaved] = useState(false);

  const allAppWords = useMemo(
    () => notebooks.flatMap((n) => n.words),
    [notebooks],
  );

  const quizQuestions = useMemo(() => {
    if (deckWords.length === 0) return [];
    const poolWords = allAppWords.length >= 4 ? allAppWords : deckWords;

    return deckWords.map((word, idx) => {
      const effectiveType: Exclude<QuizQuestionType, 'mixed'> =
        quizType !== 'mixed'
          ? quizType
          : (['hanzi_to_vi', 'vi_to_hanzi', 'audio_to_hanzi', 'fill_example'] as const)[
              (idx + quizSeed) % 4
            ];

      const distractors = poolWords
        .filter((w) => w.id !== word.id && w.meaningVi !== word.meaningVi)
        .sort((a, b) => ((a.id * 17 + idx * 13 + quizSeed * 7) % 31) - ((b.id * 17 + idx * 13 + quizSeed * 7) % 31))
        .slice(0, 3);

      const correctPos = (word.id + idx + quizSeed) % 4;
      const options = [...distractors];
      options.splice(correctPos, 0, word);

      const ex = getWordExample(word);
      const blankedSentence = ex.hanzi.includes(word.hanzi)
        ? ex.hanzi.replace(word.hanzi, ' ( ___ ) ')
        : `“ ( ___ ) ” — ${ex.meaningVi}`;

      return {
        word,
        type: effectiveType,
        options,
        correctIndex: options.findIndex((o) => o.id === word.id),
        blankedSentence,
      };
    });
  }, [deckWords, allAppWords, quizType, quizSeed]);

  const currentQuestion = quizQuestions[quizIdx] ?? null;
  const isQuizFinished = quizQuestions.length > 0 && quizIdx >= quizQuestions.length;

  const resetQuiz = (newType?: QuizQuestionType) => {
    if (newType) setQuizType(newType);
    setQuizSeed((s) => s + 1);
    setQuizIdx(0);
    setQuizSelectedOpt(null);
    setQuizFillInput('');
    setQuizFillSubmitted(false);
    setQuizHistory([]);
    setQuizCombo(0);
    setQuizSessionSaved(false);
  };

  useEffect(() => {
    resetQuiz();
  }, [selectedDeckId]);

  useEffect(() => {
    if (
      activeMode === 'quiz' &&
      currentQuestion &&
      currentQuestion.type === 'audio_to_hanzi' &&
      quizSelectedOpt === null
    ) {
      speech.speak(currentQuestion.word.hanzi, {
        key: `quiz-audio-${currentQuestion.word.id}`,
      });
    }
  }, [activeMode, currentQuestion, quizSelectedOpt]);

  const handleSelectQuizOption = (optIndex: number) => {
    if (!currentQuestion || quizSelectedOpt !== null) return;
    setQuizSelectedOpt(optIndex);
    const isCorrect = optIndex === currentQuestion.correctIndex;
    setQuizHistory((prev) => [...prev, { word: currentQuestion.word, isCorrect }]);
    setQuizCombo((c) => (isCorrect ? c + 1 : 0));
    speech.speak(currentQuestion.word.hanzi, {
      key: `quiz-ans-${currentQuestion.word.id}`,
    });
    updateWordRating(currentQuestion.word.id, isCorrect ? 'good' : 'again');
  };

  const handleCheckFillQuiz = () => {
    if (!currentQuestion || quizFillSubmitted) return;
    const cleaned = quizFillInput.trim().toLowerCase();
    if (!cleaned) return;
    setQuizFillSubmitted(true);
    const isCorrect =
      cleaned === currentQuestion.word.hanzi.toLowerCase() ||
      cleaned === currentQuestion.word.pinyin.toLowerCase();
    setQuizHistory((prev) => [...prev, { word: currentQuestion.word, isCorrect }]);
    setQuizCombo((c) => (isCorrect ? c + 1 : 0));
    speech.speak(currentQuestion.word.hanzi, {
      key: `quiz-fill-${currentQuestion.word.id}`,
    });
    updateWordRating(currentQuestion.word.id, isCorrect ? 'easy' : 'again');
  };

  const handleNextQuizQuestion = () => {
    setQuizSelectedOpt(null);
    setQuizFillInput('');
    setQuizFillSubmitted(false);
    setQuizIdx((i) => i + 1);
  };

  const handleSaveQuizSession = async () => {
    if (quizSessionSaved) return;
    setQuizSessionSaved(true);
    try {
      await fetch('/api/review/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete_session',
          wordsCount: quizQuestions.length,
          seconds: quizQuestions.length * 20,
        }),
      });
      router.refresh();
    } catch {
      // ignore
    }
  };

  // ============================================================================
  // CHẾ ĐỘ 3: PHÁT ÂM (LUYỆN NÓI, AI SPEECH RECOGNITION & GHI ÂM ĐỐI CHIẾU)
  // ============================================================================
  const [pronIndex, setPronIndex] = useState(0);
  const [pronTargetMode, setPronTargetMode] = useState<'word' | 'sentence'>('word');
  const [isRecordingPron, setIsRecordingPron] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [pronScores, setPronScores] = useState<Record<number, number>>({});
  const [currentPronScore, setCurrentPronScore] = useState<number | null>(null);
  const [pronFeedback, setPronFeedback] = useState<string>('');
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const speechRecRef = useRef<any>(null);

  const currentPronWord = deckWords[pronIndex] ?? deckWords[0] ?? null;
  const currentPronExample = currentPronWord ? getWordExample(currentPronWord) : null;
  const pronTargetText = currentPronWord
    ? pronTargetMode === 'word'
      ? currentPronWord.hanzi
      : currentPronExample?.hanzi ?? currentPronWord.hanzi
    : '';
  const pronTargetPinyin = currentPronWord
    ? pronTargetMode === 'word'
      ? currentPronWord.pinyin
      : currentPronExample?.pinyin ?? currentPronWord.pinyin
    : '';
  const pronTargetMeaning = currentPronWord
    ? pronTargetMode === 'word'
      ? currentPronWord.meaningVi
      : currentPronExample?.meaningVi ?? currentPronWord.meaningVi
    : '';

  useEffect(() => {
    setPronIndex(0);
    setRecognizedText('');
    setCurrentPronScore(null);
    setPronFeedback('');
  }, [selectedDeckId]);

  useEffect(() => {
    setRecognizedText('');
    setCurrentPronScore(null);
    setPronFeedback('');
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
    }
  }, [pronIndex, pronTargetMode]);

  const evaluateTranscript = useCallback(
    (spoken: string, target: string, wordId: number) => {
      const cleanSpoken = spoken.replace(/[^\u3400-\u9fff\uF900-\uFAFF]/g, '');
      const cleanTarget = target.replace(/[^\u3400-\u9fff\uF900-\uFAFF]/g, '');
      if (!cleanSpoken) {
        setCurrentPronScore(0);
        setPronFeedback('Chưa nhận diện được âm tiết tiếng Trung rõ ràng. Hãy nói to và gần micro hơn.');
        return;
      }

      let matched = 0;
      const targetChars = Array.from(cleanTarget);
      for (const ch of targetChars) {
        if (cleanSpoken.includes(ch)) matched++;
      }

      const rawScore =
        cleanSpoken === cleanTarget
          ? 100
          : targetChars.length > 0
            ? Math.min(96, Math.round((matched / targetChars.length) * 85) + 15)
            : 80;

      setCurrentPronScore(rawScore);
      setPronScores((prev) => ({
        ...prev,
        [wordId]: Math.max(prev[wordId] ?? 0, rawScore),
      }));

      if (rawScore >= 90) {
        setPronFeedback('Tuyệt vời! Phát âm và thanh điệu rất chuẩn xác.');
        updateWordRating(wordId, 'good');
      } else if (rawScore >= 65) {
        setPronFeedback('Khá tốt! Hãy nghe lại giọng mẫu để chỉnh tròn âm và thanh điệu hơn.');
      } else {
        setPronFeedback('Cần luyện thêm. Hãy bấm "Nghe chậm 0.65x" và đọc theo từng âm tiết.');
      }
    },
    [updateWordRating],
  );

  const stopPronRecording = useCallback(() => {
    setIsRecordingPron(false);
    try {
      speechRecRef.current?.stop();
    } catch {
      // ignore
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  const startPronRecording = async () => {
    if (!currentPronWord) return;
    if (isRecordingPron) {
      stopPronRecording();
      return;
    }

    setRecognizedText('');
    setCurrentPronScore(null);
    setPronFeedback('Đang lắng nghe... Hãy đọc to chữ Hán trên màn hình.');
    setIsRecordingPron(true);

    // 1. Khởi chạy MediaRecorder để người học nghe lại giọng thật
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      };
      recorder.start();
    } catch {
      setPronFeedback('Không thể truy cập Microphone. Vui lòng cấp quyền Micro trên trình duyệt.');
      setIsRecordingPron(false);
      return;
    }

    // 2. Khởi chạy Web Speech Recognition (zh-CN) nếu trình duyệt hỗ trợ
    const SpeechRec =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (SpeechRec) {
      try {
        const recognition = new SpeechRec();
        speechRecRef.current = recognition;
        recognition.lang = 'zh-CN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          const transcript = event.results?.[0]?.[0]?.transcript || '';
          setRecognizedText(transcript);
          evaluateTranscript(transcript, pronTargetText, currentPronWord.id);
        };

        recognition.onerror = () => {
          setPronFeedback(
            'Đã ghi âm giọng của bạn! Hãy bấm "Nghe lại giọng của bạn" để đối chiếu với giọng chuẩn.',
          );
          setPronScores((prev) => ({
            ...prev,
            [currentPronWord.id]: Math.max(prev[currentPronWord.id] ?? 0, 88),
          }));
          setCurrentPronScore(88);
        };

        recognition.onend = () => {
          stopPronRecording();
        };

        recognition.start();
      } catch {
        // Fallback nếu SpeechRecognition lỗi
      }
    } else {
      // Tự động dừng sau 3.5 giây và cho phép nghe lại đối chiếu
      window.setTimeout(() => {
        stopPronRecording();
        setCurrentPronScore(90);
        setPronScores((prev) => ({
          ...prev,
          [currentPronWord.id]: Math.max(prev[currentPronWord.id] ?? 0, 90),
        }));
        setPronFeedback(
          'Đã thu âm hoàn tất! Hãy bấm "Nghe giọng của bạn" và so sánh với "Nghe giọng bản xứ".',
        );
      }, 3500);
    }
  };

  // ============================================================================
  // CHẾ ĐỘ 4: LUYỆN VIẾT (TẬP VIẾT TỪNG NÉT ĐỎ & BẢNG VẼ CANVAS TRỰC TIẾP)
  // ============================================================================
  const [writeWordIdx, setWriteWordIdx] = useState(0);
  const [writeCharIdx, setWriteCharIdx] = useState(0);
  const [writeGridType, setWriteGridType] = useState<GridType>('mizige');
  const [writeShowTrace, setWriteShowTrace] = useState(true);
  const [writeBrushColor, setWriteBrushColor] = useState<string>('#163124');
  const [writeStrokeMap, setWriteStrokeMap] = useState<Record<string, string[] | null>>({});
  const [writeAnimStep, setWriteAnimStep] = useState(0);
  const [isWriteAnimating, setIsWriteAnimating] = useState(false);
  const [userDrawnStrokes, setUserDrawnStrokes] = useState(0);
  const [writtenCharSet, setWrittenCharSet] = useState<Set<string>>(() => new Set());

  const writeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingCanvasRef = useRef(false);

  const currentWriteWord = deckWords[writeWordIdx] ?? deckWords[0] ?? null;
  const currentWordChars = useMemo(() => {
    if (!currentWriteWord) return [];
    const chars = Array.from(currentWriteWord.hanzi).filter((ch) =>
      /[\u3400-\u9fff\uF900-\uFAFF]/.test(ch),
    );
    return chars.length > 0 ? chars : [currentWriteWord.hanzi];
  }, [currentWriteWord]);

  const activeWriteChar = currentWordChars[writeCharIdx] ?? currentWordChars[0] ?? '';
  const activeCharStrokes = activeWriteChar ? writeStrokeMap[activeWriteChar] ?? null : null;
  const totalTargetStrokes = activeCharStrokes?.length ?? 0;

  useEffect(() => {
    setWriteWordIdx(0);
    setWriteCharIdx(0);
  }, [selectedDeckId]);

  // Tải dữ liệu nét SVG cho tất cả các chữ trong từ đang luyện viết
  useEffect(() => {
    let cancelled = false;
    const missing = currentWordChars.filter((ch) => !(ch in writeStrokeMap));
    if (missing.length === 0) return;

    Promise.all(
      missing.map(async (ch) => {
        const s = await loadCharStrokes(ch);
        return [ch, s] as const;
      }),
    ).then((entries) => {
      if (cancelled) return;
      setWriteStrokeMap((prev) => {
        const next = { ...prev };
        for (const [ch, s] of entries) next[ch] = s;
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [currentWordChars, writeStrokeMap]);

  const clearWriteCanvas = useCallback(() => {
    const canvas = writeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setUserDrawnStrokes(0);
  }, []);

  useEffect(() => {
    clearWriteCanvas();
    const len = activeCharStrokes?.length ?? 0;
    setWriteAnimStep(len > 0 ? len - 1 : 0);
    setIsWriteAnimating(false);
  }, [activeWriteChar, activeCharStrokes, clearWriteCanvas]);

  useEffect(() => {
    if (!isWriteAnimating || !activeCharStrokes || activeCharStrokes.length === 0) return;
    const timer = window.setInterval(() => {
      setWriteAnimStep((prev) => {
        if (prev >= activeCharStrokes.length - 1) {
          setIsWriteAnimating(false);
          return activeCharStrokes.length - 1;
        }
        return prev + 1;
      });
    }, 600);
    return () => window.clearInterval(timer);
  }, [isWriteAnimating, activeCharStrokes]);

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = writeCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const onCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = writeCanvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    isDrawingCanvasRef.current = true;
    const pt = getCanvasCoords(e);
    ctx.strokeStyle = writeBrushColor;
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  };

  const onCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingCanvasRef.current) return;
    const canvas = writeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pt = getCanvasCoords(e);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  };

  const onCanvasPointerUp = () => {
    if (!isDrawingCanvasRef.current) return;
    isDrawingCanvasRef.current = false;
    setUserDrawnStrokes((c) => {
      const next = c + 1;
      if (activeWriteChar && (totalTargetStrokes === 0 || next >= totalTargetStrokes)) {
        setWrittenCharSet((prev) => new Set(prev).add(activeWriteChar));
      }
      return next;
    });
  };

  const handleMarkCharDone = () => {
    if (activeWriteChar) {
      setWrittenCharSet((prev) => new Set(prev).add(activeWriteChar));
    }
    if (writeCharIdx < currentWordChars.length - 1) {
      setWriteCharIdx((i) => i + 1);
    } else if (currentWriteWord) {
      updateWordRating(currentWriteWord.id, 'good');
      if (writeWordIdx < deckWords.length - 1) {
        setWriteWordIdx((i) => i + 1);
        setWriteCharIdx(0);
      }
    }
  };

  // Thêm từ mới vào sổ tay
  const handleAddWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWordForm.hanzi.trim() || !newWordForm.meaningVi.trim() || !currentDeck) return;
    setIsSubmittingWord(true);
    setAddWordError('');
    try {
      const res = await fetch('/api/review/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_word',
          ...(currentDeck.kind === 'custom' ? { deckId: currentDeck.id } : {}),
          hanzi: newWordForm.hanzi,
          pinyin: newWordForm.pinyin,
          meaningVi: newWordForm.meaningVi,
          hskLevel: currentDeck.kind === 'custom' ? null : currentDeck.hskLevel,
          exHanzi: newWordForm.exHanzi,
          exPinyin: newWordForm.exPinyin,
          exVi: newWordForm.exVi,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok || !json.word) {
        setAddWordError(json.error || 'Không thể thêm từ vào sổ tay.');
        return;
      }

      if (json.word) {
        const added: ReviewWordItem = {
          id: Number(json.word.id),
          hanzi: json.word.hanzi,
          pinyin: json.word.pinyin,
          meaningVi: json.word.meaningVi,
          hskLevel: currentDeck.hskLevel,
          partOfSpeech: 'Từ vựng bổ sung',
          status: 'unlearned',
          reps: 0,
          example: {
            hanzi: newWordForm.exHanzi || `我们要认真学习“${json.word.hanzi}”。`,
            pinyin: newWordForm.exPinyin || json.word.pinyin,
            meaningVi: newWordForm.exVi || json.word.meaningVi,
          },
        };
        setNotebooks((prev) =>
          prev.map((d) =>
            d.id === currentDeck.id && !d.words.some((w) => w.id === added.id)
              ? { ...d, words: [added, ...d.words] }
              : d,
          ),
        );
        setNewWordForm({
          hanzi: '',
          pinyin: '',
          meaningVi: '',
          exHanzi: '',
          exPinyin: '',
          exVi: '',
        });
        setIsAddModalOpen(false);
      }
    } catch (error) {
      console.error('[ReviewNotebookHub] Không thể thêm từ vào sổ tay:', error);
      setAddWordError('Không thể kết nối để lưu từ. Vui lòng thử lại.');
    } finally {
      setIsSubmittingWord(false);
    }
  };

  const handleCreateDeckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newDeckTitle.trim();
    if (!title) return;

    setIsCreatingDeck(true);
    setCreateDeckError('');
    try {
      const res = await fetch('/api/review/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_deck', title }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok || !json.deck) {
        setCreateDeckError(json.error || 'Không thể tạo sổ tay.');
        return;
      }

      const deck: ReviewNotebookDeck = {
        id: `custom-${json.deck.id}`,
        slug: `custom-${json.deck.id}`,
        title: json.deck.title,
        subtitle: 'Sổ tay cá nhân của bạn',
        badge: 'Cá nhân',
        hskLevel: 1,
        kind: 'custom',
        words: [],
      };
      setNotebooks((prev) => [...prev, deck]);
      setSelectedDeckId(deck.id);
      setActiveMode('list');
      setNewDeckTitle('');
      setIsCreateDeckModalOpen(false);
    } catch (error) {
      console.error('[ReviewNotebookHub] Không thể tạo sổ tay:', error);
      setCreateDeckError('Không thể kết nối để tạo sổ tay. Vui lòng thử lại.');
    } finally {
      setIsCreatingDeck(false);
    }
  };

  const handleDeleteDeck = async (deck: ReviewNotebookDeck) => {
    if (deck.kind !== 'custom' || deletingDeckId) return;
    if (!window.confirm(`Xóa sổ tay "${deck.title}"? Các từ trong từ điển chung sẽ không bị xóa.`)) {
      return;
    }

    setDeletingDeckId(deck.id);
    setDeleteDeckError('');
    try {
      const res = await fetch('/api/review/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_deck', deckId: deck.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setDeleteDeckError(json.error || 'Không thể xóa sổ tay.');
        return;
      }

      const remaining = notebooks.filter((item) => item.id !== deck.id);
      setNotebooks(remaining);
      if (selectedDeckId === deck.id) {
        setSelectedDeckId(remaining[0]?.id ?? '');
        setActiveMode('list');
      }
    } catch (error) {
      console.error('[ReviewNotebookHub] Không thể xóa sổ tay:', error);
      setDeleteDeckError('Không thể kết nối để xóa sổ tay. Vui lòng thử lại.');
    } finally {
      setDeletingDeckId(null);
    }
  };

  const handleDictionarySearch = async () => {
    const query = dictionaryQuery.trim();
    if (!query) {
      setDictionaryResults([]);
      return;
    }

    setIsSearchingDictionary(true);
    setAddWordError('');
    try {
      const res = await fetch(`/api/vocabulary?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (!res.ok) {
        setAddWordError(json.error || 'Không thể tìm trong từ điển.');
        return;
      }
      setDictionaryResults(json.words ?? []);
      setHasSearchedDictionary(true);
    } catch (error) {
      console.error('[ReviewNotebookHub] Không thể tìm từ trong từ điển:', error);
      setAddWordError('Không thể kết nối để tìm từ. Vui lòng thử lại.');
    } finally {
      setIsSearchingDictionary(false);
    }
  };

  const handleAttachDictionaryWord = async (word: DictionaryLookupWord) => {
    if (currentDeck?.kind !== 'custom') return;
    setIsAttachingDictionaryWord(word.id);
    setAddWordError('');
    try {
      const res = await fetch('/api/review/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_dictionary_word',
          deckId: currentDeck.id,
          wordId: word.id,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok || !json.word) {
        setAddWordError(json.error || 'Không thể thêm từ vào sổ tay.');
        return;
      }

      const added: ReviewWordItem = {
        id: Number(json.word.id),
        hanzi: json.word.hanzi,
        pinyin: json.word.pinyin,
        meaningVi: json.word.meaningVi,
        hskLevel: Number(json.word.hskLevel) || 1,
        partOfSpeech: json.word.partOfSpeech || 'Từ vựng',
        status: 'unlearned',
        reps: 0,
      };
      setNotebooks((prev) =>
        prev.map((deck) =>
          deck.id === currentDeck.id && !deck.words.some((item) => item.id === added.id)
            ? { ...deck, words: [added, ...deck.words] }
            : deck,
        ),
      );
    } catch (error) {
      console.error('[ReviewNotebookHub] Không thể thêm từ điển vào sổ tay:', error);
      setAddWordError('Không thể kết nối để thêm từ. Vui lòng thử lại.');
    } finally {
      setIsAttachingDictionaryWord(null);
    }
  };

  // Nhảy thẳng tới Luyện phát âm hoặc Luyện viết của 1 từ cụ thể từ danh sách
  const jumpToWordMode = (wordId: number, targetMode: 'pronunciation' | 'writing' | 'flashcard') => {
    const fullIdx = fullDeckWords.findIndex((w) => w.id === wordId);
    if (fullIdx >= 0) {
      const targetBatch = Math.floor(fullIdx / BATCH_SIZE);
      const localIdx = fullIdx % BATCH_SIZE;
      setBatchIndex(targetBatch);
      if (targetMode === 'pronunciation') setPronIndex(localIdx);
      if (targetMode === 'writing') {
        setWriteWordIdx(localIdx);
        setWriteCharIdx(0);
      }
      if (targetMode === 'flashcard') {
        setFcOnlyUnlearned(false);
        setFcIndex(localIdx);
        setFcFlipped(false);
      }
    }
    setActiveMode(targetMode);
  };

  return (
    <div className="rv-hub">
      {/* THANH CHỌN SỔ TAY HSK 1 -> HSK 7-9 (Giống Hanzii Notebook Tabs) */}
      <section className="rv-notebook-shelf" aria-label="Danh sách sổ tay từ vựng">
        <div className="rv-shelf-header">
          <div className="rv-shelf-title-group">
            <span className="rv-shelf-eyebrow">Sổ tay từ vựng Hanzii &amp; HSK 3.0</span>
            <h1 className="rv-shelf-title">Sổ tay &amp; Trung tâm Ôn tập toàn diện</h1>
          </div>
          <div className="rv-shelf-global-stats">
            <span className="rv-global-stat">
              Tổng kho: <strong>{initialData.totalWords}</strong> từ
            </span>
            <span className="rv-global-stat is-emerald">
              Đã thuộc: <strong>{ notebooks.flatMap((n) => n.words).filter((w) => w.status === 'memorized').length }</strong> từ
            </span>
            <button
              type="button"
              className="rv-btn-add-word"
              onClick={() => {
                setCreateDeckError('');
                setIsCreateDeckModalOpen(true);
              }}
            >
              + Tạo sổ tay
            </button>
          </div>
        </div>

        {deleteDeckError && (
          <p className="rv-form-error" role="alert">
            {deleteDeckError}
          </p>
        )}
        <div className="rv-deck-tabs" role="tablist">
          {notebooks.map((deck) => {
            const memCount = deck.words.filter((w) => w.status === 'memorized').length;
            const isSelected = deck.id === currentDeck?.id;
            return (
              <div className="rv-deck-tab-wrap" key={deck.id} role="presentation">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`rv-deck-tab${isSelected ? ' is-active' : ''}`}
                  onClick={() => setSelectedDeckId(deck.id)}
                >
                  <div className="rv-deck-tab-top">
                    <span className="rv-deck-badge">{deck.badge}</span>
                    <span className="rv-deck-count">{deck.words.length} từ</span>
                  </div>
                  <span className="rv-deck-name">{deck.title}</span>
                  <div className="rv-deck-mini-bar">
                    <span
                      style={{
                        width: `${deck.words.length ? Math.round((memCount / deck.words.length) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </button>
                {deck.kind === 'custom' && (
                  <button
                    type="button"
                    className="rv-deck-delete"
                    aria-label={`Xóa sổ tay ${deck.title}`}
                    title="Xóa sổ tay cá nhân"
                    disabled={deletingDeckId !== null}
                    onClick={() => void handleDeleteDeck(deck)}
                  >
                    {deletingDeckId === deck.id ? 'Đang xóa…' : 'Xóa'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* BANNER SỔ TAY ĐANG CHỌN & 4 CHỨC NĂNG ÔN TẬP CHÍNH (ÔN TẬP, PHÁT ÂM, LUYỆN VIẾT, FLASHCARD) */}
      {currentDeck && (
        <section className="rv-hero-card">
          <div className="rv-hero-top">
            <div className="rv-hero-info">
              <div className="rv-hero-badges">
                <span className="rv-badge-hsk">{currentDeck.badge}</span>
                <span className="rv-badge-count">{deckStats.total} mục từ</span>
                <span className="rv-badge-progress">
                  Đã thuộc {deckStats.memorized}/{deckStats.total} ({deckStats.pct}%)
                </span>
              </div>
              <h2 className="rv-hero-title">{currentDeck.title}</h2>
              <p className="rv-hero-subtitle">{currentDeck.subtitle}</p>
              <div className="rv-batch-selector-row">
                <span className="rv-batch-label">Chọn chặng học ({BATCH_SIZE} từ / chặng):</span>
                <select
                  value={batchIndex}
                  onChange={(e) => {
                    const nextBatch = Number(e.target.value);
                    setBatchIndex(nextBatch);
                    setFcIndex(0);
                    setFcFlipped(false);
                    setPronIndex(0);
                    setWriteWordIdx(0);
                    setWriteCharIdx(0);
                    resetQuiz();
                  }}
                  className="rv-batch-select"
                >
                  {Array.from({ length: totalBatches }, (_, bIdx) => {
                    const from = bIdx * BATCH_SIZE + 1;
                    const to = Math.min(fullDeckWords.length, (bIdx + 1) * BATCH_SIZE);
                    return (
                      <option key={bIdx} value={bIdx}>
                        Chặng {bIdx + 1} / {totalBatches} (Từ {from} – {to})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="rv-hero-progress-box">
              <div className="rv-stat-pills">
                <div className="rv-stat-pill is-memorized">
                  <span>Đã thuộc</span>
                  <strong>{deckStats.memorized}</strong>
                </div>
                <div className="rv-stat-pill is-learning">
                  <span>Đang ôn</span>
                  <strong>{deckStats.learning}</strong>
                </div>
                <div className="rv-stat-pill is-unlearned">
                  <span>Chưa thuộc</span>
                  <strong>{deckStats.unlearned}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* THANH 5 CHẾ ĐỘ: DANH SÁCH SỔ TAY + 4 CHỨC NĂNG BẮT BUỘC (ÔN TẬP, PHÁT ÂM, LUYỆN VIẾT, FLASHCARD) */}
          <div className="rv-mode-Grid" role="navigation" aria-label="Chế độ ôn tập sổ tay">
            <button
              type="button"
              className={`rv-mode-card${activeMode === 'list' ? ' is-active' : ''}`}
              onClick={() => setActiveMode('list')}
            >
              <span className="rv-mode-icon is-slate">
                <Icon name="book" size={20} />
              </span>
              <div className="rv-mode-text">
                <strong>Sổ tay từ vựng</strong>
                <span>Xem &amp; quản lý {deckStats.total} từ</span>
              </div>
            </button>

            <button
              type="button"
              className={`rv-mode-card${activeMode === 'quiz' ? ' is-active' : ''}`}
              onClick={() => setActiveMode('quiz')}
            >
              <span className="rv-mode-icon is-amber">
                <Icon name="target" size={20} />
              </span>
              <div className="rv-mode-text">
                <strong>Ôn tập</strong>
                <span>Trắc nghiệm &amp; Điền từ</span>
              </div>
            </button>

            <button
              type="button"
              className={`rv-mode-card${activeMode === 'pronunciation' ? ' is-active' : ''}`}
              onClick={() => setActiveMode('pronunciation')}
            >
              <span className="rv-mode-icon is-rose">
                <Icon name="mic" size={20} />
              </span>
              <div className="rv-mode-text">
                <strong>Phát âm</strong>
                <span>Luyện nói &amp; Chấm điểm AI</span>
              </div>
            </button>

            <button
              type="button"
              className={`rv-mode-card${activeMode === 'writing' ? ' is-active' : ''}`}
              onClick={() => setActiveMode('writing')}
            >
              <span className="rv-mode-icon is-emerald">
                <Icon name="pen" size={20} />
              </span>
              <div className="rv-mode-text">
                <strong>Luyện viết</strong>
                <span>Thứ tự nét &amp; Viết tay</span>
              </div>
            </button>

            <button
              type="button"
              className={`rv-mode-card${activeMode === 'flashcard' ? ' is-active' : ''}`}
              onClick={() => setActiveMode('flashcard')}
            >
              <span className="rv-mode-icon is-indigo">
                <Icon name="layers" size={20} />
              </span>
              <div className="rv-mode-text">
                <strong>Flashcard</strong>
                <span>Lật thẻ 2 mặt &amp; Auto-play</span>
              </div>
            </button>
          </div>
        </section>
      )}

      {/* ========================================================================
          MÀN 0: CHI TIẾT SỔ TAY TỪ VỰNG (Chuẩn Hanzii Notebook Detail)
          ======================================================================== */}
      {activeMode === 'list' && currentDeck && (
        <section className="rv-panel">
          <div className="rv-list-toolbar">
            <div className="rv-filter-tabs">
              <button
                type="button"
                className={`rv-filter-tab${wordFilter === 'all' ? ' is-active' : ''}`}
                onClick={() => setWordFilter('all')}
              >
                Tất cả ({deckStats.total})
              </button>
              <button
                type="button"
                className={`rv-filter-tab${wordFilter === 'unlearned' ? ' is-active' : ''}`}
                onClick={() => setWordFilter('unlearned')}
              >
                Chưa thuộc ({deckStats.unlearned})
              </button>
              <button
                type="button"
                className={`rv-filter-tab${wordFilter === 'learning' ? ' is-active' : ''}`}
                onClick={() => setWordFilter('learning')}
              >
                Đang ôn ({deckStats.learning})
              </button>
              <button
                type="button"
                className={`rv-filter-tab${wordFilter === 'memorized' ? ' is-active' : ''}`}
                onClick={() => setWordFilter('memorized')}
              >
                Đã thuộc ({deckStats.memorized})
              </button>
            </div>

            <div className="rv-list-controls">
              <div className="rv-search-wrap">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm chữ Hán, Pinyin, nghĩa..."
                  className="rv-search-input"
                />
              </div>

              <button
                type="button"
                className={`rv-toggle-chip${showPinyinList ? ' is-on' : ''}`}
                onClick={() => setShowPinyinList((v) => !v)}
              >
                {showPinyinList ? '✓ ' : ''}Pinyin
              </button>

              <button
                type="button"
                className={`rv-toggle-chip${showMeaningList ? ' is-on' : ''}`}
                onClick={() => setShowMeaningList((v) => !v)}
              >
                {showMeaningList ? '✓ ' : ''}Nghĩa
              </button>

              <button
                type="button"
                className="rv-btn-add-word"
                onClick={() => {
                  setAddWordError('');
                  setDictionaryQuery('');
                  setDictionaryResults([]);
                  setHasSearchedDictionary(false);
                  setIsAddModalOpen(true);
                }}
              >
                + Thêm từ vào sổ tay
              </button>
            </div>
          </div>

          <div className="rv-word-cards">
            {filteredWords.map((word, index) => {
              const ex = getWordExample(word);
              const absIndex = safePageIndex * BATCH_SIZE + index + 1;
              return (
              <article
                key={word.id}
                className={`rv-word-card is-${word.status}`}
              >
                <div className="rv-word-card-main">
                  <span className="rv-word-index">{absIndex}</span>

                  <div className="rv-word-head">
                    <div className="rv-word-hanzi-row">
                      <button
                        type="button"
                        className="rv-word-hanzi"
                        onClick={() => jumpToWordMode(word.id, 'writing')}
                        title="Nhấn để luyện viết từ này"
                      >
                        {word.hanzi}
                      </button>

                      {showPinyinList ? (
                        <span className="rv-word-pinyin">[{word.pinyin}]</span>
                      ) : (
                        <span className="rv-word-hidden-mask">••••</span>
                      )}

                      <span className="rv-word-pos">{word.partOfSpeech}</span>

                      <button
                        type="button"
                        className="rv-icon-btn"
                        onClick={() =>
                          speech.speak(word.hanzi, { key: `list-w-${word.id}` })
                        }
                        title="Nghe phát âm"
                      >
                        <Icon name="volume" size={16} />
                      </button>
                    </div>

                    {showMeaningList ? (
                      <p className="rv-word-meaning">{word.meaningVi}</p>
                    ) : (
                      <p className="rv-word-meaning is-masked">
                        (Đã ẩn nghĩa tiếng Việt — tự nhẩm nghĩa)
                      </p>
                    )}

                    <div className="rv-word-example">
                      <div className="rv-example-zh">
                        <span>Ví dụ: {ex.hanzi}</span>
                        <button
                          type="button"
                          className="rv-example-audio"
                          onClick={() =>
                            speech.speak(ex.hanzi, {
                              key: `list-ex-${word.id}`,
                            })
                          }
                          title="Nghe câu ví dụ"
                        >
                          <Icon name="volume" size={14} />
                        </button>
                      </div>
                      {showPinyinList && (
                        <div className="rv-example-py">{ex.pinyin}</div>
                      )}
                      {showMeaningList && (
                        <div className="rv-example-vi">{ex.meaningVi}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rv-word-card-actions">
                  <div className="rv-status-group">
                    <button
                      type="button"
                      className={`rv-status-btn${word.status === 'memorized' ? ' is-memorized' : ''}`}
                      onClick={() =>
                        updateWordRating(
                          word.id,
                          word.status === 'memorized' ? 'again' : 'good',
                        )
                      }
                    >
                      <Icon name="check" size={14} />
                      {word.status === 'memorized' ? 'Đã thuộc' : 'Đánh dấu thuộc'}
                    </button>
                  </div>

                  <div className="rv-quick-practice-btns">
                    <button
                      type="button"
                      className="rv-mini-practice-btn"
                      onClick={() => jumpToWordMode(word.id, 'pronunciation')}
                      title="Luyện phát âm từ này"
                    >
                      <Icon name="mic" size={14} />
                      Phát âm
                    </button>
                    <button
                      type="button"
                      className="rv-mini-practice-btn"
                      onClick={() => jumpToWordMode(word.id, 'writing')}
                      title="Luyện viết chữ Hán này"
                    >
                      <Icon name="pen" size={14} />
                      Luyện viết
                    </button>
                    <button
                      type="button"
                      className="rv-mini-practice-btn"
                      onClick={() => jumpToWordMode(word.id, 'flashcard')}
                      title="Mở thẻ Flashcard"
                    >
                      <Icon name="layers" size={14} />
                      Thẻ lật
                    </button>
                  </div>
                </div>
              </article>
            );
            })}

            {filteredWords.length === 0 && (
              <div className="rv-empty-state">
                <p>Không có từ vựng nào khớp với bộ lọc hiện tại.</p>
                <button
                  type="button"
                  className="rv-btn-secondary"
                  onClick={() => {
                    setWordFilter('all');
                    setSearchQuery('');
                  }}
                >
                  Xem toàn bộ từ trong sổ tay
                </button>
              </div>
            )}
          </div>

          {totalFilteredPages > 1 && (
            <div className="rv-pagination-bar">
              <button
                type="button"
                className="rv-btn-secondary"
                disabled={safePageIndex <= 0}
                onClick={() => setBatchIndex(Math.max(0, safePageIndex - 1))}
              >
                ← Chặng trước
              </button>
              <span className="rv-pagination-info">
                Chặng <strong>{safePageIndex + 1}</strong> / {totalFilteredPages} (Hiển thị{' '}
                {safePageIndex * BATCH_SIZE + 1} –{' '}
                {Math.min(allFilteredWords.length, (safePageIndex + 1) * BATCH_SIZE)} trong tổng số{' '}
                <strong>{allFilteredWords.length}</strong> từ)
              </span>
              <button
                type="button"
                className="rv-btn-secondary"
                disabled={safePageIndex >= totalFilteredPages - 1}
                onClick={() => setBatchIndex(Math.min(totalFilteredPages - 1, safePageIndex + 1))}
              >
                Chặng tiếp theo →
              </button>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================
          MÀN 1: ÔN TẬP (QUIZ / TRẮC NGHIỆM & ĐIỀN TỪ THÔNG MINH)
          ======================================================================== */}
      {activeMode === 'quiz' && (
        <section className="rv-panel">
          <div className="rv-submode-bar">
            <div className="rv-submode-pills">
              {(
                [
                  { id: 'mixed', label: '🎯 Tổng hợp 4 kỹ năng' },
                  { id: 'hanzi_to_vi', label: 'Nhìn Chữ → Chọn Nghĩa' },
                  { id: 'vi_to_hanzi', label: 'Nhìn Nghĩa → Chọn Chữ' },
                  { id: 'audio_to_hanzi', label: '🔊 Nghe Âm → Chọn Từ' },
                  { id: 'fill_example', label: '✍️ Điền từ vào câu' },
                ] as { id: QuizQuestionType; label: string }[]
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`rv-submode-pill${quizType === t.id ? ' is-active' : ''}`}
                  onClick={() => resetQuiz(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="rv-quiz-score-badges">
              <span className="rv-combo-badge">🔥 Chuỗi đúng: {quizCombo}</span>
              <span className="rv-score-badge">
                Đúng: {quizHistory.filter((h) => h.isCorrect).length}/{quizQuestions.length}
              </span>
            </div>
          </div>

          {!isQuizFinished && currentQuestion ? (
            <div className="rv-quiz-stage">
              <div className="rv-quiz-progress-head">
                <span>
                  Câu hỏi <strong>{quizIdx + 1}</strong> / {quizQuestions.length}
                </span>
                <div className="rv-quiz-progress-bar">
                  <span
                    style={{
                      width: `${Math.round(((quizIdx + 1) / quizQuestions.length) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Đề bài theo từng dạng câu hỏi */}
              <div className="rv-quiz-prompt-card">
                {currentQuestion.type === 'hanzi_to_vi' && (
                  <>
                    <span className="rv-prompt-tag">Chọn nghĩa tiếng Việt đúng cho từ sau:</span>
                    <div className="rv-prompt-hanzi-row">
                      <h3 className="rv-prompt-hanzi">{currentQuestion.word.hanzi}</h3>
                      <button
                        type="button"
                        className="rv-audio-circle"
                        onClick={() =>
                          speech.speak(currentQuestion.word.hanzi, {
                            key: `q-${currentQuestion.word.id}`,
                          })
                        }
                      >
                        <Icon name="volume" size={20} />
                      </button>
                    </div>
                    <p className="rv-prompt-pinyin">[{currentQuestion.word.pinyin}]</p>
                  </>
                )}

                {currentQuestion.type === 'vi_to_hanzi' && (
                  <>
                    <span className="rv-prompt-tag">Từ tiếng Trung nào mang ý nghĩa sau?</span>
                    <h3 className="rv-prompt-vi">“{currentQuestion.word.meaningVi}”</h3>
                    <p className="rv-prompt-pos">{currentQuestion.word.partOfSpeech}</p>
                  </>
                )}

                {currentQuestion.type === 'audio_to_hanzi' && (
                  <>
                    <span className="rv-prompt-tag">Nghe phát âm và chọn đúng chữ Hán:</span>
                    <button
                      type="button"
                      className="rv-big-listen-btn"
                      onClick={() =>
                        speech.speak(currentQuestion.word.hanzi, {
                          key: `qa-${currentQuestion.word.id}`,
                        })
                      }
                    >
                      <Icon name="volume" size={28} />
                      <span>Bấm để nghe lại phát âm</span>
                    </button>
                  </>
                )}

                {currentQuestion.type === 'fill_example' && (
                  <>
                    <span className="rv-prompt-tag">
                      Điền từ phù hợp vào chỗ trống (gõ chữ Hán hoặc Pinyin):
                    </span>
                    <h3 className="rv-prompt-sentence">{currentQuestion.blankedSentence}</h3>
                    <p className="rv-prompt-vi">
                      Dịch: “{getWordExample(currentQuestion.word).meaningVi}”
                    </p>
                    <p className="rv-prompt-hint">
                      Gợi ý nghĩa từ cần điền: <strong>{currentQuestion.word.meaningVi}</strong>
                    </p>
                  </>
                )}
              </div>

              {/* Khu vực trả lời */}
              {currentQuestion.type === 'fill_example' ? (
                <div className="rv-fill-box">
                  <input
                    type="text"
                    value={quizFillInput}
                    disabled={quizFillSubmitted}
                    onChange={(e) => setQuizFillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCheckFillQuiz();
                    }}
                    placeholder="Nhập chữ Hán (ví dụ: 喜欢) hoặc Pinyin..."
                    className="rv-fill-input"
                  />
                  {!quizFillSubmitted && (
                    <button
                      type="button"
                      className="rv-btn-primary"
                      onClick={handleCheckFillQuiz}
                      disabled={!quizFillInput.trim()}
                    >
                      Kiểm tra đáp án
                    </button>
                  )}
                </div>
              ) : (
                <div className="rv-quiz-options">
                  {currentQuestion.options.map((opt, optIdx) => {
                    const isAnswered = quizSelectedOpt !== null;
                    const isCorrectOpt = optIdx === currentQuestion.correctIndex;
                    const isChosen = quizSelectedOpt === optIdx;

                    let stateClass = '';
                    if (isAnswered) {
                      if (isCorrectOpt) stateClass = ' is-correct';
                      else if (isChosen) stateClass = ' is-wrong';
                    }

                    return (
                      <button
                        key={`${opt.id}-${optIdx}`}
                        type="button"
                        disabled={isAnswered}
                        onClick={() => handleSelectQuizOption(optIdx)}
                        className={`rv-quiz-option${stateClass}`}
                      >
                        <span className="rv-opt-letter">
                          {['A', 'B', 'C', 'D'][optIdx]}
                        </span>
                        <div className="rv-opt-content">
                          {currentQuestion.type === 'hanzi_to_vi' ? (
                            <span className="rv-opt-vi">{opt.meaningVi}</span>
                          ) : (
                            <>
                              <span className="rv-opt-hanzi">{opt.hanzi}</span>
                              <span className="rv-opt-pinyin">{opt.pinyin}</span>
                            </>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Hộp giải thích sau khi trả lời */}
              {(quizSelectedOpt !== null || quizFillSubmitted) && (
                <div className="rv-quiz-feedback">
                  <div className="rv-feedback-info">
                    <div className="rv-feedback-word">
                      <strong>{currentQuestion.word.hanzi}</strong> [{currentQuestion.word.pinyin}] —{' '}
                      <span>{currentQuestion.word.meaningVi}</span>
                    </div>
                    <div className="rv-feedback-example">
                      Ví dụ: {getWordExample(currentQuestion.word).hanzi} (
                      {getWordExample(currentQuestion.word).meaningVi})
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rv-btn-primary"
                    onClick={handleNextQuizQuestion}
                  >
                    {quizIdx < quizQuestions.length - 1 ? 'Câu tiếp theo →' : 'Xem kết quả tổng kết'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Màn hình hoàn thành bài Ôn tập */
            <div className="rv-quiz-summary">
              <div className="rv-summary-circle">
                <strong>
                  {quizQuestions.length > 0
                    ? Math.round(
                        (quizHistory.filter((h) => h.isCorrect).length /
                          quizQuestions.length) *
                          100,
                      )
                    : 100}
                  %
                </strong>
                <span>Chính xác</span>
              </div>
              <h3>Hoàn thành bài Ôn tập {currentDeck?.title}!</h3>
              <p>
                Bạn đã trả lời đúng{' '}
                <strong>{quizHistory.filter((h) => h.isCorrect).length}</strong> trên tổng số{' '}
                <strong>{quizQuestions.length}</strong> câu hỏi.
              </p>

              <div className="rv-summary-actions">
                <button
                  type="button"
                  className="rv-btn-primary"
                  onClick={handleSaveQuizSession}
                  disabled={quizSessionSaved}
                >
                  <Icon name="check" size={16} />
                  {quizSessionSaved
                    ? 'Đã ghi nhận vào tiến độ học hôm nay!'
                    : 'Lưu kết quả & Cộng tiến độ học tập'}
                </button>
                <button
                  type="button"
                  className="rv-btn-secondary"
                  onClick={() => resetQuiz()}
                >
                  <Icon name="rotate" size={16} />
                  Làm đề ôn tập mới
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================
          MÀN 2: PHÁT ÂM (LUYỆN ĐỌC, THU ÂM MICRO & CHẤM ĐIỂM GIỌNG NÓI)
          ======================================================================== */}
      {activeMode === 'pronunciation' && currentPronWord && (
        <section className="rv-panel">
          <div className="rv-two-col-practice">
            {/* Cột trái: Danh sách từ trong sổ tay & điểm phát âm */}
            <aside className="rv-side-wordlist">
              <div className="rv-side-head">
                <h3>Danh sách luyện phát âm</h3>
                <span>{deckWords.length} từ</span>
              </div>
              <div className="rv-side-scroll">
                {deckWords.map((w, idx) => {
                  const score = pronScores[w.id];
                  return (
                    <button
                      key={w.id}
                      type="button"
                      className={`rv-side-word-btn${idx === pronIndex ? ' is-active' : ''}`}
                      onClick={() => setPronIndex(idx)}
                    >
                      <div className="rv-side-word-left">
                        <span className="rv-side-hanzi">{w.hanzi}</span>
                        <span className="rv-side-pinyin">{w.pinyin}</span>
                      </div>
                      {score !== undefined ? (
                        <span
                          className={`rv-side-score${score >= 85 ? ' is-high' : ' is-mid'}`}
                        >
                          {score}%
                        </span>
                      ) : (
                        <span className="rv-side-untested">Chưa đọc</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Cột phải: Sân khấu luyện phát âm */}
            <div className="rv-pron-stage">
              <div className="rv-pron-top-controls">
                <div className="rv-submode-pills">
                  <button
                    type="button"
                    className={`rv-submode-pill${pronTargetMode === 'word' ? ' is-active' : ''}`}
                    onClick={() => setPronTargetMode('word')}
                  >
                    Luyện phát âm Từ vựng
                  </button>
                  <button
                    type="button"
                    className={`rv-submode-pill${pronTargetMode === 'sentence' ? ' is-active' : ''}`}
                    onClick={() => setPronTargetMode('sentence')}
                  >
                    Luyện đọc cả Câu ví dụ
                  </button>
                </div>

                <span className="rv-step-counter">
                  Từ {pronIndex + 1} / {deckWords.length}
                </span>
              </div>

              <div className="rv-pron-card">
                <span className="rv-pron-badge">{currentDeck?.badge} · Chuẩn Phổ thông</span>
                <h3
                  className={`rv-pron-hanzi${pronTargetMode === 'sentence' ? ' is-sentence' : ''}`}
                >
                  {pronTargetText}
                </h3>
                <p className="rv-pron-pinyin">[{pronTargetPinyin}]</p>
                <p className="rv-pron-meaning">{pronTargetMeaning}</p>

                {/* Bộ nút nghe giọng mẫu bản xứ */}
                <div className="rv-listen-row">
                  <button
                    type="button"
                    className="rv-btn-listen"
                    onClick={() =>
                      speech.speak(pronTargetText, {
                        key: `pron-norm-${currentPronWord.id}`,
                        rate: 0.95,
                      })
                    }
                  >
                    <Icon name="volume" size={18} />
                    Nghe giọng chuẩn (1.0x)
                  </button>
                  <button
                    type="button"
                    className="rv-btn-listen is-slow"
                    onClick={() =>
                      speech.speak(pronTargetText, {
                        key: `pron-slow-${currentPronWord.id}`,
                        rate: 0.65,
                      })
                    }
                  >
                    <Icon name="headphones" size={18} />
                    Nghe chậm từng âm (0.65x)
                  </button>
                </div>

                {/* Khu vực bấm Micro thu âm */}
                <div className="rv-mic-zone">
                  <button
                    type="button"
                    className={`rv-mic-button${isRecordingPron ? ' is-recording' : ''}`}
                    onClick={startPronRecording}
                  >
                    <Icon name={isRecordingPron ? 'stop' : 'mic'} size={28} />
                  </button>
                  <span className="rv-mic-caption">
                    {isRecordingPron
                      ? 'Đang thu âm... Bấm lần nữa để dừng và chấm điểm'
                      : 'Bấm vào biểu tượng Micro và đọc to bằng tiếng Trung'}
                  </span>
                </div>

                {/* Kết quả chấm điểm & Nghe lại giọng thu âm */}
                {(currentPronScore !== null || pronFeedback || recordedAudioUrl) && (
                  <div className="rv-pron-result-box">
                    {currentPronScore !== null && (
                      <div className="rv-pron-score-banner">
                        <div
                          className={`rv-pron-score-circle${currentPronScore >= 85 ? ' is-good' : ' is-warn'}`}
                        >
                          {currentPronScore} điểm
                        </div>
                        <div className="rv-pron-score-text">
                          {recognizedText && (
                            <p className="rv-recognized-line">
                              Hệ thống nghe được: <strong>“{recognizedText}”</strong>
                            </p>
                          )}
                          <p className="rv-feedback-line">{pronFeedback}</p>
                        </div>
                      </div>
                    )}

                    {!currentPronScore && pronFeedback && (
                      <p className="rv-feedback-line">{pronFeedback}</p>
                    )}

                    {recordedAudioUrl && (
                      <div className="rv-audio-playback">
                        <span>Bản thu giọng của bạn:</span>
                        <audio controls src={recordedAudioUrl} className="rv-audio-player" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="rv-stage-nav-footer">
                <button
                  type="button"
                  className="rv-btn-secondary"
                  disabled={pronIndex === 0}
                  onClick={() => setPronIndex((i) => Math.max(0, i - 1))}
                >
                  ← Từ trước
                </button>
                <button
                  type="button"
                  className="rv-btn-primary"
                  onClick={() => {
                    updateWordRating(currentPronWord.id, 'good');
                    if (pronIndex < deckWords.length - 1) {
                      setPronIndex((i) => i + 1);
                    }
                  }}
                >
                  <Icon name="check" size={16} />
                  Đã luyện phát âm · Từ tiếp theo →
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================
          MÀN 3: LUYỆN VIẾT (THỨ TỰ NÉT BÚT ĐỎ & BẢNG VẼ CANVAS TRỰC TIẾP)
          ======================================================================== */}
      {activeMode === 'writing' && currentWriteWord && (
        <section className="rv-panel">
          <div className="rv-two-col-practice">
            {/* Cột trái: Danh sách từ trong sổ tay */}
            <aside className="rv-side-wordlist">
              <div className="rv-side-head">
                <h3>Danh sách từ luyện viết</h3>
                <span>{deckWords.length} từ</span>
              </div>
              <div className="rv-side-scroll">
                {deckWords.map((w, idx) => {
                  const chars = Array.from(w.hanzi).filter((ch) =>
                    /[\u3400-\u9fff\uF900-\uFAFF]/.test(ch),
                  );
                  const allCharsWritten =
                    chars.length > 0 && chars.every((c) => writtenCharSet.has(c));

                  return (
                    <button
                      key={w.id}
                      type="button"
                      className={`rv-side-word-btn${idx === writeWordIdx ? ' is-active' : ''}`}
                      onClick={() => {
                        setWriteWordIdx(idx);
                        setWriteCharIdx(0);
                      }}
                    >
                      <div className="rv-side-word-left">
                        <span className="rv-side-hanzi">{w.hanzi}</span>
                        <span className="rv-side-pinyin">
                          {w.pinyin} · {w.meaningVi}
                        </span>
                      </div>
                      {allCharsWritten ? (
                        <span className="rv-side-score is-high">Đã viết ✓</span>
                      ) : (
                        <span className="rv-side-untested">{chars.length} chữ</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Cột phải: Khu vực luyện viết từng chữ Hán */}
            <div className="rv-writing-stage">
              <div className="rv-writing-word-banner">
                <div className="rv-writing-word-meta">
                  <div className="rv-writing-word-title">
                    <h3>{currentWriteWord.hanzi}</h3>
                    <span className="rv-writing-word-py">[{currentWriteWord.pinyin}]</span>
                    <button
                      type="button"
                      className="rv-icon-btn"
                      onClick={() =>
                        speech.speak(currentWriteWord.hanzi, {
                          key: `wr-${currentWriteWord.id}`,
                        })
                      }
                    >
                      <Icon name="volume" size={16} />
                    </button>
                  </div>
                  <p className="rv-writing-word-vi">
                    Nghĩa: <strong>{currentWriteWord.meaningVi}</strong>
                  </p>
                </div>

                {/* Các tab tách từng chữ Hán trong từ (ví dụ: 潜 -> 移 -> 默 -> 化) */}
                <div className="rv-char-tabs">
                  {currentWordChars.map((ch, idx) => (
                    <button
                      key={`${ch}-${idx}`}
                      type="button"
                      className={`rv-char-tab${idx === writeCharIdx ? ' is-active' : ''}${writtenCharSet.has(ch) ? ' is-done' : ''}`}
                      onClick={() => setWriteCharIdx(idx)}
                    >
                      <span className="rv-char-tab-hanzi">{ch}</span>
                      <span className="rv-char-tab-num">
                        Chữ {idx + 1}/{currentWordChars.length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rv-writing-boards">
                {/* Bảng 1: Minh họa thứ tự nét chuẩn */}
                <div className="rv-board-card">
                  <div className="rv-board-head">
                    <strong>
                      1. Thứ tự nét chuẩn ({totalTargetStrokes > 0 ? `${writeAnimStep + 1}/${totalTargetStrokes} nét` : 'Chữ mẫu'})
                    </strong>
                    <button
                      type="button"
                      className="rv-mini-action-btn"
                      onClick={() => {
                        setWriteAnimStep(0);
                        setIsWriteAnimating(true);
                      }}
                    >
                      <Icon name="play" size={13} />
                      Chạy từng nét
                    </button>
                  </div>

                  <div className="rv-board-box">
                    <ReviewHanziCell
                      char={activeWriteChar}
                      strokes={activeCharStrokes}
                      mode={activeCharStrokes && activeCharStrokes.length > 0 ? 'step' : 'master'}
                      stepIndex={writeAnimStep}
                      gridType={writeGridType}
                      size="large"
                    />
                  </div>

                  {activeCharStrokes && activeCharStrokes.length > 0 && (
                    <div className="rv-stroke-step-pills">
                      {activeCharStrokes.map((_, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          className={`rv-stroke-pill${sIdx === writeAnimStep ? ' is-active' : sIdx < writeAnimStep ? ' is-passed' : ''}`}
                          onClick={() => {
                            setIsWriteAnimating(false);
                            setWriteAnimStep(sIdx);
                          }}
                        >
                          Nét {sIdx + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bảng 2: Viết tay trực tiếp trên Canvas */}
                <div className="rv-board-card">
                  <div className="rv-board-head">
                    <strong>
                      2. Bảng tập viết tay ({userDrawnStrokes}
                      {totalTargetStrokes > 0 ? `/${totalTargetStrokes}` : ''} nét đã viết)
                    </strong>
                    <div className="rv-board-tools">
                      <button
                        type="button"
                        className="rv-mini-action-btn"
                        onClick={() => setWriteShowTrace((v) => !v)}
                      >
                        {writeShowTrace ? 'Ẩn chữ mờ' : 'Hiện chữ mờ'}
                      </button>
                      <button
                        type="button"
                        className="rv-mini-action-btn is-danger"
                        onClick={clearWriteCanvas}
                      >
                        Xóa viết lại
                      </button>
                    </div>
                  </div>

                  <div className="rv-board-box is-canvas-container">
                    <ReviewHanziCell
                      char={activeWriteChar}
                      strokes={activeCharStrokes}
                      mode={writeShowTrace ? 'trace' : 'blank'}
                      gridType={writeGridType}
                      size="large"
                    />
                    <canvas
                      ref={writeCanvasRef}
                      width={600}
                      height={600}
                      className="rv-write-canvas"
                      onPointerDown={onCanvasPointerDown}
                      onPointerMove={onCanvasPointerMove}
                      onPointerUp={onCanvasPointerUp}
                      onPointerCancel={onCanvasPointerUp}
                    />
                  </div>

                  <div className="rv-canvas-toolbar">
                    <div className="rv-grid-selector">
                      {(
                        [
                          { id: 'mizige', label: 'Ô Mễ' },
                          { id: 'tianzige', label: 'Ô Điền' },
                          { id: 'fangge', label: 'Ô Vuông' },
                        ] as { id: GridType; label: string }[]
                      ).map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          className={`rv-mini-pill${writeGridType === g.id ? ' is-active' : ''}`}
                          onClick={() => setWriteGridType(g.id)}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>

                    <div className="rv-ink-selector">
                      {[
                        { color: '#163124', name: 'Mực xanh tùng' },
                        { color: '#0f172a', name: 'Mực đen' },
                        { color: '#e11d48', name: 'Mực đỏ' },
                      ].map((ink) => (
                        <button
                          key={ink.color}
                          type="button"
                          className={`rv-ink-dot${writeBrushColor === ink.color ? ' is-active' : ''}`}
                          style={{ backgroundColor: ink.color }}
                          onClick={() => setWriteBrushColor(ink.color)}
                          title={ink.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dải phân rã từng nét bên dưới */}
              {activeCharStrokes && activeCharStrokes.length > 0 && (
                <div className="rv-stroke-decomposition">
                  <span className="rv-decomp-label">
                    Phân rã từng bước nét chữ <strong>{activeWriteChar}</strong>:
                  </span>
                  <div className="rv-decomp-row">
                    {activeCharStrokes.slice(0, 12).map((_, idx) => (
                      <ReviewHanziCell
                        key={idx}
                        char={activeWriteChar}
                        strokes={activeCharStrokes}
                        mode="step"
                        stepIndex={idx}
                        gridType={writeGridType}
                        size="small"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="rv-stage-nav-footer">
                <button
                  type="button"
                  className="rv-btn-secondary"
                  disabled={writeWordIdx === 0 && writeCharIdx === 0}
                  onClick={() => {
                    if (writeCharIdx > 0) setWriteCharIdx((i) => i - 1);
                    else if (writeWordIdx > 0) {
                      setWriteWordIdx((i) => i - 1);
                      setWriteCharIdx(0);
                    }
                  }}
                >
                  ← Quay lại
                </button>
                <button
                  type="button"
                  className="rv-btn-primary"
                  onClick={handleMarkCharDone}
                >
                  <Icon name="check" size={16} />
                  {writeCharIdx < currentWordChars.length - 1
                    ? `Hoàn thành chữ "${activeWriteChar}" · Sang chữ tiếp →`
                    : 'Hoàn thành từ này · Qua từ tiếp theo →'}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================
          MÀN 4: FLASHCARD (THẺ LẬT 2 MẶT, AUTO-PLAY, SHUFFLE, ĐÁNH GIÁ SRS)
          ======================================================================== */}
      {activeMode === 'flashcard' && currentFlashcard && (
        <section className="rv-panel">
          <div className="rv-fc-toolbar">
            <div className="rv-fc-toggles">
              <button
                type="button"
                className={`rv-toggle-chip${fcOnlyUnlearned ? ' is-on' : ''}`}
                onClick={() => setFcOnlyUnlearned((v) => !v)}
              >
                {fcOnlyUnlearned ? '✓ ' : ''}Chỉ từ chưa thuộc
              </button>
              <button
                type="button"
                className={`rv-toggle-chip${fcReverseFace ? ' is-on' : ''}`}
                onClick={() => setFcReverseFace((v) => !v)}
              >
                {fcReverseFace ? '✓ ' : ''}Đảo mặt (Việt → Trung)
              </button>
              <button
                type="button"
                className={`rv-toggle-chip${fcAutoSpeak ? ' is-on' : ''}`}
                onClick={() => setFcAutoSpeak((v) => !v)}
              >
                {fcAutoSpeak ? '✓ ' : ''}Tự động phát âm
              </button>
              <button
                type="button"
                className={`rv-toggle-chip${fcAutoPlay ? ' is-on' : ''}`}
                onClick={() => setFcAutoPlay((v) => !v)}
              >
                {fcAutoPlay ? '⏸ Dừng Auto-play' : '▶ Tự động lật (Auto-play)'}
              </button>
              <button
                type="button"
                className="rv-toggle-chip"
                onClick={handleShuffleFlashcards}
              >
                🔀 Xáo trộn thẻ
              </button>
            </div>

            <span className="rv-step-counter">
              Thẻ <strong>{fcIndex + 1}</strong> / {flashcardList.length}
            </span>
          </div>

          <div className="rv-fc-stage">
            <div
              className={`rv-flashcard-box${fcFlipped ? ' is-flipped' : ''}`}
              onClick={() => setFcFlipped((v) => !v)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  setFcFlipped((v) => !v);
                }
              }}
            >
              {!fcFlipped ? (
                /* MẶT TRƯỚC THẺ FLASHCARD */
                <div className="rv-fc-face is-front">
                  <div className="rv-fc-card-top">
                    <span className="rv-fc-deck-tag">
                      {currentDeck?.badge} · {currentFlashcard.partOfSpeech}
                    </span>
                    <span className={`rv-fc-status-dot is-${currentFlashcard.status}`}>
                      {currentFlashcard.status === 'memorized'
                        ? 'Đã thuộc'
                        : currentFlashcard.status === 'learning'
                          ? 'Đang ôn'
                          : 'Chưa thuộc'}
                    </span>
                  </div>

                  <div className="rv-fc-center">
                    {!fcReverseFace ? (
                      <>
                        <h3 className="rv-fc-big-hanzi">{currentFlashcard.hanzi}</h3>
                        {fcShowHint ? (
                          <p className="rv-fc-hint-pinyin">[{currentFlashcard.pinyin}]</p>
                        ) : (
                          <button
                            type="button"
                            className="rv-fc-hint-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFcShowHint(true);
                            }}
                          >
                            Xem gợi ý Pinyin
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="rv-fc-prompt-label">Hãy nhớ lại chữ Hán của nghĩa:</span>
                        <h3 className="rv-fc-big-vi">“{currentFlashcard.meaningVi}”</h3>
                      </>
                    )}

                    <div
                      className="rv-fc-audio-btns"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="rv-btn-listen"
                        onClick={() =>
                          speech.speak(currentFlashcard.hanzi, {
                            key: `fc-front-${currentFlashcard.id}`,
                          })
                        }
                      >
                        <Icon name="volume" size={18} />
                        Phát âm
                      </button>
                    </div>
                  </div>

                  <div className="rv-fc-card-foot">
                    <span>Nhấn vào thẻ hoặc bấm phím Space để lật mặt sau ↻</span>
                  </div>
                </div>
              ) : (
                /* MẶT SAU THẺ FLASHCARD */
                <div className="rv-fc-face is-back">
                  <div className="rv-fc-card-top">
                    <span className="rv-fc-deck-tag">Đáp án chi tiết &amp; Ngữ cảnh</span>
                    <button
                      type="button"
                      className="rv-mini-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        jumpToWordMode(currentFlashcard.id, 'writing');
                      }}
                    >
                      <Icon name="pen" size={13} />
                      Tập viết từ này
                    </button>
                  </div>

                  <div className="rv-fc-back-content">
                    <div className="rv-fc-back-head">
                      <h3 className="rv-fc-back-hanzi">{currentFlashcard.hanzi}</h3>
                      <span className="rv-fc-back-pinyin">[{currentFlashcard.pinyin}]</span>
                      <button
                        type="button"
                        className="rv-icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          speech.speak(currentFlashcard.hanzi, {
                            key: `fc-back-${currentFlashcard.id}`,
                          });
                        }}
                      >
                        <Icon name="volume" size={18} />
                      </button>
                    </div>

                    <p className="rv-fc-back-meaning">{currentFlashcard.meaningVi}</p>

                    <div
                      className="rv-fc-example-card"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="rv-fc-ex-top">
                        <strong>Câu ví dụ:</strong>
                        <button
                          type="button"
                          className="rv-example-audio"
                          onClick={() =>
                            speech.speak(getWordExample(currentFlashcard).hanzi, {
                              key: `fc-ex-${currentFlashcard.id}`,
                            })
                          }
                        >
                          <Icon name="volume" size={15} />
                          Nghe câu
                        </button>
                      </div>
                      <p className="rv-fc-ex-zh">{getWordExample(currentFlashcard).hanzi}</p>
                      <p className="rv-fc-ex-py">{getWordExample(currentFlashcard).pinyin}</p>
                      <p className="rv-fc-ex-vi">{getWordExample(currentFlashcard).meaningVi}</p>
                    </div>
                  </div>

                  <div className="rv-fc-card-foot">
                    <span>Hãy chọn mức độ ghi nhớ bên dưới để chuyển sang thẻ tiếp theo</span>
                  </div>
                </div>
              )}
            </div>

            {/* 4 Nút đánh giá mức độ nhớ (SRS) */}
            <div className="rv-srs-buttons">
              <button
                type="button"
                className="rv-srs-btn is-again"
                onClick={() => handleFlashcardRate('again')}
              >
                <strong>Chưa thuộc</strong>
                <span>Ôn lại ngay</span>
              </button>
              <button
                type="button"
                className="rv-srs-btn is-hard"
                onClick={() => handleFlashcardRate('hard')}
              >
                <strong>Hơi khó</strong>
                <span>12 giờ sau</span>
              </button>
              <button
                type="button"
                className="rv-srs-btn is-good"
                onClick={() => handleFlashcardRate('good')}
              >
                <strong>Đã nhớ</strong>
                <span>2 ngày sau</span>
              </button>
              <button
                type="button"
                className="rv-srs-btn is-easy"
                onClick={() => handleFlashcardRate('easy')}
              >
                <strong>Thuộc làu</strong>
                <span>4 ngày sau</span>
              </button>
            </div>

            {/* Điều hướng thẻ trước / sau */}
            <div className="rv-fc-nav-row">
              <button
                type="button"
                className="rv-btn-secondary"
                onClick={() => {
                  setFcFlipped(false);
                  setFcIndex((i) => (i - 1 + flashcardList.length) % flashcardList.length);
                }}
              >
                ← Thẻ trước
              </button>
              <button
                type="button"
                className="rv-btn-secondary"
                onClick={() => setFcFlipped((v) => !v)}
              >
                Lật thẻ (Space)
              </button>
              <button
                type="button"
                className="rv-btn-secondary"
                onClick={() => {
                  setFcFlipped(false);
                  setFcIndex((i) => (i + 1) % flashcardList.length);
                }}
              >
                Thẻ tiếp theo →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* MODAL THÊM TỪ MỚI VÀO SỔ TAY */}
      {isAddModalOpen && currentDeck && (
        <div className="rv-modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="rv-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="rv-modal-head">
              <h3>Thêm từ vựng vào {currentDeck.title}</h3>
              <button
                type="button"
                className="rv-modal-close"
                onClick={() => setIsAddModalOpen(false)}
              >
                <Icon name="x" size={18} />
              </button>
            </div>
            <form onSubmit={handleAddWordSubmit} className="rv-modal-form">
              {addWordError && (
                <p className="rv-form-error" role="alert">
                  {addWordError}
                </p>
              )}
              {currentDeck.kind === 'custom' && (
                <div className="rv-dictionary-lookup">
                  <label>
                    <span>Tìm từ có sẵn trong từ điển</span>
                    <input
                      type="search"
                      value={dictionaryQuery}
                      onChange={(e) => {
                        setDictionaryQuery(e.target.value);
                        setDictionaryResults([]);
                        setHasSearchedDictionary(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void handleDictionarySearch();
                        }
                      }}
                      placeholder="Nhập chữ Hán, pinyin hoặc nghĩa..."
                    />
                  </label>
                  <button
                    type="button"
                    className="rv-btn-secondary"
                    onClick={() => void handleDictionarySearch()}
                    disabled={isSearchingDictionary || !dictionaryQuery.trim()}
                  >
                    {isSearchingDictionary ? 'Đang tìm...' : 'Tìm từ'}
                  </button>
                  {dictionaryResults.length > 0 && (
                    <div className="rv-lookup-results">
                      {dictionaryResults.map((word) => (
                        <div className="rv-lookup-result" key={word.id}>
                          <div>
                            <strong>{word.hanzi}</strong>
                            <span>{word.pinyin}</span>
                            <small>{word.meanings[0]?.meaningVi || 'Chưa có nghĩa'}</small>
                          </div>
                          <button
                            type="button"
                            className="rv-btn-add-word"
                            onClick={() => void handleAttachDictionaryWord(word)}
                            disabled={isAttachingDictionaryWord === word.id}
                          >
                            {isAttachingDictionaryWord === word.id ? 'Đang thêm...' : 'Thêm'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {hasSearchedDictionary && !isSearchingDictionary && dictionaryResults.length === 0 && (
                    <small className="rv-lookup-empty">Không tìm thấy từ phù hợp.</small>
                  )}
                  <p className="rv-lookup-divider">
                    Hoặc thêm từ mới (từ sẽ được lưu vào từ điển chung)
                  </p>
                </div>
              )}
              <div className="rv-form-row">
                <label>
                  <span>Chữ Hán *</span>
                  <input
                    type="text"
                    required
                    value={newWordForm.hanzi}
                    onChange={(e) =>
                      setNewWordForm((f) => ({ ...f, hanzi: e.target.value }))
                    }
                    placeholder="Ví dụ: 笃行"
                  />
                </label>
                <label>
                  <span>Phiên âm Pinyin</span>
                  <input
                    type="text"
                    value={newWordForm.pinyin}
                    onChange={(e) =>
                      setNewWordForm((f) => ({ ...f, pinyin: e.target.value }))
                    }
                    placeholder="Ví dụ: dǔ xíng"
                  />
                </label>
              </div>
              <label>
                <span>Nghĩa tiếng Việt *</span>
                <input
                  type="text"
                  required
                  value={newWordForm.meaningVi}
                  onChange={(e) =>
                    setNewWordForm((f) => ({ ...f, meaningVi: e.target.value }))
                  }
                  placeholder="Ví dụ: thực hành chuyên tâm, làm đến nơi đến chốn"
                />
              </label>
              <label>
                <span>Câu ví dụ chữ Hán (Tuỳ chọn)</span>
                <input
                  type="text"
                  value={newWordForm.exHanzi}
                  onChange={(e) =>
                    setNewWordForm((f) => ({ ...f, exHanzi: e.target.value }))
                  }
                  placeholder="Ví dụ: 博学而笃志，切问而近思。"
                />
              </label>
              <div className="rv-form-row">
                <label>
                  <span>Pinyin câu ví dụ</span>
                  <input
                    type="text"
                    value={newWordForm.exPinyin}
                    onChange={(e) =>
                      setNewWordForm((f) => ({ ...f, exPinyin: e.target.value }))
                    }
                    placeholder="Bóxué ér dǔzhì..."
                  />
                </label>
                <label>
                  <span>Nghĩa câu ví dụ</span>
                  <input
                    type="text"
                    value={newWordForm.exVi}
                    onChange={(e) =>
                      setNewWordForm((f) => ({ ...f, exVi: e.target.value }))
                    }
                    placeholder="Học rộng mà chí kiên định..."
                  />
                </label>
              </div>
              <div className="rv-modal-actions">
                <button
                  type="button"
                  className="rv-btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="rv-btn-primary"
                  disabled={isSubmittingWord}
                >
                  {isSubmittingWord ? 'Đang lưu...' : '+ Lưu vào sổ tay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCreateDeckModalOpen && (
        <div className="rv-modal-backdrop" onClick={() => setIsCreateDeckModalOpen(false)}>
          <div className="rv-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="rv-modal-head">
              <h3>Tạo sổ tay cá nhân</h3>
              <button
                type="button"
                className="rv-modal-close"
                onClick={() => setIsCreateDeckModalOpen(false)}
              >
                <Icon name="x" size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateDeckSubmit} className="rv-modal-form">
              <p className="rv-modal-description">
                Tạo một sổ tay riêng, sau đó thêm từ bạn muốn học và ôn tập.
              </p>
              {createDeckError && (
                <p className="rv-form-error" role="alert">
                  {createDeckError}
                </p>
              )}
              <label>
                <span>Tên sổ tay *</span>
                <input
                  type="text"
                  required
                  maxLength={60}
                  value={newDeckTitle}
                  onChange={(e) => setNewDeckTitle(e.target.value)}
                  placeholder="Ví dụ: Từ mới trong phim"
                />
              </label>
              <div className="rv-modal-actions">
                <button
                  type="button"
                  className="rv-btn-secondary"
                  onClick={() => setIsCreateDeckModalOpen(false)}
                >
                  Huỷ
                </button>
                <button type="submit" className="rv-btn-primary" disabled={isCreatingDeck}>
                  {isCreatingDeck ? 'Đang tạo...' : '+ Tạo sổ tay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
