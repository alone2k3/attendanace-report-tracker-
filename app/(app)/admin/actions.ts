"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { departmentSchema, firstError, holidaySchema, settingsSchema, uuid } from "@/lib/validations";

const roleSchema = z.object({ id: uuid, role: z.enum(["member", "mentor", "admin"]) });
const statusSchema = z.object({ id: uuid, status: z.enum(["active", "disabled"]) });

export async function setRole(id: string, role: string): Promise<ActionResult> {
  await requireAdmin();
  const p = roleSchema.safeParse({ id, role });
  if (!p.success) return { ok: false, error: "Pick a valid role." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_role", { p_profile: p.data.id, p_role: p.data.role });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function setStatus(id: string, status: string): Promise<ActionResult> {
  await requireAdmin();
  const p = statusSchema.safeParse({ id, status });
  if (!p.success) return { ok: false, error: "Pick a valid status." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_status", { p_profile: p.data.id, p_status: p.data.status });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function setMentorDepartments(mentorId: string, departmentIds: string[]): Promise<ActionResult> {
  await requireAdmin();
  const p = z.object({ mentorId: uuid, departmentIds: z.array(uuid).max(50) }).safeParse({ mentorId, departmentIds });
  if (!p.success) return { ok: false, error: "Invalid selection." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_mentor_departments", { p_mentor: p.data.mentorId, p_departments: p.data.departmentIds });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/admin/mentors");
  return { ok: true, message: "Saved." };
}

export async function saveDepartment(_: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const p = departmentSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug"),
    color: formData.get("color"),
    detailLabel: formData.get("detailLabel") ?? undefined,
  });
  if (!p.success) return { ok: false, error: firstError(p.error) };
  const supabase = await createClient();
  const row = { name: p.data.name, slug: p.data.slug, color: p.data.color.toUpperCase(), detail_label: p.data.detailLabel ?? null };
  const { error } = p.data.id ? await supabase.from("departments").update(row).eq("id", p.data.id) : await supabase.from("departments").insert(row);
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved." };
}

export async function addTaskType(_: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const p = z.object({ departmentId: uuid, name: z.string().trim().min(1, "Name the type of work.").max(60) }).safeParse({ departmentId: formData.get("departmentId"), name: formData.get("name") });
  if (!p.success) return { ok: false, error: firstError(p.error) };
  const supabase = await createClient();
  const { count } = await supabase.from("task_types").select("id", { count: "exact", head: true }).eq("department_id", p.data.departmentId);
  const { error } = await supabase.from("task_types").insert({ department_id: p.data.departmentId, name: p.data.name, sort: (count ?? 0) + 1 });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/admin/departments");
  return { ok: true };
}

export async function removeTaskType(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!uuid.safeParse(id).success) return { ok: false, error: "Invalid type." };
  const supabase = await createClient();
  const { error } = await supabase.from("task_types").delete().eq("id", id);
  if (error) return { ok: false, error: error.code === "23503" ? "Tasks already use this type, so it can't be removed." : friendlyError(error) };
  revalidatePath("/admin/departments");
  return { ok: true };
}

export async function saveSettings(_: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const p = settingsSchema.safeParse(Object.fromEntries(["office_start", "office_end", "late_after", "half_day_minutes", "reminder_at", "mentor_digest_at", "weekly_off"].map((k) => [k, String(formData.get(k) ?? "").trim().toLowerCase()])));
  if (!p.success) return { ok: false, error: firstError(p.error) };
  const supabase = await createClient();
  const { error } = await supabase.from("settings").upsert(Object.entries(p.data).map(([key, value]) => ({ key, value: String(value) })));
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved." };
}

export async function addHoliday(_: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const p = holidaySchema.safeParse({ day: formData.get("day"), name: formData.get("name") });
  if (!p.success) return { ok: false, error: firstError(p.error) };
  const supabase = await createClient();
  const { error } = await supabase.from("holidays").upsert({ day: p.data.day, name: p.data.name });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function removeHoliday(day: string): Promise<ActionResult> {
  await requireAdmin();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return { ok: false, error: "Invalid date." };
  const supabase = await createClient();
  const { error } = await supabase.from("holidays").delete().eq("day", day);
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/admin/settings");
  return { ok: true };
}
