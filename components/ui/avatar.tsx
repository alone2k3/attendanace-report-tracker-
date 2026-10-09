import { deptStyle } from "@/lib/departments";
import { initials } from "@/lib/permissions";

export function Avatar({ name, slug, size = 36 }: { name: string; slug?: string | null; size?: number }) {
  const s = deptStyle(slug);
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{ width: size, height: size, background: s.tint, color: s.ink, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </span>
  );
}
