import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stringToDescriptor, isFaceMatch } from "@/lib/face-recognition";
import { isWithinRadius } from "@/lib/geolocation";
import { determineAttendanceStatus } from "@/lib/attendance-rules";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageData, descriptor, latitude, longitude, type } = await req.json();

    if (!imageData || !descriptor || !latitude || !longitude || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (type !== "checkin" && type !== "checkout") {
      return NextResponse.json(
        { error: "Invalid attendance type" },
        { status: 400 }
      );
    }

    // Get user with face descriptor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        faceDescriptor: true,
        role: true,
      },
    });

    if (!user || !user.faceDescriptor) {
      return NextResponse.json(
        { error: "Face data not registered. Please contact admin." },
        { status: 400 }
      );
    }

    // Verify face match
    const userDescriptor = stringToDescriptor(user.faceDescriptor);
    const capturedDescriptor = new Float32Array(Object.values(descriptor));
    const faceMatch = isFaceMatch(userDescriptor, capturedDescriptor, 0.6);

    if (!faceMatch) {
      return NextResponse.json(
        { error: "Face not recognized. Please try again." },
        { status: 403 }
      );
    }

    // Verify geolocation
    const locationSettings = await prisma.locationSetting.findMany({
      where: { isActive: true },
    });

    if (locationSettings.length === 0) {
      return NextResponse.json(
        { error: "No location settings configured. Please contact admin." },
        { status: 400 }
      );
    }

    const isWithinAllowedLocation = locationSettings.some((location: any) =>
      isWithinRadius(
        latitude,
        longitude,
        location.latitude,
        location.longitude,
        location.radius
      )
    );

    if (!isWithinAllowedLocation) {
      return NextResponse.json(
        {
          error: "You are not within the allowed location",
          allowedLocations: locationSettings.map((loc: any) => ({
            name: loc.name,
            address: loc.address,
          })),
        },
        { status: 403 }
      );
    }

    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find or create today's attendance record
    let attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
    });

    const now = new Date();

    // Get attendance settings for check-in time validation
    const attendanceSettings = await prisma.attendanceSettings.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    // If checking in, validate time rules
    if (type === "checkin") {
      if (attendanceSettings) {
        const timeValidation = determineAttendanceStatus(now, {
          checkInLatestBy: attendanceSettings.checkInLatestBy,
          permitDurationMinutes: attendanceSettings.permitDurationMinutes,
          autoMarkAbsentEnabled: attendanceSettings.autoMarkAbsentEnabled,
          checkOutLatestBy: attendanceSettings.checkOutLatestBy || undefined,
        });

        if (!timeValidation.canMark) {
          // Check if already marked as absent
          if (attendance && attendance.status === "ABSENT") {
            return NextResponse.json(
              {
                error: timeValidation.message || "Cannot mark attendance. You have been marked as ABSENT.",
              },
              { status: 403 }
            );
          }

          // Mark as absent if auto-mark is enabled
          if (attendanceSettings.autoMarkAbsentEnabled) {
            if (!attendance) {
              await prisma.attendance.create({
                data: {
                  userId: user.id,
                  date: today,
                  status: "ABSENT",
                },
              });
            } else {
              await prisma.attendance.update({
                where: { id: attendance.id },
                data: { status: "ABSENT" },
              });
            }
          }

          return NextResponse.json(
            {
              error: timeValidation.message || "Check-in time has passed. Cannot mark attendance.",
            },
            { status: 403 }
          );
        }

        // Determine status based on time
        const attendanceStatus = timeValidation.status;
        
        if (!attendance) {
          // Create new attendance record with determined status
          attendance = await prisma.attendance.create({
            data: {
              userId: user.id,
              date: today,
              checkIn: now,
              checkInImage: imageData,
              checkInLat: latitude,
              checkInLng: longitude,
              status: attendanceStatus,
            },
          });
        } else {
          // Update existing attendance record
          if (!attendance.checkIn) {
            attendance = await prisma.attendance.update({
              where: { id: attendance.id },
              data: {
                checkIn: now,
                checkInImage: imageData,
                checkInLat: latitude,
                checkInLng: longitude,
                status: attendanceStatus,
              },
            });
          } else {
            return NextResponse.json(
              { error: "Already checked in today" },
              { status: 400 }
            );
          }
        }
      } else {
        // No settings configured, use default behavior
        if (!attendance) {
          attendance = await prisma.attendance.create({
            data: {
              userId: user.id,
              date: today,
              checkIn: now,
              checkInImage: imageData,
              checkInLat: latitude,
              checkInLng: longitude,
              status: "PRESENT",
            },
          });
        } else {
          if (!attendance.checkIn) {
            attendance = await prisma.attendance.update({
              where: { id: attendance.id },
              data: {
                checkIn: now,
                checkInImage: imageData,
                checkInLat: latitude,
                checkInLng: longitude,
                status: "PRESENT",
              },
            });
          } else {
            return NextResponse.json(
              { error: "Already checked in today" },
              { status: 400 }
            );
          }
        }
      }
    } else {
      // Checkout logic (no time restrictions for now)
      if (!attendance) {
        return NextResponse.json(
          { error: "Please check in first before checking out" },
          { status: 400 }
        );
      }

      if (!attendance.checkOut) {
        attendance = await prisma.attendance.update({
          where: { id: attendance.id },
          data: {
            checkOut: now,
            checkOutImage: imageData,
            checkOutLat: latitude,
            checkOutLng: longitude,
          },
        });
      } else {
        return NextResponse.json(
          { error: "Already checked out today" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${type === "checkin" ? "checked in" : "checked out"}`,
      attendance,
    });
  } catch (error) {
    console.error("Attendance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Admins can view all, employees can only view their own
    const where: any = {};
    
    if (session.user.role === "ADMIN") {
      // Admin: if userId is specified, filter by that user, otherwise show all
      if (userId) {
        where.userId = userId;
      }
    } else {
      // Employee: can only view their own attendance
      where.userId = session.user.id;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            department: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json({ attendances });
  } catch (error) {
    console.error("Get attendance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
