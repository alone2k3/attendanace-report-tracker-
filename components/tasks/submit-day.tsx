"use client";
import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { submitDay } from "@/app/(app)/tasks/actions";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

export function SubmitDay({
  date,
  mentorName,
  taskCount,
  status,
  note,
}: {
  date: string;
  mentorName: string;
  taskCount: number;
  status: "submitted" | "approved" | "sent_back" | null;
  note: string | null;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (status === "approved") return <Chip tone="ok">Approved by your mentor</Chip>;
  return (
    <div className="flex flex-col gap-2">
      {status === "sent_back" ? (
        <div role="status" className="rounded-[12px] bg-warn-bg px-3.5 py-2.5 text-sm text-warn">
          <strong>Sent back.</strong> {note ?? ""} You can edit this day and send it again.
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        {status === "submitted" ? <Chip tone="info">Sent for review</Chip> : null}
        <Button
          variant={status === "submitted" ? "secondary" : "dark"}
          disabled={pending || taskCount === 0}
          onClick={() =>
            start(async () => {
              setError(null);
              const r = await submitDay(date);
              if (!r.ok) setError(r.error);
            })
          }
        >
          <Send className="h-4 w-4" aria-hidden />
          {status === "submitted" ? "Send again" : `Send day to ${mentorName}`}
        </Button>
        {taskCount === 0 ? <span className="text-sm text-muted">Add at least one task first.</span> : null}
      </div>
      {error ? (
        <p role="alert" className="text-sm font-medium text-bad">
          {error}
        </p>
      ) : null}
    </div>
  );
}
