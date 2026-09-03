import type { LearningGoal } from '../../data/dashboardData';

export default function DailyGoal({ goals }: { goals: LearningGoal[] }) {
  const completed = goals.filter((goal) => goal.done).length;

  return (
    <aside className="goal-card">
      <div className="section-heading compact">
        <div>
          <p className="section-label">🎯 Mục tiêu hôm nay</p>
        </div>
      </div>

      <ul className="goal-list">
        {goals.map((goal) => (
          <li key={goal.id} className={goal.done ? 'done' : ''}>
            <span className="goal-status" aria-hidden="true">{goal.done ? '✅' : '⬜'}</span>
            <span className="goal-copy">{goal.label}</span>
            <span className="goal-xp">+{goal.xp} XP</span>
          </li>
        ))}
      </ul>

      <div className="goal-summary">
        <span>{completed} / {goals.length} nhiệm vụ</span>
      </div>
    </aside>
  );
}
