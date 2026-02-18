"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import Button from "@/components/ui/Button";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface SidebarProps {
  items: SidebarItem[];
}

export default function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };


  const sidebarContent = (
    <div
      className={cn(
        "flex flex-col h-full bg-white dark:bg-[#0F172A] border-r border-[#E2E8F0] dark:border-[#334155] transition-all duration-300",
        isCollapsed && !isMobile ? "w-20" : "w-64",
        isMobile && !isMobileOpen && "hidden",
        isMobile && isMobileOpen && "fixed inset-y-0 left-0 z-50 w-64 shadow-2xl"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0] dark:border-[#334155]">
        {!isCollapsed || isMobile ? (
          <div className="flex items-center gap-3 flex-1">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#1E40AF] flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-sm text-[#0F172A] dark:text-[#F1F5F9]">
                Attendance
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">System</p>
            </div>
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="h-8 w-8 p-0 flex-shrink-0"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center w-full gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#1E40AF] flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="h-8 w-8 p-0"
                title="Expand sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-track-transparent">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                isActive
                  ? "bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-lg shadow-[#2563EB]/20"
                  : "text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] hover:text-[#0F172A] dark:hover:text-[#F1F5F9]"
              )}
              title={isCollapsed && !isMobile ? item.label : undefined}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 flex-shrink-0 transition-transform z-10",
                  isActive && "scale-110",
                  !isActive && "group-hover:scale-105"
                )}
              />
              {(!isCollapsed || isMobile) && (
                <>
                  <span className={cn(
                    "flex-1 font-medium text-sm transition-opacity",
                    isCollapsed && !isMobile && "opacity-0 w-0"
                  )}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#EF4444] text-white animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] shadow-lg hover:shadow-xl transition-shadow"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5 text-[#0F172A] dark:text-[#F1F5F9]" />
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn("relative", isMobile && "lg:relative")}>
        {sidebarContent}
      </aside>
    </>
  );
}
