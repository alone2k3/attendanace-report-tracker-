import Link from "next/link";
import type { FeedRow } from "@/lib/mentor";
import { formatDay, formatTime, parseDay } from "@/lib/dates";
import { Card, CardHeader, Empty } from "@/components/ui/card";
import { SegmentedLinks } from "@/components/ui/segmented";
import { Chip } from "@/components/ui/chip";

export type Shoot = { id: string; name: string; client: string | null; date: string; crew: string[] };
export type Deliverable = { id: string; title: string; due_date: string; project: string; projectId: string; assignee: string | null };

function DateBlock({ day }: { day: string }) {
  const d = parseDay(day);
  return (
    <span className="flex w-14 shrink-0 flex-col items-center rounded-[12px] bg-ink py-1.5 text-ivory">
      <span className="text-[11px] uppercase text-nav-label">{d.toLocaleString("en-IN", { month: "short", timeZone: "UTC" })}</span>
      <span className="font-display text-xl font-semibold text-gold-light">{d.getUTCDate()}</span>
    </span>
  );
}

export function ShootSchedule({ upcoming, done, tab }: { upcoming: Shoot[]; done: FeedRow[]; tab: string }) {
  return (
    <Card>
      <CardHeader
        title="Shoot schedule"
        action={
          <SegmentedLinks
            label="Shoot schedule"
            items={[
              { href: "/departments/production", label: `Next 7 days · ${upcoming.length}`, active: tab !== "done" },
              { href: "/departments/production?shoots=done", label: `Done this week · ${done.length}`, active: tab === "done" },
            ]}
          />
        }
      />
      {tab === "done" ? (
        done.length ? (
          <ul className="divide-y divide-line-soft">
            {done.map((t) => (
              <li key={t.id} className="flex items-start gap-3 py-3">
                <DateBlock day={t.work_date!} />
                <div className="min-w-0">
                  <p className="font-semibold text-ink-soft">{t.title}</p>
                  <p className="text-sm text-muted">{[formatTime(t.created_at), t.detail ? `Location: ${t.detail}` : null, t.project_name, t.user_name].filter(Boolean).join(" · ")}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No shoots logged this week.</Empty>
        )
      ) : upcoming.length ? (
        <ul className="divide-y divide-line-soft">
          {upcoming.map((s) => (
            <li key={s.id} className="flex items-start gap-3 py-3">
              <DateBlock day={s.date} />
              <div className="min-w-0">
                <Link href={`/projects/${s.id}`} className="font-semibold text-ink-soft hover:underline">
                  {s.name}
                </Link>
                <p className="text-sm text-muted">{[formatDay(s.date), s.client, s.crew.length ? `Crew: ${s.crew.join(", ")}` : null].filter(Boolean).join(" · ")}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>No shoots starting in the next 7 days.</Empty>
      )}
    </Card>
  );
}

export function Deliverables({ items, today }: { items: Deliverable[]; today: string }) {
  return (
    <Card>
      <CardHeader title="Deliverables due" sub="Open to-dos due in the next 7 days." />
      {items.length ? (
        <ul className="divide-y divide-line-soft">
          {items.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <span>
                <span className="block font-semibold text-ink-soft">{d.title}</span>
                <Link href={`/projects/${d.projectId}?tab=todos`} className="text-sm text-gold-deep underline">
                  {d.project}
                </Link>
                {d.assignee ? <span className="text-sm text-muted"> · {d.assignee}</span> : null}
              </span>
              <Chip tone={d.due_date < today ? "bad" : "warn"}>
                {d.due_date < today ? "Overdue" : "Due"} {formatDay(d.due_date)}
              </Chip>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Nothing due this week.</Empty>
      )}
    </Card>
  );
}
