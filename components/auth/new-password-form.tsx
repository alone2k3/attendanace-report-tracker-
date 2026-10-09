"use client";
import { useActionState } from "react";
import { setNewPassword, type AuthState } from "@/app/(auth)/actions";
import { Field, FormError, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function NewPasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(setNewPassword, undefined);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Field label="New password" htmlFor="password" hint="At least 6 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </Field>
      <Field label="Type it again" htmlFor="confirm">
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
      </Field>
      <FormError message={state?.error} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}
