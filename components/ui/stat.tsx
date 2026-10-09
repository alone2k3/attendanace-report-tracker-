import { cn } from "@/lib/cn";

export function StatTile({ label, value, suffix, dark, className }: { label: string; value: React.ReactNode; suffix?: string; dark?: boolean; className?: string }) {
  return (
    <div className={cn("rounded-[16px] border p-4", dark ? "border-ink bg-ink text-ivory" : "border-line bg-card", className)}>
      <p className={cn("text-[13px]", dark ? "text-nav-text" : "text-muted")}>{label}</p>
      <p className={cn("mt-1 font-display text-[30px] font-semibold leading-tight", dark ? "text-gold-light" : "text-ink-soft")}>
        {value}
        {suffix ? <span className={cn("ml-1 text-sm font-medium", dark ? "text-nav-text" : "text-muted")}>{suffix}</span> : null}
      </p>
    </div>
  );
}

export function StatRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">{children}</div>;
}

export function Bar({ value, color = "#C9A23F", label }: { value: number; color?: string; label: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div role="meter" aria-label={label} aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} className="h-2 w-full overflow-hidden rounded-full bg-track">
      <div className="h-full rounded-full" style={{ width: `${v}%`, background: color }} />
    </div>
  );
}
