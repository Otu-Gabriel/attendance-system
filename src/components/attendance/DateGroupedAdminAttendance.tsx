"use client";

import { useState, useMemo, Fragment, useEffect } from "react";
import { formatDate, formatTime, getDayOfWeek, calculateHoursWorked, formatHours } from "@/lib/utils";
import { ChevronDown, ChevronUp, ChevronRight, Clock, MapPin, Image as ImageIcon, User, Users, CheckCircle, XCircle, AlertCircle, Calendar } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface DateGroupedAdminAttendanceProps {
  attendances: any[];
  employees: any[];
  startDate?: string;
  endDate?: string;
}

export default function DateGroupedAdminAttendance({
  attendances,
  employees,
  startDate,
  endDate,
}: DateGroupedAdminAttendanceProps) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleDate = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PRESENT: "bg-[#D1FAE5] text-[#065F46] dark:bg-[#064E3B] dark:text-[#6EE7B7]",
      LATE: "bg-[#FEF3C7] text-[#92400E] dark:bg-[#78350F] dark:text-[#FCD34D]",
      ABSENT: "bg-[#FEE2E2] text-[#991B1B] dark:bg-[#7F1D1D] dark:text-[#FCA5A5]",
      EARLY_LEAVE: "bg-[#FED7AA] text-[#9A3412] dark:bg-[#7C2D12] dark:text-[#FDBA74]",
      HALF_DAY: "bg-[#DBEAFE] text-[#1E40AF] dark:bg-[#1E3A8A] dark:text-[#93C5FD]",
    };
    
    return (
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${styles[status as keyof typeof styles] || styles.PRESENT}`}>
        {status.replace("_", " ")}
      </span>
    );
  };

  // Group attendances by date and merge with all employees
  const groupedByDate = useMemo(() => {
    // Create a map of date -> attendance records
    const attendanceMap = new Map<string, any[]>();
    attendances.forEach((att) => {
      const dateKey = new Date(att.date).toISOString().split("T")[0];
      if (!attendanceMap.has(dateKey)) {
        attendanceMap.set(dateKey, []);
      }
      attendanceMap.get(dateKey)!.push(att);
    });

    // Get date range
    const dates: string[] = [];
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d).toISOString().split("T")[0]);
      }
    } else {
      // Get all unique dates from attendances
      const uniqueDates = Array.from(attendanceMap.keys());
      dates.push(...uniqueDates);
    }

    // Sort dates descending (newest first)
    dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    // For each date, create employee attendance records
    const result: Array<{
      date: string;
      employees: Array<{
        employee: any;
        attendance: any | null;
      }>;
      stats: {
        present: number;
        late: number;
        absent: number;
        total: number;
      };
    }> = [];

    dates.forEach((date) => {
      const dateAttendances = attendanceMap.get(date) || [];
      const employeeAttendanceMap = new Map<string, any>();
      
      // Map attendances by employee ID
      dateAttendances.forEach((att) => {
        if (att.userId) {
          employeeAttendanceMap.set(att.userId, att);
        }
      });

      // Create records for all active employees
      const employeeRecords = employees
        .filter((emp) => emp.isActive)
        .map((emp) => ({
          employee: emp,
          attendance: employeeAttendanceMap.get(emp.id) || null,
        }));

      // Calculate stats
      const stats = {
        present: employeeRecords.filter((r) => r.attendance?.status === "PRESENT").length,
        late: employeeRecords.filter((r) => r.attendance?.status === "LATE").length,
        absent: employeeRecords.filter((r) => !r.attendance || r.attendance?.status === "ABSENT").length,
        total: employeeRecords.length,
      };

      result.push({
        date,
        employees: employeeRecords,
        stats,
      });
    });

    return result;
  }, [attendances, employees, startDate, endDate]);

  // Auto-expand first date by default
  useEffect(() => {
    if (groupedByDate.length > 0 && expandedDates.size === 0) {
      setExpandedDates(new Set([groupedByDate[0].date]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedByDate.length]);

  return (
    <div className="space-y-4">
      {groupedByDate.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-[#64748B] dark:text-[#94A3B8] mx-auto mb-4" />
          <p className="text-lg font-medium text-[#0F172A] dark:text-[#F1F5F9]">
            No attendance records found for the selected date range
          </p>
        </div>
      ) : (
        groupedByDate.map((dateGroup) => {
          const isExpanded = expandedDates.has(dateGroup.date);
          const dateObj = new Date(dateGroup.date);
          const formattedDate = formatDate(dateGroup.date);
          const dayOfWeek = getDayOfWeek(dateGroup.date);

          return (
            <div
              key={dateGroup.date}
              className="border border-[#E2E8F0] dark:border-[#334155] rounded-lg bg-white dark:bg-[#1E293B] overflow-hidden"
            >
              {/* Date Header - Collapsible */}
              <button
                onClick={() => toggleDate(dateGroup.date)}
                className="w-full p-4 bg-[#F8FAFC] dark:bg-[#0F172A] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-colors flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#334155]"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-[#64748B] dark:text-[#94A3B8]" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-[#64748B] dark:text-[#94A3B8]" />
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                      {formattedDate}
                    </h3>
                    <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">{dayOfWeek}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Date Summary Stats */}
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-[#10B981]" />
                      <span className="text-[#0F172A] dark:text-[#F1F5F9] font-medium">
                        {dateGroup.stats.present}
                      </span>
                      <span className="text-[#64748B] dark:text-[#94A3B8]">Present</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-4 w-4 text-[#F59E0B]" />
                      <span className="text-[#0F172A] dark:text-[#F1F5F9] font-medium">
                        {dateGroup.stats.late}
                      </span>
                      <span className="text-[#64748B] dark:text-[#94A3B8]">Late</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <XCircle className="h-4 w-4 text-[#EF4444]" />
                      <span className="text-[#0F172A] dark:text-[#F1F5F9] font-medium">
                        {dateGroup.stats.absent}
                      </span>
                      <span className="text-[#64748B] dark:text-[#94A3B8]">Absent</span>
                    </div>
                    <div className="text-[#64748B] dark:text-[#94A3B8]">
                      ({dateGroup.stats.total} Total)
                    </div>
                  </div>
                </div>
              </button>

              {/* Employee List - Expandable */}
              {isExpanded && (
                <div className="divide-y divide-[#E2E8F0] dark:divide-[#334155]">
                  {dateGroup.employees.map((record) => {
                    const attendance = record.attendance;
                    const employee = record.employee;
                    const hours = attendance
                      ? calculateHoursWorked(attendance.checkIn, attendance.checkOut)
                      : 0;
                    const isRowExpanded = attendance && expandedRows.has(attendance.id);
                    const status = attendance?.status || "ABSENT";

                    return (
                      <Fragment key={employee.id}>
                        <div
                          className={cn(
                            "p-4 hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors",
                            attendance && "cursor-pointer"
                          )}
                          onClick={() => attendance && toggleRow(attendance.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              {/* Employee Info */}
                              <div className="flex items-center gap-3 flex-1">
                                {employee.faceImageUrl ? (
                                  <img
                                    src={employee.faceImageUrl}
                                    alt={employee.name}
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center text-white font-semibold">
                                    {employee.name?.charAt(0).toUpperCase() || "E"}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">
                                    {employee.name}
                                  </p>
                                  <p className="text-sm text-[#64748B] dark:text-[#94A3B8] truncate">
                                    {employee.email}
                                  </p>
                                  {employee.department && (
                                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                                      {employee.department}
                                      {employee.position && ` • ${employee.position}`}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Attendance Details */}
                              <div className="flex items-center gap-6">
                                {/* Check In */}
                                <div className="text-sm">
                                  {attendance?.checkIn ? (
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-[#10B981]" />
                                      <span className="text-[#10B981] font-medium">
                                        {formatTime(attendance.checkIn)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[#64748B] dark:text-[#94A3B8]">-</span>
                                  )}
                                </div>

                                {/* Check Out */}
                                <div className="text-sm">
                                  {attendance?.checkOut ? (
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-[#2563EB] dark:text-[#3B82F6]" />
                                      <span className="text-[#2563EB] dark:text-[#3B82F6] font-medium">
                                        {formatTime(attendance.checkOut)}
                                      </span>
                                    </div>
                                  ) : attendance?.checkIn ? (
                                    <span className="text-[#F59E0B] text-sm">Pending</span>
                                  ) : (
                                    <span className="text-[#64748B] dark:text-[#94A3B8]">-</span>
                                  )}
                                </div>

                                {/* Hours */}
                                <div className="text-sm">
                                  <span className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">
                                    {hours > 0 ? formatHours(hours) : "-"}
                                  </span>
                                </div>

                                {/* Status */}
                                <div>{getStatusBadge(status)}</div>

                                {/* Expand Button */}
                                {attendance && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleRow(attendance.id);
                                    }}
                                  >
                                    {isRowExpanded ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {attendance && isRowExpanded && (
                          <div className="p-4 bg-[#F8FAFC] dark:bg-[#1E293B] border-t border-[#E2E8F0] dark:border-[#334155]">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <h4 className="font-semibold mb-2 text-sm text-[#0F172A] dark:text-[#F1F5F9]">
                                  Employee Info
                                </h4>
                                <div className="space-y-1 text-sm">
                                  <p className="text-[#64748B] dark:text-[#94A3B8]">
                                    <span className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">ID:</span>{" "}
                                    {employee.employeeId || "N/A"}
                                  </p>
                                  <p className="text-[#64748B] dark:text-[#94A3B8]">
                                    <span className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">Department:</span>{" "}
                                    {employee.department || "N/A"}
                                  </p>
                                  <p className="text-[#64748B] dark:text-[#94A3B8]">
                                    <span className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">Position:</span>{" "}
                                    {employee.position || "N/A"}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2 text-sm text-[#0F172A] dark:text-[#F1F5F9]">
                                  Location & Notes
                                </h4>
                                <div className="space-y-2 text-sm">
                                  {attendance.location && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4 text-[#64748B] dark:text-[#94A3B8]" />
                                      <span className="text-[#64748B] dark:text-[#94A3B8]">{attendance.location}</span>
                                    </div>
                                  )}
                                  {attendance.checkInLat && attendance.checkInLng && (
                                    <div className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                                      Check-in: {attendance.checkInLat.toFixed(4)}, {attendance.checkInLng.toFixed(4)}
                                    </div>
                                  )}
                                  {attendance.notes && (
                                    <div className="text-[#64748B] dark:text-[#94A3B8]">
                                      <span className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">Notes: </span>
                                      {attendance.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2 text-sm text-[#0F172A] dark:text-[#F1F5F9]">
                                  Images
                                </h4>
                                <div className="flex gap-2">
                                  {attendance.checkInImage && (
                                    <div className="relative group">
                                      <img
                                        src={attendance.checkInImage}
                                        alt="Check-in"
                                        className="h-20 w-20 rounded object-cover cursor-pointer border border-[#E2E8F0] dark:border-[#334155]"
                                        onClick={() => window.open(attendance.checkInImage, "_blank")}
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded flex items-center justify-center">
                                        <ImageIcon className="h-4 w-4 text-white opacity-0 group-hover:opacity-100" />
                                      </div>
                                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">Check In</p>
                                    </div>
                                  )}
                                  {attendance.checkOutImage && (
                                    <div className="relative group">
                                      <img
                                        src={attendance.checkOutImage}
                                        alt="Check-out"
                                        className="h-20 w-20 rounded object-cover cursor-pointer border border-[#E2E8F0] dark:border-[#334155]"
                                        onClick={() => window.open(attendance.checkOutImage, "_blank")}
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded flex items-center justify-center">
                                        <ImageIcon className="h-4 w-4 text-white opacity-0 group-hover:opacity-100" />
                                      </div>
                                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">Check Out</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
