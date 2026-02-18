"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { formatDate, formatTime } from "@/lib/utils";
import { Clock, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EmployeeDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchAttendance();
    }
  }, [status, router]);

  const fetchAttendance = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/attendance?startDate=${today}&endDate=${today}`);
      if (res.ok) {
        const data = await res.json();
        if (data.attendances && data.attendances.length > 0) {
          setTodayAttendance(data.attendances[0]);
        }
      }

      // Fetch recent attendance (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split("T")[0];
      const res2 = await fetch(`/api/attendance?startDate=${weekAgoStr}`);
      if (res2.ok) {
        const data = await res2.json();
        setRecentAttendance(data.attendances || []);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
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
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#2563EB] to-[#3B82F6] bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-[#64748B] dark:text-[#94A3B8] mt-2 text-lg">
          Welcome back, <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{session?.user?.name}</span>
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] font-medium">Today&apos;s Status</p>
                <p className="text-3xl font-bold mt-2 text-[#0F172A] dark:text-[#F1F5F9]">
                  {todayAttendance?.checkIn ? "Checked In" : "Not Checked In"}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center shadow-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] font-medium">Check In Time</p>
                <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-[#10B981] to-[#059669] bg-clip-text text-transparent">
                  {todayAttendance?.checkIn
                    ? formatTime(todayAttendance.checkIn)
                    : "--"}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] font-medium">Check Out Time</p>
                <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] bg-clip-text text-transparent">
                  {todayAttendance?.checkOut
                    ? formatTime(todayAttendance.checkOut)
                    : "--"}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center shadow-lg">
                <Clock className="h-6 w-6 text-white" />
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
            <Link href="/employee/attendance" className="block">
              <Button className="w-full">Mark Attendance</Button>
            </Link>
            <Link href="/employee/history" className="block">
              <Button variant="outline" className="w-full">
                View Attendance History
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {recentAttendance.length > 0 ? (
              <div className="space-y-3">
                {recentAttendance.slice(0, 5).map((attendance) => (
                  <div
                    key={attendance.id}
                    className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#334155] pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">{formatDate(attendance.date)}</p>
                      <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                        {attendance.checkIn && `In: ${formatTime(attendance.checkIn)}`}
                        {attendance.checkOut && ` Out: ${formatTime(attendance.checkOut)}`}
                      </p>
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
