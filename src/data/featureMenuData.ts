export type StatItem = {
  label: string;
  value: string;
  hint: string;
};

export type FeatureCard = {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  tag?: string;
  cta: string;
  tone?: 'primary' | 'neutral' | 'success';
};

export type FeatureSection = {
  title: string;
  cards: FeatureCard[];
};

export type FeaturePageConfig = {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  stats: StatItem[];
  sections: FeatureSection[];
};

export const lessonPageData: FeaturePageConfig = {
  eyebrow: 'Bài học',
  title: 'Lộ trình học tiếng Trung theo từng chủ đề',
  description: 'Học từ câu cơ bản đến hội thoại thực tế với bố cục rõ ràng và lộ trình dễ đi tiếp.',
  primaryAction: { label: 'Tiếp tục học', href: '/dashboard' },
  secondaryAction: { label: 'Xem tất cả', href: '/lessons' },
  stats: [
    { label: 'Bài đang học', value: '12', hint: 'trong tuần' },
    { label: 'Từ mới', value: '248', hint: 'đã lưu' },
    { label: 'Mức độ', value: 'HSK 2', hint: 'đang tiến bộ' },
  ],
  sections: [
    {
      title: 'Bộ bài học nổi bật',
      cards: [
        { id: 'lesson-1', title: 'Bài 01 · Chào hỏi', subtitle: '你好', meta: 'Nǐ hǎo · Xin chào', cta: 'Học ngay', tone: 'primary' },
        { id: 'lesson-2', title: 'Bài 02 · Gia đình', subtitle: '家人', meta: 'Jiārén · Gia đình', cta: 'Vào bài', tone: 'neutral' },
        { id: 'lesson-3', title: 'Bài 03 · Món ăn', subtitle: '食物', meta: 'Shíwù · Thực phẩm', cta: 'Ôn tập', tone: 'success' },
      ],
    },
    {
      title: 'Lịch học gợi ý',
      cards: [
        { id: 'schedule-1', title: 'Ngày 1', subtitle: 'Từ vựng nền', meta: '20 từ · 15 phút', cta: 'Bắt đầu', tone: 'neutral' },
        { id: 'schedule-2', title: 'Ngày 2', subtitle: 'Luyện nghe', meta: '10 phút nghe', cta: 'Luyện nghe', tone: 'primary' },
        { id: 'schedule-3', title: 'Ngày 3', subtitle: 'Luyện nói', meta: '5 câu mẫu', cta: 'Luyện nói', tone: 'success' },
      ],
    },
  ],
};

export const vocabPageData: FeaturePageConfig = {
  eyebrow: 'Từ vựng',
  title: 'Từ vựng theo chủ đề, dễ nhớ và dễ lặp lại',
  description: 'Ôn tập theo từng nhóm từ, kèm pinyin và nghĩa tiếng Việt để bạn nhớ sâu hơn.',
  primaryAction: { label: 'Ôn tập ngay', href: '/vocabulary' },
  secondaryAction: { label: 'Thêm bộ từ', href: '/lessons' },
  stats: [
    { label: 'Từ đã học', value: '420', hint: 'của bạn' },
    { label: 'Mực nhắc lại', value: '86%', hint: 'hiệu quả' },
    { label: 'Bộ từ mới', value: '5', hint: 'chủ đề' },
  ],
  sections: [
    {
      title: 'Chủ đề nổi bật',
      cards: [
        { id: 'vocab-1', title: 'Gia đình', subtitle: '爸爸 · Mẹ', meta: 'bàba · māmā', cta: 'Xem từ', tone: 'primary' },
        { id: 'vocab-2', title: 'Món ăn', subtitle: '米饭 · Bún', meta: 'mǐfàn · miến', cta: 'Học từ', tone: 'neutral' },
        { id: 'vocab-3', title: 'Du lịch', subtitle: '车站 · khách sạn', meta: 'chēzhàn · jiàn', cta: 'Ôn lại', tone: 'success' },
      ],
    },
    {
      title: 'Từ mới hôm nay',
      cards: [
        { id: 'today-1', title: '喜欢', subtitle: 'xǐhuan', meta: 'Thích', cta: 'Thêm', tone: 'neutral' },
        { id: 'today-2', title: '朋友', subtitle: 'péngyou', meta: 'Bạn bè', cta: 'Thêm', tone: 'neutral' },
        { id: 'today-3', title: '咖啡', subtitle: 'kāfēi', meta: 'Cà phê', cta: 'Thêm', tone: 'neutral' },
      ],
    },
  ],
};

