'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { courseLevels, examNav, primaryNav, skillNav } from '../../data/homeData';
import type { NavLink } from '../../data/homeData';
import Icon from '../ui/Icon';
import { useSidebar } from './SidebarContext';

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/' || pathname === '/dashboard';
  return pathname === href.split('?')[0];
}

function NavItem({ item, pathname }: { item: NavLink; pathname: string }) {
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      className={`lx-nav-item${active ? ' is-active' : ''}`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon name={item.icon} />
      <span>{item.label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname() ?? '/';
  const [coursesOpen, setCoursesOpen] = useState(true);
  const { isCollapsed, toggleSidebar } = useSidebar();
  const coursesActive = pathname === '/lessons';

  return (
    <aside className={`lx-sidebar${isCollapsed ? ' is-collapsed' : ''}`} aria-label="Điều hướng chính">
      <div className="lx-sidebar-header">
        <Link href="/" className="lx-brand">
          <span className="lx-brand-name">
            lǎoshi<span className="lx-brand-dot">.</span>
          </span>
          <span className="lx-brand-tagline">Học mỗi ngày, tiến xa hơn</span>
        </Link>
        <button
          type="button"
          className="lx-icon-button lx-sidebar-close-btn"
          onClick={toggleSidebar}
          aria-label="Thu gọn menu"
          title="Thu gọn menu"
        >
          <Icon name="panel-left" size={17} />
        </button>
      </div>

      <div className="lx-sidebar-scroll">
        <p className="lx-nav-heading">Không gian học tập</p>
        <nav className="lx-nav" aria-label="Không gian học tập">
          {primaryNav.map((item) => (
            <NavItem key={item.id} item={item} pathname={pathname} />
          ))}

          <button
            type="button"
            className={`lx-nav-item lx-nav-toggle${coursesActive ? ' is-active' : ''}`}
            aria-expanded={coursesOpen}
            aria-controls="lx-course-levels"
            onClick={() => setCoursesOpen((open) => !open)}
          >
            <Icon name="book" />
            <span>Khoá học</span>
            <Icon name="chevron-down" size={16} className="lx-nav-chevron" />
          </button>

          {coursesOpen && (
            <ul id="lx-course-levels" className="lx-subnav">
              {courseLevels.map((level) => (
                <li key={level.id}>
                  <Link
                    href={level.href}
                    className={`lx-subnav-item${level.current ? ' is-current' : ''}`}
                  >
                    <span>{level.label}</span>
                    {level.current && <small>Đang học</small>}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {examNav.map((item) => (
            <NavItem key={item.id} item={item} pathname={pathname} />
          ))}
        </nav>

        <p className="lx-nav-heading lx-nav-heading-next">Luyện kỹ năng</p>
        <nav className="lx-nav" aria-label="Luyện kỹ năng">
          {skillNav.map((item) => (
            <NavItem key={item.id} item={item} pathname={pathname} />
          ))}
        </nav>
      </div>

      <div className="lx-sidebar-foot">
        <div className="lx-motto">
          <p className="lx-motto-kicker">Chậm mà chắc</p>
          <p className="lx-motto-text">Mỗi bài học nhỏ, một bước tiến lớn.</p>
        </div>
        <Link href="/settings" className="lx-help-link">
          Trung tâm trợ giúp
          <Icon name="external" size={13} />
        </Link>
      </div>
    </aside>
  );
}
