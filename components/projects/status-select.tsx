"use client";
import { useState, useTransition } from "react";
import { updateProjectStatus } from "@/app/(app)/projects/actions";
import { Select } from "@/components/ui/field";
import { PROJECT_LABEL } from "@/components/ui/chip";

export function StatusSelect({ projectId, status, canEdit }: { projectId: string; status: string; canEdit: boolean }) {
  const [value, setValue] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (!canEdit) return null;
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
        Status
        <Select
          value={value}
          disabled={pending}
          onChange={(e) => {
            const next = e.target.value;
            const prev = value;
            setValue(next);
            start(async () => {
              setError(null);
              const r = await updateProjectStatus(projectId, next);
              if (!r.ok) {
                setValue(prev);
                setError(r.error);
              }
            });
          }}
          className="min-w-[160px]"
        >
          {Object.entries(PROJECT_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </label>
      {error ? (
        <p role="alert" className="text-sm text-bad">
          {error}
        </p>
      ) : null}
    </div>
  );
}
