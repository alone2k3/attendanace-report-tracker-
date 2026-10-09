import { NextResponse } from "next/server";
import { authorizedCron } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { addDays, formatDay, todayIST } from "@/lib/dates";
import { isWeeklyOff } from "@/lib/attendance";

export const dynamic = "force-dynamic";

/** 10:00 IST (04:30 UTC): each mentor gets absent, late, missing logs and waiting-for-review counts. */
export async function GET(request: Request) {
  if (!authorizedCron(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set" }, { status: 500 });
  const today = todayIST();
  const { data: off } = await admin.from("settings").select("value").eq("key", "weekly_off").maybeSingle();
  const weeklyOff = off?.value ?? "sun";
  const { data: holiday } = await admin.from("holidays").select("day").eq("day", today).maybeSingle();
  if (holiday || isWeeklyOff(today, weeklyOff)) return NextResponse.json({ ok: true, skipped: "day off" });
  let yesterday = addDays(today, -1);
  for (let i = 0; i < 6 && isWeeklyOff(yesterday, weeklyOff); i++) yesterday = addDays(yesterday, -1);

  const [{ data: md }, { data: people }, { data: att }, { data: yTasks }, { data: subs }, { data: depts }] = await Promise.all([
    admin.from("mentor_departments").select("mentor_id, department_id, profiles!mentor_departments_mentor_id_fkey(email, full_name, status)"),
    admin.from("profiles").select("id, full_name, department_id").eq("status", "active"),
    admin.from("attendance").select("user_id, status, check_in_at").eq("work_date", today),
    admin.from("daily_tasks").select("user_id").eq("work_date", yesterday),
    admin.from("day_submissions").select("department_id").eq("review_status", "submitted"),
    admin.from("departments").select("id, name"),
  ]);
  const attBy = new Map((att ?? []).map((a) => [a.user_id, a]));
  const logged = new Set((yTasks ?? []).map((t) => t.user_id));
  const deptName = new Map((depts ?? []).map((d) => [d.id, d.name]));

  const byMentor = new Map<string, { email: string; name: string; depts: string[] }>();
  for (const r of md ?? []) {
    const p = r.profiles as unknown as { email: string; full_name: string; status: string } | null;
    if (!p || p.status !== "active") continue;
    const cur = byMentor.get(r.mentor_id) ?? { email: p.email, name: p.full_name, depts: [] };
    cur.depts.push(r.department_id);
    byMentor.set(r.mentor_id, cur);
  }

  let sent = 0;
  for (const [mentorId, m] of byMentor) {
    const { error } = await admin.from("email_log").insert({ user_id: mentorId, kind: "digest", work_date: today });
    if (error) continue; // already sent today
    const team = (people ?? []).filter((p) => p.department_id && m.depts.includes(p.department_id) && p.id !== mentorId);
    const notIn = team.filter((p) => !attBy.get(p.id)?.check_in_at && attBy.get(p.id)?.status !== "leave");
    const late = team.filter((p) => attBy.get(p.id)?.status === "late");
    const missing = team.filter((p) => !logged.has(p.id));
    const waiting = (subs ?? []).filter((s) => m.depts.includes(s.department_id)).length;
    const list = (xs: { full_name: string }[]) => (xs.length ? xs.map((x) => x.full_name).join(", ") : "none");
    await sendEmail({
      to: m.email,
      subject: `Morning digest · ${formatDay(today)}`,
      heading: `Good morning, ${m.name.split(" ")[0]}`,
      body: [
        `Departments: ${m.depts.map((d) => deptName.get(d)).join(", ")}`,
        `Not checked in yet (${notIn.length}): ${list(notIn)}`,
        `Late (${late.length}): ${list(late)}`,
        `No tasks logged on ${formatDay(yesterday)} (${missing.length}): ${list(missing)}`,
        `Days waiting for your review: ${waiting}`,
      ].join("\n"),
      cta: { label: "Open mentor view", path: "/mentor" },
    });
    sent++;
  }
  return NextResponse.json({ ok: true, sent });
}
