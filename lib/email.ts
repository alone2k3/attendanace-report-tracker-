import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "./supabase/admin";

type Mail = { to: string | string[]; subject: string; heading: string; body: string; cta?: { label: string; path: string } };

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Turmeric-branded email: logo on a black header, gold button. */
export function renderEmail({ heading, body, cta }: Omit<Mail, "to" | "subject">): string {
  const url = appUrl();
  const button = cta
    ? `<p style="margin:28px 0 0"><a href="${url}${cta.path}" style="background:#C9A23F;color:#000;font-weight:700;text-decoration:none;padding:14px 22px;border-radius:12px;display:inline-block">${escapeHtml(cta.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#FAF6EC;font-family:Arial,Helvetica,sans-serif;color:#3B3426">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6EC;padding:24px 0"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border:1px solid #E9E1CC;border-radius:18px;overflow:hidden">
<tr><td style="background:#000;padding:22px 24px"><img src="${url}/brand/turmeric-logo.png" width="150" alt="turmeric" style="display:block"></td></tr>
<tr><td style="padding:28px 24px">
<h1 style="font-size:22px;margin:0 0 12px;color:#14110A">${escapeHtml(heading)}</h1>
<p style="font-size:15px;line-height:1.6;margin:0;white-space:pre-line">${escapeHtml(body)}</p>${button}
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #F0E9D6;font-size:12px;color:#6B6250">Turmeric Work Tracker</td></tr>
</table></td></tr></table></body></html>`;
}

/** Sends mail through Resend from the server. Without RESEND_API_KEY it logs instead. */
export async function sendEmail(mail: Mail): Promise<boolean> {
  const recipients = (Array.isArray(mail.to) ? mail.to : [mail.to]).filter(Boolean);
  if (recipients.length === 0) return false;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email skipped: no RESEND_API_KEY] to=${recipients.join(",")} subject="${mail.subject}"`);
    return false;
  }
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "Turmeric Work Tracker <onboarding@resend.dev>",
      to: recipients,
      subject: mail.subject,
      html: renderEmail(mail),
    });
    if (error) console.error("[email] send failed", error.message);
    return !error;
  } catch (e) {
    console.error("[email] send failed", e instanceof Error ? e.message : e);
    return false;
  }
}

/** Email addresses of a person, looked up with the service role (email only). */
export async function emailsForUsers(userIds: string[]): Promise<string[]> {
  const admin = createAdminClient();
  if (!admin || userIds.length === 0) return [];
  const { data } = await admin.from("profiles").select("email").in("id", userIds).eq("status", "active");
  return (data ?? []).map((r) => r.email);
}

/** Emails of the active mentors of a department. */
export async function mentorEmails(departmentId: string): Promise<string[]> {
  const admin = createAdminClient();
  if (!admin) return [];
  const { data } = await admin
    .from("mentor_departments")
    .select("profiles!mentor_departments_mentor_id_fkey(email, status)")
    .eq("department_id", departmentId);
  return (data ?? [])
    .map((r) => r.profiles as unknown as { email: string; status: string } | null)
    .filter((p): p is { email: string; status: string } => !!p && p.status === "active")
    .map((p) => p.email);
}

export async function emailForPendingOrAnyStatus(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin.from("profiles").select("email").eq("id", userId).maybeSingle();
  return data?.email ?? null;
}
