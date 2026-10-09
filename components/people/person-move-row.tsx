"use client";
import { useState, useTransition } from "react";
import { changeDepartment } from "@/app/(app)/mentor/people/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DeptChip } from "@/components/ui/chip";
import { Input, Select } from "@/components/ui/field";
import type { Dept } from "@/lib/departments";

export function PersonMoveRow({ person, current, departments, canMove }: { person: { id: string; full_name: string; role: string }; current: Dept; departments: Dept[]; canMove: boolean }) {
  const [target, setTarget] = useState(current.id);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const changed = target !== current.id;

  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <Avatar name={person.full_name} slug={current.slug} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink-soft">{person.full_name}</p>
          <div className="mt-0.5 flex flex-wrap gap-1.5">
            <DeptChip slug={current.slug} name={current.name} />
            {person.role !== "member" ? <span className="text-xs text-muted">{person.role === "admin" ? "Admin" : "Mentor"}</span> : null}
          </div>
        </div>
        {canMove ? (
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
            Move to
            <Select value={target} onChange={(e) => setTarget(e.target.value)} className="min-w-[150px]" aria-label={`Move ${person.full_name} to`}>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </label>
        ) : null}
      </div>
      {changed ? (
        <div className="flex flex-wrap items-end gap-2 sm:pl-12">
          <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-sm font-semibold text-ink-soft">
            Note (optional)
            <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Joining the shoot team" />
          </label>
          <Button
            disabled={pending}
            onClick={() =>
              start(async () => {
                setError(null);
                const r = await changeDepartment(person.id, target, note);
                if (!r.ok) setError(r.error);
                else setNote("");
              })
            }
          >
            Save change
          </Button>
          <Button variant="secondary" onClick={() => setTarget(current.id)}>
            Cancel
          </Button>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm font-medium text-bad sm:pl-12">
          {error}
        </p>
      ) : null}
    </li>
  );
}
