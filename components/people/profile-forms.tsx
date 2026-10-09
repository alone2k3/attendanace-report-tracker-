"use client";
import { useActionState } from "react";
import { updateName, updatePassword } from "@/app/(app)/profile/actions";
import type { ActionResult } from "@/lib/errors";
import { Field, FormError, FormNotice, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function NameForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState<ActionResult | undefined, FormData>(updateName, undefined);
  return (
    <form action={action} className="flex flex-col gap-3">
      <Field label="Full name" htmlFor="fullName">
        <Input id="fullName" name="fullName" defaultValue={name} required maxLength={120} />
      </Field>
      <FormError message={state && !state.ok ? state.error : null} />
      <FormNotice message={state && state.ok ? state.message : null} />
      <Button type="submit" variant="secondary" disabled={pending} className="self-start">
        Save name
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<ActionResult | undefined, FormData>(updatePassword, undefined);
  return (
    <form action={action} className="flex flex-col gap-3">
      <Field label="New password" htmlFor="password" hint="At least 6 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={6} />
      </Field>
      <FormError message={state && !state.ok ? state.error : null} />
      <FormNotice message={state && state.ok ? state.message : null} />
      <Button type="submit" variant="secondary" disabled={pending} className="self-start">
        Change password
      </Button>
    </form>
  );
}
