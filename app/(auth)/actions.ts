"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema, firstError } from "@/lib/validations";
import { mentorEmails, sendEmail } from "@/lib/email";

export type AuthState = { error?: string } | undefined;

const STATUS_MESSAGE: Record<string, string> = {
  pending: "Your registration is waiting for a mentor to confirm your department.",
  disabled: "This account isn't active. Talk to your mentor.",
};

function safeNext(next: FormDataEntryValue | null): string {
  const v = typeof next === "string" ? next : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/login") ? v : "/dashboard";
}

export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    if (error?.code === "email_not_confirmed") return { error: "Confirm your email first. Check your inbox for the link." };
    return { error: "That email and password don't match." };
  }

  const { data: profile } = await supabase.from("profiles").select("status").eq("id", data.user.id).maybeSingle();
  if (!profile || profile.status !== "active") {
    await supabase.auth.signOut();
    return { error: STATUS_MESSAGE[profile?.status ?? "pending"] };
  }
  redirect(safeNext(formData.get("next")));
}

export async function register(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    department: formData.get("department"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { fullName, email, password, department } = parsed.data;

  const supabase = await createClient();
  const { data: dept } = await supabase.from("departments").select("id, name, slug").eq("slug", department).maybeSingle();
  if (!dept) return { error: "Pick your department." };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, department: dept.slug }, emailRedirectTo: `${appUrl}/login?confirmed=1` },
  });
  if (error) {
    if (error.code === "user_already_exists") return { error: "An account with that email already exists. Sign in instead." };
    if (error.code === "weak_password") return { error: "Choose a stronger password." };
    if (error.code === "over_email_send_rate_limit") return { error: "Too many sign-ups right now. Try again in a few minutes." };
    return { error: "We couldn't create your account. Try again." };
  }
  // Supabase hides existing emails behind an empty identities list.
  if (data.user && data.user.identities?.length === 0) {
    return { error: "An account with that email already exists. Sign in instead." };
  }
  // Pending accounts never keep a session.
  if (data.session) await supabase.auth.signOut();

  const to = await mentorEmails(dept.id);
  await sendEmail({
    to,
    subject: `New registration: ${fullName} (${dept.name})`,
    heading: "Someone joined and needs a department",
    body: `${fullName} (${email}) registered and tagged ${dept.name}. Confirm or correct their department to activate the account.`,
    cta: { label: "Review registrations", path: "/mentor/people" },
  });

  redirect(`/register/pending?dept=${encodeURIComponent(dept.slug)}`);
}

const emailOnly = z.object({ email: z.email({ message: "Enter a valid email." }).trim().toLowerCase() });

function appBase() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Same reply whether or not the email has an account, so nobody can probe for accounts. */
export type MailState = { error?: string; sent?: boolean } | undefined;

export async function requestPasswordReset(_: MailState, formData: FormData): Promise<MailState> {
  const parsed = emailOnly.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appBase()}/auth/callback?next=/reset-password`,
  });
  if (error?.code === "over_email_send_rate_limit") return { error: "Too many requests. Try again in a few minutes." };
  return { sent: true };
}

export async function resendConfirmation(_: MailState, formData: FormData): Promise<MailState> {
  const parsed = emailOnly.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: `${appBase()}/login?confirmed=1` },
  });
  if (error?.code === "over_email_send_rate_limit") return { error: "Too many requests. Try again in a few minutes." };
  return { sent: true };
}

export async function setNewPassword(_: AuthState, formData: FormData): Promise<AuthState> {
  const password = formData.get("password");
  const confirm = formData.get("confirm");
  if (typeof password !== "string" || password.length < 6) return { error: "Use at least 6 characters." };
  if (password.length > 72) return { error: "Keep it under 72 characters." };
  if (password !== confirm) return { error: "The two passwords don't match." };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "This reset link has expired. Ask for a new one." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.code === "same_password" ? "Pick a password you haven't used." : "We couldn't change your password. Try again." };
  }
  await supabase.auth.signOut();
  redirect("/login?reset=1");
}
