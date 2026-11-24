import { getHomeData } from '../../lib/homeRepo';
import CourseCard from './CourseCard';
import RecentLessonCard from './RecentLessonCard';
import StatsCard from './StatsCard';
import StreakCard from './StreakCard';
import StudyTimeCard from './StudyTimeCard';

/** Nội dung trang chủ — khung sidebar/header nằm ở app/(learn)/layout.tsx. */
export default async function HomeDashboard() {
  const { learner, todayLabel, stats, studyWeek, dailyGoalMinutes, recentLesson, currentCourse, fromDatabase } =
    await getHomeData();

  return (
    <>
      <section className="lx-greeting">
        <div>
          <h1>Chào {learner.name}, cùng học tiếp nhé!</h1>
          <p>Từng chút mỗi ngày, bạn đang tiến gần hơn đến mục tiêu của mình.</p>
        </div>
        <span className="lx-date">{todayLabel}</span>
      </section>

      <section className="lx-stats" aria-label="Thống kê học tập">
        {stats.map((stat) => (
          <StatsCard key={stat.id} stat={stat} />
        ))}
      </section>

      <section className="lx-row lx-row-chart">
        <StudyTimeCard days={studyWeek} />
        <StreakCard days={studyWeek} goalMinutes={dailyGoalMinutes} />
      </section>

      <section className="lx-row lx-row-lesson">
        <RecentLessonCard lesson={recentLesson} />
        <CourseCard course={currentCourse} />
      </section>

      <p className="lx-footnote">
        {fromDatabase ? 'Số liệu lấy từ database.' : 'Số liệu minh hoạ cho giao diện học tập.'}
      </p>
    </>
  );
}
