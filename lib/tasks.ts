export type TaskLike = {
  status: "in_progress" | "done" | null;
  task_type_name?: string | null;
  work_date?: string | null;
  department_slug?: string | null;
  reviewed_at?: string | null;
  flagged?: boolean | null;
  user_id?: string | null;
};

export type TaskSummary = {
  total: number;
  done: number;
  inProgress: number;
  byType: { name: string; count: number }[];
};

export function summarizeTasks(tasks: TaskLike[]): TaskSummary {
  const byType = new Map<string, number>();
  let done = 0;
  for (const t of tasks) {
    if (t.status === "done") done++;
    const name = t.task_type_name ?? "Other";
    byType.set(name, (byType.get(name) ?? 0) + 1);
  }
  return {
    total: tasks.length,
    done,
    inProgress: tasks.length - done,
    byType: [...byType.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
  };
}

/** Count of tasks per day for the given days (zero-filled). */
export function countByDay(tasks: TaskLike[], days: string[]): { day: string; count: number }[] {
  const m = new Map(days.map((d) => [d, 0]));
  for (const t of tasks) if (t.work_date && m.has(t.work_date)) m.set(t.work_date, m.get(t.work_date)! + 1);
  return days.map((day) => ({ day, count: m.get(day)! }));
}

/** Per day, per department counts — the grouped bar chart. */
export function countByDayAndDept(tasks: TaskLike[], days: string[], depts: string[]): Record<string, string | number>[] {
  return days.map((day) => {
    const row: Record<string, string | number> = { day };
    for (const d of depts) row[d] = 0;
    for (const t of tasks) if (t.work_date === day && t.department_slug && t.department_slug in row) row[t.department_slug] = (row[t.department_slug] as number) + 1;
    return row;
  });
}

export function pct(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

/** Logged -> Done -> Reviewed funnel for the mentor task manager. */
export function taskProcess(tasks: TaskLike[]) {
  const logged = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const reviewed = tasks.filter((t) => t.status === "done" && t.reviewed_at).length;
  const flagged = tasks.filter((t) => t.flagged).length;
  return {
    logged,
    done,
    reviewed,
    inProgress: logged - done,
    flagged,
    donePct: pct(done, logged),
    reviewedPct: pct(reviewed, done),
  };
}

export type BoardColumn = "in_progress" | "to_review" | "reviewed" | "flagged";

export function boardColumn(t: TaskLike): BoardColumn {
  if (t.flagged) return "flagged";
  if (t.status === "in_progress") return "in_progress";
  return t.reviewed_at ? "reviewed" : "to_review";
}
