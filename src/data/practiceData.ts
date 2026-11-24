import type { HomeStat } from './homeData';

export type Speaker = { name: string; hanzi: string; avatar: string };

export type DialogueLine = {
  /** Vị trí người nói trong mảng speakers. */
  speaker: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
};

export type QuizItem = { id: string; prompt: string; options: string[]; answer: number };

export type VocabItem = { hanzi: string; pinyin: string; meaning: string };

export type PatternItem = { structure: string; hanzi: string; pinyin: string; meaning: string };

export type LessonData = {
  course: string;
  topic: string;
  title: string;
  titleHanzi: string;
  description: string;
  remaining: string;
  thumb: { tag: string; hanzi: string; caption: string };
  /** Phần đang học dở (các phần trước đó coi như đã xong). */
  startStep: number;
  steps: { label: string; intro: string }[];
  goals: string[];
  notes: { title: string; body: string }[];
  vocabulary: VocabItem[];
  patterns: PatternItem[];
  speakers: Speaker[];
  dialogue: DialogueLine[];
  quiz: QuizItem[];
};

export type ReviewCard = {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  deck: string;
  example: { hanzi: string; pinyin: string; meaning: string };
};

export type ListeningTrack = {
  id: string;
  title: string;
  hanziTitle: string;
  art: string;
  situation: string;
  level: string;
  speakers: Speaker[];
  lines: DialogueLine[];
  questions: QuizItem[];
};

export type SpeakingSentence = {
  id: string;
  hanzi: string;
  /** Pinyin theo từng chữ Hán (bỏ qua dấu câu), cách nhau bởi dấu cách. */
  syllables: string;
  meaning: string;
  tip: string;
  best?: number;
};

export type ToneItem = { tone: number; mark: string; hanzi: string; meaning: string; hint: string; contour: string };

/* ---------------------------------------------------------------- Học ngay */

const xiaoMing: Speaker = { name: 'Tiểu Minh', hanzi: '小明', avatar: '明' };
const anna: Speaker = { name: 'Anna', hanzi: '安娜', avatar: '安' };

