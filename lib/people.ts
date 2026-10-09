import "server-only";
import { createClient } from "./supabase/server";
import type { Me } from "./auth";
import type { Dept } from "./departments";

export async function peopleData(me: Me) {
  const supabase = await createClient();
  const mentoredIds = me.mentored.map((d) => d.id);
  const { data: allDepts } = await supabase.from("departments").select("id, slug, name, color, detail_label").order("name");
  const depts = (allDepts ?? []) as Dept[];
  const byId = new Map(depts.map((d) => [d.id, d]));

  const [{ data: pending }, { data: people }, { data: changes }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, requested_department_id, created_at").eq("status", "pending").order("created_at"),
    mentoredIds.length
      ? supabase.from("profiles").select("id, full_name, role, department_id").eq("status", "active").in("department_id", mentoredIds).order("full_name")
      : Promise.resolve({ data: [] as { id: string; full_name: string; role: string; department_id: string | null }[] }),
    supabase
      .from("department_changes")
      .select("id, kind, note, created_at, from_department_id, to_department_id, person:profiles!department_changes_profile_id_fkey(full_name), by:profiles!department_changes_changed_by_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  return {
    depts,
    byId,
    // RLS already limits pending rows to the mentor's departments.
    pending: (pending ?? []).map((p) => ({ ...p, requested: p.requested_department_id ? (byId.get(p.requested_department_id) ?? null) : null })),
    people: (people ?? []).filter((p) => p.id !== me.id),
    changes: changes ?? [],
  };
}
