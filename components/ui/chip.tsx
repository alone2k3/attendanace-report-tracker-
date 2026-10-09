import { cn } from "@/lib/cn";
import { deptStyle } from "@/lib/departments";

const TONES = {
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  info: "bg-info-bg text-info",
  neutral: "bg-neutral-bg text-neutral",
  bad: "bg-bad-bg text-bad",
  gold: "bg-gold-tint text-gold-ink",
  dark: "bg-ink-soft text-ivory",
} as const;

export type Tone = keyof typeof TONES;

export function Chip({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-semibold", TONES[tone], className)}>
      {children}
    </span>
  );
}

export function DeptChip({ slug, name, className }: { slug: string; name: string; className?: string }) {
  const s = deptStyle(slug);
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-semibold", className)}
      style={{ background: s.tint, color: s.ink }}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: s.fill }} />
      {name}
    </span>
  );
}

export const ATTENDANCE_TONE: Record<string, Tone> = {
  present: "ok",
  late: "warn",
  wfh: "info",
  half_day: "warn",
  leave: "neutral",
  holiday: "neutral",
  absent: "bad",
};

export const PROJECT_TONE: Record<string, Tone> = {
  planning: "neutral",
  in_progress: "gold",
  review: "info",
  revision: "warn",
  completed: "ok",
  on_hold: "neutral",
};

export const PROJECT_LABEL: Record<string, string> = {
  planning: "Planning",
  in_progress: "In progress",
  review: "In review",
  revision: "Revision",
  completed: "Completed",
  on_hold: "On hold",
};
