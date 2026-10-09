"use client";
import { useState, useTransition } from "react";
import { Building2, Home as HomeIcon, LogOut } from "lucide-react";
import { checkIn, checkOut } from "@/app/(app)/attendance/actions";
import { formatDuration, formatTime } from "@/lib/dates";
import { Chip } from "@/components/ui/chip";

type Row = { check_in_at: string | null; check_out_at: string | null; status: string; worked_minutes: number | null } | null;

export function AttendanceCard({ row, officeHours, lateAt }: { row: Row; officeHours: string; lateAt: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Something went wrong.");
    });

  let body: React.ReactNode;
  if (row?.status === "leave" && !row.check_in_at) {
    body = (
      <>
        <p className="font-display text-[26px] font-semibold text-ivory">You&apos;re on leave today</p>
        <p className="mt-1 text-sm text-nav-text">Enjoy the day off.</p>
      </>
    );
  } else if (!row?.check_in_at) {
    body = (
      <>
        <p className="font-display text-[26px] font-semibold text-ivory">Not checked in yet</p>
        <p className="mt-1 text-sm text-nav-text">
          Office hours {officeHours}. You&apos;re marked late after {lateAt}.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" disabled={pending} onClick={() => run(() => checkIn("office"))} className="inline-flex min-h-12 items-center gap-2 rounded-[12px] bg-gold px-5 font-bold text-black hover:bg-[#B8922F] disabled:opacity-60">
            <Building2 className="h-5 w-5" aria-hidden />
            Check in now
          </button>
          <button type="button" disabled={pending} onClick={() => run(() => checkIn("wfh"))} className="inline-flex min-h-12 items-center gap-2 rounded-[12px] border border-[#3A3220] px-5 font-semibold text-ivory hover:bg-nav-active disabled:opacity-60">
            <HomeIcon className="h-5 w-5" aria-hidden />
            Working from home
          </button>
        </div>
      </>
    );
  } else if (!row.check_out_at) {
    body = (
      <>
        <p className="flex flex-wrap items-center gap-2 font-display text-[26px] font-semibold text-ivory">
          Checked in at {formatTime(row.check_in_at)}
          <Chip tone={row.status === "late" ? "warn" : row.status === "wfh" ? "info" : "ok"}>
            {row.status === "late" ? "Late" : row.status === "wfh" ? "Work from home" : "On time"}
          </Chip>
        </p>
        <p className="mt-1 text-sm text-nav-text">Remember to check out when you leave.</p>
        <button type="button" disabled={pending} onClick={() => run(checkOut)} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-[12px] bg-gold px-5 font-bold text-black hover:bg-[#B8922F] disabled:opacity-60">
          <LogOut className="h-5 w-5" aria-hidden />
          Check out
        </button>
      </>
    );
  } else {
    body = (
      <>
        <p className="flex flex-wrap items-center gap-2 font-display text-[26px] font-semibold text-ivory">
          Done for today
          {row.status === "half_day" ? <Chip tone="warn">Half day</Chip> : null}
        </p>
        <p className="mt-1 text-sm text-nav-text">
          In {formatTime(row.check_in_at)} · Out {formatTime(row.check_out_at)} · {formatDuration(row.worked_minutes)} worked
        </p>
      </>
    );
  }

  return (
    <section aria-labelledby="att-title" className="rounded-[18px] bg-ink p-6 text-ivory">
      <h2 id="att-title" className="label-caps mb-3 text-nav-label">Attendance · today</h2>
      {body}
      {error ? (
        <p role="alert" className="mt-3 rounded-[10px] bg-bad-bg px-3 py-2 text-sm font-medium text-bad">
          {error}
        </p>
      ) : null}
    </section>
  );
}
