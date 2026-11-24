import type { IconName } from '../components/ui/Icon';

export type NavLink = {
  id: string;
  label: string;
  href: string;
  icon: IconName;
};

export type CourseLevel = {
  id: string;
  label: string;
  href: string;
  current?: boolean;
};

export type HomeStat = {
  id: string;
  label: string;
  value: string;
  unit: string;
  hint: string;
  icon: IconName;
  highlight?: boolean;
};

export type StudyDay = {
  day: string;
  date: string;
  minutes: number;
  today?: boolean;
};

export const learner = {
  name: 'Minh Anh',
  role: 'Học viên · HSK 2',
};

export const todayLabel = 'Thứ Hai, 23/11/2026';

export const primaryNav: NavLink[] = [
  { id: 'account', label: 'Tài khoản', href: '/profile', icon: 'user' },
  { id: 'home', label: 'Trang chủ', href: '/', icon: 'home' },
  { id: 'learn', label: 'Học ngay', href: '/learn', icon: 'play' },
];

export const courseLevels: CourseLevel[] = [
  { id: 'hsk1', label: 'HSK 1', href: '/lessons?level=1' },
  { id: 'hsk2', label: 'HSK 2', href: '/lessons?level=2', current: true },
  { id: 'hsk3', label: 'HSK 3', href: '/lessons?level=3' },
  { id: 'hsk4', label: 'HSK 4', href: '/lessons?level=4' },
  { id: 'hsk5', label: 'HSK 5', href: '/lessons?level=5' },
  { id: 'hsk6', label: 'HSK 6', href: '/lessons?level=6' },
];

/** Tên trang hiển thị trên breadcrumb của thanh trên cùng. */
export const pageTitles: Record<string, string> = {
  '/': 'Trang chủ',
  '/dashboard': 'Trang chủ',
  '/profile': 'Tài khoản',
  '/learn': 'Học ngay',
  '/lessons': 'Khoá học',
  '/practice': 'Luyện đọc',
  '/practice/manage': 'Quản lý bài đọc',
  '/writing': 'Luyện viết',
  '/hsk': 'Thi HSK',
  '/vocabulary': 'Từ điển',
  '/listening': 'Luyện nghe',
  '/speaking': 'Luyện nói',
  '/dialogues': 'Hội thoại',
  '/review': 'Ôn tập',
  '/achievements': 'Thành tích',
  '/settings': 'Cài đặt',
};

export const examNav: NavLink[] = [{ id: 'exam', label: 'Thi HSK', href: '/hsk', icon: 'exam' }];

export const skillNav: NavLink[] = [
  { id: 'review', label: 'Ôn tập', href: '/review', icon: 'layers' },
  { id: 'dictionary', label: 'Từ điển', href: '/vocabulary', icon: 'book' },
  { id: 'listening', label: 'Luyện nghe', href: '/listening', icon: 'headphones' },
  { id: 'speaking', label: 'Luyện nói', href: '/speaking', icon: 'mic' },
  { id: 'reading', label: 'Luyện đọc', href: '/practice', icon: 'read' },
  { id: 'writing', label: 'Luyện viết', href: '/writing', icon: 'pen' },
];

export const mobileNav: NavLink[] = [
  { id: 'home', label: 'Trang chủ', href: '/', icon: 'home' },
  { id: 'learn', label: 'Học ngay', href: '/learn', icon: 'play' },
  { id: 'review', label: 'Ôn tập', href: '/review', icon: 'layers' },
  { id: 'dictionary', label: 'Từ điển', href: '/vocabulary', icon: 'book' },
  { id: 'listening', label: 'Nghe', href: '/listening', icon: 'headphones' },
  { id: 'speaking', label: 'Nói', href: '/speaking', icon: 'mic' },
];

export const homeStats: HomeStat[] = [
  { id: 'lessons', label: 'Số bài đã học', value: '24', unit: 'bài', hint: '+3 bài trong 7 ngày qua', icon: 'book' },
  { id: 'streak', label: 'Streak hiện tại', value: '7', unit: 'ngày', hint: 'Giữ nhịp học mỗi ngày', icon: 'flame', highlight: true },
  { id: 'today', label: 'Thời gian học hôm nay', value: '25', unit: 'phút', hint: 'Mục tiêu: 30 phút / ngày', icon: 'clock' },
  { id: 'total', label: 'Tổng thời gian học', value: '12,5', unit: 'giờ', hint: 'Từ ngày bạn bắt đầu', icon: 'chart' },
];

export const studyWeek: StudyDay[] = [
  { day: 'T3', date: '17/11', minutes: 20 },
  { day: 'T4', date: '18/11', minutes: 35 },
  { day: 'T5', date: '19/11', minutes: 15 },
  { day: 'T6', date: '20/11', minutes: 40 },
  { day: 'T7', date: '21/11', minutes: 30 },
  { day: 'CN', date: '22/11', minutes: 45 },
  { day: 'T2', date: '23/11', minutes: 25, today: true },
];

export const dailyGoalMinutes = 30;

export const recentLesson = {
  time: 'Hôm nay, 09:15',
  thumbTag: 'HSK 2 · Bài 09',
  thumbHanzi: '日常',
  thumbCaption: 'Cuộc sống hằng ngày',
  course: 'HSK 2',
  topic: 'Giao tiếp đời sống',
  title: 'Bài 09: Một ngày của tôi',
  description: 'Nói về lịch trình và những thói quen mỗi ngày.',
  partsDone: 2,
  partsTotal: 5,
  remaining: 'Khoảng 10 phút còn lại',
  href: '/learn',
};

export const currentCourse = {
  title: 'HSK 2 · Sơ cấp',
  lessonsDone: 8,
  lessonsTotal: 24,
  previous: 'HSK 1 đã hoàn thành · 16 bài',
  roadmapLabel: 'Xem lộ trình HSK 2',
  href: '/hsk',
};
