import "server-only";
import { createClient } from "./supabase/server";
import type { ProjectCardData } from "@/components/projects/project-card";

const SELECT =
  "id, name, client, status, priority, due_date, department_id, owner:profiles!projects_created_by_fkey(full_name), departments(slug, name), project_todos(done), project_members(profiles!project_members_user_id_fkey(full_name, departments!profiles_department_id_fkey(slug, name)))";

type Raw = {
  id: string;
  name: string;
  client: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  department_id: string;
  owner: { full_name: string } | null;
  departments: { slug: string; name: string } | null;
  project_todos: { done: boolean }[];
  project_members: { profiles: { full_name: string; departments: { slug: string; name: string } | null } | null }[];
};

export async function projectCards(filter?: { departmentId?: string; ids?: string[] }): Promise<(ProjectCardData & { department_id: string })[]> {
  const supabase = await createClient();
  let q = supabase.from("projects").select(SELECT).order("due_date", { ascending: true, nullsFirst: false });
  if (filter?.departmentId) q = q.eq("department_id", filter.departmentId);
  if (filter?.ids) q = q.in("id", filter.ids.length ? filter.ids : ["00000000-0000-0000-0000-000000000000"]);
  const { data } = await q;
  return ((data ?? []) as unknown as Raw[]).map((p) => {
    const team = p.project_members.map((m) => m.profiles).filter((x): x is NonNullable<typeof x> => !!x);
    const depts = new Map<string, string>();
    if (p.departments) depts.set(p.departments.slug, p.departments.name);
    for (const t of team) if (t.departments) depts.set(t.departments.slug, t.departments.name);
    return {
      id: p.id,
      name: p.name,
      client: p.client,
      status: p.status,
      priority: p.priority,
      due_date: p.due_date,
      department_id: p.department_id,
      owner: p.owner?.full_name ?? "",
      todos: p.project_todos.map((t) => t.done),
      team: team.map((t) => ({ name: t.full_name, slug: t.departments?.slug ?? "" })),
      depts: [...depts.entries()].map(([slug, name]) => ({ slug, name })),
    };
  });
}
