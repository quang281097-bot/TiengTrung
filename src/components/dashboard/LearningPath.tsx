import type { PathLevel } from '../../data/dashboardData';

export default function LearningPath({ items }: { items: PathLevel[] }) {
  return (
    <article className="path-card">
      <div className="section-heading">
        <div>
          <p className="section-label">🗺️ Lộ trình học</p>
        </div>
      </div>

      <div className="path-roadmap" aria-label="Learning roadmap">
        {items.map((item) => (
          <div key={item.level} className={`path-step ${item.status.toLowerCase()}`}>
            <div className="path-node" aria-hidden="true" />
            <div className="path-copy">
              <span>{item.level}</span>
              <small>{item.status === 'Current' ? 'Bạn đang ở đây' : item.status}</small>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
