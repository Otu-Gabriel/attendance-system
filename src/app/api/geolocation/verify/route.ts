import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWithinRadius } from "@/lib/geolocation";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { latitude, longitude } = await req.json();

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    // Get active location settings
    const locationSettings = await prisma.locationSetting.findMany({
      where: { isActive: true },
    });

    if (locationSettings.length === 0) {
      return NextResponse.json(
        { error: "No location settings configured" },
        { status: 400 }
      );
    }

    // Check if user is within any allowed location
    const isWithinAllowedLocation = locationSettings.some((location) =>
      isWithinRadius(
        latitude,
        longitude,
        location.latitude,
        location.longitude,
        location.radius
      )
    );

    if (!isWithinAllowedLocation) {
      const nearestLocation = locationSettings.reduce((prev, curr) => {
        const prevDist = Math.abs(prev.latitude - latitude) + Math.abs(prev.longitude - longitude);
        const currDist = Math.abs(curr.latitude - latitude) + Math.abs(curr.longitude - longitude);
        return currDist < prevDist ? curr : prev;
      });

      return NextResponse.json(
        {
          error: "You are not within the allowed location",
          allowedLocations: locationSettings.map((loc) => ({
            name: loc.name,
            address: loc.address,
            latitude: loc.latitude,
            longitude: loc.longitude,
            radius: loc.radius,
          })),
          nearestLocation: {
            name: nearestLocation.name,
            distance: Math.abs(nearestLocation.latitude - latitude) + Math.abs(nearestLocation.longitude - longitude),
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Location verified",
    });
  } catch (error) {
    console.error("Geolocation verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