export const lesson: LessonData = {
  course: 'HSK 2',
  topic: 'Giao tiếp đời sống',
  title: 'Bài 09: Một ngày của tôi',
  titleHanzi: '我的一天',
  description: 'Nói về giờ giấc và những việc bạn làm trong một ngày.',
  remaining: 'Khoảng 10 phút còn lại',
  thumb: { tag: 'HSK 2 · Bài 09', hanzi: '日常', caption: 'Cuộc sống hằng ngày' },
  startStep: 2,
  steps: [
    { label: 'Từ vựng', intro: 'Nghe và ghi nhớ 10 từ mới của bài. Bấm biểu tượng loa để nghe phát âm.' },
    { label: 'Mẫu câu', intro: 'Ba cấu trúc câu dùng để nói về giờ giấc và lịch sinh hoạt.' },
    { label: 'Hội thoại', intro: 'Tiểu Minh và Anna kể về một ngày của mình. Bấm vào từng câu để nghe lại.' },
    { label: 'Luyện tập', intro: 'Trả lời 3 câu hỏi để kiểm tra nhanh những gì bạn vừa học.' },
    { label: 'Tổng kết', intro: 'Xem lại kết quả và chọn bước học tiếp theo.' },
  ],
  goals: ['Nói giờ với 点 và 半', 'Hỏi giờ với 几点', 'Kể lịch sinh hoạt trong một ngày'],
  notes: [
    { title: 'Nói giờ với 点 và 半', body: '七点 = 7 giờ · 七点半 = 7 giờ rưỡi.' },
    { title: 'Thời gian đứng trước động từ', body: '我七点起床。Không nói 我起床七点。' },
    { title: 'Hỏi giờ với 几点', body: '你几点上班？— Mấy giờ bạn đi làm?' },
  ],
  vocabulary: [
    { hanzi: '起床', pinyin: 'qǐchuáng', meaning: 'thức dậy' },
    { hanzi: '早上', pinyin: 'zǎoshang', meaning: 'buổi sáng' },
    { hanzi: '上班', pinyin: 'shàngbān', meaning: 'đi làm' },
    { hanzi: '中午', pinyin: 'zhōngwǔ', meaning: 'buổi trưa' },
    { hanzi: '下午', pinyin: 'xiàwǔ', meaning: 'buổi chiều' },
    { hanzi: '晚上', pinyin: 'wǎnshang', meaning: 'buổi tối' },
    { hanzi: '睡觉', pinyin: 'shuìjiào', meaning: 'đi ngủ' },
    { hanzi: '每天', pinyin: 'měitiān', meaning: 'mỗi ngày' },
    { hanzi: '点', pinyin: 'diǎn', meaning: 'giờ (giờ đồng hồ)' },
    { hanzi: '半', pinyin: 'bàn', meaning: 'rưỡi, một nửa' },
  ],
  patterns: [
    {
      structure: 'Chủ ngữ + thời gian + động từ',
      hanzi: '我每天早上七点起床。',
      pinyin: 'Wǒ měitiān zǎoshang qī diǎn qǐchuáng.',
      meaning: 'Mỗi sáng tôi thức dậy lúc 7 giờ.',
    },
    {
      structure: 'Chủ ngữ + 几点 + động từ？',
      hanzi: '你几点上班？',
      pinyin: 'Nǐ jǐ diǎn shàngbān?',
      meaning: 'Mấy giờ bạn đi làm?',
    },
    {
      structure: 'Số + 点 + 半',
      hanzi: '我晚上十一点半睡觉。',
      pinyin: 'Wǒ wǎnshang shíyī diǎn bàn shuìjiào.',
      meaning: 'Tôi đi ngủ lúc 11 giờ rưỡi tối.',
    },
  ],
  speakers: [xiaoMing, anna],
  dialogue: [
    { speaker: 0, hanzi: '安娜，你每天几点起床？', pinyin: 'Ānnà, nǐ měitiān jǐ diǎn qǐchuáng?', meaning: 'Anna, mỗi ngày bạn dậy lúc mấy giờ?' },
    { speaker: 1, hanzi: '我六点半起床。你呢？', pinyin: 'Wǒ liù diǎn bàn qǐchuáng. Nǐ ne?', meaning: 'Mình dậy lúc 6 giờ rưỡi. Còn bạn?' },
    { speaker: 0, hanzi: '我七点起床，八点上班。', pinyin: 'Wǒ qī diǎn qǐchuáng, bā diǎn shàngbān.', meaning: 'Mình dậy lúc 7 giờ, 8 giờ đi làm.' },
    { speaker: 1, hanzi: '你中午在哪儿吃饭？', pinyin: 'Nǐ zhōngwǔ zài nǎr chīfàn?', meaning: 'Buổi trưa bạn ăn cơm ở đâu?' },
    { speaker: 0, hanzi: '我在公司吃饭。晚上我常常看书。', pinyin: 'Wǒ zài gōngsī chīfàn. Wǎnshang wǒ chángcháng kàn shū.', meaning: 'Mình ăn ở công ty. Buổi tối mình thường đọc sách.' },
    { speaker: 1, hanzi: '我晚上喜欢跑步。', pinyin: 'Wǒ wǎnshang xǐhuan pǎobù.', meaning: 'Buổi tối mình thích chạy bộ.' },
  ],
  quiz: [
    { id: 'q1', prompt: '“起床” nghĩa là gì?', options: ['Đi ngủ', 'Thức dậy', 'Đi làm', 'Ăn cơm'], answer: 1 },
    { id: 'q2', prompt: 'Chọn cách nói đúng của “8 giờ rưỡi”.', options: ['八点半', '半八点', '八半点', '点八半'], answer: 0 },
    { id: 'q3', prompt: 'Trong hội thoại, Anna dậy lúc mấy giờ?', options: ['6 giờ', '6 giờ rưỡi', '7 giờ', '8 giờ'], answer: 1 },
  ],
};

/* ---------------------------------------------------------------- Ôn tập */

