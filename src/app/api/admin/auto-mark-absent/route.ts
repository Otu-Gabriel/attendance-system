import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { shouldAutoMarkAbsent } from "@/lib/attendance-rules";

/**
 * POST /api/admin/auto-mark-absent
 * Manually trigger auto-mark absent for today
 * This can be called by a cron job or manually by admin
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active attendance settings
    const settings = await prisma.attendanceSettings.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    if (!settings || !settings.autoMarkAbsentEnabled) {
      return NextResponse.json({
        success: true,
        message: "Auto-mark absent is disabled",
        marked: 0,
      });
    }

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // Get all active employees
    const employees = await prisma.user.findMany({
      where: {
        role: "EMPLOYEE",
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    let markedCount = 0;

    // Check each employee
    for (const employee of employees) {
      // Check if employee has attendance record for today
      const attendance = await prisma.attendance.findUnique({
        where: {
          userId_date: {
            userId: employee.id,
            date: today,
          },
        },
      });

      const hasCheckedIn = attendance?.checkIn !== null;

      if (shouldAutoMarkAbsent(settings, hasCheckedIn)) {
        if (!attendance) {
          // Create absent record
          await prisma.attendance.create({
            data: {
              userId: employee.id,
              date: today,
              status: "ABSENT",
            },
          });
          markedCount++;
        } else if (attendance.status !== "ABSENT") {
          // Update existing record to absent
          await prisma.attendance.update({
            where: { id: attendance.id },
            data: { status: "ABSENT" },
          });
          markedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Auto-mark absent completed. ${markedCount} employee(s) marked as absent.`,
      marked: markedCount,
    });
  } catch (error) {
    console.error("Auto-mark absent error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
