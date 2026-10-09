import { createClient } from "@supabase/supabase-js";
import type { Page } from "@playwright/test";

export const MENTOR = { email: "arjun.e2e@example.com", password: "mentor-pass-123", name: "Arjun Mehta" };
export const PASSWORD = "member-pass-123";

export function admin() {
  const url = process.env.E2E_SUPABASE_URL ?? "http://127.0.0.1:54321";
  const key = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Set E2E_SUPABASE_SERVICE_ROLE_KEY (from `supabase status`).");
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Creates an active member directly (for tests that don't exercise registration). */
export async function activeMember(prefix: string, dept = "creative") {
  const a = admin();
  const stamp = Date.now();
  const email = `${prefix.toLowerCase()}.${stamp}@example.com`;
  const name = `${prefix} Tester ${stamp % 100000}`;
  const { data, error } = await a.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: name, department: dept } });
  if (error || !data.user) throw error;
  const { data: d } = await a.from("departments").select("id").eq("slug", dept).single();
  await a.from("profiles").update({ status: "active", department_id: d!.id }).eq("id", data.user.id);
  return { email, name, id: data.user.id };
}

export async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

export async function signOut(page: Page) {
  await page.context().clearCookies();
}
