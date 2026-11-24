'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type SidebarContextType = {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  toggleSidebar: () => {},
  openSidebar: () => {},
  closeSidebar: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Mở menu trái theo mặc định để giao diện có ngữ cảnh điều hướng đầy đủ.
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      localStorage.removeItem('lx_sidebar_collapsed');
    } catch {
      // Bỏ qua nếu trình duyệt chặn storage
    }
  }, []);

  const toggleSidebar = () => setIsCollapsed((prev) => !prev);
  const openSidebar = () => setIsCollapsed(false);
  const closeSidebar = () => setIsCollapsed(true);

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, openSidebar, closeSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
