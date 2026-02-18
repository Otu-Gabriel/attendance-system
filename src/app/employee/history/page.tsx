"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AttendanceStats from "@/components/attendance/AttendanceStats";
import QuickFilters from "@/components/attendance/QuickFilters";
import AttendanceTable from "@/components/attendance/AttendanceTable";
import { Calendar, ArrowLeft, Download, Filter } from "lucide-react";
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
  const [groupBy, setGroupBy] = useState<"none" | "week" | "month">("none");
  const [showFilters, setShowFilters] = useState(false);

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

  const handleFilterChange = (startDate: string, endDate: string) => {
    setFilters({ startDate, endDate });
  };

  const handleExport = () => {
    const csv = [
      ["Date", "Day", "Check In", "Check Out", "Status", "Hours Worked"],
      ...attendances.map((att) => {
        const checkIn = att.checkIn ? new Date(att.checkIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";
        const checkOut = att.checkOut ? new Date(att.checkOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";
        const hours = att.checkIn && att.checkOut
          ? ((new Date(att.checkOut).getTime() - new Date(att.checkIn).getTime()) / (1000 * 60 * 60)).toFixed(1)
          : "";
        return [
          new Date(att.date).toLocaleDateString("en-US"),
          new Date(att.date).toLocaleDateString("en-US", { weekday: "short" }),
          checkIn,
          checkOut,
          att.status,
          hours ? `${hours} hrs` : "",
        ];
      }),
    ].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${new Date().toISOString()}.csv`;
    a.click();
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <p>Loading attendance records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link href="/employee/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Hide" : "Show"} Filters
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        <h1 className="text-3xl font-bold">Attendance History</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View and analyze your attendance records
        </p>
      </div>

      {/* Summary Statistics */}
      {attendances.length > 0 && <AttendanceStats attendances={attendances} />}

      {/* Filters Section */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Quick Filters</label>
              <QuickFilters
                onFilterChange={handleFilterChange}
                currentStartDate={filters.startDate}
                currentEndDate={filters.endDate}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
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
            <div className="pt-4 border-t">
              <label className="mb-2 block text-sm font-medium">Group By</label>
              <div className="flex gap-2">
                <Button
                  variant={groupBy === "none" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGroupBy("none")}
                >
                  None
                </Button>
                <Button
                  variant={groupBy === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGroupBy("week")}
                >
                  Week
                </Button>
                <Button
                  variant={groupBy === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGroupBy("month")}
                >
                  Month
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Attendance Records ({attendances.length})
            </CardTitle>
            {!showFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(true)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {attendances.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-500 mb-2">
                No attendance records found
              </p>
              <p className="text-sm text-gray-400 mb-4">
                {filters.startDate || filters.endDate
                  ? "Try adjusting your date filters or select a different time period"
                  : "Your attendance records will appear here once you start marking attendance"}
              </p>
              {filters.startDate || filters.endDate ? (
                <Button
                  variant="outline"
                  onClick={() => setFilters({ startDate: "", endDate: "" })}
                >
                  Clear Filters
                </Button>
              ) : null}
            </div>
          ) : (
            <AttendanceTable
              attendances={attendances}
              groupBy={groupBy}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
