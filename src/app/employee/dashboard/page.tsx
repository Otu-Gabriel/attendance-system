"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { formatDate, formatTime } from "@/lib/utils";
import { Clock, Calendar, User } from "lucide-react";

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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome back, {session?.user?.name}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Today&apos;s Status</p>
                <p className="text-2xl font-bold mt-1">
                  {todayAttendance?.checkIn ? "Checked In" : "Not Checked In"}
                </p>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Check In Time</p>
                <p className="text-2xl font-bold mt-1">
                  {todayAttendance?.checkIn
                    ? formatTime(todayAttendance.checkIn)
                    : "--"}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Check Out Time</p>
                <p className="text-2xl font-bold mt-1">
                  {todayAttendance?.checkOut
                    ? formatTime(todayAttendance.checkOut)
                    : "--"}
                </p>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
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
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{formatDate(attendance.date)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {attendance.checkIn && `In: ${formatTime(attendance.checkIn)}`}
                        {attendance.checkOut && ` Out: ${formatTime(attendance.checkOut)}`}
                      </p>
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
