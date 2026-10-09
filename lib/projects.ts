import "server-only";
import { createClient } from "./supabase/server";
import type { ProjectSummary } from "@/components/projects/project-row";

type Raw = {
  id: string;
  name: string;
  status: string;
  due_date: string | null;
  department_id: string;
  project_todos: { done: boolean }[];
  project_members: { profiles: { department_id: string | null } | null }[];
};

export const PROJECT_SUMMARY_SELECT =
  "id, name, status, due_date, department_id, project_todos(done), project_members(profiles!project_members_user_id_fkey(department_id))";

export function toSummary(p: Raw, deptNames: Map<string, string>): ProjectSummary {
  const tagged = new Set<string>();
  for (const m of p.project_members ?? []) {
    const d = m.profiles?.department_id;
    if (d && d !== p.department_id) tagged.add(deptNames.get(d) ?? "");
  }
  return {
    id: p.id,
    name: p.name,
    status: p.status,
    due_date: p.due_date,
    todosDone: (p.project_todos ?? []).filter((t) => t.done).length,
    todosTotal: (p.project_todos ?? []).length,
    tagged: [...tagged].filter(Boolean),
  };
}

/** Projects the person created or is tagged on. */
export async function myProjects(userId: string, deptNames: Map<string, string>): Promise<ProjectSummary[]> {
  const supabase = await createClient();
  const { data: memberOf } = await supabase.from("project_members").select("project_id").eq("user_id", userId);
  const ids = (memberOf ?? []).map((m) => m.project_id);
  let q = supabase.from("projects").select(PROJECT_SUMMARY_SELECT).neq("status", "completed").order("due_date", { ascending: true, nullsFirst: false }).limit(8);
  q = ids.length ? q.or(`created_by.eq.${userId},id.in.(${ids.join(",")})`) : q.eq("created_by", userId);
  const { data } = await q;
  return ((data ?? []) as unknown as Raw[]).map((p) => toSummary(p, deptNames));
}
