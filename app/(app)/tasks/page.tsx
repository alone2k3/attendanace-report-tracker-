import Link from "next/link";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { countByDay, summarizeTasks } from "@/lib/tasks";
import { formatDay, todayIST, weekToDate } from "@/lib/dates";
import { linkableProjects, mentorNamesByDept } from "@/lib/queries";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, Empty } from "@/components/ui/card";
import { StatRow, StatTile } from "@/components/ui/stat";
import { Chip } from "@/components/ui/chip";
import { DepartmentBanner } from "@/components/tasks/department-banner";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskList, type TaskRow } from "@/components/tasks/task-list";
import { SubmitDay } from "@/components/tasks/submit-day";
import { WeekStrip } from "@/components/tasks/week-strip";

export const metadata = { title: "Daily tasks" };

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const me = await requireMe();
  const today = todayIST();
  if (!me.department) {
    return (
      <>
        <PageHeader crumb="Me" title="Daily tasks" />
        <Empty>Your account has no department, so there&apos;s no log to post to.</Empty>
      </>
    );
  }
  const dept = me.department;
  const supabase = await createClient();
  const sp = await searchParams;

  // Days a mentor sent back stay editable.
  const { data: subs } = await supabase
    .from("day_submissions")
    .select("work_date, review_status, review_note")
    .eq("user_id", me.id)
    .or(`work_date.eq.${today},review_status.eq.sent_back`);
  const sentBack = (subs ?? []).filter((s) => s.review_status === "sent_back" && s.work_date !== today);
  const date = sp.date && sentBack.some((s) => s.work_date === sp.date) ? sp.date : today;
  const submission = (subs ?? []).find((s) => s.work_date === date) ?? null;
  const editable = date === today || submission?.review_status === "sent_back";
  const week = weekToDate(today);

  const [{ data: types }, projects, { data: tasks }, { data: weekTasks }, mentors] = await Promise.all([
    supabase.from("task_types").select("id, name").eq("department_id", dept.id).order("sort"),
    linkableProjects(),
    supabase
      .from("daily_tasks")
      .select("id, title, status, created_at, detail, task_types(name), projects(name), task_reviews(flagged, flag_note, reviewed_at)")
      .eq("user_id", me.id)
      .eq("work_date", date)
      .order("created_at", { ascending: false }),
    supabase.from("daily_tasks").select("work_date, status").eq("user_id", me.id).gte("work_date", week[0]).lte("work_date", today),
    mentorNamesByDept(),
  ]);

  const rows: TaskRow[] = (tasks ?? []).map((t) => {
    const review = (Array.isArray(t.task_reviews) ? t.task_reviews[0] : t.task_reviews) as { flagged: boolean; flag_note: string | null; reviewed_at: string | null } | null;
    return {
      id: t.id,
      title: t.title,
      status: t.status,
      created_at: t.created_at,
      detail: t.detail,
      type: (t.task_types as { name: string } | null)?.name ?? null,
      project: (t.projects as { name: string } | null)?.name ?? null,
      flagged: !!review?.flagged,
      flagNote: review?.flag_note ?? null,
      reviewed: !!review?.reviewed_at,
    };
  });
  const summary = summarizeTasks(rows.map((r) => ({ status: r.status, task_type_name: r.type })));
  const mentorName = mentors.get(dept.id)?.filter((n) => n !== me.fullName)[0] ?? "your mentor";

  return (
    <>
      <PageHeader crumb="Me" title="Daily tasks" description={`${formatDay(date)} · log what you worked on. Tasks lock at 11:59 PM IST.`} />
      <div className="flex flex-col gap-6">
        <DepartmentBanner dept={dept} />

        {sentBack.length > 0 ? (
          <div role="status" className="rounded-[14px] bg-warn-bg px-4 py-3 text-sm text-warn">
            Your mentor sent back:{" "}
            {sentBack.map((s, i) => (
              <span key={s.work_date}>
                {i > 0 ? ", " : ""}
                <Link className="font-semibold underline" href={`/tasks?date=${s.work_date}`}>
                  {formatDay(s.work_date)}
                </Link>
              </span>
            ))}
            . Fix and send again.
            {date !== today ? (
              <>
                {" "}
                <Link className="font-semibold underline" href="/tasks">
                  Back to today
                </Link>
              </>
            ) : null}
          </div>
        ) : null}

        {editable ? (
          <Card>
            <CardHeader title="Add a task" sub="No hours needed. Your worked time comes from check-in and check-out." />
            <TaskForm deptName={dept.name} deptSlug={dept.slug} detailLabel={dept.detail_label} types={types ?? []} projects={projects} workDate={date} />
          </Card>
        ) : null}

        <Card>
          <CardHeader
            title={`My ${dept.name} log · ${date === today ? "today" : formatDay(date)}`}
            action={
              <SubmitDay
                date={date}
                mentorName={mentorName}
                taskCount={rows.length}
                status={(submission?.review_status as "submitted" | "approved" | "sent_back" | undefined) ?? null}
                note={submission?.review_note ?? null}
              />
            }
          />
          <StatRow>
            <StatTile dark label="Tasks" value={summary.total} />
            <StatTile label="Done" value={summary.done} />
            <StatTile label="In progress" value={summary.inProgress} />
          </StatRow>
          {summary.byType.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2" aria-label="Tasks by type">
              {summary.byType.map((t) => (
                <Chip key={t.name} tone="gold">
                  {t.name} · {t.count}
                </Chip>
              ))}
            </div>
          ) : null}
          <div className="mt-4">
            <TaskList tasks={rows} editable={editable} detailLabel={dept.detail_label} />
          </div>
          {!editable ? <p className="mt-3 text-sm text-muted">This day is closed. Only a mentor can reopen it by sending it back.</p> : null}
        </Card>

        <Card>
          <CardHeader title="This week · tasks you logged" />
          <WeekStrip counts={countByDay(weekTasks ?? [], week)} today={today} />
        </Card>
      </div>
    </>
  );
}