export const listeningPageData: FeaturePageConfig = {
  eyebrow: 'Luyện nghe',
  title: 'Nghe tiếng Trung với ví dụ ngắn và thực tế',
  description: 'Bài nghe theo nhịp từ cơ bản đến hội thoại hàng ngày, giúp bạn tăng phản xạ.',
  primaryAction: { label: 'Nghe ngay', href: '/listening' },
  secondaryAction: { label: 'Lịch học', href: '/dashboard' },
  stats: [
    { label: 'Bài nghe', value: '18', hint: 'trong ngày' },
    { label: 'Thời lượng', value: '32m', hint: 'học thêm' },
    { label: 'Độ hiểu', value: '74%', hint: 'tăng dần' },
  ],
  sections: [
    {
      title: 'Phiên bản có sẵn',
      cards: [
        { id: 'listen-1', title: 'Mở đầu', subtitle: '3 phút', meta: 'Chào hỏi', cta: 'Play', tone: 'primary' },
        { id: 'listen-2', title: 'Khuyến mãi', subtitle: '4 phút', meta: 'Mua sắm', cta: 'Play', tone: 'neutral' },
        { id: 'listen-3', title: 'Đi làm', subtitle: '5 phút', meta: 'Hội thoại hàng ngày', cta: 'Play', tone: 'success' },
      ],
    },
    {
      title: 'Bài tập nghe',
      cards: [
        { id: 'audio-1', title: 'Nghe và điền từ', subtitle: '13 câu', meta: 'Phần nghe nhanh', cta: 'Bắt đầu', tone: 'neutral' },
        { id: 'audio-2', title: 'Lắng nghe chính tả', subtitle: '8 từ', meta: 'Cố định âm', cta: 'Làm bài', tone: 'neutral' },
      ],
    },
  ],
};

export const speakingPageData: FeaturePageConfig = {
  eyebrow: 'Luyện nói',
  title: 'Lặp lại câu mẫu để nói trôi chảy hơn',
  description: 'Bài luyện nói theo tình huống thực tế với gợi ý câu mẫu tiếng Việt và phát âm rõ ràng.',
  primaryAction: { label: 'Luyện ngay', href: '/speaking' },
  secondaryAction: { label: 'Xem hội thoại', href: '/dialogues' },
  stats: [
    { label: 'Câu mẫu', value: '42', hint: 'theo chủ đề' },
    { label: 'Phát âm', value: '92%', hint: 'rõ ràng' },
    { label: 'Thành tích', value: '8/10', hint: 'mỗi buổi' },
  ],
  sections: [
    {
      title: 'Tình huống luyện nói',
      cards: [
        { id: 'speak-1', title: 'Giới thiệu bản thân', subtitle: '你好，我叫 Quang', meta: 'Câu mở đầu', cta: 'Lặp lại', tone: 'primary' },
        { id: 'speak-2', title: 'Đặt hàng', subtitle: '我要一碗面', meta: 'Câu mua đồ', cta: 'Luyện', tone: 'neutral' },
        { id: 'speak-3', title: 'Mời bạn đi chơi', subtitle: '我们去看电影吗？', meta: 'Hội thoại cộng đồng', cta: 'Luyện', tone: 'success' },
      ],
    },
  ],
};

