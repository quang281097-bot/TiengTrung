import {
  currentCourse as fallbackCourse,
  dailyGoalMinutes as fallbackGoal,
  homeStats as fallbackStats,
  learner as fallbackLearner,
  recentLesson as fallbackLesson,
  studyWeek as fallbackWeek,
  todayLabel as fallbackToday,
  type HomeStat,
  type StudyDay,
} from '../data/homeData';
import { DEMO_USER_ID, getPool } from './db';

export type HomeData = {
  learner: { name: string; role: string };
  todayLabel: string;
  stats: HomeStat[];
  studyWeek: StudyDay[];
  dailyGoalMinutes: number;
  recentLesson: typeof fallbackLesson;
  currentCourse: typeof fallbackCourse;
  fromDatabase: boolean;
};

const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const DOW_LONG = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const pad = (n: number) => String(n).padStart(2, '0');

function fallback(): HomeData {
  return {
    learner: fallbackLearner,
    todayLabel: fallbackToday,
    stats: fallbackStats,
    studyWeek: fallbackWeek,
    dailyGoalMinutes: fallbackGoal,
    recentLesson: fallbackLesson,
    currentCourse: fallbackCourse,
    fromDatabase: false,
  };
}

/** Đọc dữ liệu trang chủ từ PostgreSQL; lỗi hoặc chưa cấu hình thì dùng dữ liệu tĩnh. */
export async function getHomeData(userId: string = DEMO_USER_ID): Promise<HomeData> {
  const pool = getPool();
  if (!pool) return fallback();

  try {
    const [header, stats, week, lesson, course] = await Promise.all([
      pool.query(
        `SELECT u.display_name,
                CASE WHEN u.last_study_date >= local_today(u.id) - 1 THEN u.current_streak ELSE 0 END AS streak,
                local_today(u.id)::text AS today
         FROM nguoi_dung u WHERE u.id = $1`,
        [userId],
      ),
      pool.query(
        `SELECT
           (SELECT count(*) FROM tien_do_bai_hoc WHERE user_id = $1 AND completed_at IS NOT NULL)::int AS lessons_done,
           (SELECT count(*) FROM tien_do_bai_hoc WHERE user_id = $1 AND completed_at >= now() - interval '7 days')::int AS lessons_7d,
           (SELECT coalesce(sum(seconds), 0) / 60 FROM hoat_dong_hang_ngay WHERE user_id = $1 AND day = local_today($1))::int AS today_minutes,
           (SELECT daily_goal_minutes FROM cai_dat_nguoi_dung WHERE user_id = $1) AS goal_minutes,
           (SELECT round(coalesce(sum(seconds), 0) / 3600.0, 1) FROM hoat_dong_hang_ngay WHERE user_id = $1)::float AS total_hours`,
        [userId],
      ),
      pool.query(
        `SELECT d::date::text AS day, (coalesce(sum(a.seconds), 0) / 60)::int AS minutes, d::date = local_today($1) AS is_today
         FROM generate_series(local_today($1) - 6, local_today($1), interval '1 day') AS d
         LEFT JOIN hoat_dong_hang_ngay a ON a.user_id = $1 AND a.day = d::date
         GROUP BY d ORDER BY d`,
        [userId],
      ),
      pool.query(
        `SELECT c.title AS course, t.name_vi AS topic, l.number, l.title, l.description, l.cover_hanzi, l.cover_caption,
                cardinality(p.completed_steps) AS parts_done, jsonb_array_length(l.steps) AS parts_total
         FROM tien_do_bai_hoc p
         JOIN bai_hoc l ON l.id = p.lesson_id
         JOIN khoa_hoc c ON c.id = l.course_id
         LEFT JOIN chu_de t ON t.id = l.topic_id
         WHERE p.user_id = $1 AND p.completed_at IS NULL
         ORDER BY p.last_activity_at DESC LIMIT 1`,
        [userId],
      ),
      pool.query(
        `SELECT c.title, count(l.id)::int AS lessons_total, count(p.completed_at)::int AS lessons_done
         FROM khoa_hoc_nguoi_dung uc
         JOIN khoa_hoc c ON c.id = uc.course_id
         JOIN bai_hoc l ON l.course_id = c.id AND l.is_published
         LEFT JOIN tien_do_bai_hoc p ON p.lesson_id = l.id AND p.user_id = uc.user_id
         WHERE uc.user_id = $1 AND uc.status = 'current'
         GROUP BY c.id`,
        [userId],
      ),
    ]);

    const h = header.rows[0];
    if (!h) return fallback();
    const s = stats.rows[0];
    const goal: number = s.goal_minutes ?? fallbackGoal;

    const [y, m, d] = (h.today as string).split('-').map(Number);
    const todayDate = new Date(Date.UTC(y, m - 1, d));

    const result: HomeData = {
      ...fallback(),
      fromDatabase: true,
      learner: { name: h.display_name, role: fallbackLearner.role },
      todayLabel: `${DOW_LONG[todayDate.getUTCDay()]}, ${pad(d)}/${pad(m)}/${y}`,
      dailyGoalMinutes: goal,
      stats: [
        { ...fallbackStats[0], value: String(s.lessons_done), hint: `+${s.lessons_7d} bài trong 7 ngày qua` },
        { ...fallbackStats[1], value: String(h.streak) },
        { ...fallbackStats[2], value: String(s.today_minutes), hint: `Mục tiêu: ${goal} phút / ngày` },
        { ...fallbackStats[3], value: String(s.total_hours).replace('.', ',') },
      ],
      studyWeek: week.rows.map((r) => {
        const [ry, rm, rd] = (r.day as string).split('-').map(Number);
        const dow = new Date(Date.UTC(ry, rm - 1, rd)).getUTCDay();
        return { day: DOW[dow], date: `${pad(rd)}/${pad(rm)}`, minutes: r.minutes, today: r.is_today || undefined };
      }),
    };

    const l = lesson.rows[0];
    if (l) {
      result.recentLesson = {
        ...fallbackLesson,
        thumbTag: `${l.course} · Bài ${pad(l.number)}`,
        thumbHanzi: l.cover_hanzi ?? fallbackLesson.thumbHanzi,
        thumbCaption: l.cover_caption ?? '',
        course: l.course,
        topic: l.topic ?? '',
        title: `Bài ${pad(l.number)}: ${l.title}`,
        description: l.description ?? '',
        partsDone: l.parts_done,
        partsTotal: l.parts_total,
      };
    }

    const c = course.rows[0];
    if (c) {
      result.currentCourse = { ...fallbackCourse, title: c.title, lessonsDone: c.lessons_done, lessonsTotal: c.lessons_total };
    }

    return result;
  } catch (error) {
    console.error('[homeRepo] Lỗi đọc database, dùng dữ liệu tĩnh:', error);
    return fallback();
  }
}
