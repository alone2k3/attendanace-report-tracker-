"use client";
import { useActionState, useState } from "react";
import { register, type AuthState } from "@/app/(auth)/actions";
import { Field, FormError, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { deptStyle, type Dept } from "@/lib/departments";
import { cn } from "@/lib/cn";

export function RegisterForm({ departments }: { departments: Pick<Dept, "slug" | "name">[] }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(register, undefined);
  const [dept, setDept] = useState("");
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Field label="Full name" htmlFor="fullName">
        <Input id="fullName" name="fullName" autoComplete="name" required maxLength={120} />
      </Field>
      <Field label="Work email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required inputMode="email" />
      </Field>
      <Field label="Password" htmlFor="password" hint="At least 6 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={6} />
      </Field>
      <fieldset>
        <legend className="text-sm font-semibold text-ink-soft">Department</legend>
        <p className="mt-0.5 text-xs text-muted">A mentor confirms it. After that, only a mentor can change it.</p>
        <input type="hidden" name="department" value={dept} />
        <div className="mt-2 grid grid-cols-3 gap-2">
          {departments.map((d) => {
            const s = deptStyle(d.slug);
            const selected = dept === d.slug;
            return (
              <button
                key={d.slug}
                type="button"
                aria-pressed={selected}
                onClick={() => setDept(d.slug)}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-[12px] border px-2 py-2 text-sm font-semibold",
                  selected ? "border-2 border-ink-soft" : "border-field-line bg-white",
                )}
                style={selected ? { background: s.tint, color: s.ink } : undefined}
              >
                <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: s.fill }} />
                {d.name}
              </button>
            );
          })}
        </div>
      </fieldset>
      <FormError message={state?.error} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
