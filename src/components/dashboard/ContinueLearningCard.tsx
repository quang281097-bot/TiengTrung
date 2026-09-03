import type { DailyChinese } from '../../data/dashboardData';

export default function ContinueLearningCard({ lesson }: { lesson: { title: string; chinese: string; pinyin: string; meaning: string; progress: number } }) {
  return (
    <article className="continue-card">
      <div className="section-heading">
        <div>
          <p className="section-label">📖 Tiếp tục học</p>
        </div>
        <button type="button" className="inline-link">
          Học tiếp →
        </button>
      </div>

      <div className="lesson-meta">{lesson.title}</div>
      <div className="lesson-chinese">{lesson.chinese}</div>
      <div className="lesson-pinyin">{lesson.pinyin}</div>
      <div className="lesson-meaning">{lesson.meaning}</div>

      <div className="progress-row">
        <span>Progress</span>
        <strong>{lesson.progress}%</strong>
      </div>

      <div className="progress-bar" aria-label="Lesson progress">
        <span style={{ width: `${lesson.progress}%` }} />
      </div>
    </article>
  );
}
