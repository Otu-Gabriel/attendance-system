"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Users, Clock, TrendingUp, CheckCircle } from "lucide-react";
import { calculateHoursWorked, formatHours } from "@/lib/utils";

interface AdminAttendanceStatsProps {
  attendances: any[];
}

export default function AdminAttendanceStats({ attendances }: AdminAttendanceStatsProps) {
  const uniqueEmployees = new Set(attendances.map((a) => a.userId)).size;
  
  const stats = {
    totalRecords: attendances.length,
    uniqueEmployees,
    totalHours: attendances.reduce((sum, a) => {
      return sum + calculateHoursWorked(a.checkIn, a.checkOut);
    }, 0),
    presentCount: attendances.filter((a) => a.status === "PRESENT").length,
    lateCount: attendances.filter((a) => a.status === "LATE").length,
    absentCount: attendances.filter((a) => a.status === "ABSENT").length,
    incompleteCount: attendances.filter((a) => a.checkIn && !a.checkOut).length,
  };

  const averageHours = stats.totalRecords > 0 ? stats.totalHours / stats.totalRecords : 0;
  const attendanceRate = stats.totalRecords > 0
    ? Math.round(((stats.presentCount + stats.lateCount) / stats.totalRecords) * 100)
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Total Records</p>
              <p className="text-2xl font-bold mt-1 text-[#0F172A] dark:text-[#F1F5F9]">{stats.totalRecords}</p>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                {stats.uniqueEmployees} employee{stats.uniqueEmployees !== 1 ? "s" : ""}
              </p>
            </div>
            <Users className="h-8 w-8 text-[#2563EB] dark:text-[#3B82F6]" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Total Hours</p>
              <p className="text-2xl font-bold mt-1 text-[#0F172A] dark:text-[#F1F5F9]">
                {formatHours(stats.totalHours)}
              </p>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                Avg: {formatHours(averageHours)}
              </p>
            </div>
            <Clock className="h-8 w-8 text-[#10B981] dark:text-[#10B981]" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] font-medium">Attendance Rate</p>
              <p className="text-2xl font-bold mt-1 text-[#0F172A] dark:text-[#F1F5F9]">{attendanceRate}%</p>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                {stats.presentCount} present, {stats.lateCount} late
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
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Issues</p>
              <p className="text-2xl font-bold mt-1 text-[#0F172A] dark:text-[#F1F5F9]">
                {stats.absentCount + stats.incompleteCount}
              </p>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                {stats.absentCount} absent, {stats.incompleteCount} incomplete
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-[#F59E0B] dark:text-[#F59E0B]" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
