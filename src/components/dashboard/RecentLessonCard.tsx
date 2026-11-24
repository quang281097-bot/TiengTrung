import Link from 'next/link';

import { recentLesson } from '../../data/homeData';
import Icon from '../ui/Icon';

export default function RecentLessonCard({ lesson }: { lesson: typeof recentLesson }) {
  const percent = Math.round((lesson.partsDone / lesson.partsTotal) * 100);

  return (
    <article className="lx-card lx-recent">
      <div className="lx-card-head">
        <h2 className="lx-card-title">Bài học gần nhất</h2>
        <span className="lx-card-meta">{lesson.time}</span>
      </div>

      <div className="lx-recent-body">
        <div className="lx-thumb" aria-hidden="true">
          <span className="lx-thumb-tag">{lesson.thumbTag}</span>
          <span className="lx-thumb-hanzi" lang="zh">
            {lesson.thumbHanzi}
          </span>
          <span className="lx-thumb-caption">{lesson.thumbCaption}</span>
        </div>

        <div className="lx-recent-info">
          <p className="lx-recent-crumb">
            {lesson.course} <span aria-hidden="true">/</span> {lesson.topic}
          </p>
          <h3 className="lx-recent-title">{lesson.title}</h3>
          <p className="lx-recent-desc">{lesson.description}</p>

          <div className="lx-progress-row">
            <span>
              Đã hoàn thành {lesson.partsDone} / {lesson.partsTotal} phần
            </span>
            <strong>{percent}%</strong>
          </div>
          <div
            className="lx-progress"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Tiến độ bài học"
          >
            <span style={{ width: `${percent}%` }} />
          </div>

          <div className="lx-recent-actions">
            <Link href={lesson.href} className="lx-button">
              Tiếp tục bài học
              <Icon name="arrow-right" size={15} />
            </Link>
            <span className="lx-card-meta">{lesson.remaining}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
