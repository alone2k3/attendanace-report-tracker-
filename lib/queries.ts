import "server-only";
import { createClient } from "./supabase/server";

/** Mentor names per department id (from mentor_departments). */
export async function mentorNamesByDept(): Promise<Map<string, string[]>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mentor_departments")
    .select("department_id, profiles!mentor_departments_mentor_id_fkey(full_name, status)");
  const m = new Map<string, string[]>();
  for (const r of data ?? []) {
    const p = r.profiles as unknown as { full_name: string; status: string } | null;
    if (!p || p.status !== "active") continue;
    m.set(r.department_id, [...(m.get(r.department_id) ?? []), p.full_name]);
  }
  return m;
}

/** Projects people can link a task to (anything not completed). */
export async function linkableProjects() {
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("id, name").neq("status", "completed").order("name");
  return data ?? [];
}
