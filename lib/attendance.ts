import type { Database } from "@/types/database";
import { hhmmToMinutes, minutesOfDayIST, weekdayKey } from "./dates";

export type AttendanceStatus = Database["public"]["Enums"]["attendance_status"];

/** Mirrors check_in(): after the late cutoff (IST) is late, unless working from home. */
export function checkInStatus(checkInIso: string, mode: "office" | "wfh", lateAfter = "10:15"): AttendanceStatus {
  if (mode === "wfh") return "wfh";
  return minutesOfDayIST(checkInIso) > hhmmToMinutes(lateAfter) ? "late" : "present";
}

/** Mirrors check_out(): present/late days under the threshold become half days. */
export function checkOutStatus(current: AttendanceStatus, workedMinutes: number, halfDayMinutes = 270): AttendanceStatus {
  if ((current === "present" || current === "late") && workedMinutes < halfDayMinutes) return "half_day";
  return current;
}

export function workedMinutes(checkInIso: string, checkOutIso: string): number {
  return Math.floor((new Date(checkOutIso).getTime() - new Date(checkInIso).getTime()) / 60000);
}

export function isWeeklyOff(day: string, weeklyOff = "sun"): boolean {
  return weeklyOff.toLowerCase().includes(weekdayKey(day));
}

export const STATUS_LETTER: Record<AttendanceStatus, string> = {
  present: "P",
  late: "L",
  wfh: "W",
  half_day: "H",
  leave: "LV",
  absent: "A",
  holiday: "HO",
};

export const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: "Present",
  late: "Late",
  wfh: "Work from home",
  half_day: "Half day",
  leave: "Leave",
  absent: "Absent",
  holiday: "Holiday",
};

export type MonthTotals = Record<AttendanceStatus, number>;

export function monthTotals(rows: { status: AttendanceStatus }[]): MonthTotals {
  const t: MonthTotals = { present: 0, late: 0, wfh: 0, half_day: 0, leave: 0, absent: 0, holiday: 0 };
  for (const r of rows) t[r.status] += 1;
  return t;
}
