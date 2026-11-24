'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { pageTitles } from '../../data/homeData';
import Icon from '../ui/Icon';
import { useSidebar } from './SidebarContext';

type HeaderUser = { displayName: string; role: 'admin' | 'learner' };

function getInitial(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return 'H';
  const parts = trimmed.split(/\s+/);
  return parts[parts.length - 1][0]?.toUpperCase() ?? 'H';
}

export default function TopHeader() {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const isHome = pathname === '/' || pathname === '/dashboard';
  const title = pageTitles[pathname];
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((response) => response.json())
      .then((result) => {
        if (active) setUser(result.user);
      })
      .catch(() => {
        if (active) setUser(null);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) return;
      setUser(null);
      router.replace('/login');
      router.refresh();
    } catch {
      return;
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="lx-topbar">
      <div className="lx-topbar-left">
        <button
          type="button"
          className="lx-icon-button lx-toggle-sidebar-btn"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? 'Mở thanh menu bên trái' : 'Thu gọn thanh menu bên trái'}
          title={isCollapsed ? 'Mở menu' : 'Thu gọn menu'}
        >
          <Icon name="panel-left" size={18} />
        </button>

        <Link href="/" className={`lx-topbar-brand${isCollapsed ? ' is-visible' : ''}`}>
          lǎoshi<span>.</span>
        </Link>

        <span className="lx-topbar-divider" aria-hidden="true" />

        <nav className="lx-breadcrumb" aria-label="Breadcrumb">
          {isHome ? <span>Không gian học tập</span> : <Link href="/">Không gian học tập</Link>}
          {title && (
            <>
              <span className="lx-breadcrumb-sep" aria-hidden="true">
                /
              </span>
              <strong aria-current="page">{title}</strong>
            </>
          )}
        </nav>
      </div>

      <div className="lx-topbar-right">
        <button type="button" className="lx-icon-button lx-topbar-bell" aria-label="Thông báo" title="Thông báo">
          <Icon name="bell" size={17} />
          <span className="lx-bell-dot" aria-hidden="true" />
        </button>

        {user ? (
          <>
            <Link href="/profile" className="lx-user" aria-label={`Tài khoản của ${user.displayName}`}>
              <span className="lx-user-avatar" aria-hidden="true">
                {getInitial(user.displayName)}
              </span>
              <span className="lx-user-info">
                <span className="lx-user-name">{user.displayName}</span>
                <span className="lx-user-role">{user.role === 'admin' ? 'Quản trị viên' : 'Học viên'}</span>
              </span>
            </Link>
            <button
              type="button"
              className="lx-auth-button lx-auth-logout"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Đang thoát...' : 'Đăng xuất'}
            </button>
          </>
        ) : (
          <Link href="/login" className="lx-auth-button lx-auth-login">
            Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
}
