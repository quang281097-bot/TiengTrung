export type SidebarItem = {
  id: string;
  label: string;
  icon: string;
  href: string;
  active?: boolean;
};

export type StatCard = {
  id: string;
  label: string;
  value: string;
  detail: string;
  icon: string;
  accent: 'red' | 'gold' | 'blue' | 'green';
};

export type LearningGoal = {
  id: string;
  label: string;
  xp: number;
  done: boolean;
};

export type PathLevel = {
  level: string;
  status: 'Completed' | 'Current' | 'Locked';
};

export type QuickCard = {
  id: string;
  title: string;
  description: string;
  icon: string;
  cta: string;
  href: string;
};

export type DailyChinese = {
  title: string;
  sentence: string;
  pinyin: string;
  meaning: string;
  audioLabel: string;
  detailLabel: string;
};

export type FooterLink = {
  label: string;
  href: string;
};

export const sidebarItems: SidebarItem[] = [
  { id: 'home', label: 'Trang chủ', icon: '🏠', href: '/', active: true },
  { id: 'lessons', label: 'Bài học', icon: '📚', href: '/lessons' },
  { id: 'vocabulary', label: 'Từ vựng', icon: '🧠', href: '/vocabulary' },
  { id: 'listening', label: 'Luyện nghe', icon: '🎧', href: '/listening' },
  { id: 'speaking', label: 'Luyện nói', icon: '🎤', href: '/speaking' },
  { id: 'writing', label: 'Viết chữ', icon: '✍️', href: '/writing' },
  { id: 'dialogues', label: 'Hội thoại', icon: '💬', href: '/dialogues' },
  { id: 'hsk', label: 'HSK', icon: '🎯', href: '/hsk' },
  { id: 'achievements', label: 'Thành tích', icon: '🏆', href: '/achievements' },
];

export const mobileNavItems: SidebarItem[] = [
  { id: 'home', label: 'Trang chủ', icon: '🏠', href: '/', active: true },
  { id: 'lessons', label: 'Bài học', icon: '📚', href: '/lessons' },
  { id: 'vocabulary', label: 'Từ vựng', icon: '🧠', href: '/vocabulary' },
  { id: 'practice', label: 'Luyện tập', icon: '🎯', href: '/practice' },
  { id: 'account', label: 'Tài khoản', icon: '👤', href: '/profile' },
];

export const statCards: StatCard[] = [
  { id: 'streak', label: 'Streak', value: '12 ngày', detail: 'liên tiếp', icon: '🔥', accent: 'red' },
  { id: 'xp', label: 'XP', value: '1,280', detail: 'điểm', icon: '⭐', accent: 'gold' },
  { id: 'progress', label: 'Tiến độ', value: '75%', detail: 'học tập', icon: '🎯', accent: 'blue' },
  { id: 'level', label: 'Level', value: 'Level 8', detail: 'đạt được', icon: '🏆', accent: 'green' },
];

export const continueLesson = {
  title: 'HSK 2 · Bài 12',
  chinese: '你喜欢吃什么？',
  pinyin: 'Nǐ xǐhuan chī shénme?',
  meaning: 'Bạn thích ăn gì?',
  progress: 75,
};

export const dailyGoals: LearningGoal[] = [
  { id: 'vocab', label: 'Học 20 từ', xp: 50, done: true },
  { id: 'listening', label: 'Nghe 10 phút', xp: 30, done: false },
  { id: 'speaking', label: 'Luyện nói', xp: 50, done: false },
  { id: 'writing', label: 'Viết 10 chữ', xp: 30, done: false },
];

export const learningPath: PathLevel[] = [
  { level: 'HSK 1', status: 'Completed' },
  { level: 'HSK 2', status: 'Current' },
  { level: 'HSK 3', status: 'Locked' },
  { level: 'HSK 4', status: 'Locked' },
  { level: 'HSK 5', status: 'Locked' },
  { level: 'HSK 6', status: 'Locked' },
];

export const quickLearningCards: QuickCard[] = [
  { id: 'vocab', title: 'Từ vựng', description: 'Ôn lại 20 từ bạn đã học', icon: '🧠', cta: 'Ôn tập', href: '/vocabulary' },
  { id: 'listening', title: 'Luyện nghe', description: 'Nghe 5 đoạn hội thoại ngắn', icon: '🎧', cta: 'Nghe ngay', href: '/listening' },
  { id: 'speaking', title: 'Luyện nói', description: 'Lặp lại câu mẫu rõ ràng', icon: '🎤', cta: 'Luyện tập', href: '/speaking' },
  { id: 'writing', title: 'Viết chữ', description: 'Rèn nét chữ và nhớ từ', icon: '✍️', cta: 'Viết chữ', href: '/writing' },
];

export const dailyChinese: DailyChinese = {
  title: 'Câu tiếng Trung hôm nay',
  sentence: '你好，我叫 Quang。',
  pinyin: 'Nǐ hǎo, wǒ jiào Quang.',
  meaning: 'Xin chào, tôi tên là Quang.',
  audioLabel: 'Nghe phát âm',
  detailLabel: 'Xem giải thích',
};

export const footerLinks: FooterLink[] = [
  { label: 'Về chúng tôi', href: '/about' },
  { label: 'Điều khoản', href: '/terms' },
  { label: 'Chính sách bảo mật', href: '/privacy' },
  { label: 'Liên hệ', href: '/contact' },
];

export const userProfile = {
  name: 'Quang',
  streak: 12,
  xp: 1280,
  level: 8,
};
