"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatDate, formatTime, cn } from "@/lib/utils";
import { Users, Clock, MapPin, Calendar } from "lucide-react";

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayAttendance: 0,
    activeLocations: 0,
    recentAttendance: [] as any[],
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/employee/dashboard");
      return;
    }

    if (status === "authenticated") {
      fetchStats();
    }
  }, [status, session, router]);

  const fetchStats = async () => {
    try {
      const [employeesRes, attendanceRes, locationsRes] = await Promise.all([
        fetch("/api/employees"),
        fetch("/api/attendance"),
        fetch("/api/admin/locations"),
      ]);

      if (employeesRes.ok) {
        const empData = await employeesRes.json();
        setStats((prev) => ({
          ...prev,
          totalEmployees: empData.employees?.length || 0,
        }));
      } else {
        console.error("Failed to fetch employees:", employeesRes.status);
      }

      if (attendanceRes.ok) {
        const attData = await attendanceRes.json();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        
        const todayAtt = (attData.attendances || []).filter((a: any) => {
          if (!a.date) return false;
          const attDate = new Date(a.date);
          return attDate >= today && attDate <= todayEnd;
        });
        
        setStats((prev) => ({
          ...prev,
          todayAttendance: todayAtt.length,
          recentAttendance: (attData.attendances || []).slice(0, 10),
        }));
      } else {
        console.error("Failed to fetch attendance:", attendanceRes.status);
        const errorData = await attendanceRes.json().catch(() => ({}));
        console.error("Error details:", errorData);
      }

      if (locationsRes.ok) {
        const locData = await locationsRes.json();
        const active = (locData.locations || []).filter((l: any) => l.isActive);
        setStats((prev) => ({
          ...prev,
          activeLocations: active.length,
        }));
      } else {
        console.error("Failed to fetch locations:", locationsRes.status);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB] dark:border-[#3B82F6] mx-auto mb-4"></div>
          <p className="text-[#64748B] dark:text-[#94A3B8]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#2563EB] to-[#3B82F6] bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-[#64748B] dark:text-[#94A3B8] mt-2 text-lg">
          Welcome back, <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{session?.user?.name}</span>
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="border-2 border-transparent hover:border-[#2563EB]/20 transition-all duration-300 hover:shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] font-medium">Total Employees</p>
                <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] bg-clip-text text-transparent">
                  {stats.totalEmployees}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-transparent hover:border-[#10B981]/20 transition-all duration-300 hover:shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] font-medium">Today&apos;s Attendance</p>
                <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-[#10B981] to-[#059669] bg-clip-text text-transparent">
                  {stats.todayAttendance}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center shadow-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-transparent hover:border-[#F59E0B]/20 transition-all duration-300 hover:shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] font-medium">Active Locations</p>
                <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] bg-clip-text text-transparent">
                  {stats.activeLocations}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center shadow-lg">
                <MapPin className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/employees" className="block group">
              <Card className="p-4 hover:bg-gradient-to-r hover:from-[#2563EB]/5 hover:to-[#3B82F6]/5 dark:hover:from-[#2563EB]/10 dark:hover:to-[#3B82F6]/10 cursor-pointer transition-all duration-200 border-2 border-transparent hover:border-[#2563EB]/20">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">Manage Employees</span>
                </div>
              </Card>
            </Link>
            <Link href="/admin/attendance" className="block group">
              <Card className="p-4 hover:bg-gradient-to-r hover:from-[#10B981]/5 hover:to-[#059669]/5 dark:hover:from-[#10B981]/10 dark:hover:to-[#059669]/10 cursor-pointer transition-all duration-200 border-2 border-transparent hover:border-[#10B981]/20">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">View Attendance Reports</span>
                </div>
              </Card>
            </Link>
            <Link href="/admin/settings" className="block group">
              <Card className="p-4 hover:bg-gradient-to-r hover:from-[#F59E0B]/5 hover:to-[#D97706]/5 dark:hover:from-[#F59E0B]/10 dark:hover:to-[#D97706]/10 cursor-pointer transition-all duration-200 border-2 border-transparent hover:border-[#F59E0B]/20">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">Location Settings</span>
                </div>
              </Card>
            </Link>
            <Link href="/admin/attendance-settings" className="block group">
              <Card className="p-4 hover:bg-gradient-to-r hover:from-[#6366F1]/5 hover:to-[#4F46E5]/5 dark:hover:from-[#6366F1]/10 dark:hover:to-[#4F46E5]/10 cursor-pointer transition-all duration-200 border-2 border-transparent hover:border-[#6366F1]/20">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#4F46E5] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">Attendance Time Settings</span>
                </div>
              </Card>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentAttendance.length > 0 ? (
              <div className="space-y-3">
                {stats.recentAttendance.map((attendance: any) => (
                  <div
                    key={attendance.id}
                    className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#334155] pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">{attendance.user?.name}</p>
                      <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                        {formatDate(attendance.date)}
                      </p>
                      {attendance.checkIn && (
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                          In: {formatTime(attendance.checkIn)}
                        </p>
                      )}
                    </div>
                    <span className={cn(
                      "text-sm font-medium",
                      attendance.status === "PRESENT" && "text-[#10B981]",
                      attendance.status === "LATE" && "text-[#F59E0B]",
                      attendance.status === "ABSENT" && "text-[#EF4444]"
                    )}>{attendance.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#64748B] dark:text-[#94A3B8]">No recent attendance records</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
