import "server-only";
import { createClient } from "./supabase/server";
import type { Person } from "@/components/projects/member-picker";

/** Active people across all departments (any active user may read these). */
export async function activePeople(): Promise<Person[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, departments!profiles_department_id_fkey(slug, name)")
    .eq("status", "active")
    .order("full_name");
  return (data ?? []).map((p) => ({ id: p.id, full_name: p.full_name, dept: (p.departments as { slug: string; name: string } | null) ?? null }));
}
