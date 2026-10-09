import { describe, expect, it } from "vitest";
import { boardColumn, countByDay, countByDayAndDept, pct, summarizeTasks, taskProcess } from "@/lib/tasks";

const tasks = [
  { status: "done" as const, task_type_name: "Design", work_date: "2026-10-09", department_slug: "creative", reviewed_at: "x", flagged: false },
  { status: "done" as const, task_type_name: "Design", work_date: "2026-10-09", department_slug: "creative", reviewed_at: null, flagged: true },
  { status: "in_progress" as const, task_type_name: "Copy", work_date: "2026-10-08", department_slug: "creative", reviewed_at: null, flagged: false },
  { status: "done" as const, task_type_name: null, work_date: "2026-10-09", department_slug: "production", reviewed_at: null, flagged: false },
];

describe("task grouping and counts", () => {
  it("summarises totals and types, busiest first", () => {
    const s = summarizeTasks(tasks);
    expect(s).toMatchObject({ total: 4, done: 3, inProgress: 1 });
    expect(s.byType[0]).toEqual({ name: "Design", count: 2 });
    expect(s.byType.map((t) => t.name)).toContain("Other");
  });

  it("zero-fills counts per day", () => {
    expect(countByDay(tasks, ["2026-10-07", "2026-10-08", "2026-10-09"])).toEqual([
      { day: "2026-10-07", count: 0 },
      { day: "2026-10-08", count: 1 },
      { day: "2026-10-09", count: 3 },
    ]);
  });

  it("groups per day and department for the chart", () => {
    const rows = countByDayAndDept(tasks, ["2026-10-09"], ["creative", "production", "finance"]);
    expect(rows[0]).toEqual({ day: "2026-10-09", creative: 2, production: 1, finance: 0 });
  });

  it("builds the Logged -> Done -> Reviewed funnel", () => {
    expect(taskProcess(tasks)).toEqual({ logged: 4, done: 3, reviewed: 1, inProgress: 1, flagged: 1, donePct: 75, reviewedPct: 33 });
  });

  it("puts tasks in the right board column", () => {
    expect(tasks.map(boardColumn)).toEqual(["reviewed", "flagged", "in_progress", "to_review"]);
  });

  it("percentages never divide by zero", () => {
    expect(pct(0, 0)).toBe(0);
    expect(pct(1, 3)).toBe(33);
  });
});
