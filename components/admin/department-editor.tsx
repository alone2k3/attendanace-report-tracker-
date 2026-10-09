"use client";
import { useActionState, useTransition } from "react";
import { X } from "lucide-react";
import { addTaskType, removeTaskType, saveDepartment } from "@/app/(app)/admin/actions";
import type { ActionResult } from "@/lib/errors";
import { Field, FormError, FormNotice, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

type D = { id?: string; slug: string; name: string; color: string; detail_label: string | null };

export function DepartmentForm({ d }: { d?: D }) {
  const [state, action, pending] = useActionState<ActionResult | undefined, FormData>(saveDepartment, undefined);
  const k = d?.id ?? "new";
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_140px_1fr_auto] lg:items-end">
      {d?.id ? <input type="hidden" name="id" value={d.id} /> : null}
      <Field label="Name" htmlFor={`name-${k}`}>
        <Input id={`name-${k}`} name="name" defaultValue={d?.name} required maxLength={60} />
      </Field>
      <Field label="Slug (URL)" htmlFor={`slug-${k}`}>
        <Input id={`slug-${k}`} name="slug" defaultValue={d?.slug} required pattern="[a-z0-9-]+" maxLength={40} />
      </Field>
      <Field label="Colour" htmlFor={`color-${k}`}>
        <Input id={`color-${k}`} name="color" type="color" defaultValue={d?.color ?? "#C9A23F"} className="h-11 p-1" />
      </Field>
      <Field label="Extra field label" htmlFor={`dl-${k}`} hint="e.g. Location or Reference. Leave empty for none.">
        <Input id={`dl-${k}`} name="detailLabel" defaultValue={d?.detail_label ?? ""} maxLength={40} />
      </Field>
      <Button type="submit" variant={d ? "secondary" : "primary"} disabled={pending}>
        {d ? "Save" : "Add department"}
      </Button>
      <div className="sm:col-span-2 lg:col-span-5">
        <FormError message={state && !state.ok ? state.error : null} />
        <FormNotice message={state && state.ok ? state.message : null} />
      </div>
    </form>
  );
}

export function TaskTypes({ departmentId, types }: { departmentId: string; types: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<ActionResult | undefined, FormData>(addTaskType, undefined);
  const [busy, start] = useTransition();
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-ink-soft">Types of work</p>
      <ul className="flex flex-wrap gap-2">
        {types.map((t) => (
          <li key={t.id} className="inline-flex items-center gap-1 rounded-full bg-gold-tint pl-3 text-sm font-semibold text-gold-ink">
            {t.name}
            <button type="button" aria-label={`Remove ${t.name}`} disabled={busy} onClick={() => start(async () => void (await removeTaskType(t.id)))} className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-white">
              <X className="h-4 w-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <form action={action} className="flex flex-wrap gap-2">
        <input type="hidden" name="departmentId" value={departmentId} />
        <Input name="name" required maxLength={60} placeholder="New type of work" aria-label="New type of work" className="max-w-[260px]" />
        <Button type="submit" variant="secondary" disabled={pending}>
          Add
        </Button>
      </form>
      <FormError message={state && !state.ok ? state.error : null} />
    </div>
  );
}
