import { formatInTimeZone } from "date-fns-tz";

export const TZ = "Asia/Kolkata";

/** Today's work date in IST as "yyyy-MM-dd". */
export function todayIST(now: Date = new Date()): string {
  return formatInTimeZone(now, TZ, "yyyy-MM-dd");
}

/** Parse "yyyy-MM-dd" as a calendar date (noon UTC so it never slips a day). */
export function parseDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export function toDayString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(day: string, n: number): string {
  const d = parseDay(day);
  d.setUTCDate(d.getUTCDate() + n);
  return toDayString(d);
}

/** "Fri, 9 Oct" */
export function formatDay(day: string): string {
  return formatInTimeZone(parseDay(day), "UTC", "EEE, d MMM");
}

/** "Friday, 9 October" */
export function formatDayLong(day: string): string {
  return formatInTimeZone(parseDay(day), "UTC", "EEEE, d MMMM");
}

/** "9:52 AM" in IST */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "";
  return formatInTimeZone(new Date(iso), TZ, "h:mm a");
}

/** "Fri, 9 Oct · 9:52 AM" in IST */
export function formatDateTime(iso: string): string {
  return formatInTimeZone(new Date(iso), TZ, "EEE, d MMM · h:mm a");
}

/** Minutes since midnight IST for an instant. */
export function minutesOfDayIST(iso: string | Date): number {
  const hhmm = formatInTimeZone(typeof iso === "string" ? new Date(iso) : iso, TZ, "HH:mm");
  return hhmmToMinutes(hhmm);
}

export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** "7 h 12 m", "45 m" */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} m`;
  return m === 0 ? `${h} h` : `${h} h ${m} m`;
}

/** Monday of the week containing `day` (ISO weeks). */
export function startOfWeek(day: string): string {
  const d = parseDay(day);
  const dow = (d.getUTCDay() + 6) % 7; // Mon = 0
  return addDays(day, -dow);
}

/** Mon..`day` inclusive. */
export function weekToDate(day: string): string[] {
  const start = startOfWeek(day);
  const out: string[] = [];
  for (let d = start; d <= day; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Every day of the month containing `day`. */
export function monthDays(day: string): string[] {
  const [y, m] = day.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: last }, (_, i) => `${y}-${String(m).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`);
}

export function monthLabel(day: string): string {
  return formatInTimeZone(parseDay(day), "UTC", "MMMM yyyy");
}

export function monthName(day: string): string {
  return formatInTimeZone(parseDay(day), "UTC", "MMMM");
}

/** "mon".."sun" for a day. */
export function weekdayKey(day: string): string {
  return formatInTimeZone(parseDay(day), "UTC", "EEE").toLowerCase();
}

export function weekdayShort(day: string): string {
  return formatInTimeZone(parseDay(day), "UTC", "EEE");
}

export function greeting(now: Date = new Date()): string {
  const m = minutesOfDayIST(now);
  if (m < 12 * 60) return "Good morning";
  if (m < 17 * 60) return "Good afternoon";
  return "Good evening";
}
