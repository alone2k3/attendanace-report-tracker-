import { pct } from "./tasks";

export type AttRow = { user_id: string; status: string };
export type TaskRow = { user_id: string | null; status: string | null; reviewed_at: string | null; flagged: boolean | null; work_date: string | null };
export type SubRow = { user_id: string; work_date: string; submitted_at: string };

export type PersonReport = {
  name: string;
  department: string;
  present: number;
  late: number;
  halfDay: number;
  wfh: number;
  leave: number;
  absent: number;
  tasks: number;
  done: number;
  reviewed: number;
  flagged: number;
  daysOnTime: number;
  donePct: number;
};

/** A day counts as "sent on time" when submitted on its own work date (IST). */
export function sentOnTime(s: SubRow): boolean {
  const ist = new Date(new Date(s.submitted_at).getTime() + 330 * 60000).toISOString().slice(0, 10);
  return ist <= s.work_date;
}

export function buildReport(people: { id: string; full_name: string; department: string }[], att: AttRow[], tasks: TaskRow[], subs: SubRow[]): PersonReport[] {
  return people.map((p) => {
    const a = att.filter((r) => r.user_id === p.id);
    const t = tasks.filter((r) => r.user_id === p.id);
    const done = t.filter((r) => r.status === "done").length;
    const count = (s: string) => a.filter((r) => r.status === s).length;
    return {
      name: p.full_name,
      department: p.department,
      present: count("present"),
      late: count("late"),
      halfDay: count("half_day"),
      wfh: count("wfh"),
      leave: count("leave"),
      absent: count("absent"),
      tasks: t.length,
      done,
      reviewed: t.filter((r) => r.reviewed_at).length,
      flagged: t.filter((r) => r.flagged).length,
      daysOnTime: subs.filter((s) => s.user_id === p.id && sentOnTime(s)).length,
      donePct: pct(done, t.length),
    };
  });
}

export const REPORT_COLUMNS: { key: keyof PersonReport; label: string }[] = [
  { key: "name", label: "Person" },
  { key: "department", label: "Department" },
  { key: "present", label: "Present" },
  { key: "late", label: "Late" },
  { key: "halfDay", label: "Half day" },
  { key: "wfh", label: "WFH" },
  { key: "leave", label: "Leave" },
  { key: "absent", label: "Absent" },
  { key: "tasks", label: "Tasks" },
  { key: "done", label: "Done" },
  { key: "reviewed", label: "Reviewed" },
  { key: "flagged", label: "Flagged" },
  { key: "daysOnTime", label: "Days sent on time" },
];
