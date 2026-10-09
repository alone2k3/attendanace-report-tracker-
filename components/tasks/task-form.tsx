"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { addTask } from "@/app/(app)/tasks/actions";
import type { ActionResult } from "@/lib/errors";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type Option = { id: string; name: string };

export function TaskForm({
  deptName,
  deptSlug,
  detailLabel,
  types,
  projects,
  workDate,
}: {
  deptName: string;
  deptSlug: string;
  detailLabel: string | null;
  types: Option[];
  projects: Option[];
  workDate: string;
}) {
  const [state, action, pending] = useActionState<ActionResult | undefined, FormData>(addTask, undefined);
  const [status, setStatus] = useState<"done" | "in_progress">("done");
  const formRef = useRef<HTMLFormElement>(null);
  // After a successful add: reset the status toggle (during render) and the inputs (after commit).
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state?.ok) setStatus("done");
  }
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);
  const typeLabel = deptSlug === "finance" ? "Category" : "Type of work";
  const projectLabel = deptSlug === "production" ? "Shoot or project" : "Project";

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      <input type="hidden" name="workDate" value={workDate} />
      <input type="hidden" name="status" value={status} />
      <Field label="What did you do?" htmlFor="title">
        <Textarea id="title" name="title" required maxLength={300} rows={2} placeholder="Diwali key visual, round 2" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={typeLabel} htmlFor="taskTypeId">
          <Select id="taskTypeId" name="taskTypeId" defaultValue="">
            <option value="">Choose…</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={`${projectLabel} (optional)`} htmlFor="projectId">
          <Select id="projectId" name="projectId" defaultValue="">
            <option value="">None</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        {detailLabel ? (
          <Field label={detailLabel} htmlFor="detail">
            <Input id="detail" name="detail" maxLength={200} placeholder={detailLabel === "Reference" ? "Invoice or batch no." : "Where"} />
          </Field>
        ) : null}
      </div>
      <fieldset>
        <legend className="text-sm font-semibold text-ink-soft">Status</legend>
        <div className="mt-2 inline-flex gap-1 rounded-[14px] bg-segmented p-1">
          {(
            [
              ["done", "Done"],
              ["in_progress", "In progress"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              aria-pressed={status === v}
              onClick={() => setStatus(v)}
              className={cn("min-h-11 rounded-[10px] px-4 text-sm font-semibold", status === v ? "bg-ink-soft text-ivory" : "text-ink-soft")}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <FormError message={state && !state.ok ? state.error : null} />
      <Button type="submit" size="lg" disabled={pending} className="self-start">
        {pending ? "Adding…" : `Add to ${deptName} log`}
      </Button>
    </form>
  );
}
