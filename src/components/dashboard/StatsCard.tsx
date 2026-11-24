import type { HomeStat } from '../../data/homeData';
import Icon from '../ui/Icon';

export default function StatsCard({ stat }: { stat: HomeStat }) {
  return (
    <article className="lx-card lx-stat">
      <div className="lx-stat-top">
        <p className="lx-stat-label">{stat.label}</p>
        <span className={`lx-stat-icon${stat.highlight ? ' is-warm' : ''}`}>
          <Icon name={stat.icon} size={15} />
        </span>
      </div>
      <p className="lx-stat-value">
        <strong>{stat.value}</strong>
        <span>{stat.unit}</span>
      </p>
      <p className="lx-stat-hint">{stat.hint}</p>
    </article>
  );
}