export const reviewStats: HomeStat[] = [
  { id: 'due', label: 'Đến hạn hôm nay', value: '12', unit: 'thẻ', hint: '4 thẻ HSK 1 · 8 thẻ HSK 2', icon: 'layers', highlight: true },
  { id: 'known', label: 'Từ đã thuộc', value: '248', unit: 'từ', hint: '+16 từ trong 7 ngày qua', icon: 'book' },
  { id: 'recall', label: 'Tỉ lệ nhớ', value: '86', unit: '%', hint: 'Trung bình 30 ngày', icon: 'target' },
  { id: 'streak', label: 'Chuỗi ôn tập', value: '5', unit: 'ngày', hint: 'Ôn mỗi ngày để giữ chuỗi', icon: 'flame' },
];

export const reviewCards: ReviewCard[] = [
  { id: 'xihuan', hanzi: '喜欢', pinyin: 'xǐhuan', meaning: 'thích', deck: 'HSK 1', example: { hanzi: '我喜欢喝茶。', pinyin: 'Wǒ xǐhuan hē chá.', meaning: 'Tôi thích uống trà.' } },
  { id: 'pengyou', hanzi: '朋友', pinyin: 'péngyou', meaning: 'bạn bè', deck: 'HSK 1', example: { hanzi: '他是我的好朋友。', pinyin: 'Tā shì wǒ de hǎo péngyou.', meaning: 'Anh ấy là bạn tốt của tôi.' } },
  { id: 'kafei', hanzi: '咖啡', pinyin: 'kāfēi', meaning: 'cà phê', deck: 'HSK 2', example: { hanzi: '我每天早上喝咖啡。', pinyin: 'Wǒ měitiān zǎoshang hē kāfēi.', meaning: 'Sáng nào tôi cũng uống cà phê.' } },
  { id: 'xuexiao', hanzi: '学校', pinyin: 'xuéxiào', meaning: 'trường học', deck: 'HSK 1', example: { hanzi: '我们的学校很大。', pinyin: 'Wǒmen de xuéxiào hěn dà.', meaning: 'Trường của chúng tôi rất rộng.' } },
  { id: 'shangdian', hanzi: '商店', pinyin: 'shāngdiàn', meaning: 'cửa hàng', deck: 'HSK 1', example: { hanzi: '商店几点关门？', pinyin: 'Shāngdiàn jǐ diǎn guānmén?', meaning: 'Cửa hàng mấy giờ đóng cửa?' } },
  { id: 'shijian', hanzi: '时间', pinyin: 'shíjiān', meaning: 'thời gian', deck: 'HSK 2', example: { hanzi: '你明天有时间吗？', pinyin: 'Nǐ míngtiān yǒu shíjiān ma?', meaning: 'Ngày mai bạn có thời gian không?' } },
  { id: 'zhunbei', hanzi: '准备', pinyin: 'zhǔnbèi', meaning: 'chuẩn bị', deck: 'HSK 2', example: { hanzi: '我在准备考试。', pinyin: 'Wǒ zài zhǔnbèi kǎoshì.', meaning: 'Tôi đang chuẩn bị đi thi.' } },
  { id: 'lvyou', hanzi: '旅游', pinyin: 'lǚyóu', meaning: 'du lịch', deck: 'HSK 2', example: { hanzi: '我想去北京旅游。', pinyin: 'Wǒ xiǎng qù Běijīng lǚyóu.', meaning: 'Tôi muốn đi du lịch Bắc Kinh.' } },
  { id: 'pianyi', hanzi: '便宜', pinyin: 'piányi', meaning: 'rẻ', deck: 'HSK 2', example: { hanzi: '这件衣服很便宜。', pinyin: 'Zhè jiàn yīfu hěn piányi.', meaning: 'Bộ quần áo này rất rẻ.' } },
  { id: 'yijing', hanzi: '已经', pinyin: 'yǐjīng', meaning: 'đã (rồi)', deck: 'HSK 2', example: { hanzi: '我已经吃饭了。', pinyin: 'Wǒ yǐjīng chīfàn le.', meaning: 'Tôi ăn cơm rồi.' } },
  { id: 'xiuxi', hanzi: '休息', pinyin: 'xiūxi', meaning: 'nghỉ ngơi', deck: 'HSK 2', example: { hanzi: '你累了，休息一下吧。', pinyin: 'Nǐ lèi le, xiūxi yíxià ba.', meaning: 'Bạn mệt rồi, nghỉ một chút đi.' } },
  { id: 'yundong', hanzi: '运动', pinyin: 'yùndòng', meaning: 'vận động, thể thao', deck: 'HSK 2', example: { hanzi: '我每天都运动。', pinyin: 'Wǒ měitiān dōu yùndòng.', meaning: 'Ngày nào tôi cũng tập thể thao.' } },
];

