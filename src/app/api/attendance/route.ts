import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stringToDescriptor, isFaceMatch } from "@/lib/face-recognition";
import { isWithinRadius } from "@/lib/geolocation";

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

    if (!attendance) {
      // Create new attendance record
      attendance = await prisma.attendance.create({
        data: {
          userId: user.id,
          date: today,
          checkIn: type === "checkin" ? now : null,
          checkOut: type === "checkout" ? now : null,
          checkInImage: type === "checkin" ? imageData : null,
          checkOutImage: type === "checkout" ? imageData : null,
          checkInLat: type === "checkin" ? latitude : null,
          checkInLng: type === "checkin" ? longitude : null,
          checkOutLat: type === "checkout" ? latitude : null,
          checkOutLng: type === "checkout" ? longitude : null,
          status: "PRESENT",
        },
      });
    } else {
      // Update existing attendance record
      if (type === "checkin" && !attendance.checkIn) {
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
      } else if (type === "checkout" && !attendance.checkOut) {
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
          {
            error:
              type === "checkin"
                ? "Already checked in today"
                : "Already checked out today",
          },
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