export const writingPageData: FeaturePageConfig = {
  eyebrow: 'Viết chữ',
  title: 'Rèn nét chữ và ghi nhớ cấu trúc từ',
  description: 'Tập viết từng nét, hiểu từ khóa và nhớ đúng hình dạng ký tự.',
  primaryAction: { label: 'Viết chữ', href: '/writing' },
  secondaryAction: { label: 'Xem từ mới', href: '/vocabulary' },
  stats: [
    { label: 'Ký tự', value: '96', hint: 'đã viết' },
    { label: 'Nét chính xác', value: '81%', hint: 'độ chính xác' },
    { label: 'Phân tích', value: '12', hint: 'bộ chữ' },
  ],
  sections: [
    {
      title: 'Bài tập viết chữ',
      cards: [
        { id: 'write-1', title: '你', subtitle: 'Nǐ', meta: 'Bạn', cta: 'Viết', tone: 'primary' },
        { id: 'write-2', title: '好', subtitle: 'hǎo', meta: 'Tốt', cta: 'Viết', tone: 'neutral' },
        { id: 'write-3', title: '吃', subtitle: 'chī', meta: 'Ăn', cta: 'Viết', tone: 'success' },
      ],
    },
  ],
};

export const dialoguesPageData: FeaturePageConfig = {
  eyebrow: 'Hội thoại',
  title: 'Cặp thoại ngắn, thực tế và dễ áp dụng',
  description: 'Học cách sử dụng tiếng Trung trong các tình huống thường gặp như đi chợ, ăn uống, hỏi đường.',
  primaryAction: { label: 'Bắt đầu hội thoại', href: '/dialogues' },
  secondaryAction: { label: 'Luyện nghe', href: '/listening' },
  stats: [
    { label: 'Hội thoại', value: '24', hint: 'trong thư viện' },
    { label: 'Khả năng ứng dụng', value: '88%', hint: 'thực tế' },
    { label: 'Mức độ', value: 'A2', hint: 'đã đạt' },
  ],
  sections: [
    {
      title: 'Tình huống phổ biến',
      cards: [
        { id: 'dialogue-1', title: 'Chào hỏi', subtitle: '你好，我叫 Quang.', meta: '2 phút', cta: 'Xem', tone: 'primary' },
        { id: 'dialogue-2', title: 'Đặt món', subtitle: '你喜欢吃什么？', meta: '3 phút', cta: 'Xem', tone: 'neutral' },
        { id: 'dialogue-3', title: 'Hỏi đường', subtitle: '请问地铁站怎么走？', meta: '4 phút', cta: 'Xem', tone: 'success' },
      ],
    },
  ],
};

export const hskPageData: FeaturePageConfig = {
  eyebrow: 'HSK',
  title: 'Lộ trình HSK rõ ràng từ cơ bản đến nâng cao',
  description: 'Theo dõi chuẩn HSK, các mốc học và mức độ hoàn thiện cá nhân.',
  primaryAction: { label: 'Xem lộ trình', href: '/hsk' },
  secondaryAction: { label: 'Dashboard', href: '/dashboard' },
  stats: [
    { label: 'Mức hiện tại', value: 'HSK 2', hint: 'đang học' },
    { label: 'Từ vựng', value: '600+', hint: 'đã ghi nhớ' },
    { label: 'Đạt mục tiêu', value: '75%', hint: 'tiến độ' },
  ],
  sections: [
    {
      title: 'Đường cong HSK',
      cards: [
        { id: 'hsk-1', title: 'HSK 1', subtitle: 'Hoàn thành', meta: 'Đã xong', cta: 'Xem lại', tone: 'success' },
        { id: 'hsk-2', title: 'HSK 2', subtitle: 'Đang học', meta: 'Bạn đang ở đây', cta: 'Tiếp tục', tone: 'primary' },
        { id: 'hsk-3', title: 'HSK 3', subtitle: 'Khóa tiếp theo', meta: 'Mở khóa sau 2 tuần', cta: 'Khóa', tone: 'neutral' },
      ],
    },
  ],
};