export const reviewForecast = [
  { day: 'Hôm nay', count: 12 },
  { day: 'T4', count: 8 },
  { day: 'T5', count: 15 },
  { day: 'T6', count: 6 },
  { day: 'T7', count: 10 },
  { day: 'CN', count: 4 },
  { day: 'T2', count: 9 },
];

export const reviewDecks = [
  { name: 'HSK 1', total: 150, learned: 142, due: 4 },
  { name: 'HSK 2', total: 150, learned: 98, due: 8 },
  { name: 'Bài 09 · Một ngày của tôi', total: 10, learned: 4, due: 0 },
];

/* ---------------------------------------------------------------- Luyện nghe */

export const listeningStats: HomeStat[] = [
  { id: 'tracks', label: 'Bài đã nghe', value: '18', unit: 'bài', hint: '+3 bài trong 7 ngày qua', icon: 'headphones' },
  { id: 'time', label: 'Thời gian nghe tuần này', value: '42', unit: 'phút', hint: 'Mục tiêu: 60 phút / tuần', icon: 'clock' },
  { id: 'accuracy', label: 'Nghe hiểu', value: '78', unit: '%', hint: 'Câu trả lời đúng', icon: 'target' },
  { id: 'streak', label: 'Chuỗi luyện nghe', value: '4', unit: 'ngày', hint: 'Giữ nhịp mỗi ngày', icon: 'flame', highlight: true },
];

const waiter: Speaker = { name: 'Phục vụ', hanzi: '服务员', avatar: '服' };
const passerby: Speaker = { name: 'Người đi đường', hanzi: '路人', avatar: '路' };

