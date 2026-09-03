import Link from 'next/link';

import type { FeaturePageConfig } from '../../data/featureMenuData';

export default function FeaturePageLayout({ data }: { data: FeaturePageConfig }) {
  return (
    <main className="feature-page-shell">
      <div className="feature-page-inner">
        <header className="feature-page-header">
          <div>
            <p className="feature-eyebrow">{data.eyebrow}</p>
            <h1>{data.title}</h1>
            <p className="feature-description">{data.description}</p>
          </div>

          <div className="feature-page-actions">
            <Link href={data.primaryAction.href} className="primary-button">{data.primaryAction.label}</Link>
            {data.secondaryAction && (
              <Link href={data.secondaryAction.href} className="secondary-button feature-secondary-btn">
                {data.secondaryAction.label}
              </Link>
            )}
          </div>
        </header>

        <section className="feature-summary-grid" aria-label="Summary stats">
          {data.stats.map((item) => (
            <article key={item.label} className="feature-stat-card">
              <p>{item.label}</p>
              <strong>{item.value}</strong>
              <span>{item.hint}</span>
            </article>
          ))}
        </section>

        {data.sections.map((section) => (
          <section key={section.title} className="feature-section">
            <div className="section-header-row">
              <h2>{section.title}</h2>
              <button type="button" className="ghost-button">Xem thêm</button>
            </div>

            <div className="feature-card-grid">
              {section.cards.map((card) => (
                <article key={card.id} className={`feature-list-card tone-${card.tone ?? 'neutral'}`}>
                  <div className="feature-card-top">
                    <span className="feature-tag">{card.tag ?? card.title}</span>
                    {card.subtitle && <span className="feature-subtitle">{card.subtitle}</span>}
                  </div>

                  <div className="feature-card-body">
                    <h3>{card.title}</h3>
                    <p>{card.meta}</p>
                  </div>

                  <button type="button" className="feature-cta">{card.cta}</button>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
