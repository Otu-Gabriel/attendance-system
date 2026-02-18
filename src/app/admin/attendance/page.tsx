"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AdminAttendanceStats from "@/components/attendance/AdminAttendanceStats";
import QuickFilters from "@/components/attendance/QuickFilters";
import AdminAttendanceTable from "@/components/attendance/AdminAttendanceTable";
import { Calendar, Download, Filter, Search } from "lucide-react";

export default function AdminAttendancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [attendances, setAttendances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    userId: "",
    searchQuery: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);

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
      fetchEmployees();
      fetchAttendance();
    }
  }, [status, session, router]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

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
        let filtered = data.attendances || [];
        
        // Apply search filter
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          filtered = filtered.filter((att: any) =>
            att.user?.name?.toLowerCase().includes(query) ||
            att.user?.email?.toLowerCase().includes(query) ||
            att.user?.employeeId?.toLowerCase().includes(query)
          );
        }
        
        setAttendances(filtered);
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
  }, [filters.startDate, filters.endDate, filters.userId, filters.searchQuery]);

  const handleFilterChange = (startDate: string, endDate: string) => {
    setFilters({ ...filters, startDate, endDate });
  };

  const handleExport = () => {
    const csv = [
      ["Date", "Day", "Employee", "Email", "Employee ID", "Department", "Check In", "Check Out", "Status", "Hours Worked"],
      ...attendances.map((att) => {
        const checkIn = att.checkIn ? new Date(att.checkIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";
        const checkOut = att.checkOut ? new Date(att.checkOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";
        const hours = att.checkIn && att.checkOut
          ? ((new Date(att.checkOut).getTime() - new Date(att.checkIn).getTime()) / (1000 * 60 * 60)).toFixed(1)
          : "";
        return [
          new Date(att.date).toLocaleDateString("en-US"),
          new Date(att.date).toLocaleDateString("en-US", { weekday: "short" }),
          att.user?.name || "",
          att.user?.email || "",
          att.user?.employeeId || "",
          att.user?.department || "",
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
          <div>
            <h1 className="text-3xl font-bold">Attendance Reports</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              View and manage all employee attendance records
            </p>
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
            <Button variant="default" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      {attendances.length > 0 && <AdminAttendanceStats attendances={attendances} />}

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
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
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
              <div>
                <label className="mb-2 block text-sm font-medium">Employee</label>
                <select
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 dark:border-gray-700 dark:bg-gray-800 dark:focus-visible:ring-gray-300"
                  value={filters.userId}
                  onChange={(e) =>
                    setFilters({ ...filters, userId: e.target.value })
                  }
                >
                  <option value="">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeId || emp.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="pt-4 border-t">
              <label className="mb-2 block text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name, email, or employee ID..."
                  value={filters.searchQuery}
                  onChange={(e) =>
                    setFilters({ ...filters, searchQuery: e.target.value })
                  }
                  className="pl-10"
                />
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
                {filters.startDate || filters.endDate || filters.userId || filters.searchQuery
                  ? "Try adjusting your filters or search query"
                  : "Attendance records will appear here once employees start marking attendance"}
              </p>
              {(filters.startDate || filters.endDate || filters.userId || filters.searchQuery) && (
                <Button
                  variant="outline"
                  onClick={() => setFilters({ startDate: "", endDate: "", userId: "", searchQuery: "" })}
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <AdminAttendanceTable attendances={attendances} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
