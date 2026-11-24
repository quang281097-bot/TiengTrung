'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { learner, pageTitles } from '../../data/homeData';
import Icon from '../ui/Icon';

export default function TopHeader() {
  const pathname = usePathname() ?? '/';
  const isHome = pathname === '/' || pathname === '/dashboard';
  const title = pageTitles[pathname];

  return (
    <header className="lx-topbar">
      <nav className="lx-breadcrumb" aria-label="Breadcrumb">
        {isHome ? <span>Không gian học tập</span> : <Link href="/">Không gian học tập</Link>}
        {title && (
          <>
            <span aria-hidden="true">/</span>
            <strong aria-current="page">{title}</strong>
          </>
        )}
      </nav>

      <div className="lx-topbar-right">
        <button type="button" className="lx-icon-button" aria-label="Thông báo">
          <Icon name="bell" size={17} />
        </button>
        <div className="lx-user">
          <p className="lx-user-name">{learner.name}</p>
          <p className="lx-user-role">{learner.role}</p>
        </div>
      </div>
    </header>
  );
}
