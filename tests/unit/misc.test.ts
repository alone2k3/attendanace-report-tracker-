import { describe, expect, it } from "vitest";
import { friendlyError } from "@/lib/errors";
import { buildReport, sentOnTime } from "@/lib/reports";
import { canSeeDepartment, initials } from "@/lib/permissions";
import { registerSchema, taskSchema, projectSchema } from "@/lib/validations";

describe("friendly errors", () => {
  it("passes through the RPC's own plain messages", () => {
    expect(friendlyError({ message: "This day is closed" })).toBe("This day is closed");
  });
  it("hides raw Postgres errors", () => {
    expect(friendlyError({ message: 'new row violates row-level security policy for table "daily_tasks"', code: "42501" })).toBe("You don't have permission to do that.");
    expect(friendlyError({ message: "relation x does not exist", code: "42P01" })).toBe("Something went wrong. Try again.");
  });
});

describe("validation", () => {
  it("requires a department and a 6+ character password at registration", () => {
    expect(registerSchema.safeParse({ fullName: "A", email: "a@b.co", password: "12345", department: "creative" }).success).toBe(false);
    expect(registerSchema.safeParse({ fullName: "A", email: "a@b.co", password: "123456", department: "" }).success).toBe(false);
    expect(registerSchema.safeParse({ fullName: "A", email: "A@B.co", password: "123456", department: "creative" }).data?.email).toBe("a@b.co");
  });
  it("has no hours field on tasks and caps the title at 300", () => {
    expect(Object.keys(taskSchema.shape)).not.toContain("hours");
    expect(taskSchema.safeParse({ title: "x".repeat(301), status: "done" }).success).toBe(false);
  });
  it("rejects a due date before the start date", () => {
    expect(projectSchema.safeParse({ name: "P", priority: "normal", startDate: "2026-10-10", dueDate: "2026-10-01" }).success).toBe(false);
  });
});

describe("reports", () => {
  it("counts attendance, tasks and on-time days per person", () => {
    const [r] = buildReport(
      [{ id: "u1", full_name: "Priya", department: "Creative" }],
      [{ user_id: "u1", status: "present" }, { user_id: "u1", status: "late" }, { user_id: "u2", status: "present" }],
      [{ user_id: "u1", status: "done", reviewed_at: "x", flagged: false, work_date: "2026-10-09" }, { user_id: "u1", status: "in_progress", reviewed_at: null, flagged: true, work_date: "2026-10-09" }],
      [{ user_id: "u1", work_date: "2026-10-09", submitted_at: "2026-10-09T13:00:00Z" }],
    );
    expect(r).toMatchObject({ present: 1, late: 1, tasks: 2, done: 1, reviewed: 1, flagged: 1, daysOnTime: 1, donePct: 50 });
  });
  it("a day sent after midnight IST is late", () => {
    expect(sentOnTime({ user_id: "u", work_date: "2026-10-09", submitted_at: "2026-10-09T18:31:00Z" })).toBe(false);
  });
});

describe("permissions", () => {
  it("members see only departments in their visible list", () => {
    const me = { isAdmin: false, visible: [{ id: "1", slug: "creative", name: "Creative", color: "#C9A23F", detail_label: null }] };
    expect(canSeeDepartment(me, "creative")).toBe(true);
    expect(canSeeDepartment(me, "finance")).toBe(false);
    expect(canSeeDepartment({ ...me, isAdmin: true }, "finance")).toBe(true);
  });
  it("makes initials", () => {
    expect(initials("Priya Sundar")).toBe("PS");
    expect(initials("Divya")).toBe("D");
  });
});
