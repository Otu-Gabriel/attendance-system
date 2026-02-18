"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface DashboardLayoutProps {
  children: ReactNode;
  sidebarItems: Array<{
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }>;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}

export default function DashboardLayout({
  children,
  sidebarItems,
  searchPlaceholder,
  onSearch,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#0F172A]">
      <Sidebar items={sidebarItems} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header searchPlaceholder={searchPlaceholder} onSearch={onSearch} />
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-[#0F172A]">
          <div className="container mx-auto px-4 py-6 lg:px-6 lg:py-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
