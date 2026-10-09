import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Chip, DeptChip, PROJECT_LABEL, PROJECT_TONE } from "@/components/ui/chip";
import { Avatar } from "@/components/ui/avatar";
import { formatDay } from "@/lib/dates";

export type ProjectCardData = {
  id: string;
  name: string;
  client: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  owner: string;
  todos: boolean[];
  team: { name: string; slug: string }[];
  depts: { slug: string; name: string }[];
};

export function ProjectCard({ p, today }: { p: ProjectCardData; today: string }) {
  const done = p.todos.filter(Boolean).length;
  return (
    <li className="rounded-[18px] border border-line bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/projects/${p.id}`} className="font-display text-lg font-semibold text-ink-soft hover:underline">
          {p.name}
        </Link>
        <Chip tone={PROJECT_TONE[p.status]}>{PROJECT_LABEL[p.status]}</Chip>
      </div>
      <p className="mt-0.5 text-sm text-muted">
        {p.client ? `${p.client} · ` : ""}Owner {p.owner}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        {p.due_date ? (
          <span className={p.due_date < today && p.status !== "completed" ? "inline-flex items-center gap-1 font-semibold text-bad" : "inline-flex items-center gap-1 text-text"}>
            <CalendarDays className="h-4 w-4" aria-hidden />
            Due {formatDay(p.due_date)}
          </span>
        ) : null}
        <Chip tone={p.priority === "high" ? "bad" : p.priority === "low" ? "neutral" : "gold"}>{p.priority === "high" ? "High priority" : p.priority === "low" ? "Low priority" : "Normal"}</Chip>
      </div>
      <div className="mt-3">
        <p className="mb-1 text-xs text-muted">
          {done} of {p.todos.length} to-dos done
        </p>
        <div className="flex h-2 gap-0.5" role="meter" aria-label="To-do progress" aria-valuenow={done} aria-valuemin={0} aria-valuemax={p.todos.length}>
          {p.todos.length === 0 ? <span className="h-full flex-1 rounded-full bg-track" /> : p.todos.map((d, i) => <span key={i} className={`h-full flex-1 rounded-full ${d ? "bg-gold" : "bg-track"}`} />)}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex -space-x-2" aria-label={`Team: ${p.team.map((t) => t.name).join(", ")}`}>
          {p.team.slice(0, 6).map((t, i) => (
            <span key={i} className="rounded-full ring-2 ring-white">
              <Avatar name={t.name} slug={t.slug} size={30} />
            </span>
          ))}
          {p.team.length > 6 ? <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-segmented text-xs font-semibold ring-2 ring-white">+{p.team.length - 6}</span> : null}
        </div>
        <div className="flex flex-wrap gap-1">
          {p.depts.map((d) => (
            <DeptChip key={d.slug} slug={d.slug} name={d.name} />
          ))}
        </div>
      </div>
    </li>
  );
}
