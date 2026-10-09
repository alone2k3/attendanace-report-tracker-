import Link from "next/link";
import { X } from "lucide-react";
import type { Me } from "@/lib/auth";
import type { mentorData } from "@/lib/mentor";
import { formatTime, weekdayShort } from "@/lib/dates";
import { boardColumn, countByDayAndDept, pct, summarizeTasks, taskProcess } from "@/lib/tasks";
import { deptStyle } from "@/lib/departments";
import { Card, CardHeader, Empty } from "@/components/ui/card";
import { Bar, StatRow, StatTile } from "@/components/ui/stat";
import { Chip, DeptChip } from "@/components/ui/chip";
import { PillLinks, SegmentedLinks } from "@/components/ui/segmented";
import { WeekChart } from "@/components/charts/week-chart";
import { PersonTable } from "./person-table";
import { TaskActions } from "./task-actions";

type Data = NonNullable<Awaited<ReturnType<typeof mentorData>>>;
export type TMParams = { dept?: string; status?: string; person?: string; view?: string };

export function TaskManager({ me, d, p }: { me: Me; d: Data; p: TMParams }) {
  const href = (patch: Partial<TMParams>) => {
    const q = new URLSearchParams({ tab: "tasks" });
    for (const [k, v] of Object.entries({ ...p, ...patch })) if (v) q.set(k, v);
    return `/mentor?${q.toString()}`;
  };
  const depts = me.mentored.filter((x) => !p.dept || x.slug === p.dept);
  const deptIds = new Set(depts.map((x) => x.id));
  const team = d.team.filter((x) => x.department_id && deptIds.has(x.department_id));
  const person = p.person ? team.find((x) => x.id === p.person) : undefined;
  let today = d.todayFeed.filter((t) => t.department_id && deptIds.has(t.department_id));
  if (person) today = today.filter((t) => t.user_id === person.id);
  const statusFiltered = today.filter((t) => !p.status || (p.status === "flagged" ? t.flagged : t.status === p.status));
  const proc = taskProcess(today);
  const reviewedByMe = today.filter((t) => t.reviewed_by === me.id).length;
  const loggedPeople = new Set(today.map((t) => t.user_id));
  const nothingYet = (person ? [person] : team).filter((x) => !loggedPeople.has(x.id));
  const chart = countByDayAndDept(d.feedRows.filter((t) => t.department_id && deptIds.has(t.department_id) && (!person || t.user_id === person.id)), d.week, depts.map((x) => x.slug)).map((r) => ({ ...r, label: weekdayShort(String(r.day)) }));
  const deptById = new Map(me.mentored.map((x) => [x.id, x]));
  const view = p.view === "board" ? "board" : "list";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <PillLinks label="Department" items={[{ href: href({ dept: undefined, person: undefined }), label: "All", active: !p.dept }, ...me.mentored.map((x) => ({ href: href({ dept: x.slug, person: undefined }), label: x.name, active: p.dept === x.slug }))]} />
        <PillLinks
          label="Status"
          items={[
            { href: href({ status: undefined }), label: "All", active: !p.status },
            { href: href({ status: "in_progress" }), label: "In progress", active: p.status === "in_progress" },
            { href: href({ status: "done" }), label: "Done", active: p.status === "done" },
            { href: href({ status: "flagged" }), label: "Flagged", active: p.status === "flagged" },
          ]}
        />
        {person ? (
          <Link href={href({ person: undefined })} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-gold-tint px-4 text-sm font-semibold text-gold-ink">
            Showing {person.full_name}
            <X className="h-4 w-4" aria-label="Clear person filter" />
          </Link>
        ) : null}
      </div>

      <StatRow>
        <StatTile dark label="Tasks logged today" value={proc.logged} />
        <StatTile label="Done" value={proc.done} suffix={`${proc.donePct}%`} />
        <StatTile label="In progress" value={proc.inProgress} />
        <StatTile label="Reviewed by you" value={reviewedByMe} />
        <StatTile label="People who logged" value={loggedPeople.size} suffix={`of ${person ? 1 : team.length}`} />
      </StatRow>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Task process today" />
          {[
            ["Logged", proc.logged, 100],
            ["Done", proc.done, proc.donePct],
            ["Reviewed by you", reviewedByMe, pct(reviewedByMe, proc.done)],
          ].map(([label, n, v]) => (
            <div key={label as string} className="mb-3">
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-semibold text-ink-soft">{label}</span>
                <span className="text-muted">
                  {n} · {v}%
                </span>
              </div>
              <Bar value={v as number} label={`${label}: ${v}%`} />
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Chip tone="gold">Still in progress {proc.inProgress}</Chip>
            <Chip tone="bad">Flagged by you {today.filter((t) => t.flagged).length}</Chip>
          </div>
        </Card>
        <Card>
          <CardHeader title="Progress by department" />
          <ul className="flex flex-col gap-4">
            {depts.map((x) => {
              const rows = today.filter((t) => t.department_id === x.id);
              const s = summarizeTasks(rows);
              return (
                <li key={x.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <DeptChip slug={x.slug} name={x.name} />
                    <span className="text-muted">
                      {s.done}/{s.total} done
                    </span>
                  </div>
                  <Bar value={pct(s.done, s.total)} color={deptStyle(x.slug).fill} label={`${x.name} done`} />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {s.byType.map((t) => (
                      <Chip key={t.name}>
                        {t.name} · {t.count}
                      </Chip>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader title="Tasks logged this week" />
        <WeekChart data={chart} today={d.today} series={depts.map((x) => ({ key: x.slug, name: x.name, color: deptStyle(x.slug).fill }))} />
      </Card>

      <Card>
        <CardHeader title="By person" sub="Select someone to filter everything to them." />
        <PersonTable
          rows={team.map((x) => {
            const rows = d.todayFeed.filter((t) => t.user_id === x.id);
            const dep = x.department_id ? deptById.get(x.department_id) : undefined;
            return {
              id: x.id,
              name: x.full_name,
              slug: dep?.slug ?? "",
              dept: dep?.name ?? "",
              tasks: rows.length,
              done: rows.filter((t) => t.status === "done").length,
              inProgress: rows.filter((t) => t.status === "in_progress").length,
              last: rows[0]?.created_at ? formatTime(rows[0].created_at) : "—",
              href: href({ person: x.id }),
              selected: person?.id === x.id,
            };
          })}
        />
        {nothingYet.length ? (
          <div className="mt-4 rounded-[14px] bg-bad-bg p-4 text-bad">
            <p className="font-semibold">Nothing logged yet today</p>
            <p className="text-sm">{nothingYet.map((x) => x.full_name).join(", ")}</p>
          </div>
        ) : null}
      </Card>

      <Card>
        <CardHeader title="All tasks" sub="Newest first. Mentors can review and flag but not edit." action={<SegmentedLinks label="View" items={[{ href: href({ view: undefined }), label: "List", active: view === "list" }, { href: href({ view: "board" }), label: "Board", active: view === "board" }]} />} />
        {statusFiltered.length === 0 ? (
          <Empty>No tasks match these filters.</Empty>
        ) : view === "list" ? (
          <ul className="divide-y divide-line-soft">
            {statusFiltered.map((t) => (
              <li key={t.id} className="flex flex-wrap items-start gap-3 py-3">
                <span className="w-[70px] shrink-0 text-sm text-muted">{formatTime(t.created_at)}</span>
                <div className="min-w-[200px] flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-ink-soft">{t.user_name}</span>
                    <DeptChip slug={t.department_slug ?? ""} name={t.department_name ?? ""} />
                  </p>
                  <p className="font-semibold text-ink-soft">{t.title}</p>
                  <p className="text-sm text-muted">{[t.project_name, t.task_type_name, t.detail].filter(Boolean).join(" · ")}</p>
                  {t.flagged && t.flag_note ? <p className="text-sm text-bad">Flag note: {t.flag_note}</p> : null}
                </div>
                <Chip tone={t.status === "done" ? "ok" : "gold"}>{t.status === "done" ? "Done" : "In progress"}</Chip>
                <TaskActions id={t.id!} status={t.status!} reviewed={!!t.reviewed_at} flagged={!!t.flagged} ownTask={t.user_id === me.id} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid gap-3 md:grid-cols-4">
            {(
              [
                ["in_progress", "In progress"],
                ["to_review", "Done · to review"],
                ["reviewed", "Reviewed"],
                ["flagged", "Flagged"],
              ] as const
            ).map(([col, label]) => {
              const items = statusFiltered.filter((t) => boardColumn({ status: t.status!, reviewed_at: t.reviewed_at, flagged: t.flagged }) === col);
              return (
                <section key={col} aria-label={label} className="rounded-[14px] bg-segmented p-3">
                  <h3 className="mb-2 text-sm font-semibold text-ink-soft">
                    {label} · {items.length}
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {items.map((t) => (
                      <li key={t.id} className="rounded-[12px] border border-line bg-card p-3">
                        <p className="text-xs text-muted">
                          {t.user_name} · {formatTime(t.created_at)}
                        </p>
                        <p className="text-sm font-semibold text-ink-soft">{t.title}</p>
                        <div className="mt-2">
                          <TaskActions id={t.id!} status={t.status!} reviewed={!!t.reviewed_at} flagged={!!t.flagged} ownTask={t.user_id === me.id} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
