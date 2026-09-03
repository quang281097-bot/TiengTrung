import Link from 'next/link';

import type { SidebarItem } from '../../data/dashboardData';

export default function MobileBottomNav({ items }: { items: SidebarItem[] }) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={`mobile-nav-item${item.active ? ' active' : ''}`}
          aria-current={item.active ? 'page' : undefined}
        >
          <span aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
