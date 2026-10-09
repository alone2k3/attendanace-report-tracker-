"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { firstError, leaveSchema } from "@/lib/validations";

function refresh() {
  revalidatePath("/dashboard");
  revalidatePath("/attendance");
}

export async function checkIn(mode: "office" | "wfh"): Promise<ActionResult> {
  if (mode !== "office" && mode !== "wfh") return { ok: false, error: "Pick office or work from home." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("check_in", { p_mode: mode });
  if (error) return { ok: false, error: friendlyError(error) };
  refresh();
  return { ok: true };
}

export async function checkOut(): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("check_out");
  if (error) return { ok: false, error: friendlyError(error) };
  refresh();
  return { ok: true };
}

export async function markLeave(_: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const parsed = leaveSchema.safeParse({ date: formData.get("date"), note: formData.get("note") ?? undefined });
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_leave", { p_date: parsed.data.date, p_note: parsed.data.note });
  if (error) return { ok: false, error: friendlyError(error) };
  refresh();
  return { ok: true, message: "Leave marked." };
}

export async function cancelLeave(date: string): Promise<ActionResult> {
  const parsed = leaveSchema.pick({ date: true }).safeParse({ date });
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_leave", { p_date: parsed.data.date });
  if (error) return { ok: false, error: friendlyError(error) };
  refresh();
  return { ok: true };
}
