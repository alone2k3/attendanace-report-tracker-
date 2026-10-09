import Link from "next/link";
import type { Me } from "@/lib/auth";
import type { mentorData } from "@/lib/mentor";
import { formatDay, formatDateTime } from "@/lib/dates";
import { Card, CardHeader, Empty } from "@/components/ui/card";
import { StatRow, StatTile } from "@/components/ui/stat";
import { PillLinks } from "@/components/ui/segmented";
import { Chip, DeptChip, PROJECT_LABEL, PROJECT_TONE } from "@/components/ui/chip";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { ReviewItem } from "./review-item";
import { ReminderButton } from "./reminder-button";

type Data = NonNullable<Awaited<ReturnType<typeof mentorData>>>;

export function Overview({ me, d, dept }: { me: Me; d: Data; dept?: string }) {
  const byId = new Map(me.mentored.map((x) => [x.id, x]));
  const subs = d.submissions.filter((s) => !dept || byId.get(s.department_id)?.slug === dept);
  const tasksFor = (userId: string, day: string) => d.feedRows.filter((t) => t.user_id === userId && t.work_date === day);

  return (
    <div className="flex flex-col gap-6">
      <StatRow>
        <StatTile dark label="Days waiting for review" value={d.submissions.length} />
        <StatTile label="Not checked in" value={d.notCheckedIn.length} suffix={`of ${d.team.length}`} />
        <StatTile label="Late today" value={d.lateToday.length} />
        <StatTile label="Missed yesterday's update" value={d.missedYesterday.length} />
      </StatRow>

      <Card>
        <CardHeader title="Review queue" sub="Approve marks every Done task that day as reviewed. Send back needs a note." />
        <PillLinks
          label="Filter by department"
          items={[
            { href: "/mentor", label: `All · ${d.submissions.length}`, active: !dept },
            ...me.mentored.map((x) => ({
              href: `/mentor?dept=${x.slug}`,
              label: `${x.name} · ${d.submissions.filter((s) => s.department_id === x.id).length}`,
              active: dept === x.slug,
            })),
          ]}
        />
        {subs.length ? (
          <ul className="mt-2 divide-y divide-line-soft">
            {subs.map((s) => {
              const dep = byId.get(s.department_id);
              return (
                <ReviewItem
                  key={s.id}
                  id={s.id}
                  name={(s.profiles as unknown as { full_name: string } | null)?.full_name ?? "Someone"}
                  dept={{ slug: dep?.slug ?? "", name: dep?.name ?? "" }}
                  when={`${formatDay(s.work_date)} · sent ${formatDateTime(s.submitted_at)}`}
                  tasks={tasksFor(s.user_id, s.work_date).map((t) => ({ title: t.title ?? "", status: t.status ?? "done", type: t.task_type_name }))}
                />
              );
            })}
          </ul>
        ) : (
          <div className="mt-4">
            <Empty>Nothing waiting for review.</Empty>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Not checked in yet" sub="Reminders go by email, one per person per day." />
          {d.notCheckedIn.length ? (
            <ul className="divide-y divide-line-soft">
              {d.notCheckedIn.map((p) => {
                const dep = p.department_id ? byId.get(p.department_id) : undefined;
                return (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <Avatar name={p.full_name} slug={dep?.slug} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink-soft">{p.full_name}</span>
                      {dep ? <DeptChip slug={dep.slug} name={dep.name} /> : null}
                    </span>
                    <ReminderButton profileId={p.id} name={p.full_name} already={d.reminded.has(p.id)} />
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty>Everyone has checked in.</Empty>
          )}
        </Card>

        <Card>
          <CardHeader title="Projects to watch" sub="In review, overdue or due within 3 days." />
          {d.watch.length ? (
            <ul className="divide-y divide-line-soft">
              {d.watch.map((p) => (
                <li key={p.id}>
                  <Link href={`/projects/${p.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:underline">
                    <span className="font-semibold text-ink-soft">{p.name}</span>
                    <span className="flex items-center gap-2">
                      <Chip tone={PROJECT_TONE[p.status]}>{PROJECT_LABEL[p.status]}</Chip>
                      {p.due_date ? (
                        <Chip tone={p.due_date < d.today ? "bad" : "warn"}>{p.due_date < d.today ? "Overdue" : "Due"} {formatDay(p.due_date)}</Chip>
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No projects need attention.</Empty>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="People & departments" action={<ButtonLink href="/mentor/people" variant="secondary">Open</ButtonLink>} />
        <p className="text-[15px]">
          <strong className="text-ink-soft">{d.pendingCount}</strong> new {d.pendingCount === 1 ? "registration" : "registrations"} waiting ·{" "}
          <strong className="text-ink-soft">{d.team.length}</strong> active people in your departments.
        </p>
      </Card>
    </div>
  );
}
