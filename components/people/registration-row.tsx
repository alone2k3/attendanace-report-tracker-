"use client";
import { useState, useTransition } from "react";
import { approveRegistration, declineRegistration } from "@/app/(app)/mentor/people/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DeptChip } from "@/components/ui/chip";
import { Input, Select } from "@/components/ui/field";
import type { Dept } from "@/lib/departments";

export function RegistrationRow({
  person,
  departments,
}: {
  person: { id: string; full_name: string; email: string; requested: Dept | null; created: string };
  departments: Dept[];
}) {
  const [dept, setDept] = useState(person.requested?.id ?? departments[0]?.id ?? "");
  const [declining, setDeclining] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Something went wrong.");
    });

  return (
    <li className="flex flex-col gap-3 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <Avatar name={person.full_name} slug={person.requested?.slug} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink-soft">{person.full_name}</p>
          <p className="truncate text-sm text-muted">
            {person.email} · registered {person.created}
          </p>
        </div>
        {person.requested ? <DeptChip slug={person.requested.slug} name={`Tagged ${person.requested.name}`} /> : null}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-sm font-semibold text-ink-soft">
          Department
          <Select value={dept} onChange={(e) => setDept(e.target.value)} className="min-w-[160px]" aria-label={`Department for ${person.full_name}`}>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </label>
        <Button disabled={pending || !dept} onClick={() => run(() => approveRegistration(person.id, dept))}>
          Approve
        </Button>
        {!declining ? (
          <Button variant="danger" disabled={pending} onClick={() => setDeclining(true)}>
            Decline
          </Button>
        ) : null}
      </div>
      {declining ? (
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-sm font-semibold text-ink-soft">
            Note (optional)
            <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Not on the team" />
          </label>
          <Button variant="danger" disabled={pending} onClick={() => run(() => declineRegistration(person.id, note))}>
            Confirm decline
          </Button>
          <Button variant="secondary" onClick={() => setDeclining(false)}>
            Cancel
          </Button>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm font-medium text-bad">
          {error}
        </p>
      ) : null}
    </li>
  );
}
