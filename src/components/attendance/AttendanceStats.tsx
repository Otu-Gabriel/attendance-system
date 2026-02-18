"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Calendar, Clock, TrendingUp, CheckCircle } from "lucide-react";
import { calculateHoursWorked, formatHours } from "@/lib/utils";

interface AttendanceStatsProps {
  attendances: any[];
}

export default function AttendanceStats({ attendances }: AttendanceStatsProps) {
  const stats = {
    totalDays: attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length,
    totalHours: attendances.reduce((sum, a) => {
      return sum + calculateHoursWorked(a.checkIn, a.checkOut);
    }, 0),
    averageHours: 0,
    onTimePercentage: 0,
    lateCount: attendances.filter((a) => a.status === "LATE").length,
    absentCount: attendances.filter((a) => a.status === "ABSENT").length,
    incompleteCount: attendances.filter((a) => a.checkIn && !a.checkOut).length,
  };

  stats.averageHours = stats.totalDays > 0 ? stats.totalHours / stats.totalDays : 0;
  stats.onTimePercentage =
    attendances.length > 0
      ? Math.round(
          ((stats.totalDays - stats.lateCount) / attendances.length) * 100
        )
      : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Days</p>
              <p className="text-2xl font-bold mt-1">{stats.totalDays}</p>
              <p className="text-xs text-gray-500 mt-1">
                {attendances.length} records
              </p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Hours</p>
              <p className="text-2xl font-bold mt-1">
                {formatHours(stats.totalHours)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Avg: {formatHours(stats.averageHours)}
              </p>
            </div>
            <Clock className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">On-Time Rate</p>
              <p className="text-2xl font-bold mt-1">{stats.onTimePercentage}%</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.lateCount} late arrival{stats.lateCount !== 1 ? "s" : ""}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <p className="text-2xl font-bold mt-1">
                {stats.absentCount === 0 ? "Perfect" : `${stats.absentCount} Absent`}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.incompleteCount > 0 && `${stats.incompleteCount} incomplete`}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
