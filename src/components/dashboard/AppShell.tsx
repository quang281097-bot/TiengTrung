'use client';

import '../../styles/dashboard.css';
import '../../styles/practice.css';
import '../../styles/reading.css';
import '../../styles/writing.css';

import type { ReactNode } from 'react';

import { mobileNav } from '../../data/homeData';
import MobileBottomNav from './MobileBottomNav';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import { SidebarProvider, useSidebar } from './SidebarContext';

function ShellLayout({ children }: { children: ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className={`lx-shell${isCollapsed ? ' is-sidebar-collapsed' : ''}`}>
      <Sidebar />

      <div className="lx-main">
        <TopHeader />
        <main className="lx-content">{children}</main>
      </div>

      <MobileBottomNav items={mobileNav} />
    </div>
  );
}

/** Khung chung (sidebar + thanh trên + điều hướng di động) cho mọi trang học tập. */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <ShellLayout>{children}</ShellLayout>
    </SidebarProvider>
  );
}
