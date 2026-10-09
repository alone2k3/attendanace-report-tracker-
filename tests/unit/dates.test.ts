import { describe, expect, it } from "vitest";
import { addDays, formatDay, formatDuration, formatTime, minutesOfDayIST, monthDays, startOfWeek, todayIST, weekToDate, weekdayKey, greeting } from "@/lib/dates";

describe("IST date helpers", () => {
  it("rolls the work date over at midnight IST, not UTC", () => {
    expect(todayIST(new Date("2026-10-08T18:29:59Z"))).toBe("2026-10-08"); // 23:59:59 IST
    expect(todayIST(new Date("2026-10-08T18:30:00Z"))).toBe("2026-10-09"); // 00:00 IST
  });

  it("formats dates and times the way the copy guide asks", () => {
    expect(formatDay("2026-10-09")).toBe("Fri, 9 Oct");
    expect(formatTime("2026-10-09T04:22:00Z")).toBe("9:52 AM");
    expect(formatTime("2026-10-09T13:38:00Z")).toBe("7:08 PM");
  });

  it("gives minutes since midnight in IST", () => {
    expect(minutesOfDayIST("2026-10-09T04:45:00Z")).toBe(10 * 60 + 15);
  });

  it("formats durations", () => {
    expect(formatDuration(556)).toBe("9 h 16 m");
    expect(formatDuration(45)).toBe("45 m");
    expect(formatDuration(120)).toBe("2 h");
  });

  it("does calendar arithmetic across month ends", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(monthDays("2026-02-10")).toHaveLength(28);
    expect(monthDays("2026-10-01")).toHaveLength(31);
  });

  it("weeks start on Monday", () => {
    expect(startOfWeek("2026-10-09")).toBe("2026-10-05");
    expect(startOfWeek("2026-10-11")).toBe("2026-10-05"); // Sunday
    expect(weekToDate("2026-10-07")).toEqual(["2026-10-05", "2026-10-06", "2026-10-07"]);
    expect(weekdayKey("2026-10-11")).toBe("sun");
  });

  it("greets by IST time of day", () => {
    expect(greeting(new Date("2026-10-09T03:00:00Z"))).toBe("Good morning");
    expect(greeting(new Date("2026-10-09T09:00:00Z"))).toBe("Good afternoon");
    expect(greeting(new Date("2026-10-09T14:00:00Z"))).toBe("Good evening");
  });
});
