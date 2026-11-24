import Link from 'next/link';

import { currentCourse } from '../../data/homeData';
import Icon from '../ui/Icon';

export default function CourseCard({ course }: { course: typeof currentCourse }) {
  const percent = Math.round((course.lessonsDone / course.lessonsTotal) * 100);

  return (
    <article className="lx-card lx-course">
      <h2 className="lx-card-title">Khoá học của bạn</h2>
      <p className="lx-course-name">{course.title}</p>

      <div className="lx-progress-row">
        <span>
          {course.lessonsDone} / {course.lessonsTotal} bài đã hoàn thành
        </span>
        <strong>{percent}%</strong>
      </div>
      <div
        className="lx-progress lx-progress-deep"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Tiến độ khoá học"
      >
        <span style={{ width: `${percent}%` }} />
      </div>

      <p className="lx-course-prev">
        <Icon name="check" size={14} strokeWidth={2.2} />
        {course.previous}
      </p>

      <Link href={course.href} className="lx-course-link">
        <span>{course.roadmapLabel}</span>
        <Icon name="arrow-right" size={16} />
      </Link>
    </article>
  );
}
