"use client";
import { useState, useTransition } from "react";
import { Mail } from "lucide-react";
import { sendCheckinReminder } from "@/app/(app)/mentor/actions";
import { Button } from "@/components/ui/button";

export function ReminderButton({ profileId, name, already }: { profileId: string; name: string; already: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(already ? "Reminded today" : null);
  return (
    <span className="flex items-center gap-2">
      {msg ? <span className="text-sm text-muted" role="status">{msg}</span> : null}
      {!msg ? (
        <Button
          variant="secondary"
          size="sm"
          disabled={pending}
          aria-label={`Email ${name} a check-in reminder`}
          onClick={() =>
            start(async () => {
              const r = await sendCheckinReminder(profileId);
              setMsg(r.ok ? (r.message ?? "Reminder sent.") : r.error);
            })
          }
        >
          <Mail className="h-4 w-4" aria-hidden />
          Email reminder
        </Button>
      ) : null}
    </span>
  );
}
