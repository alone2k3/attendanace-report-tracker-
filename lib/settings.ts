import "server-only";
import { createClient } from "./supabase/server";

export type AppSettings = {
  office_start: string;
  office_end: string;
  late_after: string;
  half_day_minutes: number;
  reminder_at: string;
  mentor_digest_at: string;
  weekly_off: string;
};

export const DEFAULT_SETTINGS: AppSettings = {
  office_start: "10:00",
  office_end: "19:00",
  late_after: "10:15",
  half_day_minutes: 270,
  reminder_at: "18:30",
  mentor_digest_at: "10:00",
  weekly_off: "sun",
};

export function parseSettings(rows: { key: string; value: string }[]): AppSettings {
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    office_start: m.office_start ?? DEFAULT_SETTINGS.office_start,
    office_end: m.office_end ?? DEFAULT_SETTINGS.office_end,
    late_after: m.late_after ?? DEFAULT_SETTINGS.late_after,
    half_day_minutes: Number(m.half_day_minutes ?? DEFAULT_SETTINGS.half_day_minutes),
    reminder_at: m.reminder_at ?? DEFAULT_SETTINGS.reminder_at,
    mentor_digest_at: m.mentor_digest_at ?? DEFAULT_SETTINGS.mentor_digest_at,
    weekly_off: m.weekly_off ?? DEFAULT_SETTINGS.weekly_off,
  };
}

export async function getSettings(): Promise<AppSettings> {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("key, value");
  return parseSettings(data ?? []);
}

/** "10:15" -> "10:15 AM" */
export function formatClock(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}
