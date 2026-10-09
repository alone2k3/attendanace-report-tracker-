import { describe, expect, it } from "vitest";
import { checkInStatus, checkOutStatus, isWeeklyOff, monthTotals, workedMinutes } from "@/lib/attendance";

describe("attendance rules", () => {
  it("is on time up to and including the late cutoff (IST)", () => {
    expect(checkInStatus("2026-10-09T04:22:00Z", "office")).toBe("present"); // 9:52
    expect(checkInStatus("2026-10-09T04:45:00Z", "office")).toBe("present"); // 10:15 exactly
    expect(checkInStatus("2026-10-09T04:46:00Z", "office")).toBe("late"); // 10:16
  });

  it("respects a custom cutoff", () => {
    expect(checkInStatus("2026-10-09T04:22:00Z", "office", "09:30")).toBe("late");
  });

  it("work from home is never late", () => {
    expect(checkInStatus("2026-10-09T08:00:00Z", "wfh")).toBe("wfh");
  });

  it("marks a half day under the threshold", () => {
    expect(checkOutStatus("present", 269)).toBe("half_day");
    expect(checkOutStatus("late", 200)).toBe("half_day");
    expect(checkOutStatus("present", 270)).toBe("present");
    expect(checkOutStatus("wfh", 60)).toBe("wfh");
  });

  it("computes worked minutes", () => {
    expect(workedMinutes("2026-10-09T04:22:00Z", "2026-10-09T13:38:30Z")).toBe(556);
  });

  it("knows weekly offs", () => {
    expect(isWeeklyOff("2026-10-11", "sun")).toBe(true);
    expect(isWeeklyOff("2026-10-10", "sun")).toBe(false);
    expect(isWeeklyOff("2026-10-10", "sat,sun")).toBe(true);
  });

  it("totals a month", () => {
    const t = monthTotals([{ status: "present" }, { status: "present" }, { status: "late" }, { status: "wfh" }]);
    expect(t).toMatchObject({ present: 2, late: 1, wfh: 1, absent: 0 });
  });
});
