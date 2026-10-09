import Link from "next/link";
import { cn } from "@/lib/cn";

/** Link-based tabs/pills that keep state in the URL (works without JS). */
export function SegmentedLinks({ items, label }: { items: { href: string; label: string; active: boolean }[]; label: string }) {
  return (
    <nav aria-label={label} className="inline-flex flex-wrap gap-1 rounded-[14px] bg-segmented p-1">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={i.active ? "page" : undefined}
          className={cn(
            "inline-flex min-h-11 items-center rounded-[10px] px-4 text-sm font-semibold",
            i.active ? "bg-ink-soft text-ivory" : "text-ink-soft hover:bg-white",
          )}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

export function PillLinks({ items, label }: { items: { href: string; label: string; active: boolean }[]; label: string }) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={i.active ? "true" : undefined}
          className={cn(
            "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold",
            i.active ? "border-ink-soft bg-ink-soft text-ivory" : "border-field-line bg-white text-ink-soft hover:bg-field",
          )}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
