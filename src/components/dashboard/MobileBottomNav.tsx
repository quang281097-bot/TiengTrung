'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { NavLink } from '../../data/homeData';
import Icon from '../ui/Icon';

export default function MobileBottomNav({ items }: { items: NavLink[] }) {
  const pathname = usePathname() ?? '/';

  return (
    <nav className="lx-bottomnav" aria-label="Điều hướng di động">
      {items.map((item) => {
        const active = item.href === '/' ? pathname === '/' || pathname === '/dashboard' : pathname === item.href;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={active ? 'is-active' : undefined}
            aria-current={active ? 'page' : undefined}
          >
            <Icon name={item.icon} size={19} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
