import type { StatCard as StatCardType } from '../../data/dashboardData';

export default function StatsCard({ card }: { card: StatCardType }) {
  const accentClass = `stat-card stat-card-${card.accent}`;

  return (
    <article className={accentClass}>
      <div className="stat-icon" aria-hidden="true">{card.icon}</div>
      <div className="stat-body">
        <p className="stat-label">{card.label}</p>
        <h3>{card.value}</h3>
        <span>{card.detail}</span>
      </div>
    </article>
  );
}
