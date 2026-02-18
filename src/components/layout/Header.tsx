"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { Search, Sun, Moon, User, LogOut, Settings, ChevronDown } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme/ThemeProvider";

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

export default function Header({ onSearch, searchPlaceholder = "Search..." }: HeaderProps) {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E2E8F0] dark:border-[#334155] bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-lg">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Search Bar */}
        <div className="flex-1 max-w-2xl">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#64748B] dark:text-[#94A3B8]" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 w-full max-w-md border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#1E293B] focus:bg-white dark:focus:bg-[#0F172A]"
            />
          </form>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-10 w-10 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] transition-all duration-200"
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5 text-[#64748B] transition-transform hover:rotate-12" />
            ) : (
              <Sun className="h-5 w-5 text-[#FCD34D] transition-transform hover:rotate-12" />
            )}
          </Button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] transition-colors"
            >
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center text-white font-semibold shadow-lg ring-2 ring-[#2563EB]/20">
                {session?.user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-[#0F172A] dark:text-[#F1F5F9]">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] capitalize">
                  {session?.user?.role?.toLowerCase() || "Employee"}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-[#64748B] dark:text-[#94A3B8] transition-transform hidden md:block",
                  showUserMenu && "rotate-180"
                )}
              />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] shadow-xl z-20 py-2">
                  <div className="px-4 py-3 border-b border-[#E2E8F0] dark:border-[#334155]">
                    <p className="text-sm font-medium text-[#0F172A] dark:text-[#F1F5F9]">
                      {session?.user?.name || "User"}
                    </p>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] truncate">
                      {session?.user?.email || ""}
                    </p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        // Navigate to profile settings if needed
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors"
                    >
                      <User className="h-4 w-4" />
                      Profile Settings
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        // Navigate to account settings if needed
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      Account Settings
                    </button>
                  </div>
                  <div className="border-t border-[#E2E8F0] dark:border-[#334155] pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#EF4444] hover:bg-[#FEE2E2] dark:hover:bg-[#7F1D1D] transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
