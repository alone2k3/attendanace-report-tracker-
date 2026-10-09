"use client";
import { useState, useTransition } from "react";
import { reviewDay } from "@/app/(app)/mentor/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DeptChip } from "@/components/ui/chip";
import { Input } from "@/components/ui/field";

export function ReviewItem({
  id,
  name,
  dept,
  when,
  tasks,
}: {
  id: string;
  name: string;
  dept: { slug: string; name: string };
  when: string;
  tasks: { title: string; status: string; type: string | null }[];
}) {
  const [mode, setMode] = useState<"idle" | "back">("idle");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (decision: "approved" | "sent_back") =>
    start(async () => {
      setError(null);
      const r = await reviewDay(id, decision, note);
      if (!r.ok) setError(r.error);
    });

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-center gap-3">
        <Avatar name={name} slug={dept.slug} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink-soft">{name}</p>
          <p className="text-sm text-muted">{when}</p>
        </div>
        <DeptChip slug={dept.slug} name={dept.name} />
      </div>
      <ul className="mt-2 list-disc pl-14 text-sm text-text">
        {tasks.slice(0, 6).map((t, i) => (
          <li key={i}>
            {t.title}
            <span className="text-muted">
              {t.type ? ` · ${t.type}` : ""} · {t.status === "done" ? "Done" : "In progress"}
            </span>
          </li>
        ))}
        {tasks.length > 6 ? <li className="text-muted">+{tasks.length - 6} more</li> : null}
      </ul>
      <div className="mt-3 flex flex-wrap items-end gap-2 sm:pl-12">
        {mode === "back" ? (
          <>
            <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-sm font-semibold text-ink-soft">
              What needs fixing?
              <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} required placeholder="Link the project on the second task" />
            </label>
            <Button variant="dark" disabled={pending || !note.trim()} onClick={() => run("sent_back")}>
              Send back
            </Button>
            <Button variant="secondary" onClick={() => setMode("idle")}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button disabled={pending} onClick={() => run("approved")}>
              Approve
            </Button>
            <Button variant="secondary" disabled={pending} onClick={() => setMode("back")}>
              Send back
            </Button>
          </>
        )}
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm font-medium text-bad sm:pl-12">
          {error}
        </p>
      ) : null}
    </li>
  );
}