export const listeningTracks: ListeningTrack[] = [
  {
    id: 'cafe',
    title: 'Ở quán cà phê',
    hanziTitle: '在咖啡店',
    art: '咖啡',
    situation: 'Gọi đồ uống và trả tiền',
    level: 'HSK 2',
    speakers: [waiter, anna],
    lines: [
      { speaker: 0, hanzi: '你好，你想喝点儿什么？', pinyin: 'Nǐ hǎo, nǐ xiǎng hē diǎnr shénme?', meaning: 'Chào bạn, bạn muốn uống gì?' },
      { speaker: 1, hanzi: '我要一杯咖啡，不要糖。', pinyin: 'Wǒ yào yì bēi kāfēi, bú yào táng.', meaning: 'Cho tôi một cốc cà phê, không đường.' },
      { speaker: 0, hanzi: '要大杯还是小杯？', pinyin: 'Yào dà bēi háishi xiǎo bēi?', meaning: 'Cốc lớn hay cốc nhỏ ạ?' },
      { speaker: 1, hanzi: '大杯。多少钱？', pinyin: 'Dà bēi. Duōshao qián?', meaning: 'Cốc lớn. Bao nhiêu tiền?' },
      { speaker: 0, hanzi: '二十八块。', pinyin: 'Èrshíbā kuài.', meaning: '28 tệ.' },
      { speaker: 1, hanzi: '好的，给你。', pinyin: 'Hǎo de, gěi nǐ.', meaning: 'Vâng, gửi bạn.' },
    ],
    questions: [
      { id: 'c1', prompt: 'Anna gọi đồ uống gì?', options: ['Trà sữa', 'Cà phê không đường', 'Cà phê có đường', 'Nước cam'], answer: 1 },
      { id: 'c2', prompt: 'Anna chọn cốc cỡ nào?', options: ['Cốc nhỏ', 'Cốc lớn'], answer: 1 },
      { id: 'c3', prompt: 'Đồ uống giá bao nhiêu?', options: ['18 tệ', '28 tệ', '82 tệ'], answer: 1 },
    ],
  },
  {
    id: 'directions',
    title: 'Hỏi đường',
    hanziTitle: '问路',
    art: '问路',
    situation: 'Hỏi đường đến ga tàu điện ngầm',
    level: 'HSK 2',
    speakers: [xiaoMing, passerby],
    lines: [
      { speaker: 0, hanzi: '请问，地铁站怎么走？', pinyin: 'Qǐngwèn, dìtiězhàn zěnme zǒu?', meaning: 'Xin hỏi, ga tàu điện ngầm đi thế nào?' },
      { speaker: 1, hanzi: '一直往前走，到路口往右拐。', pinyin: 'Yìzhí wǎng qián zǒu, dào lùkǒu wǎng yòu guǎi.', meaning: 'Cứ đi thẳng, đến ngã tư thì rẽ phải.' },
      { speaker: 0, hanzi: '远吗？', pinyin: 'Yuǎn ma?', meaning: 'Có xa không?' },
      { speaker: 1, hanzi: '不远，走路五分钟就到了。', pinyin: 'Bù yuǎn, zǒulù wǔ fēnzhōng jiù dào le.', meaning: 'Không xa, đi bộ 5 phút là tới.' },
      { speaker: 0, hanzi: '谢谢你！', pinyin: 'Xièxie nǐ!', meaning: 'Cảm ơn bạn!' },
      { speaker: 1, hanzi: '不客气。', pinyin: 'Bú kèqi.', meaning: 'Không có gì.' },
    ],
    questions: [
      { id: 'd1', prompt: 'Tiểu Minh muốn đi đâu?', options: ['Bến xe buýt', 'Ga tàu điện ngầm', 'Nhà ga xe lửa', 'Sân bay'], answer: 1 },
      { id: 'd2', prompt: 'Đến ngã tư thì phải làm gì?', options: ['Rẽ trái', 'Rẽ phải', 'Đi thẳng', 'Quay lại'], answer: 1 },
      { id: 'd3', prompt: 'Đi bộ mất bao lâu?', options: ['5 phút', '10 phút', '15 phút'], answer: 0 },
    ],
  },
  {
    id: 'weekend',
    title: 'Kế hoạch cuối tuần',
    hanziTitle: '周末计划',
    art: '周末',
    situation: 'Rủ bạn cùng đi leo núi',
    level: 'HSK 2',
    speakers: [anna, xiaoMing],
    lines: [
      { speaker: 0, hanzi: '这个周末你有什么打算？', pinyin: 'Zhège zhōumò nǐ yǒu shénme dǎsuàn?', meaning: 'Cuối tuần này bạn có dự định gì?' },
      { speaker: 1, hanzi: '星期六我想去爬山。', pinyin: 'Xīngqīliù wǒ xiǎng qù páshān.', meaning: 'Thứ Bảy mình muốn đi leo núi.' },
      { speaker: 0, hanzi: '星期天呢？', pinyin: 'Xīngqītiān ne?', meaning: 'Còn Chủ nhật?' },
      { speaker: 1, hanzi: '星期天我在家休息，看看电影。', pinyin: 'Xīngqītiān wǒ zài jiā xiūxi, kànkan diànyǐng.', meaning: 'Chủ nhật mình ở nhà nghỉ ngơi, xem phim.' },
      { speaker: 0, hanzi: '我也想去爬山，我们一起去吧！', pinyin: 'Wǒ yě xiǎng qù páshān, wǒmen yìqǐ qù ba!', meaning: 'Mình cũng muốn đi leo núi, chúng ta cùng đi nhé!' },
    ],
    questions: [
      { id: 'w1', prompt: 'Thứ Bảy Tiểu Minh định làm gì?', options: ['Đi leo núi', 'Xem phim', 'Đi bơi'], answer: 0 },
      { id: 'w2', prompt: 'Chủ nhật Tiểu Minh làm gì?', options: ['Đi làm', 'Ở nhà nghỉ ngơi, xem phim', 'Đi du lịch'], answer: 1 },
      { id: 'w3', prompt: 'Anna đề nghị điều gì?', options: ['Cùng đi leo núi', 'Cùng xem phim', 'Cùng đi ăn'], answer: 0 },
    ],
  },
];

