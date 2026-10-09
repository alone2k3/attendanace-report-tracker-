import "server-only";
import { createClient } from "./supabase/server";
import { addDays, todayIST, weekToDate } from "./dates";
import { isWeeklyOff } from "./attendance";
import type { Me } from "./auth";
import type { Database } from "@/types/database";

export type FeedRow = Database["public"]["Views"]["v_task_feed"]["Row"];

export async function mentorData(me: Me, weeklyOff: string) {
  const supabase = await createClient();
  const today = todayIST();
  const week = weekToDate(today);
  // Last working day before today (skips weekly offs).
  let yesterday = addDays(today, -1);
  for (let i = 0; i < 6 && isWeeklyOff(yesterday, weeklyOff); i++) yesterday = addDays(yesterday, -1);
  const deptIds = me.mentored.map((d) => d.id);
  if (deptIds.length === 0) return null;

  const [{ data: people }, { data: att }, { data: feed }, { data: subs }, { data: projects }, { data: yTasks }, { data: reminders }, { count: pendingCount }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, department_id, role").eq("status", "active").in("department_id", deptIds).order("full_name"),
    supabase.from("attendance").select("user_id, status, check_in_at").eq("work_date", today),
    supabase.from("v_task_feed").select("*").in("department_id", deptIds).gte("work_date", week[0]).lte("work_date", today).order("created_at", { ascending: false }),
    supabase
      .from("day_submissions")
      .select("id, work_date, submitted_at, department_id, user_id, profiles!day_submissions_user_id_fkey(full_name)")
      .eq("review_status", "submitted")
      .in("department_id", deptIds)
      .order("submitted_at"),
    supabase.from("projects").select("id, name, status, due_date, department_id").in("department_id", deptIds).neq("status", "completed"),
    supabase.from("daily_tasks").select("user_id").eq("work_date", yesterday).in("department_id", deptIds),
    supabase.from("email_log").select("user_id").eq("work_date", today).eq("kind", "checkin_reminder"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const team = (people ?? []).filter((p) => p.id !== me.id);
  const attByUser = new Map((att ?? []).map((a) => [a.user_id, a]));
  const feedRows = (feed ?? []) as FeedRow[];
  const todayFeed = feedRows.filter((t) => t.work_date === today);
  const loggedYesterday = new Set((yTasks ?? []).map((t) => t.user_id));
  const soon = addDays(today, 3);

  return {
    today,
    week,
    yesterday,
    team,
    attByUser,
    feedRows,
    todayFeed,
    submissions: (subs ?? []).filter((s) => s.user_id !== me.id),
    notCheckedIn: team.filter((p) => !attByUser.get(p.id)?.check_in_at && attByUser.get(p.id)?.status !== "leave"),
    lateToday: team.filter((p) => attByUser.get(p.id)?.status === "late"),
    missedYesterday: isWeeklyOff(today, weeklyOff) ? [] : team.filter((p) => !loggedYesterday.has(p.id)),
    reminded: new Set((reminders ?? []).map((r) => r.user_id)),
    watch: (projects ?? [])
      .filter((p) => p.status === "review" || (p.due_date && p.due_date <= soon))
      .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999")),
    pendingCount: pendingCount ?? 0,
  };
}
