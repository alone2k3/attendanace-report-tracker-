"use client";
import { useActionState, useTransition } from "react";
import { cancelLeave, markLeave } from "@/app/(app)/attendance/actions";
import type { ActionResult } from "@/lib/errors";
import { Field, FormError, FormNotice, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { formatDay } from "@/lib/dates";

export function LeaveForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState<ActionResult | undefined, FormData>(markLeave, undefined);
  return (
    <form action={action} className="flex flex-col gap-3">
      <Field label="Date" htmlFor="leave-date">
        <Input id="leave-date" name="date" type="date" min={today} required />
      </Field>
      <Field label="Note (optional)" htmlFor="leave-note">
        <Input id="leave-note" name="note" maxLength={200} placeholder="Family function" />
      </Field>
      <FormError message={state && !state.ok ? state.error : null} />
      <FormNotice message={state && state.ok ? state.message : null} />
      <Button type="submit" variant="dark" disabled={pending}>
        {pending ? "Saving…" : "Mark leave"}
      </Button>
    </form>
  );
}

export function UpcomingLeave({ days }: { days: { work_date: string; note: string | null }[] }) {
  const [pending, start] = useTransition();
  if (days.length === 0) return <p className="text-sm text-muted">No leave coming up.</p>;
  return (
    <ul className="divide-y divide-line-soft">
      {days.map((d) => (
        <li key={d.work_date} className="flex items-center justify-between gap-3 py-2">
          <span>
            <span className="font-semibold text-ink-soft">{formatDay(d.work_date)}</span>
            {d.note ? <span className="block text-sm text-muted">{d.note}</span> : null}
          </span>
          <Button variant="secondary" size="sm" disabled={pending} onClick={() => start(async () => void (await cancelLeave(d.work_date)))}>
            Cancel
          </Button>
        </li>
      ))}
    </ul>
  );
}
