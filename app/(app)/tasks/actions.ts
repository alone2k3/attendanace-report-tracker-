"use server";
import { revalidatePath } from "next/cache";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { firstError, taskSchema, uuid } from "@/lib/validations";
import { todayIST } from "@/lib/dates";
import { mentorEmails, sendEmail } from "@/lib/email";

function refresh() {
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function addTask(_: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const me = await requireMe();
  if (!me.department) return { ok: false, error: "You need a department before you can log tasks." };
  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    taskTypeId: formData.get("taskTypeId") ?? "",
    projectId: formData.get("projectId") ?? "",
    detail: formData.get("detail") ?? undefined,
    status: formData.get("status") ?? "done",
    workDate: formData.get("workDate") || undefined,
  });
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const t = parsed.data;
  const supabase = await createClient();
  // department_id is always the member's own; RLS rejects anything else.
  const { error } = await supabase.from("daily_tasks").insert({
    user_id: me.id,
    department_id: me.department.id,
    work_date: t.workDate ?? todayIST(),
    title: t.title,
    task_type_id: t.taskTypeId ?? null,
    project_id: t.projectId ?? null,
    detail: me.department.detail_label ? (t.detail ?? null) : null,
    status: t.status,
  });
  if (error) return { ok: false, error: friendlyError(error, "We couldn't add that task. The day may be closed.") };
  refresh();
  return { ok: true, message: "Added." };
}

export async function setTaskStatus(taskId: string, status: "done" | "in_progress"): Promise<ActionResult> {
  const me = await requireMe();
  if (!uuid.safeParse(taskId).success || (status !== "done" && status !== "in_progress")) return { ok: false, error: "Invalid task." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("daily_tasks").update({ status }).eq("id", taskId).eq("user_id", me.id).select("id");
  if (error) return { ok: false, error: friendlyError(error) };
  if (!data?.length) return { ok: false, error: "This day is closed, so the task can't change." };
  refresh();
  return { ok: true };
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  const me = await requireMe();
  if (!uuid.safeParse(taskId).success) return { ok: false, error: "Invalid task." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("daily_tasks").delete().eq("id", taskId).eq("user_id", me.id).select("id");
  if (error) return { ok: false, error: friendlyError(error) };
  if (!data?.length) return { ok: false, error: "This day is closed, so the task can't be removed." };
  refresh();
  return { ok: true };
}

export async function submitDay(date: string): Promise<ActionResult> {
  const me = await requireMe();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: "Invalid date." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_day", { p_date: date });
  if (error) return { ok: false, error: friendlyError(error) };
  if (me.department) {
    const to = await mentorEmails(me.department.id);
    // Mentors see submissions in their review queue; email is a light heads-up only.
    if (to.length) {
      await sendEmail({
        to,
        subject: `${me.fullName} sent their day for review`,
        heading: "A day is waiting for review",
        body: `${me.fullName} (${me.department.name}) sent ${date} for review.`,
        cta: { label: "Open review queue", path: "/mentor" },
      });
    }
  }
  refresh();
  revalidatePath("/mentor");
  return { ok: true };
}
