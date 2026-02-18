import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/attendance-settings
 * Get current attendance settings
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active settings or create default if none exist
    let settings = await prisma.attendanceSettings.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    if (!settings) {
      // Create default settings
      settings = await prisma.attendanceSettings.create({
        data: {
          checkInLatestBy: "09:00",
          permitDurationMinutes: 30,
          autoMarkAbsentEnabled: true,
          isActive: true,
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Get attendance settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/attendance-settings
 * Create or update attendance settings
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      checkInLatestBy,
      permitDurationMinutes,
      autoMarkAbsentEnabled,
      checkOutLatestBy,
    } = body;

    // Validate time format (HH:mm)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(checkInLatestBy)) {
      return NextResponse.json(
        { error: "Invalid checkInLatestBy format. Use HH:mm (24-hour format)" },
        { status: 400 }
      );
    }

    if (checkOutLatestBy && !timeRegex.test(checkOutLatestBy)) {
      return NextResponse.json(
        { error: "Invalid checkOutLatestBy format. Use HH:mm (24-hour format)" },
        { status: 400 }
      );
    }

    if (
      permitDurationMinutes < 0 ||
      permitDurationMinutes > 1440 ||
      !Number.isInteger(permitDurationMinutes)
    ) {
      return NextResponse.json(
        { error: "permitDurationMinutes must be an integer between 0 and 1440" },
        { status: 400 }
      );
    }

    // Deactivate all existing settings
    await prisma.attendanceSettings.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new active settings
    const settings = await prisma.attendanceSettings.create({
      data: {
        checkInLatestBy,
        permitDurationMinutes: permitDurationMinutes || 0,
        autoMarkAbsentEnabled: autoMarkAbsentEnabled !== false,
        checkOutLatestBy: checkOutLatestBy || null,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Attendance settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Update attendance settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
