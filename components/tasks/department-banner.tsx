import { Lock } from "lucide-react";
import { deptStyle, type Dept } from "@/lib/departments";
import { DeptIcon } from "./dept-icon";

export function DepartmentBanner({ dept }: { dept: Dept }) {
  const s = deptStyle(dept.slug, dept.color);
  return (
    <section aria-label="Your department" className="flex flex-wrap items-center gap-4 rounded-[18px] border-2 border-ink-soft bg-card p-4 sm:p-5">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-[14px]" style={{ background: s.fill, color: s.iconOnFill }}>
        <DeptIcon slug={dept.slug} />
      </span>
      <div className="min-w-0">
        <p className="label-caps text-muted">Your department</p>
        <p className="font-display text-xl font-semibold text-ink-soft">{dept.name}</p>
      </div>
      <p className="flex min-w-[220px] flex-1 items-start gap-2 text-sm text-text">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        Tagged when you registered. You can only post to {dept.name}, and only a mentor can change your department.
      </p>
    </section>
  );
}
