/**
 * Attendance Rules and Time Validation Logic
 */

export interface AttendanceSettings {
  checkInLatestBy: string; // Format: "HH:mm" (e.g., "09:00")
  permitDurationMinutes: number; // Minutes after checkInLatestBy
  autoMarkAbsentEnabled: boolean;
  checkOutLatestBy?: string | null; // Format: "HH:mm" (optional)
}

/**
 * Parse time string (HH:mm) to minutes since midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Get current time in minutes since midnight
 */
export function getCurrentTimeMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Get today's date at a specific time
 */
export function getTodayAtTime(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Determine attendance status based on check-in time and settings
 * @returns { status: "PRESENT" | "LATE" | "ABSENT", canMark: boolean, message?: string }
 */
export function determineAttendanceStatus(
  checkInTime: Date,
  settings: AttendanceSettings
): {
  status: "PRESENT" | "LATE" | "ABSENT";
  canMark: boolean;
  message?: string;
} {
  const checkInMinutes = checkInTime.getHours() * 60 + checkInTime.getMinutes();
  const latestByMinutes = timeToMinutes(settings.checkInLatestBy);
  const permitEndMinutes = latestByMinutes + settings.permitDurationMinutes;

  // Check-in before latest by time → PRESENT
  if (checkInMinutes <= latestByMinutes) {
    return {
      status: "PRESENT",
      canMark: true,
    };
  }

  // Check-in after latest by time but within permit duration → LATE
  if (checkInMinutes <= permitEndMinutes) {
    return {
      status: "LATE",
      canMark: true,
      message: `You are ${checkInMinutes - latestByMinutes} minutes late`,
    };
  }

  // Check-in after permit duration → Cannot mark, should be ABSENT
  return {
    status: "ABSENT",
    canMark: false,
    message: `Check-in time has passed. Latest check-in was ${settings.checkInLatestBy} with ${settings.permitDurationMinutes} minutes grace period.`,
  };
}

/**
 * Check if current time allows marking attendance
 */
export function canMarkAttendanceNow(settings: AttendanceSettings): {
  canMark: boolean;
  message?: string;
  status?: "PRESENT" | "LATE" | "ABSENT";
} {
  const now = new Date();
  return determineAttendanceStatus(now, settings);
}

/**
 * Check if employee should be auto-marked as absent
 */
export function shouldAutoMarkAbsent(
  settings: AttendanceSettings,
  hasCheckedIn: boolean
): boolean {
  if (!settings.autoMarkAbsentEnabled) {
    return false;
  }

  if (hasCheckedIn) {
    return false;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const latestByMinutes = timeToMinutes(settings.checkInLatestBy);
  const permitEndMinutes = latestByMinutes + settings.permitDurationMinutes;

  // If permit duration is set, wait until after permit period
  // If no permit duration (0), mark absent immediately after latest by time
  const cutoffMinutes = settings.permitDurationMinutes > 0 
    ? permitEndMinutes 
    : latestByMinutes;

  return currentMinutes > cutoffMinutes;
}
