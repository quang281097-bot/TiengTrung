import PracticeHeader from '../../../components/practice/PracticeHeader';
import LessonPlayer from '../../../components/practice/LessonPlayer';
import Icon from '../../../components/ui/Icon';
import { lesson } from '../../../data/practiceData';

export const metadata = { title: 'Học ngay' };

export default function LearnPage() {
  const aside = (
    <>
      <div className="lx-thumb lx-thumb-wide" aria-hidden="true">
        <span className="lx-thumb-tag">{lesson.thumb.tag}</span>
        <span className="lx-thumb-hanzi" lang="zh-CN">
          {lesson.thumb.hanzi}
        </span>
        <span className="lx-thumb-caption">{lesson.thumb.caption}</span>
      </div>

      <section className="lx-card lx-side-card">
        <h2 className="lx-card-title">Mục tiêu bài học</h2>
        <ul className="lx-goals">
          {lesson.goals.map((goal) => (
            <li key={goal}>
              <Icon name="target" size={15} />
              <span>{goal}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="lx-card lx-side-card">
        <h2 className="lx-card-title">Ghi nhớ nhanh</h2>
        <dl className="lx-notes">
          {lesson.notes.map((note) => (
            <div key={note.title}>
              <dt>{note.title}</dt>
              <dd lang="vi">{note.body}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );

  return (
    <>
      <PracticeHeader
        eyebrow={`${lesson.course} / ${lesson.topic}`}
        title={lesson.title}
        titleHanzi={lesson.titleHanzi}
        description={lesson.description}
        aside={<span className="lx-date">{lesson.remaining}</span>}
      />
      <LessonPlayer lesson={lesson} aside={aside} />
    </>
  );
}
