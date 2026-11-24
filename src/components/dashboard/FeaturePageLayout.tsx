import Link from 'next/link';

import type { FeaturePageConfig } from '../../data/featureMenuData';
import Icon from '../ui/Icon';

/** Nội dung các trang chức năng — hiển thị bên trong khung chung AppShell. */
export default function FeaturePageLayout({ data }: { data: FeaturePageConfig }) {
  return (
    <>
      <section className="lx-greeting">
        <div>
          <p className="lx-eyebrow">{data.eyebrow}</p>
          <h1>{data.title}</h1>
          <p>{data.description}</p>
        </div>

        <div className="lx-page-actions">
          {data.secondaryAction && (
            <Link href={data.secondaryAction.href} className="lx-button lx-button-ghost">
              {data.secondaryAction.label}
            </Link>
          )}
          <Link href={data.primaryAction.href} className="lx-button">
            {data.primaryAction.label}
            <Icon name="arrow-right" size={15} />
          </Link>
        </div>
      </section>

      <section className="lx-stats lx-stats-fit" aria-label="Tổng quan">
        {data.stats.map((item) => (
          <article key={item.label} className="lx-card lx-stat">
            <p className="lx-stat-label">{item.label}</p>
            <p className="lx-stat-value">
              <strong>{item.value}</strong>
            </p>
            <p className="lx-stat-hint">{item.hint}</p>
          </article>
        ))}
      </section>

      {data.sections.map((section) => (
        <section key={section.title} className="lx-card lx-section">
          <div className="lx-card-head">
            <h2 className="lx-card-title">{section.title}</h2>
            <button type="button" className="lx-text-button">
              Xem thêm
            </button>
          </div>

          <div className="lx-tiles">
            {section.cards.map((card) => (
              <article key={card.id} className={`lx-tile tone-${card.tone ?? 'neutral'}`}>
                {card.tag && <span className="lx-tile-tag">{card.tag}</span>}
                <h3>{card.title}</h3>
                {card.subtitle && <p className="lx-tile-sub">{card.subtitle}</p>}
                {card.meta && <p className="lx-tile-meta">{card.meta}</p>}
                <button type="button" className="lx-tile-cta">
                  {card.cta}
                  <Icon name="arrow-right" size={14} />
                </button>
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
