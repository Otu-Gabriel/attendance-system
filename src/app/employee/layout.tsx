"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Home, Clock, Calendar } from "lucide-react";

export default function EmployeeLayout({
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

  if (session?.user?.role !== "EMPLOYEE") {
    router.push("/admin/dashboard");
    return null;
  }

  const sidebarItems = [
    {
      label: "Dashboard",
      href: "/employee/dashboard",
      icon: Home,
    },
    {
      label: "Mark Attendance",
      href: "/employee/attendance",
      icon: Clock,
    },
    {
      label: "History",
      href: "/employee/history",
      icon: Calendar,
    },
  ];

  return <DashboardLayout sidebarItems={sidebarItems}>{children}</DashboardLayout>;
}
