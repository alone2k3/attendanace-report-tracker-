"use server";
import { revalidatePath } from "next/cache";
import { requireMentor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { firstError, flagSchema, reviewSchema, uuid } from "@/lib/validations";
import { sendEmail } from "@/lib/email";
import { formatDay } from "@/lib/dates";

function refresh() {
  revalidatePath("/mentor");
  revalidatePath("/tasks");
}

export async function reviewDay(submissionId: string, decision: "approved" | "sent_back", note?: string): Promise<ActionResult> {
  await requireMentor();
  const parsed = reviewSchema.safeParse({ submissionId, decision, note: note || undefined });
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const supabase = await createClient();
  const { data: sub } = await supabase.from("day_submissions").select("work_date, user_id, profiles!day_submissions_user_id_fkey(email, full_name)").eq("id", submissionId).maybeSingle();
  const { error } = await supabase.rpc("review_day", { p_submission: submissionId, p_decision: decision, p_note: parsed.data.note });
  if (error) return { ok: false, error: friendlyError(error) };
  const person = sub?.profiles as unknown as { email: string; full_name: string } | null;
  if (decision === "sent_back" && person && sub) {
    await sendEmail({
      to: person.email,
      subject: `Your mentor sent back ${formatDay(sub.work_date)}`,
      heading: "Your day was sent back",
      body: `Your mentor sent ${formatDay(sub.work_date)} back with a note:\n\n${parsed.data.note}\n\nYou can edit that day and send it again.`,
      cta: { label: "Open daily tasks", path: `/tasks?date=${sub.work_date}` },
    });
  }
  refresh();
  return { ok: true };
}

export async function markReviewed(taskId: string, reviewed: boolean): Promise<ActionResult> {
  const me = await requireMentor();
  if (!uuid.safeParse(taskId).success) return { ok: false, error: "Invalid task." };
  const supabase = await createClient();
  // Mentors write review marks to task_reviews only; daily_tasks stays untouched.
  const { error } = await supabase.from("task_reviews").upsert(
    { task_id: taskId, reviewed_by: reviewed ? me.id : null, reviewed_at: reviewed ? new Date().toISOString() : null, updated_by: me.id, updated_at: new Date().toISOString() },
    { onConflict: "task_id" },
  );
  if (error) return { ok: false, error: friendlyError(error) };
  refresh();
  return { ok: true };
}

export async function flagTask(taskId: string, flagged: boolean, note?: string): Promise<ActionResult> {
  const me = await requireMentor();
  const parsed = flagSchema.safeParse({ taskId, flagged, note: note || undefined });
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.from("task_reviews").upsert(
    { task_id: taskId, flagged, flag_note: flagged ? (parsed.data.note ?? null) : null, updated_by: me.id, updated_at: new Date().toISOString() },
    { onConflict: "task_id" },
  );
  if (error) return { ok: false, error: friendlyError(error) };
  if (flagged) {
    const { data: task } = await supabase.from("daily_tasks").select("title, profiles!daily_tasks_user_id_fkey(email)").eq("id", taskId).maybeSingle();
    const email = (task?.profiles as unknown as { email: string } | null)?.email;
    if (email && task) {
      await sendEmail({
        to: email,
        subject: "Your mentor flagged a task",
        heading: "A task needs a look",
        body: `“${task.title}”${parsed.data.note ? `\n\nNote: ${parsed.data.note}` : ""}`,
        cta: { label: "Open daily tasks", path: "/tasks" },
      });
    }
  }
  refresh();
  return { ok: true };
}

/** One check-in reminder per person per day; the RPC enforces the limit. */
export async function sendCheckinReminder(profileId: string): Promise<ActionResult> {
  await requireMentor();
  if (!uuid.safeParse(profileId).success) return { ok: false, error: "Invalid person." };
  const supabase = await createClient();
  const { data: first, error } = await supabase.rpc("claim_checkin_reminder", { p_profile: profileId });
  if (error) return { ok: false, error: friendlyError(error) };
  if (!first) return { ok: true, message: "Already reminded today." };
  const { data: person } = await supabase.from("profiles").select("email, full_name").eq("id", profileId).maybeSingle();
  if (person) {
    await sendEmail({
      to: person.email,
      subject: "Reminder: check in for today",
      heading: `Hi ${person.full_name.split(" ")[0]}, you haven't checked in yet`,
      body: "Open the tracker and check in (office or work from home) when you start.",
      cta: { label: "Check in", path: "/dashboard" },
    });
  }
  revalidatePath("/mentor");
  return { ok: true, message: "Reminder sent." };
}
