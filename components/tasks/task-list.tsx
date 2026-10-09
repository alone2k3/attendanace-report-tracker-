"use client";
import { useOptimistic, useState, useTransition } from "react";
import { Flag, Trash2 } from "lucide-react";
import { deleteTask, setTaskStatus } from "@/app/(app)/tasks/actions";
import { formatTime } from "@/lib/dates";
import { Chip } from "@/components/ui/chip";
import { Empty } from "@/components/ui/card";

export type TaskRow = {
  id: string;
  title: string;
  status: "done" | "in_progress";
  created_at: string;
  type: string | null;
  project: string | null;
  detail: string | null;
  flagged: boolean;
  flagNote: string | null;
  reviewed: boolean;
};

type Op = { type: "status"; id: string; status: TaskRow["status"] } | { type: "remove"; id: string };

export function TaskList({ tasks, editable, detailLabel }: { tasks: TaskRow[]; editable: boolean; detailLabel: string | null }) {
  const [optimistic, apply] = useOptimistic(tasks, (state: TaskRow[], op: Op) =>
    op.type === "remove" ? state.filter((t) => t.id !== op.id) : state.map((t) => (t.id === op.id ? { ...t, status: op.status } : t)),
  );
  const [, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (optimistic.length === 0) return <Empty>Nothing logged yet today. Add your first task above.</Empty>;

  return (
    <>
      {error ? (
        <p role="alert" className="mb-3 rounded-[12px] bg-bad-bg px-3 py-2 text-sm font-medium text-bad">
          {error}
        </p>
      ) : null}
      <ul className="divide-y divide-line-soft">
        {optimistic.map((t) => {
          const meta = [t.type, t.project, t.detail && detailLabel ? `${detailLabel}: ${t.detail}` : null].filter(Boolean).join(" · ");
          return (
            <li key={t.id} className="flex flex-wrap items-start gap-3 py-3">
              <span className="w-[70px] shrink-0 pt-0.5 text-sm text-muted">{formatTime(t.created_at)}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink-soft">{t.title}</p>
                {meta ? <p className="text-sm text-muted">{meta}</p> : null}
                {t.flagged ? (
                  <p className="mt-1 flex items-start gap-1.5 rounded-[10px] bg-bad-bg px-2.5 py-1.5 text-sm text-bad">
                    <Flag className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>
                      <strong>Flagged by your mentor.</strong> {t.flagNote ?? ""}
                    </span>
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-1.5">
                {t.reviewed ? <Chip tone="ok">Reviewed</Chip> : null}
                {editable ? (
                  <button
                    type="button"
                    aria-pressed={t.status === "done"}
                    aria-label={`Status: ${t.status === "done" ? "Done" : "In progress"}. Switch`}
                    onClick={() =>
                      start(async () => {
                        const next = t.status === "done" ? "in_progress" : "done";
                        setError(null);
                        apply({ type: "status", id: t.id, status: next });
                        const r = await setTaskStatus(t.id, next);
                        if (!r.ok) setError(r.error);
                      })
                    }
                    className="inline-flex min-h-11 items-center"
                  >
                    <Chip tone={t.status === "done" ? "ok" : "gold"}>{t.status === "done" ? "Done" : "In progress"}</Chip>
                  </button>
                ) : (
                  <Chip tone={t.status === "done" ? "ok" : "gold"}>{t.status === "done" ? "Done" : "In progress"}</Chip>
                )}
                {editable ? (
                  <button
                    type="button"
                    aria-label={`Remove “${t.title}”`}
                    onClick={() =>
                      start(async () => {
                        setError(null);
                        apply({ type: "remove", id: t.id });
                        const r = await deleteTask(t.id);
                        if (!r.ok) setError(r.error);
                      })
                    }
                    className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] text-muted hover:bg-bad-bg hover:text-bad"
                  >
                    <Trash2 className="h-5 w-5" aria-hidden />
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
