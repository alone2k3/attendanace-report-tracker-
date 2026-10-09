import { deptStyle, type Dept } from "@/lib/departments";
import { formatTime } from "@/lib/dates";
import type { FeedRow } from "@/lib/mentor";
import { Card, CardHeader, Empty } from "@/components/ui/card";
import { ATTENDANCE_TONE, Chip } from "@/components/ui/chip";
import { Avatar } from "@/components/ui/avatar";
import { DeptIcon } from "@/components/tasks/dept-icon";
import { STATUS_LABEL } from "@/lib/attendance";

export function DeptHeader({ dept, mentors, count }: { dept: Dept; mentors: string[]; count: number }) {
  const s = deptStyle(dept.slug, dept.color);
  return (
    <header className="mb-6 flex flex-wrap items-center gap-4">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-[16px]" style={{ background: s.fill, color: s.iconOnFill }}>
        <DeptIcon slug={dept.slug} className="h-7 w-7" />
      </span>
      <div>
        <p className="text-[13px] text-muted">Departments</p>
        <h1 className="text-[28px] font-semibold tracking-[-0.01em] text-ink-soft sm:text-[34px]">{dept.name}</h1>
        <p className="text-[15px] text-muted">
          {count} {count === 1 ? "person" : "people"} · Mentor {mentors.length ? mentors.join(", ") : "not assigned"}
        </p>
      </div>
    </header>
  );
}

export function TodaysUpdates({ rows, detailLabel, expandable }: { rows: FeedRow[]; detailLabel: string | null; expandable?: boolean }) {
  if (!rows.length) return <Empty>No updates yet today.</Empty>;
  if (expandable) {
    const byPerson = new Map<string, FeedRow[]>();
    for (const r of rows) byPerson.set(r.user_name ?? "", [...(byPerson.get(r.user_name ?? "") ?? []), r]);
    return (
      <ul className="divide-y divide-line-soft">
        {[...byPerson.entries()].map(([name, items]) => (
          <li key={name} className="py-2">
            <details>
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3">
                <Avatar name={name} slug={items[0].department_slug} size={32} />
                <span className="flex-1 font-semibold text-ink-soft">{name}</span>
                <Chip tone="gold">{items.length} {items.length === 1 ? "task" : "tasks"}</Chip>
              </summary>
              <ul className="mt-2 flex flex-col gap-2 pl-11">
                {items.map((t) => (
                  <li key={t.id} className="text-sm">
                    <span className="font-semibold text-ink-soft">{t.title}</span>
                    <span className="block text-muted">
                      {[formatTime(t.created_at), t.task_type_name, t.project_name, t.detail && detailLabel ? `${detailLabel}: ${t.detail}` : null].filter(Boolean).join(" · ")}
                    </span>
                    {t.detail && detailLabel === "Reference" ? <Chip className="mt-1">{t.detail}</Chip> : null}
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="divide-y divide-line-soft">
      {rows.slice(0, 15).map((t) => (
        <li key={t.id} className="flex items-start gap-3 py-2.5">
          <Avatar name={t.user_name ?? ""} slug={t.department_slug} size={32} />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted">
              <span className="font-semibold text-ink-soft">{t.user_name}</span> · {formatTime(t.created_at)}
            </p>
            <p className="font-semibold text-ink-soft">{t.title}</p>
            <p className="text-sm text-muted">{[t.task_type_name, t.project_name, t.detail && detailLabel ? `${detailLabel}: ${t.detail}` : null].filter(Boolean).join(" · ")}</p>
          </div>
          <Chip tone={t.status === "done" ? "ok" : "gold"}>{t.status === "done" ? "Done" : "In progress"}</Chip>
        </li>
      ))}
    </ul>
  );
}

export function TeamToday({ people, att }: { people: { id: string; full_name: string }[]; att: Map<string, { status: string; check_in_at: string | null }> }) {
  return (
    <Card>
      <CardHeader title="Team today" />
      {people.length ? (
        <ul className="flex flex-wrap gap-2">
          {people.map((p) => {
            const a = att.get(p.id);
            const status = a?.status as keyof typeof STATUS_LABEL | undefined;
            return (
              <li key={p.id}>
                <Chip tone={status ? ATTENDANCE_TONE[status] : "bad"} className="py-1 text-[13px]">
                  {p.full_name} · {status ? `${STATUS_LABEL[status]}${a?.check_in_at ? ` ${formatTime(a.check_in_at)}` : ""}` : "Not in yet"}
                </Chip>
              </li>
            );
          })}
        </ul>
      ) : (
        <Empty>No one in this department yet.</Empty>
      )}
    </Card>
  );
}
