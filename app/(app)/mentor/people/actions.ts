"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMentor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { firstError, uuid } from "@/lib/validations";
import { mentorEmails, sendEmail } from "@/lib/email";

function refresh() {
  revalidatePath("/mentor/people");
  revalidatePath("/mentor");
}

const approveSchema = z.object({ profileId: uuid, departmentId: uuid });

export async function approveRegistration(profileId: string, departmentId: string): Promise<ActionResult> {
  await requireMentor();
  const parsed = approveSchema.safeParse({ profileId, departmentId });
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const supabase = await createClient();
  const { data: person } = await supabase.from("profiles").select("email, full_name").eq("id", profileId).maybeSingle();
  const { error } = await supabase.rpc("approve_registration", { p_profile: profileId, p_department: departmentId });
  if (error) return { ok: false, error: friendlyError(error) };
  const { data: dept } = await supabase.from("departments").select("name").eq("id", departmentId).maybeSingle();
  if (person) {
    await sendEmail({
      to: person.email,
      subject: "You're in: your account is active",
      heading: `Welcome, ${person.full_name.split(" ")[0]}`,
      body: `Your mentor confirmed your department: ${dept?.name ?? ""}. You can sign in and start logging your day.`,
      cta: { label: "Sign in", path: "/login" },
    });
  }
  refresh();
  return { ok: true, message: `${person?.full_name ?? "They"} can sign in now.` };
}

const declineSchema = z.object({ profileId: uuid, note: z.string().trim().max(500).optional() });

export async function declineRegistration(profileId: string, note?: string): Promise<ActionResult> {
  await requireMentor();
  const parsed = declineSchema.safeParse({ profileId, note: note || undefined });
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const supabase = await createClient();
  const { data: person } = await supabase.from("profiles").select("email").eq("id", profileId).maybeSingle();
  const { error } = await supabase.rpc("decline_registration", { p_profile: profileId, p_note: parsed.data.note });
  if (error) return { ok: false, error: friendlyError(error) };
  if (person) {
    await sendEmail({
      to: person.email,
      subject: "Your registration wasn't approved",
      heading: "Your registration wasn't approved",
      body: `A mentor declined this registration.${parsed.data.note ? `\n\nNote: ${parsed.data.note}` : ""}\n\nIf this is a mistake, talk to your mentor.`,
    });
  }
  refresh();
  return { ok: true };
}

const moveSchema = z.object({ profileId: uuid, departmentId: uuid, note: z.string().trim().max(500).optional() });

export async function changeDepartment(profileId: string, departmentId: string, note?: string): Promise<ActionResult> {
  await requireMentor();
  const parsed = moveSchema.safeParse({ profileId, departmentId, note: note || undefined });
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const supabase = await createClient();
  const { data: person } = await supabase.from("profiles").select("email, full_name, department_id").eq("id", profileId).maybeSingle();
  const { error } = await supabase.rpc("change_department", { p_profile: profileId, p_department: departmentId, p_note: parsed.data.note });
  if (error) return { ok: false, error: friendlyError(error) };
  const { data: dept } = await supabase.from("departments").select("name").eq("id", departmentId).maybeSingle();
  if (person) {
    const mentors = [...(person.department_id ? await mentorEmails(person.department_id) : []), ...(await mentorEmails(departmentId))];
    await sendEmail({
      to: person.email,
      subject: `Your department is now ${dept?.name}`,
      heading: `You've moved to ${dept?.name}`,
      body: `A mentor moved you to ${dept?.name}. New tasks go to the ${dept?.name} log; your earlier tasks stay where they were.${parsed.data.note ? `\n\nNote: ${parsed.data.note}` : ""}`,
      cta: { label: "Open daily tasks", path: "/tasks" },
    });
    await sendEmail({
      to: [...new Set(mentors)],
      subject: `${person.full_name} moved to ${dept?.name}`,
      heading: "Department change",
      body: `${person.full_name} now belongs to ${dept?.name}.${parsed.data.note ? `\n\nNote: ${parsed.data.note}` : ""}`,
      cta: { label: "People & departments", path: "/mentor/people" },
    });
  }
  refresh();
  return { ok: true, message: `Moved to ${dept?.name}.` };
}
