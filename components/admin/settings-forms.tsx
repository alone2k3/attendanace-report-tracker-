"use client";
import { useActionState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { addHoliday, removeHoliday, saveSettings } from "@/app/(app)/admin/actions";
import type { ActionResult } from "@/lib/errors";
import type { AppSettings } from "@/lib/settings";
import { Field, FormError, FormNotice, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { formatDay } from "@/lib/dates";

export function SettingsForm({ s }: { s: AppSettings }) {
  const [state, action, pending] = useActionState<ActionResult | undefined, FormData>(saveSettings, undefined);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <Field label="Office opens (IST)" htmlFor="office_start">
        <Input id="office_start" name="office_start" type="time" defaultValue={s.office_start} required />
      </Field>
      <Field label="Office closes (IST)" htmlFor="office_end">
        <Input id="office_end" name="office_end" type="time" defaultValue={s.office_end} required />
      </Field>
      <Field label="Late after (IST)" htmlFor="late_after">
        <Input id="late_after" name="late_after" type="time" defaultValue={s.late_after} required />
      </Field>
      <Field label="Half day under (minutes)" htmlFor="half_day_minutes" hint="270 = 4 h 30 m">
        <Input id="half_day_minutes" name="half_day_minutes" type="number" min={30} max={720} defaultValue={s.half_day_minutes} required />
      </Field>
      <Field label="Task reminder (IST)" htmlFor="reminder_at" hint="The email job runs from vercel.json; change both together.">
        <Input id="reminder_at" name="reminder_at" type="time" defaultValue={s.reminder_at} required />
      </Field>
      <Field label="Mentor digest (IST)" htmlFor="mentor_digest_at">
        <Input id="mentor_digest_at" name="mentor_digest_at" type="time" defaultValue={s.mentor_digest_at} required />
      </Field>
      <Field label="Weekly off" htmlFor="weekly_off" hint="Comma-separated: sun, or sat,sun">
        <Input id="weekly_off" name="weekly_off" defaultValue={s.weekly_off} required />
      </Field>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <FormError message={state && !state.ok ? state.error : null} />
        <FormNotice message={state && state.ok ? state.message : null} />
        <Button type="submit" disabled={pending} className="self-start">
          Save settings
        </Button>
      </div>
    </form>
  );
}

export function Holidays({ holidays }: { holidays: { day: string; name: string }[] }) {
  const [state, action, pending] = useActionState<ActionResult | undefined, FormData>(addHoliday, undefined);
  const [busy, start] = useTransition();
  return (
    <div className="flex flex-col gap-4">
      <ul className="divide-y divide-line-soft">
        {holidays.map((h) => (
          <li key={h.day} className="flex items-center justify-between gap-2 py-2">
            <span>
              <span className="font-semibold text-ink-soft">{formatDay(h.day)}</span> · {h.name}
            </span>
            <button type="button" aria-label={`Remove ${h.name}`} disabled={busy} onClick={() => start(async () => void (await removeHoliday(h.day)))} className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] text-muted hover:bg-bad-bg hover:text-bad">
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </li>
        ))}
        {holidays.length === 0 ? <li className="py-2 text-sm text-muted">No holidays added.</li> : null}
      </ul>
      <form action={action} className="grid gap-2 sm:grid-cols-[180px_1fr_auto]">
        <Input name="day" type="date" required aria-label="Holiday date" />
        <Input name="name" required maxLength={120} placeholder="Diwali" aria-label="Holiday name" />
        <Button type="submit" variant="dark" disabled={pending}>
          Add holiday
        </Button>
        <div className="sm:col-span-3">
          <FormError message={state && !state.ok ? state.error : null} />
        </div>
      </form>
    </div>
  );
}
