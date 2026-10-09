export type DeptStyle = { fill: string; tint: string; ink: string; dot: string; iconOnFill: string };

const STYLES: Record<string, DeptStyle> = {
  creative: { fill: "#C9A23F", tint: "#F6EDCF", ink: "#6E5410", dot: "#D9B24A", iconOnFill: "#000000" },
  production: { fill: "#D9692B", tint: "#FBE6D8", ink: "#9A3F0E", dot: "#E07A3A", iconOnFill: "#000000" },
  finance: { fill: "#5E7F35", tint: "#E6EFD9", ink: "#3E5A1E", dot: "#8DB05A", iconOnFill: "#FFFFFF" },
};

const FALLBACK: DeptStyle = { fill: "#6B6250", tint: "#EFEBE1", ink: "#5F5848", dot: "#8E8366", iconOnFill: "#FFFFFF" };

/** Department colours; fills come from departments.color when given. */
export function deptStyle(slug: string | null | undefined, color?: string | null): DeptStyle {
  const base = (slug && STYLES[slug]) || FALLBACK;
  return color ? { ...base, fill: color } : base;
}

export type Dept = { id: string; slug: string; name: string; color: string; detail_label: string | null };
