"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { formatDate, formatTime } from "@/lib/utils";
import { Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EmployeeHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [attendances, setAttendances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.role !== "EMPLOYEE") {
      router.push("/admin/dashboard");
      return;
    }

    if (status === "authenticated") {
      fetchAttendance();
    }
  }, [status, session, router]);

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const res = await fetch(`/api/attendance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAttendances(data.attendances || []);
      } else {
        console.error("Failed to fetch attendance:", res.status);
        setAttendances([]);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setAttendances([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.startDate, filters.endDate]);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/employee/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold">Attendance History</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View your attendance records
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Your Attendance Records ({attendances.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attendances.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No attendance records found</p>
              <p className="text-sm text-gray-400 mt-2">
                {filters.startDate || filters.endDate
                  ? "Try adjusting your date filters"
                  : "Your attendance records will appear here once you start marking attendance"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Check In</th>
                    <th className="text-left p-2">Check Out</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Hours Worked</th>
                  </tr>
                </thead>
                <tbody>
                  {attendances.map((attendance) => {
                    let hoursWorked = "-";
                    if (attendance.checkIn && attendance.checkOut) {
                      const checkIn = new Date(attendance.checkIn);
                      const checkOut = new Date(attendance.checkOut);
                      const diffMs = checkOut.getTime() - checkIn.getTime();
                      const diffHours = diffMs / (1000 * 60 * 60);
                      hoursWorked = `${diffHours.toFixed(1)} hrs`;
                    }

                    return (
                      <tr key={attendance.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-2">
                          <p className="font-medium">{formatDate(attendance.date)}</p>
                        </td>
                        <td className="p-2">
                          {attendance.checkIn ? (
                            <span className="text-green-600">
                              {formatTime(attendance.checkIn)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-2">
                          {attendance.checkOut ? (
                            <span className="text-blue-600">
                              {formatTime(attendance.checkOut)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-2">
                          <span
                            className={`text-sm px-2 py-1 rounded ${
                              attendance.status === "PRESENT"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : attendance.status === "LATE"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : attendance.status === "ABSENT"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                            }`}
                          >
                            {attendance.status}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {hoursWorked}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
