"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { friendlyError, type ActionResult } from "@/lib/errors";

const nameSchema = z.string().trim().min(1, "Enter your name.").max(120, "Keep it under 120 characters.");

export async function updateName(_: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const me = await requireMe();
  const parsed = nameSchema.safeParse(formData.get("fullName"));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const supabase = await createClient();
  // Column grants allow only full_name and avatar_url here.
  const { error } = await supabase.from("profiles").update({ full_name: parsed.data }).eq("id", me.id);
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved." };
}

const passwordSchema = z.string().min(6, "Use at least 6 characters.").max(72);

export async function updatePassword(_: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  await requireMe();
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { ok: false, error: error.code === "same_password" ? "Pick a password you haven't used." : "We couldn't change your password. Try again." };
  return { ok: true, message: "Password changed." };
}
