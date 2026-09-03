import type { QuickCard } from '../../data/dashboardData';

export default function QuickLearningCard({ cards }: { cards: QuickCard[] }) {
  return (
    <article className="quick-card">
      <div className="section-heading">
        <div>
          <p className="section-label">⚡ Học nhanh</p>
        </div>
      </div>

      <div className="quick-grid">
        {cards.map((card) => (
          <div key={card.id} className="quick-item">
            <div className="quick-icon" aria-hidden="true">{card.icon}</div>
            <div className="quick-copy">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
            <button type="button" className="mini-button">{card.cta}</button>
          </div>
        ))}
      </div>
    </article>
  );
}