export const listeningTips = [
  'Lần đầu hãy nghe khi đang ẩn lời thoại, chỉ cần đoán ý chính.',
  'Nghe lại ở tốc độ Chậm, chú ý con số, giờ giấc và địa điểm.',
  'Mở lời thoại để kiểm tra, rồi bấm từng câu và đọc to theo.',
];

/* ---------------------------------------------------------------- Luyện nói */

export const speakingStats: HomeStat[] = [
  { id: 'sentences', label: 'Câu đã luyện', value: '42', unit: 'câu', hint: '+9 câu trong 7 ngày qua', icon: 'mic' },
  { id: 'score', label: 'Điểm phát âm', value: '86', unit: '/ 100', hint: 'Trung bình 10 lần gần nhất', icon: 'target' },
  { id: 'time', label: 'Thời gian nói tuần này', value: '25', unit: 'phút', hint: 'Mục tiêu: 40 phút / tuần', icon: 'clock' },
  { id: 'streak', label: 'Chuỗi luyện nói', value: '4', unit: 'ngày', hint: 'Giữ nhịp mỗi ngày', icon: 'flame', highlight: true },
];

export const speakingTopic = 'Giới thiệu bản thân & thói quen hằng ngày';

export const speakingSentences: SpeakingSentence[] = [
  {
    id: 's1',
    hanzi: '你好，我叫明英。',
    syllables: 'nǐ hǎo wǒ jiào Míng yīng',
    meaning: 'Xin chào, tôi tên là Minh Anh.',
    tip: '你好: hai thanh 3 đứng liền nhau thì chữ đầu đọc thành thanh 2 — “ní hǎo”.',
    best: 96,
  },
  {
    id: 's2',
    hanzi: '我是越南人。',
    syllables: 'wǒ shì Yuè nán rén',
    meaning: 'Tôi là người Việt Nam.',
    tip: '越南: “Yuè” thanh 4 hạ giọng dứt khoát, rồi “nán” thanh 2 đi lên.',
    best: 91,
  },
  {
    id: 's3',
    hanzi: '我每天早上七点起床。',
    syllables: 'wǒ měi tiān zǎo shang qī diǎn qǐ chuáng',
    meaning: 'Sáng nào tôi cũng dậy lúc 7 giờ.',
    tip: '起床: “q” bật hơi mạnh, môi dẹt; “chuáng” uốn lưỡi rồi lên giọng.',
    best: 78,
  },
  {
    id: 's4',
    hanzi: '我喜欢喝咖啡。',
    syllables: 'wǒ xǐ huan hē kā fēi',
    meaning: 'Tôi thích uống cà phê.',
    tip: '喜欢: chữ 欢 đọc nhẹ và ngắn (thanh nhẹ) — “xǐhuan”.',
  },
  {
    id: 's5',
    hanzi: '周末我常常去爬山。',
    syllables: 'zhōu mò wǒ cháng cháng qù pá shān',
    meaning: 'Cuối tuần tôi thường đi leo núi.',
    tip: '常常: “ch” uốn lưỡi, hai thanh 2 cùng đi lên đều nhau.',
  },
  {
    id: 's6',
    hanzi: '我在学习汉语。',
    syllables: 'wǒ zài xué xí Hàn yǔ',
    meaning: 'Tôi đang học tiếng Trung.',
    tip: '汉语: “Hàn” thanh 4 rơi mạnh, “yǔ” thanh 3 hạ thấp giọng.',
  },
];

export const tones: ToneItem[] = [
  { tone: 1, mark: 'mā', hanzi: '妈', meaning: 'mẹ', hint: 'Cao, đều', contour: 'M4 8 H36' },
  { tone: 2, mark: 'má', hanzi: '麻', meaning: 'tê; cây gai', hint: 'Đi lên', contour: 'M4 22 L36 6' },
  { tone: 3, mark: 'mǎ', hanzi: '马', meaning: 'ngựa', hint: 'Xuống rồi lên', contour: 'M4 12 Q15 27 22 23 Q29 19 36 8' },
  { tone: 4, mark: 'mà', hanzi: '骂', meaning: 'mắng', hint: 'Rơi mạnh', contour: 'M4 6 L36 24' },
];
