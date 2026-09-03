import Link from 'next/link';

import type { SidebarItem } from '../../data/dashboardData';

export default function Sidebar({ items }: { items: SidebarItem[] }) {
  return (
    <aside className="sidebar" aria-label="Sidebar navigation">
      <div className="brand-block">
        <div className="brand-mark">🀄</div>
        <div>
          <p className="brand-name">Trung Hoa</p>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Main menu">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`nav-item${item.active ? ' active' : ''}`}
            aria-current={item.active ? 'page' : undefined}
          >
            <span className="nav-icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <Link href="/settings" className="nav-item settings-item">
        <span className="nav-icon" aria-hidden="true">⚙️</span>
        <span>Cài đặt</span>
      </Link>
    </aside>
  );
}