export const achievementsPageData: FeaturePageConfig = {
  eyebrow: 'Thành tích',
  title: 'Những mốc học tập và thành tựu của bạn',
  description: 'Theo dõi streak, điểm XP và các huy chương đạt được trong suốt quá trình học.',
  primaryAction: { label: 'Xem thành tích', href: '/achievements' },
  secondaryAction: { label: 'Tiếp tục học', href: '/dashboard' },
  stats: [
    { label: 'Streak', value: '12 ngày', hint: 'liên tiếp' },
    { label: 'XP', value: '1,280', hint: 'tổng điểm' },
    { label: 'Huy chương', value: '9', hint: 'đã đạt' },
  ],
  sections: [
    {
      title: 'Đạt được gần đây',
      cards: [
        { id: 'award-1', title: 'Huy chương 7 ngày', subtitle: 'hoàn thành', meta: 'Streak', cta: 'Xem', tone: 'primary' },
        { id: 'award-2', title: 'Người học chăm chỉ', subtitle: '35 bài học', meta: 'Thành tích tháng', cta: 'Xem', tone: 'neutral' },
        { id: 'award-3', title: 'Nói tốt hơn', subtitle: '7 lần luyện', meta: 'Speaking', cta: 'Xem', tone: 'success' },
      ],
    },
  ],
};

export const practicePageData: FeaturePageConfig = {
  eyebrow: 'Luyện tập',
  title: 'Các buổi luyện tập nhanh theo nhịp 15–20 phút',
  description: 'Tạo thói quen học đều đặn với các hoạt động ngắn, hiệu quả và dễ làm trong ngày.',
  primaryAction: { label: 'Bắt đầu buổi học', href: '/practice' },
  secondaryAction: { label: 'Dashboard', href: '/dashboard' },
  stats: [
    { label: 'Buổi hôm nay', value: '2', hint: 'đã lên lịch' },
    { label: 'Tổng XP', value: '+80', hint: 'sắp nhận' },
    { label: 'Thời gian', value: '18m', hint: 'mỗi buổi' },
  ],
  sections: [
    {
      title: 'Chế độ luyện tập',
      cards: [
        { id: 'practice-1', title: 'Luyện 15 phút', subtitle: 'Từ vựng + nghe', meta: 'Thực tế', cta: 'Bắt đầu', tone: 'primary' },
        { id: 'practice-2', title: 'Luyện 20 phút', subtitle: 'Nói + nhận diện', meta: 'Phương pháp', cta: 'Bắt đầu', tone: 'neutral' },
      ],
    },
  ],
};

export const profilePageData: FeaturePageConfig = {
  eyebrow: 'Tài khoản',
  title: 'Quang · Người học tiếng Trung đang tiến bộ',
  description: 'Cập nhật mục tiêu, tiến độ và các chỉ số học tập cá nhân trong một nơi duy nhất.',
  primaryAction: { label: 'Chỉnh sửa hồ sơ', href: '/profile' },
  secondaryAction: { label: 'Dashboard', href: '/dashboard' },
  stats: [
    { label: 'Streak', value: '12 ngày', hint: 'liên tiếp' },
    { label: 'XP', value: '1,280', hint: 'của bạn' },
    { label: 'Mức', value: 'Level 8', hint: 'đạt được' },
  ],
  sections: [
    {
      title: 'Hồ sơ học tập',
      cards: [
        { id: 'profile-1', title: 'Mục tiêu tháng', subtitle: 'HSK 2', meta: 'Đang theo dõi', cta: 'Cập nhật', tone: 'primary' },
        { id: 'profile-2', title: 'Bộ từ yêu thích', subtitle: 'Gia đình · Món ăn', meta: '7 chủ đề', cta: 'Mở', tone: 'neutral' },
        { id: 'profile-3', title: 'Chế độ học', subtitle: '15 phút/ngày', meta: 'Dễ duy trì', cta: 'Thiết lập', tone: 'success' },
      ],
    },
  ],
};
