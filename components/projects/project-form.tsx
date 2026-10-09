"use client";
import { useActionState } from "react";
import { createProject } from "@/app/(app)/projects/actions";
import type { ActionResult } from "@/lib/errors";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { MemberPicker, type Person } from "./member-picker";

export function ProjectForm({ people, meId }: { people: Person[]; meId: string }) {
  const [state, action, pending] = useActionState<ActionResult | undefined, FormData>(createProject, undefined);
  return (
    <form action={action} className="grid gap-4 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <Field label="Project name" htmlFor="name">
          <Input id="name" name="name" required maxLength={160} placeholder="Diwali festive campaign" />
        </Field>
        <Field label="Client (optional)" htmlFor="client">
          <Input id="client" name="client" maxLength={120} />
        </Field>
        <Field label="Brief (optional)" htmlFor="brief">
          <Textarea id="brief" name="brief" maxLength={2000} rows={4} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date" htmlFor="startDate">
            <Input id="startDate" name="startDate" type="date" />
          </Field>
          <Field label="Due date" htmlFor="dueDate">
            <Input id="dueDate" name="dueDate" type="date" />
          </Field>
        </div>
        <Field label="Priority" htmlFor="priority">
          <Select id="priority" name="priority" defaultValue="normal">
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </Select>
        </Field>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold text-ink-soft">Tag people (any department)</legend>
        <MemberPicker people={people} exclude={[meId]} />
      </fieldset>
      <div className="flex flex-col gap-3 lg:col-span-2">
        <FormError message={state && !state.ok ? state.error : null} />
        <Button type="submit" size="lg" disabled={pending} className="self-start">
          {pending ? "Creating…" : "Create project"}
        </Button>
      </div>
    </form>
  );
}
