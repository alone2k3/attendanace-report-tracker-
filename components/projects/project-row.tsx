import Link from "next/link";
import { Chip, PROJECT_LABEL, PROJECT_TONE } from "@/components/ui/chip";
import { formatDay } from "@/lib/dates";

export type ProjectSummary = {
  id: string;
  name: string;
  status: string;
  due_date: string | null;
  todosDone: number;
  todosTotal: number;
  tagged: string[];
};

export function ProjectRow({ p }: { p: ProjectSummary }) {
  return (
    <li>
      <Link href={`/projects/${p.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] px-2 py-3 hover:bg-field">
        <span className="min-w-0">
          <span className="block font-semibold text-ink-soft">{p.name}</span>
          <span className="block text-sm text-muted">
            {p.todosDone} of {p.todosTotal} to-dos · {p.tagged.length ? `tagged ${p.tagged.join(", ")}` : "one department"}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <Chip tone={PROJECT_TONE[p.status]}>{PROJECT_LABEL[p.status]}</Chip>
          {p.due_date ? <span className="text-sm text-muted">Due {formatDay(p.due_date)}</span> : null}
        </span>
      </Link>
    </li>
  );
}
