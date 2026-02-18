"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Home, Users, Calendar, Settings, Clock } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB] mx-auto mb-4"></div>
          <p className="text-[#64748B] dark:text-[#94A3B8]">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (session?.user?.role !== "ADMIN") {
    router.push("/employee/dashboard");
    return null;
  }

  const sidebarItems = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: Home,
    },
    {
      label: "Employees",
      href: "/admin/employees",
      icon: Users,
    },
    {
      label: "Attendance",
      href: "/admin/attendance",
      icon: Calendar,
    },
    {
      label: "Locations",
      href: "/admin/settings",
      icon: Settings,
    },
    {
      label: "Time Settings",
      href: "/admin/attendance-settings",
      icon: Clock,
    },
  ];

  return <DashboardLayout sidebarItems={sidebarItems}>{children}</DashboardLayout>;
}
