import '../../styles/dashboard.css';
import '../../styles/practice.css';

import type { ReactNode } from 'react';

import { mobileNav } from '../../data/homeData';
import MobileBottomNav from './MobileBottomNav';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

/** Khung chung (sidebar + thanh trên + điều hướng di động) cho mọi trang học tập. */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="lx-shell">
      <Sidebar />

      <div className="lx-main">
        <TopHeader />
        <main className="lx-content">{children}</main>
      </div>

      <MobileBottomNav items={mobileNav} />
    </div>
  );
}
