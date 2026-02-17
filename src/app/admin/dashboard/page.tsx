"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatDate, formatTime } from "@/lib/utils";
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
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome back, {session?.user?.name}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Employees</p>
                <p className="text-2xl font-bold mt-1">{stats.totalEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Today&apos;s Attendance</p>
                <p className="text-2xl font-bold mt-1">{stats.todayAttendance}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Locations</p>
                <p className="text-2xl font-bold mt-1">{stats.activeLocations}</p>
              </div>
              <MapPin className="h-8 w-8 text-gray-400" />
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
            <Link href="/admin/employees" className="block">
              <Card className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5" />
                  <span>Manage Employees</span>
                </div>
              </Card>
            </Link>
            <Link href="/admin/attendance" className="block">
              <Card className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5" />
                  <span>View Attendance Reports</span>
                </div>
              </Card>
            </Link>
            <Link href="/admin/settings" className="block">
              <Card className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5" />
                  <span>Location Settings</span>
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
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{attendance.user?.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(attendance.date)}
                      </p>
                      {attendance.checkIn && (
                        <p className="text-xs text-gray-500">
                          In: {formatTime(attendance.checkIn)}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-green-600">{attendance.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No recent attendance records</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
