import "server-only";
import { createClient } from "./supabase/server";
import { addDays, todayIST, weekToDate } from "./dates";
import type { Dept } from "./departments";
import type { FeedRow } from "./mentor";

export async function departmentData(dept: Dept) {
  const supabase = await createClient();
  const today = todayIST();
  const week = weekToDate(today);
  const [{ data: people }, { data: feed }, { data: mentors }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("status", "active").eq("department_id", dept.id).order("full_name"),
    // RLS: teammates, mentors of this department and admins only.
    supabase.from("v_task_feed").select("*").eq("department_id", dept.id).gte("work_date", week[0]).lte("work_date", today).order("created_at", { ascending: false }),
    supabase.from("mentor_departments").select("profiles!mentor_departments_mentor_id_fkey(full_name, status)").eq("department_id", dept.id),
  ]);
  const ids = (people ?? []).map((p) => p.id);
  const { data: att } = ids.length ? await supabase.from("attendance").select("user_id, status, check_in_at").eq("work_date", today).in("user_id", ids) : { data: [] };
  const feedRows = (feed ?? []) as FeedRow[];
  return {
    today,
    week,
    soon: addDays(today, 7),
    people: people ?? [],
    att: new Map((att ?? []).map((a) => [a.user_id, a])),
    todayFeed: feedRows.filter((t) => t.work_date === today),
    weekFeed: feedRows,
    mentorNames: (mentors ?? [])
      .map((m) => m.profiles as unknown as { full_name: string; status: string } | null)
      .filter((m): m is { full_name: string; status: string } => !!m && m.status === "active")
      .map((m) => m.full_name),
  };
}
