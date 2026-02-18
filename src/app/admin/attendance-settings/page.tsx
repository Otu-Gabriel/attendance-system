"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Clock, Save, Info, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function AttendanceSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    checkInLatestBy: "09:00",
    permitDurationMinutes: 30,
    autoMarkAbsentEnabled: true,
    checkOutLatestBy: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/employee/dashboard");
      return;
    }

    if (status === "authenticated") {
      fetchSettings();
    }
  }, [status, session, router]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/attendance-settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings({
            checkInLatestBy: data.settings.checkInLatestBy || "09:00",
            permitDurationMinutes: data.settings.permitDurationMinutes || 30,
            autoMarkAbsentEnabled: data.settings.autoMarkAbsentEnabled !== false,
            checkOutLatestBy: data.settings.checkOutLatestBy || "",
          });
        }
      } else {
        toast.error("Failed to load settings");
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Error loading settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/attendance-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Attendance settings saved successfully!");
        fetchSettings();
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB] dark:border-[#3B82F6] mx-auto mb-4"></div>
          <p className="text-[#64748B] dark:text-[#94A3B8]">Loading settings...</p>
        </div>
      </div>
    );
  }

  // Calculate permit end time
  const [hours, minutes] = settings.checkInLatestBy.split(":").map(Number);
  const permitEndDate = new Date();
  permitEndDate.setHours(hours, minutes + settings.permitDurationMinutes, 0, 0);
  const permitEndTime = permitEndDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#2563EB] to-[#3B82F6] bg-clip-text text-transparent">
          Attendance Time Settings
        </h1>
        <p className="text-[#64748B] dark:text-[#94A3B8] mt-2 text-lg">
          Configure check-in/check-out time rules and auto-mark absent settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Check-In Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#0F172A] dark:text-[#F1F5F9]">
                Latest Check-In Time (24-hour format)
              </label>
              <Input
                type="time"
                value={settings.checkInLatestBy}
                onChange={(e) =>
                  setSettings({ ...settings, checkInLatestBy: e.target.value })
                }
                className="max-w-xs"
              />
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                Employees can mark attendance before this time. Status will be &quot;PRESENT&quot;
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#0F172A] dark:text-[#F1F5F9]">
                Permit Duration (minutes)
              </label>
              <Input
                type="number"
                min="0"
                max="1440"
                value={settings.permitDurationMinutes}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    permitDurationMinutes: parseInt(e.target.value) || 0,
                  })
                }
                className="max-w-xs"
              />
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                Grace period after latest check-in time. Employees checking in during this period will be marked as &quot;LATE&quot;.
                {settings.permitDurationMinutes > 0 && (
                  <span className="block mt-1 font-medium text-[#2563EB] dark:text-[#3B82F6]">
                    Permit ends at: {permitEndTime}
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-start gap-3 p-4 bg-[#F8FAFC] dark:bg-[#1E293B] rounded-lg border border-[#E2E8F0] dark:border-[#334155]">
              <input
                type="checkbox"
                id="autoMarkAbsent"
                checked={settings.autoMarkAbsentEnabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    autoMarkAbsentEnabled: e.target.checked,
                  })
                }
                className="mt-1 h-4 w-4 rounded border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB] dark:border-[#334155]"
              />
              <div className="flex-1">
                <label
                  htmlFor="autoMarkAbsent"
                  className="block text-sm font-medium text-[#0F172A] dark:text-[#F1F5F9] cursor-pointer"
                >
                  Auto-Mark Absent
                </label>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Automatically mark employees as &quot;ABSENT&quot; if they haven&apos;t checked in by the permit end time
                  {settings.permitDurationMinutes > 0 ? ` (${permitEndTime})` : ` (${settings.checkInLatestBy})`}
                </p>
              </div>
            </div>

            {settings.permitDurationMinutes === 0 && (
              <div className="flex items-start gap-3 p-4 bg-[#FEF3C7] dark:bg-[#78350F] rounded-lg border border-[#FCD34D] dark:border-[#92400E]">
                <AlertCircle className="h-5 w-5 text-[#92400E] dark:text-[#FCD34D] mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#92400E] dark:text-[#FCD34D]">
                    No Permit Duration Set
                  </p>
                  <p className="text-xs text-[#92400E] dark:text-[#FCD34D] mt-1">
                    Employees must check in exactly by {settings.checkInLatestBy}. Any check-in after this time will be rejected and marked as ABSENT.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Check-Out Settings (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#0F172A] dark:text-[#F1F5F9]">
                Latest Check-Out Time (24-hour format)
              </label>
              <Input
                type="time"
                value={settings.checkOutLatestBy}
                onChange={(e) =>
                  setSettings({ ...settings, checkOutLatestBy: e.target.value })
                }
                className="max-w-xs"
              />
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                Optional: Set the latest time employees can check out. Leave empty to allow anytime checkout.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[#64748B] dark:text-[#94A3B8]">
            <div className="space-y-2">
              <p className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">Status Rules:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <span className="font-medium text-[#10B981]">PRESENT:</span> Check-in before{" "}
                  {settings.checkInLatestBy}
                </li>
                <li>
                  <span className="font-medium text-[#F59E0B]">LATE:</span> Check-in between{" "}
                  {settings.checkInLatestBy} and {permitEndTime}
                </li>
                <li>
                  <span className="font-medium text-[#EF4444]">ABSENT:</span> No check-in or check-in after{" "}
                  {permitEndTime}
                </li>
              </ul>
            </div>
            {settings.autoMarkAbsentEnabled && (
              <div className="mt-4 p-3 bg-[#F8FAFC] dark:bg-[#1E293B] rounded border border-[#E2E8F0] dark:border-[#334155]">
                <p className="text-xs">
                  <span className="font-medium">Auto-Mark Absent:</span> Employees who haven&apos;t checked in by{" "}
                  {permitEndTime} will be automatically marked as ABSENT.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </>
  );
}
