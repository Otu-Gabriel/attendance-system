"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { formatDate, formatTime, formatDateTime } from "@/lib/utils";
import { Calendar, Download } from "lucide-react";

export default function AdminAttendancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [attendances, setAttendances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    userId: "",
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
      fetchAttendance();
    }
  }, [status, session, router]);

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.userId) params.append("userId", filters.userId);

      const res = await fetch(`/api/attendance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAttendances(data.attendances || []);
      } else {
        console.error("Failed to fetch attendance:", res.status);
        const errorData = await res.json().catch(() => ({}));
        console.error("Error details:", errorData);
        setAttendances([]);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setAttendances([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const csv = [
      ["Date", "Employee", "Email", "Check In", "Check Out", "Status"],
      ...attendances.map((att) => [
        formatDate(att.date),
        att.user?.name || "",
        att.user?.email || "",
        att.checkIn ? formatTime(att.checkIn) : "",
        att.checkOut ? formatTime(att.checkOut) : "",
        att.status,
      ]),
    ].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${new Date().toISOString()}.csv`;
    a.click();
  };

  useEffect(() => {
    fetchAttendance();
  }, [filters.startDate, filters.endDate, filters.userId]);

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
        <h1 className="text-3xl font-bold">Attendance Reports</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View and export attendance records
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
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
            <div className="flex items-end">
              <Button onClick={handleExport} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Records ({attendances.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {attendances.length === 0 ? (
            <p className="text-gray-500">No attendance records found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Employee</th>
                    <th className="text-left p-2">Check In</th>
                    <th className="text-left p-2">Check Out</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendances.map((attendance) => (
                    <tr key={attendance.id} className="border-b">
                      <td className="p-2">{formatDate(attendance.date)}</td>
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{attendance.user?.name}</p>
                          <p className="text-sm text-gray-500">
                            {attendance.user?.email}
                          </p>
                        </div>
                      </td>
                      <td className="p-2">
                        {attendance.checkIn ? formatTime(attendance.checkIn) : "-"}
                      </td>
                      <td className="p-2">
                        {attendance.checkOut ? formatTime(attendance.checkOut) : "-"}
                      </td>
                      <td className="p-2">
                        <span className="text-sm text-green-600">
                          {attendance.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
