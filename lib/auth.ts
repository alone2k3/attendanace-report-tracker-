import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Dept } from "./departments";
import type { Database } from "@/types/database";

export type Me = {
  id: string;
  email: string;
  fullName: string;
  role: Database["public"]["Enums"]["user_role"];
  status: Database["public"]["Enums"]["account_status"];
  department: Dept | null;
  /** Departments this person mentors (all of them for admins). */
  mentored: Dept[];
  /** Departments this person may see: own + mentored, or all for admins. */
  visible: Dept[];
  isMentor: boolean;
  isAdmin: boolean;
};

const DEPT_COLS = "id, slug, name, color, detail_label";

/** The signed-in person, read once per request. */
export const getMe = cache(async (): Promise<Me | null> => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, status, department_id")
    .eq("id", uid)
    .maybeSingle();
  if (!profile) return null;

  const [{ data: depts }, { data: md }] = await Promise.all([
    supabase.from("departments").select(DEPT_COLS).order("name"),
    supabase.from("mentor_departments").select("department_id").eq("mentor_id", uid),
  ]);
  const all = (depts ?? []) as Dept[];
  const isAdmin = profile.role === "admin" && profile.status === "active";
  const mentoredIds = new Set((md ?? []).map((r) => r.department_id));
  const mentored = isAdmin ? all : all.filter((d) => mentoredIds.has(d.id));
  const isMentor = isAdmin || (profile.role === "mentor" && mentored.length > 0);
  const department = all.find((d) => d.id === profile.department_id) ?? null;
  const visibleIds = new Set([...mentored.map((d) => d.id), ...(department ? [department.id] : [])]);

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    status: profile.status,
    department,
    mentored: profile.role === "member" ? [] : mentored,
    visible: all.filter((d) => visibleIds.has(d.id)),
    isMentor,
    isAdmin,
  };
});

export async function requireMe(): Promise<Me> {
  const me = await getMe();
  if (!me) redirect("/login");
  if (me.status !== "active") redirect(`/login?state=${me.status}`);
  return me;
}

export async function requireMentor(): Promise<Me> {
  const me = await requireMe();
  if (!me.isMentor) redirect("/dashboard");
  return me;
}

export async function requireAdmin(): Promise<Me> {
  const me = await requireMe();
  if (!me.isAdmin) redirect("/dashboard");
  return me;
}

export async function getAllDepartments(): Promise<Dept[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("departments").select(DEPT_COLS).order("name");
  return (data ?? []) as Dept[];
}
