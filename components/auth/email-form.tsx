"use client";
import { useActionState } from "react";
import { requestPasswordReset, resendConfirmation, type MailState } from "@/app/(auth)/actions";
import { Field, FormError, FormNotice, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function EmailForm({ mode }: { mode: "reset" | "resend" }) {
  const [state, action, pending] = useActionState<MailState, FormData>(mode === "reset" ? requestPasswordReset : resendConfirmation, undefined);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Field label="Work email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required inputMode="email" />
      </Field>
      <FormError message={state?.error} />
      <FormNotice message={state?.sent ? "If that email has an account, a link is on its way. Check Spam too." : null} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending…" : mode === "reset" ? "Send reset link" : "Resend confirmation email"}
      </Button>
    </form>
  );
}
