import { weekdayShort } from "@/lib/dates";
import { cn } from "@/lib/cn";

export function WeekStrip({ counts, today }: { counts: { day: string; count: number }[]; today: string }) {
  return (
    <ol className="grid grid-cols-7 gap-1.5" aria-label="Tasks you logged this week">
      {counts.map((c) => (
        <li
          key={c.day}
          className={cn("flex flex-col items-center rounded-[12px] border px-1 py-2", c.day === today ? "border-ink-soft bg-ink-soft text-ivory" : "border-line bg-card")}
        >
          <span className={cn("text-xs", c.day === today ? "text-nav-text" : "text-muted")}>{weekdayShort(c.day)}</span>
          <span className={cn("font-display text-lg font-semibold", c.day === today ? "text-gold-light" : "text-ink-soft")}>{c.count}</span>
        </li>
      ))}
    </ol>
  );
}
