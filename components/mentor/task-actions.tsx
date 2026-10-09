"use client";
import { useState, useTransition } from "react";
import { Check, Flag } from "lucide-react";
import { flagTask, markReviewed } from "@/app/(app)/mentor/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

/** Mentors can mark reviewed (done tasks only) and flag. They never edit a task. */
export function TaskActions({ id, status, reviewed, flagged, ownTask }: { id: string; status: string; reviewed: boolean; flagged: boolean; ownTask: boolean }) {
  const [pending, start] = useTransition();
  const [flagging, setFlagging] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  if (ownTask) return <span className="text-xs text-muted">Your task</span>;
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Something went wrong.");
      else setFlagging(false);
    });

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap justify-end gap-1.5">
        {status === "done" ? (
          <Button variant={reviewed ? "ghost" : "secondary"} size="sm" aria-pressed={reviewed} disabled={pending} onClick={() => run(() => markReviewed(id, !reviewed))}>
            <Check className="h-4 w-4" aria-hidden />
            {reviewed ? "Reviewed" : "Mark reviewed"}
          </Button>
        ) : null}
        {flagged ? (
          <Button variant="danger" size="sm" aria-pressed disabled={pending} onClick={() => run(() => flagTask(id, false))}>
            <Flag className="h-4 w-4" aria-hidden />
            Flagged
          </Button>
        ) : (
          <Button variant="secondary" size="sm" aria-pressed={false} disabled={pending} onClick={() => setFlagging((v) => !v)}>
            <Flag className="h-4 w-4" aria-hidden />
            Flag
          </Button>
        )}
      </div>
      {flagging ? (
        <div className="flex w-full max-w-[320px] gap-1.5">
          <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Note (optional)" aria-label="Flag note" />
          <Button variant="dark" size="sm" disabled={pending} onClick={() => run(() => flagTask(id, true, note))}>
            Flag
          </Button>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="text-xs font-medium text-bad">
          {error}
        </p>
      ) : null}
    </div>
  );
}
