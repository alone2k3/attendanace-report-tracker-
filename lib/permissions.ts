import type { Me } from "./auth";

/** Department pages: members see their own; mentors see theirs; admins see all. */
export function canSeeDepartment(me: Pick<Me, "visible" | "isAdmin">, slug: string): boolean {
  return me.isAdmin || me.visible.some((d) => d.slug === slug);
}

export function canReviewDepartment(me: Pick<Me, "mentored" | "isAdmin">, departmentId: string): boolean {
  return me.isAdmin || me.mentored.some((d) => d.id === departmentId);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}
