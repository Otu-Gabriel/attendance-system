"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import FaceRecognition from "@/components/face-recognition/FaceRecognition";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getCurrentLocation } from "@/lib/geolocation";
import toast from "react-hot-toast";
import { formatDateTime } from "@/lib/utils";
import { MapPin, Clock, CheckCircle, XCircle } from "lucide-react";

export default function EmployeeAttendancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userFaceDescriptor, setUserFaceDescriptor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [locationStatus, setLocationStatus] = useState<"checking" | "allowed" | "denied">("checking");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchUserData();
      fetchTodayAttendance();
      checkLocation();
    }
  }, [status, router]);

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setUserFaceDescriptor(data.faceDescriptor);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/attendance?startDate=${today}&endDate=${today}`);
      if (res.ok) {
        const data = await res.json();
        if (data.attendances && data.attendances.length > 0) {
          setTodayAttendance(data.attendances[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  const checkLocation = async () => {
    setLocationStatus("checking");
    
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    const location = await getCurrentLocation();
    if (!location) {
      setLocationStatus("denied");
      toast.error("Could not get your location. Please enable location services and try again.");
      return;
    }

    try {
      const res = await fetch("/api/geolocation/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      });

      if (res.ok) {
        setLocationStatus("allowed");
        toast.success("Location verified successfully");
      } else {
        setLocationStatus("denied");
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Location not verified. Please ensure you are within the allowed location.");
      }
    } catch (error) {
      setLocationStatus("denied");
      console.error("Location verification error:", error);
      toast.error("Failed to verify location. Please try again.");
    }
  };

  const handleFaceMatch = async (imageData: string, descriptor?: Float32Array) => {
    if (locationStatus !== "allowed") {
      toast.error("Please verify your location first");
      // Try to verify location again
      await checkLocation();
      return;
    }

    // Get fresh location for attendance marking
    const location = await getCurrentLocation();
    if (!location) {
      toast.error("Could not get your location. Please enable location services and try again.");
      setLocationStatus("denied");
      return;
    }

    // Determine type based on current attendance status
    const type = todayAttendance?.checkIn ? "checkout" : "checkin";

    try {
      let faceDescriptor: Float32Array;
      
      if (descriptor) {
        faceDescriptor = descriptor;
      } else {
        // Extract descriptor from image
        const { extractFaceDescriptor } = await import("@/lib/face-recognition");
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageData;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const extracted = await extractFaceDescriptor(img);
        if (!extracted) {
          toast.error("Could not extract face descriptor");
          return;
        }
        faceDescriptor = extracted;
      }

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageData,
          descriptor: Array.from(faceDescriptor),
          latitude: location.latitude,
          longitude: location.longitude,
          type,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        fetchTodayAttendance();
      } else {
        toast.error(data.error || "Failed to mark attendance");
      }
    } catch (error) {
      console.error("Attendance error:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!userFaceDescriptor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Face Not Registered</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">
              Your face has not been registered yet. Please contact your administrator to register your face.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Mark Attendance</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Use facial recognition to check in or check out
        </p>
      </div>

      {/* Status Summary Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Status</p>
              <p className="text-2xl font-bold mt-1">
                {todayAttendance?.checkIn && todayAttendance?.checkOut
                  ? "✓ Completed"
                  : todayAttendance?.checkIn
                  ? "Checked In - Ready to Check Out"
                  : "Not Checked In"}
              </p>
            </div>
            <div className="text-right">
              {todayAttendance?.checkIn && !todayAttendance?.checkOut && (
                <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-lg">
                  <p className="font-semibold">Action Required</p>
                  <p className="text-sm">Please check out</p>
                </div>
              )}
              {todayAttendance?.checkIn && todayAttendance?.checkOut && (
                <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-4 py-2 rounded-lg">
                  <p className="font-semibold">All Done!</p>
                  <p className="text-sm">See you tomorrow</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {todayAttendance?.checkIn && !todayAttendance?.checkOut
                ? "Check Out"
                : todayAttendance?.checkIn && todayAttendance?.checkOut
                ? "Already Checked Out"
                : "Check In"}
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {todayAttendance?.checkIn && !todayAttendance?.checkOut
                ? "Capture your face to check out"
                : todayAttendance?.checkIn && todayAttendance?.checkOut
                ? "You have already checked in and out today"
                : "Capture your face to check in"}
            </p>
          </CardHeader>
          <CardContent>
            <FaceRecognition
              storedDescriptor={userFaceDescriptor}
              onMatch={handleFaceMatch}
              disabled={todayAttendance?.checkIn && todayAttendance?.checkOut}
              actionType={
                todayAttendance?.checkIn && !todayAttendance?.checkOut
                  ? "checkout"
                  : "checkin"
              }
            />
            {todayAttendance?.checkIn && todayAttendance?.checkOut && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ✓ You have completed your attendance for today. You can check in again tomorrow.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Location Status</CardTitle>
            </CardHeader>
            <CardContent>
              {locationStatus === "checking" && (
                <div className="flex items-center gap-2">
                  <Clock className="animate-spin" />
                  <p>Checking location...</p>
                </div>
              )}
              {locationStatus === "allowed" && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle />
                  <p>Location verified</p>
                </div>
              )}
              {locationStatus === "denied" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle />
                    <p>Location not verified</p>
                  </div>
                  <Button onClick={checkLocation} size="sm">
                    Retry Location Check
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              {todayAttendance ? (
                <div className="space-y-3">
                  {todayAttendance.checkIn && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Check In</p>
                      <p className="font-medium">
                        {formatDateTime(todayAttendance.checkIn)}
                      </p>
                    </div>
                  )}
                  {todayAttendance.checkOut && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Check Out</p>
                      <p className="font-medium">
                        {formatDateTime(todayAttendance.checkOut)}
                      </p>
                    </div>
                  )}
                  {!todayAttendance.checkIn && (
                    <p className="text-gray-500">Not checked in yet</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No attendance recorded today</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
