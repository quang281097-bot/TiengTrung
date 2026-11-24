import {
  currentCourse,
  dailyGoalMinutes,
  homeStats,
  learner,
  recentLesson,
  studyWeek,
  todayLabel,
} from '../../data/homeData';
import CourseCard from './CourseCard';
import RecentLessonCard from './RecentLessonCard';
import StatsCard from './StatsCard';
import StreakCard from './StreakCard';
import StudyTimeCard from './StudyTimeCard';

/** Nội dung trang chủ — khung sidebar/header nằm ở app/(learn)/layout.tsx. */
export default function HomeDashboard() {
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
        {homeStats.map((stat) => (
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

      <p className="lx-footnote">Số liệu minh hoạ cho giao diện học tập.</p>
    </>
  );
}
