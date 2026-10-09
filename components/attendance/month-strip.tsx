import { STATUS_LETTER, type AttendanceStatus } from "@/lib/attendance";
import { ATTENDANCE_TONE, Chip } from "@/components/ui/chip";
import { cn } from "@/lib/cn";

const TONE_BG: Record<string, string> = {
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  info: "bg-info-bg text-info",
  neutral: "bg-neutral-bg text-neutral",
  bad: "bg-bad-bg text-bad",
};

/** Day chips for the month so far: number on top, status letter below. */
export function MonthStrip({ days, byDay, today }: { days: string[]; byDay: Map<string, AttendanceStatus>; today: string }) {
  return (
    <ol className="flex flex-wrap gap-1.5" aria-label="Days this month">
      {days.map((d) => {
        const s = byDay.get(d);
        const tone = s ? ATTENDANCE_TONE[s] : null;
        return (
          <li
            key={d}
            className={cn(
              "flex h-12 w-10 flex-col items-center justify-center rounded-[10px] text-xs font-semibold",
              tone ? TONE_BG[tone] : "bg-[#F5F0E2] text-muted",
              d === today && "ring-2 ring-ink-soft",
            )}
            aria-label={`${d}: ${s ?? "no record"}`}
          >
            <span>{Number(d.slice(8))}</span>
            <span className="text-[11px]">{s ? STATUS_LETTER[s] : "·"}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function MonthTotalsRow({ totals }: { totals: Record<AttendanceStatus, number> }) {
  const items: [AttendanceStatus, string][] = [
    ["present", "Present"],
    ["late", "Late"],
    ["wfh", "WFH"],
    ["half_day", "Half day"],
    ["leave", "Leave"],
    ["absent", "Absent"],
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(([k, label]) => (
        <Chip key={k} tone={ATTENDANCE_TONE[k]}>
          {totals[k]} {label}
        </Chip>
      ))}
    </div>
  );
}
