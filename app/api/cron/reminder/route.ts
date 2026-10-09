import { NextResponse } from "next/server";
import { authorizedCron } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { todayIST } from "@/lib/dates";

export const dynamic = "force-dynamic";

/** 18:30 IST (13:00 UTC): people who checked in but logged nothing, or haven't sent their day. */
export async function GET(request: Request) {
  if (!authorizedCron(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set" }, { status: 500 });
  const today = todayIST();

  const [{ data: att }, { data: tasks }, { data: subs }, { data: sent }] = await Promise.all([
    admin.from("attendance").select("user_id").eq("work_date", today).not("check_in_at", "is", null),
    admin.from("daily_tasks").select("user_id").eq("work_date", today),
    admin.from("day_submissions").select("user_id").eq("work_date", today),
    admin.from("email_log").select("user_id").eq("work_date", today).eq("kind", "task_reminder"),
  ]);
  const withTasks = new Set((tasks ?? []).map((t) => t.user_id));
  const submitted = new Set((subs ?? []).map((s) => s.user_id));
  const already = new Set((sent ?? []).map((s) => s.user_id));
  const targets = [...new Set((att ?? []).map((a) => a.user_id))].filter((u) => !submitted.has(u) && !already.has(u));
  if (!targets.length) return NextResponse.json({ ok: true, reminded: 0 });

  const { data: people } = await admin.from("profiles").select("id, email, full_name").in("id", targets).eq("status", "active");
  let reminded = 0;
  for (const p of people ?? []) {
    const none = !withTasks.has(p.id);
    // The unique (user, day, kind) row makes this run safe to repeat.
    const { error } = await admin.from("email_log").insert({ user_id: p.id, kind: "task_reminder", work_date: today });
    if (error) continue;
    await admin.from("notifications").insert({
      user_id: p.id,
      kind: "task_reminder",
      title: none ? "You haven't logged any tasks today" : "Send your day to your mentor",
      link: "/tasks",
    });
    await sendEmail({
      to: p.email,
      subject: none ? "Reminder: log today's tasks" : "Reminder: send your day for review",
      heading: none ? "Log what you worked on today" : "Your day isn't sent yet",
      body: none ? "You checked in today but haven't logged any tasks. Add them before 11:59 PM." : "You logged tasks today. Send your day to your mentor before 11:59 PM.",
      cta: { label: "Open daily tasks", path: "/tasks" },
    });
    reminded++;
  }
  return NextResponse.json({ ok: true, reminded });
}
