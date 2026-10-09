import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDayLong, greeting, monthDays, monthName, todayIST, formatDateTime } from "@/lib/dates";
import { monthTotals } from "@/lib/attendance";
import { formatClock, getSettings } from "@/lib/settings";
import { myProjects } from "@/lib/projects";
import { deptStyle } from "@/lib/departments";
import { Card, CardHeader, Empty } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { Chip, ATTENDANCE_TONE } from "@/components/ui/chip";
import { AttendanceCard } from "@/components/attendance/attendance-card";
import { MonthStrip } from "@/components/attendance/month-strip";
import { ProjectRow } from "@/components/projects/project-row";
import { DeptIcon } from "@/components/tasks/dept-icon";

export const metadata = { title: "Home" };

export default async function Dashboard() {
  const me = await requireMe();
  const today = todayIST();
  const days = monthDays(today).filter((d) => d <= today);
  const supabase = await createClient();
  const deptNames = new Map(me.visible.map((d) => [d.id, d.name]));
  const { data: allDepts } = await supabase.from("departments").select("id, name");
  for (const d of allDepts ?? []) deptNames.set(d.id, d.name);

  const [settings, { data: att }, { data: tasks }, { data: sub }, projects, { data: tagged }] = await Promise.all([
    getSettings(),
    supabase.from("attendance").select("work_date, status, check_in_at, check_out_at, worked_minutes").eq("user_id", me.id).gte("work_date", days[0]).lte("work_date", today),
    supabase.from("daily_tasks").select("id, status").eq("user_id", me.id).eq("work_date", today),
    supabase.from("day_submissions").select("review_status").eq("user_id", me.id).eq("work_date", today).maybeSingle(),
    myProjects(me.id, deptNames),
    supabase.from("notifications").select("id, title, body, link, created_at, kind").eq("user_id", me.id).in("kind", ["project_tagged", "day_approved", "day_sent_back", "task_flagged", "project_review"]).order("created_at", { ascending: false }).limit(5),
  ]);
  const todayRow = (att ?? []).find((r) => r.work_date === today) ?? null;
  const totals = monthTotals(att ?? []);
  const byDay = new Map((att ?? []).map((r) => [r.work_date, r.status]));
  const taskCount = tasks?.length ?? 0;
  const dayState = sub?.review_status === "approved" ? "approved" : sub?.review_status === "submitted" ? "sent for review" : sub?.review_status === "sent_back" ? "sent back" : "not sent yet";
  const first = me.fullName.split(" ")[0];

  return (
    <>
      <header className="mb-6">
        <p className="text-[13px] text-muted">{formatDayLong(today)}</p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.01em] text-ink-soft sm:text-[34px]">
          {greeting()}, {first}
        </h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <AttendanceCard
          row={todayRow}
          officeHours={`${formatClock(settings.office_start)} – ${formatClock(settings.office_end)}`}
          lateAt={formatClock(settings.late_after)}
        />

        <Card>
          <CardHeader title="Today's tasks" action={<Chip tone={taskCount ? (sub?.review_status === "approved" ? "ok" : "gold") : "warn"}>{taskCount ? dayState : "Pending"}</Chip>} />
          <p className="font-display text-2xl font-semibold text-ink-soft">
            {taskCount} {taskCount === 1 ? "task" : "tasks"} logged · {dayState}
          </p>
          <p className="mt-1 text-sm text-muted">Log what you worked on and send your day to your mentor before 11:59 PM.</p>
          <ButtonLink href="/tasks" className="mt-4">
            {taskCount ? "Open today's log" : "Log today's tasks"}
          </ButtonLink>
        </Card>

        <Card>
          <CardHeader title={`${monthName(today)} so far`} action={<Link href="/attendance" className="text-sm font-semibold text-gold-deep underline">Calendar</Link>} />
          <div className="mb-4 grid grid-cols-4 gap-2">
            {(
              [
                ["present", "Present"],
                ["late", "Late"],
                ["wfh", "WFH"],
                ["half_day", "Half day"],
              ] as const
            ).map(([k, label]) => (
              <div key={k} className="rounded-[14px] border border-line p-3">
                <p className="font-display text-2xl font-semibold text-ink-soft">{totals[k]}</p>
                <Chip tone={ATTENDANCE_TONE[k]}>{label}</Chip>
              </div>
            ))}
          </div>
          <MonthStrip days={days} byDay={byDay} today={today} />
          <p className="mt-3 text-xs text-muted">P present · L late · W work from home · H half day · LV leave · A absent</p>
        </Card>

        {me.department ? (
          <Card>
            <CardHeader title="My department" />
            <Link href={`/departments/${me.department.slug}`} className="flex items-center gap-4 rounded-[14px] border border-line p-4 hover:bg-field">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-[14px]" style={{ background: deptStyle(me.department.slug).fill, color: deptStyle(me.department.slug).iconOnFill }}>
                <DeptIcon slug={me.department.slug} />
              </span>
              <span className="flex-1">
                <span className="block font-display text-lg font-semibold text-ink-soft">{me.department.name}</span>
                <span className="block text-sm text-muted">Today&apos;s updates, team and projects</span>
              </span>
              <ArrowRight className="h-5 w-5 text-gold-deep" aria-hidden />
            </Link>
          </Card>
        ) : null}

        <Card>
          <CardHeader title="My projects" action={<Link href="/projects" className="text-sm font-semibold text-gold-deep underline">All projects</Link>} />
          {projects.length ? (
            <ul className="divide-y divide-line-soft">
              {projects.map((p) => (
                <ProjectRow key={p.id} p={p} />
              ))}
            </ul>
          ) : (
            <Empty>No projects yet. When someone tags you, it shows up here.</Empty>
          )}
        </Card>

        <Card>
          <CardHeader title="Tagged you" action={<Link href="/notifications" className="text-sm font-semibold text-gold-deep underline">All notifications</Link>} />
          {tagged?.length ? (
            <ul className="divide-y divide-line-soft">
              {tagged.map((n) => (
                <li key={n.id} className="py-3">
                  <Link href={n.link ?? "/notifications"} className="block hover:underline">
                    <span className="block font-semibold text-ink-soft">{n.title}</span>
                    {n.body ? <span className="block text-sm text-muted">{n.body}</span> : null}
                    <span className="block text-xs text-muted">{formatDateTime(n.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Nothing new.</Empty>
          )}
        </Card>
      </div>
    </>
  );
}
