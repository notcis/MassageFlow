import { APP_CONFIG } from "@/lib/constants";

/**
 * Converts a time string "HH:mm" into total minutes from midnight.
 */
export function timeToMinutes(timeStr: string): number {
  const [hoursStr, minutesStr] = timeStr.split(":");
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  return hours * 60 + minutes;
}

/**
 * Converts total minutes from midnight to "HH:mm" string.
 */
export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Calculates end time string "HH:mm" given a start time and duration in minutes.
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  return minutesToTime(timeToMinutes(startTime) + durationMinutes);
}

/**
 * Returns current date and time parts in Asia/Bangkok timezone regardless of server OS timezone.
 */
export function getBangkokNowParts(now: Date = new Date()): {
  dateStr: string;
  timeStr: string;
  minutesOfDay: number;
} {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_CONFIG.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }

  const hour = map.hour === "24" ? "00" : map.hour;
  const dateStr = `${map.year}-${map.month}-${map.day}`;
  const timeStr = `${hour}:${map.minute}`;

  return {
    dateStr,
    timeStr,
    minutesOfDay: timeToMinutes(timeStr),
  };
}

/**
 * Builds an exact UTC Date object from an Asia/Bangkok date ("YYYY-MM-DD") and time ("HH:mm").
 * Since Asia/Bangkok is permanently UTC+07:00 (no DST), parsing with "+07:00" guarantees zero timezone drift.
 */
export function toBangkokDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00+07:00`);
}

/**
 * Checks whether a date string ("YYYY-MM-DD") and time string ("HH:mm") fits within shop operating hours
 * (10:00 - 21:00 Asia/Bangkok) including the full duration of the service.
 */
export function isWithinBusinessHours(startTime: string, durationMinutes: number): boolean {
  const openMinutes = timeToMinutes(APP_CONFIG.openTime);
  const closeMinutes = timeToMinutes(APP_CONFIG.closeTime);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;

  return startMinutes >= openMinutes && endMinutes <= closeMinutes;
}

/**
 * Checks whether two time intervals [startA, endA) and [startB, endB) overlap.
 */
export function isTimeOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const sA = timeToMinutes(startA);
  const eA = timeToMinutes(endA);
  const sB = timeToMinutes(startB);
  const eB = timeToMinutes(endB);

  return sA < eB && eA > sB;
}

/**
 * Generates all candidate start times ("HH:mm") within shop operating hours (10:00 - 21:00)
 * that can fit the requested service duration before closing time.
 */
export function generateCandidateStartTimes(durationMinutes: number): string[] {
  const openMinutes = timeToMinutes(APP_CONFIG.openTime);
  const closeMinutes = timeToMinutes(APP_CONFIG.closeTime);
  const interval = APP_CONFIG.slotIntervalMinutes;

  const slots: string[] = [];
  for (
    let current = openMinutes;
    current + durationMinutes <= closeMinutes;
    current += interval
  ) {
    slots.push(minutesToTime(current));
  }
  return slots;
}

/**
 * Checks if a booking can still be cancelled by the customer (at least 2 hours before startAt).
 */
export function canCustomerCancelBooking(
  startAt: Date,
  now: Date = new Date()
): { allowed: boolean; minutesRemaining: number } {
  const diffMs = startAt.getTime() - now.getTime();
  const minutesRemaining = Math.floor(diffMs / (1000 * 60));
  const requiredMinutes = APP_CONFIG.cancelMinHoursBefore * 60;

  return {
    allowed: minutesRemaining >= requiredMinutes,
    minutesRemaining,
  };
}

/**
 * Formats a "YYYY-MM-DD" string into a friendly Thai date string.
 */
export function formatThaiDate(dateStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const date = toBangkokDateTime(dateStr, "12:00");
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: APP_CONFIG.timezone,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Generates an array of upcoming date strings ("YYYY-MM-DD") in Asia/Bangkok timezone.
 */
export function getUpcomingDates(daysCount = 14, now: Date = new Date()): string[] {
  const { dateStr: todayStr } = getBangkokNowParts(now);
  const baseDate = toBangkokDateTime(todayStr, "12:00");
  const dates: string[] = [];

  for (let i = 0; i < daysCount; i++) {
    const nextDate = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
    const { dateStr } = getBangkokNowParts(nextDate);
    dates.push(dateStr);
  }
  return dates;
}
