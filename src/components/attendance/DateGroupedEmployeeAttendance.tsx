"use client";

import { useState, useMemo, useEffect } from "react";
import { formatDate, formatTime, getDayOfWeek, calculateHoursWorked, formatHours } from "@/lib/utils";
import { ChevronDown, ChevronRight, Clock, MapPin, Image as ImageIcon, CheckCircle, XCircle, AlertCircle, Calendar } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface DateGroupedEmployeeAttendanceProps {
  attendances: any[];
}

export default function DateGroupedEmployeeAttendance({
  attendances,
}: DateGroupedEmployeeAttendanceProps) {
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

  // Group attendances by date
  const groupedByDate = useMemo(() => {
    const dateMap = new Map<string, any[]>();
    
    attendances.forEach((att) => {
      const dateKey = new Date(att.date).toISOString().split("T")[0];
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(att);
    });

    const dates = Array.from(dateMap.keys()).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    return dates.map((date) => {
      const dateAttendances = dateMap.get(date)!;
      const stats = {
        present: dateAttendances.filter((a) => a.status === "PRESENT").length,
        late: dateAttendances.filter((a) => a.status === "LATE").length,
        absent: dateAttendances.filter((a) => a.status === "ABSENT").length,
        total: dateAttendances.length,
      };

      return {
        date,
        attendances: dateAttendances,
        stats,
      };
    });
  }, [attendances]);

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
            No attendance records found
          </p>
        </div>
      ) : (
        groupedByDate.map((dateGroup) => {
          const isExpanded = expandedDates.has(dateGroup.date);
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
                    {dateGroup.stats.late > 0 && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-4 w-4 text-[#F59E0B]" />
                        <span className="text-[#0F172A] dark:text-[#F1F5F9] font-medium">
                          {dateGroup.stats.late}
                        </span>
                        <span className="text-[#64748B] dark:text-[#94A3B8]">Late</span>
                      </div>
                    )}
                    {dateGroup.stats.absent > 0 && (
                      <div className="flex items-center gap-1">
                        <XCircle className="h-4 w-4 text-[#EF4444]" />
                        <span className="text-[#0F172A] dark:text-[#F1F5F9] font-medium">
                          {dateGroup.stats.absent}
                        </span>
                        <span className="text-[#64748B] dark:text-[#94A3B8]">Absent</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>

              {/* Attendance Records - Expandable */}
              {isExpanded && (
                <div className="divide-y divide-[#E2E8F0] dark:divide-[#334155]">
                  {dateGroup.attendances.map((attendance) => {
                    const hours = calculateHoursWorked(attendance.checkIn, attendance.checkOut);
                    const isRowExpanded = expandedRows.has(attendance.id);
                    const isIncomplete = attendance.checkIn && !attendance.checkOut;

                    return (
                      <div key={attendance.id}>
                        <div
                          className="p-4 hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors cursor-pointer"
                          onClick={() => toggleRow(attendance.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6 flex-1">
                              {/* Check In */}
                              <div className="text-sm">
                                {attendance.checkIn ? (
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-[#10B981]" />
                                    <div>
                                      <p className="text-[#10B981] font-medium">
                                        {formatTime(attendance.checkIn)}
                                      </p>
                                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Check In</p>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[#64748B] dark:text-[#94A3B8]">-</span>
                                )}
                              </div>

                              {/* Check Out */}
                              <div className="text-sm">
                                {attendance.checkOut ? (
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-[#2563EB] dark:text-[#3B82F6]" />
                                    <div>
                                      <p className="text-[#2563EB] dark:text-[#3B82F6] font-medium">
                                        {formatTime(attendance.checkOut)}
                                      </p>
                                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Check Out</p>
                                    </div>
                                  </div>
                                ) : isIncomplete ? (
                                  <span className="text-[#F59E0B] text-sm font-medium">Pending</span>
                                ) : (
                                  <span className="text-[#64748B] dark:text-[#94A3B8]">-</span>
                                )}
                              </div>

                              {/* Hours */}
                              <div className="text-sm">
                                <p className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">
                                  {hours > 0 ? formatHours(hours) : "-"}
                                </p>
                                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Hours</p>
                              </div>

                              {/* Status */}
                              <div>{getStatusBadge(attendance.status)}</div>
                            </div>

                            {/* Expand Button */}
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
                                <ChevronDown className="h-4 w-4 rotate-180" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isRowExpanded && (
                          <div className="p-4 bg-[#F8FAFC] dark:bg-[#1E293B] border-t border-[#E2E8F0] dark:border-[#334155]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      </div>
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
