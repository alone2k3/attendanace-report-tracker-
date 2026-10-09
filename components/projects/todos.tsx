"use client";
import { useActionState, useEffect, useRef, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { addTodo, deleteTodo, toggleTodo } from "@/app/(app)/projects/actions";
import type { ActionResult } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { FormError, Input, Select } from "@/components/ui/field";
import { Empty } from "@/components/ui/card";
import { formatDay } from "@/lib/dates";
import type { Person } from "./member-picker";

type Todo = { id: string; title: string; done: boolean; due_date: string | null; assignee: string | null };

export function Todos({ projectId, todos, team, canEdit }: { projectId: string; todos: Todo[]; team: Person[]; canEdit: boolean }) {
  const [state, action, pending] = useActionState<ActionResult | undefined, FormData>(addTodo, undefined);
  const [busy, start] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);
  return (
    <div className="flex flex-col gap-4">
      {todos.length ? (
        <ul className="divide-y divide-line-soft">
          {todos.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-2">
              <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3">
                <input type="checkbox" checked={t.done} disabled={!canEdit || busy} onChange={(e) => start(async () => void (await toggleTodo(projectId, t.id, e.target.checked)))} className="h-5 w-5 accent-[#14110A]" />
                <span className={t.done ? "text-muted line-through" : "font-medium text-ink-soft"}>{t.title}</span>
              </label>
              <span className="text-sm text-muted">{[t.assignee, t.due_date ? `Due ${formatDay(t.due_date)}` : null].filter(Boolean).join(" · ")}</span>
              {canEdit ? (
                <button type="button" aria-label={`Remove ${t.title}`} onClick={() => start(async () => void (await deleteTodo(projectId, t.id)))} className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] text-muted hover:bg-bad-bg hover:text-bad">
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <Empty>No to-dos yet.</Empty>
      )}
      {canEdit ? (
        <form ref={form} action={action} className="grid gap-2 sm:grid-cols-[1fr_180px_160px_auto]">
          <input type="hidden" name="projectId" value={projectId} />
          <Input name="title" required maxLength={200} placeholder="Add a to-do" aria-label="To-do" />
          <Select name="assigneeId" defaultValue="" aria-label="Assignee">
            <option value="">No assignee</option>
            {team.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </Select>
          <Input name="dueDate" type="date" aria-label="Due date" />
          <Button type="submit" variant="dark" disabled={pending}>
            Add
          </Button>
          <div className="sm:col-span-4">
            <FormError message={state && !state.ok ? state.error : null} />
          </div>
        </form>
      ) : null}
    </div>
  );
}
