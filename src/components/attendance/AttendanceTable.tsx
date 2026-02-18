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
      PRESENT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      LATE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      ABSENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      EARLY_LEAVE: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      HALF_DAY: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    };
    
    return (
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${styles[status as keyof typeof styles] || styles.PRESENT}`}>
        {status.replace("_", " ")}
      </span>
    );
  };

  const SortableHeader = ({ column, children }: { column: "date" | "hours" | "status"; children: React.ReactNode }) => (
    <th
      className="text-left p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortConfig.sortBy === column && (
          sortConfig.sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
          <tr className="border-b">
            <th className="text-left p-3 w-12"></th>
            <SortableHeader column="date">
              <span className="font-semibold">Date</span>
            </SortableHeader>
            <th className="text-left p-3 font-semibold">Check In</th>
            <th className="text-left p-3 font-semibold">Check Out</th>
            <SortableHeader column="status">
              <span className="font-semibold">Status</span>
            </SortableHeader>
            <SortableHeader column="hours">
              <span className="font-semibold">Hours</span>
            </SortableHeader>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groupedData).map(([groupKey, groupAttendances]: [string, any[]]) => (
            <Fragment key={groupKey}>
              {groupBy !== "none" && (
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <td colSpan={6} className="p-3 font-semibold">
                    {formatGroupHeader(groupKey)}
                    <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
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
              <>
                <tr
                  key={attendance.id}
                  className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
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
                      <p className="font-medium">{formatDate(attendance.date)}</p>
                      <p className="text-xs text-gray-500">{getDayOfWeek(attendance.date)}</p>
                    </div>
                  </td>
                  <td className="p-3">
                    {attendance.checkIn ? (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-600" />
                        <span className="text-green-600 font-medium">
                          {formatTime(attendance.checkIn)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    {attendance.checkOut ? (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-600 font-medium">
                          {formatTime(attendance.checkOut)}
                        </span>
                      </div>
                    ) : isIncomplete ? (
                      <span className="text-orange-500 text-sm">Pending</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-3">{getStatusBadge(attendance.status)}</td>
                  <td className="p-3">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {formatHours(hours)}
                    </span>
                  </td>
                </tr>
                {isExpanded && (
                  <tr key={`${attendance.id}-details`} className="bg-gray-50 dark:bg-gray-900">
                    <td colSpan={6} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2 text-sm">Details</h4>
                          <div className="space-y-2 text-sm">
                            {attendance.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-500" />
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
                                <p className="text-xs text-gray-500 mt-1">Check In</p>
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
                                <p className="text-xs text-gray-500 mt-1">Check Out</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
