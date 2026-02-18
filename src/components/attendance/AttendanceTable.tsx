"use client";

import { useState, useMemo, Fragment } from "react";
import { formatDate, formatTime, getDayOfWeek, calculateHoursWorked, formatHours, groupByWeek, groupByMonth } from "@/lib/utils";
import { ChevronDown, ChevronUp, Clock, MapPin, Image as ImageIcon } from "lucide-react";
import Button from "@/components/ui/Button";

interface AttendanceTableProps {
  attendances: any[];
  groupBy?: "none" | "week" | "month";
  sortBy?: "date" | "hours" | "status";
  sortOrder?: "asc" | "desc";
}

export default function AttendanceTable({
  attendances,
  groupBy = "none",
  sortBy = "date",
  sortOrder = "desc",
}: AttendanceTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState({ sortBy, sortOrder });

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleSort = (column: "date" | "hours" | "status") => {
    setSortConfig({
      sortBy: column,
      sortOrder: sortConfig.sortBy === column && sortConfig.sortOrder === "desc" ? "asc" : "desc",
    });
  };

  const sortedAttendances = [...attendances].sort((a, b) => {
    let comparison = 0;
    
    switch (sortConfig.sortBy) {
      case "date":
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case "hours":
        const hoursA = calculateHoursWorked(a.checkIn, a.checkOut);
        const hoursB = calculateHoursWorked(b.checkIn, b.checkOut);
        comparison = hoursA - hoursB;
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
    }
    
    return sortConfig.sortOrder === "asc" ? comparison : -comparison;
  });

  // Group attendances if needed
  const groupedData = useMemo(() => {
    if (groupBy === "week") {
      return groupByWeek(sortedAttendances);
    } else if (groupBy === "month") {
      return groupByMonth(sortedAttendances);
    }
    return { "all": sortedAttendances };
  }, [sortedAttendances, groupBy]);

  const formatGroupHeader = (key: string) => {
    if (groupBy === "week") {
      const date = new Date(key);
      const weekEnd = new Date(date);
      weekEnd.setDate(date.getDate() + 6);
      return `Week of ${formatDate(date)} - ${formatDate(weekEnd)}`;
    } else if (groupBy === "month") {
      const [year, month] = key.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    return "";
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

  const SortableHeader = ({ column, children }: { column: "date" | "hours" | "status"; children: React.ReactNode }) => (
    <th
      className="text-left p-3 cursor-pointer hover:bg-[#F1F5F9] dark:hover:bg-[#334155] select-none transition-colors"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-2 text-[#0F172A] dark:text-[#F1F5F9]">
        {children}
        {sortConfig.sortBy === column && (
          sortConfig.sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </th>
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B]">
      <table className="w-full">
        <thead className="bg-[#F8FAFC] dark:bg-[#0F172A] sticky top-0 border-b border-[#E2E8F0] dark:border-[#334155]">
          <tr className="border-b">
            <th className="text-left p-3 w-12"></th>
            <SortableHeader column="date">
              <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">Date</span>
            </SortableHeader>
            <th className="text-left p-3 font-semibold text-[#0F172A] dark:text-[#F1F5F9]">Check In</th>
            <th className="text-left p-3 font-semibold text-[#0F172A] dark:text-[#F1F5F9]">Check Out</th>
            <SortableHeader column="status">
              <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">Status</span>
            </SortableHeader>
            <SortableHeader column="hours">
              <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">Hours</span>
            </SortableHeader>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-[#1E293B]">
          {Object.entries(groupedData).map(([groupKey, groupAttendances]: [string, any[]]) => (
            <Fragment key={groupKey}>
              {groupBy !== "none" && (
                <tr className="bg-[#F1F5F9] dark:bg-[#334155]">
                  <td colSpan={6} className="p-3 font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                    {formatGroupHeader(groupKey)}
                    <span className="ml-2 text-sm font-normal text-[#64748B] dark:text-[#94A3B8]">
                      ({groupAttendances.length} record{groupAttendances.length !== 1 ? "s" : ""})
                    </span>
                  </td>
                </tr>
              )}
              {groupAttendances.map((attendance) => {
            const hours = calculateHoursWorked(attendance.checkIn, attendance.checkOut);
            const isExpanded = expandedRows.has(attendance.id);
            const isIncomplete = attendance.checkIn && !attendance.checkOut;

            return (
              <Fragment key={attendance.id}>
                <tr
                  className="bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#334155] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors cursor-pointer"
                  onClick={() => toggleRow(attendance.id)}
                >
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRow(attendance.id);
                      }}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </td>
                  <td className="p-3">
                    <div>
                      <p className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">{formatDate(attendance.date)}</p>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{getDayOfWeek(attendance.date)}</p>
                    </div>
                  </td>
                  <td className="p-3">
                    {attendance.checkIn ? (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#10B981]" />
                        <span className="text-[#10B981] font-medium">
                          {formatTime(attendance.checkIn)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[#64748B] dark:text-[#94A3B8]">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    {attendance.checkOut ? (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#2563EB] dark:text-[#3B82F6]" />
                        <span className="text-[#2563EB] dark:text-[#3B82F6] font-medium">
                          {formatTime(attendance.checkOut)}
                        </span>
                      </div>
                    ) : isIncomplete ? (
                      <span className="text-[#F59E0B] text-sm">Pending</span>
                    ) : (
                      <span className="text-[#94A3B8] dark:text-[#64748B]">-</span>
                    )}
                  </td>
                  <td className="p-3">{getStatusBadge(attendance.status)}</td>
                  <td className="p-3">
                    <span className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">
                      {formatHours(hours)}
                    </span>
                  </td>
                </tr>
                {isExpanded && (
                  <tr key={`${attendance.id}-details`} className="bg-[#F8FAFC] dark:bg-[#1E293B]">
                    <td colSpan={6} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2 text-sm">Details</h4>
                          <div className="space-y-2 text-sm">
                            {attendance.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-[#64748B] dark:text-[#94A3B8]" />
                                <span>{attendance.location}</span>
                              </div>
                            )}
                            {attendance.notes && (
                              <div>
                                <span className="font-medium">Notes: </span>
                                <span>{attendance.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2 text-sm">Images</h4>
                          <div className="flex gap-2">
                            {attendance.checkInImage && (
                              <div className="relative group">
                                <img
                                  src={attendance.checkInImage}
                                  alt="Check-in"
                                  className="h-20 w-20 rounded object-cover cursor-pointer"
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
                                  className="h-20 w-20 rounded object-cover cursor-pointer"
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
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
