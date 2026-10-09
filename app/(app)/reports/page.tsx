import { requireMentor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addDays, formatDay, todayIST } from "@/lib/dates";
import { buildReport, REPORT_COLUMNS } from "@/lib/reports";
import { reportFilterSchema } from "@/lib/validations";
import { PageHeader } from "@/components/ui/page-header";
import { Card, Empty } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { ExportButtons } from "@/components/reports/export-buttons";

export const metadata = { title: "Reports" };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireMentor();
  const sp = await searchParams;
  const today = todayIST();
  const parsed = reportFilterSchema.safeParse({ from: sp.from || `${today.slice(0, 8)}01`, to: sp.to || today, department: sp.department || undefined, person: sp.person || undefined, project: sp.project || undefined });
  const f = parsed.success ? parsed.data : { from: addDays(today, -30), to: today, department: undefined, person: undefined, project: undefined };
  const depts = me.mentored;
  const deptIds = (f.department ? depts.filter((d) => d.slug === f.department) : depts).map((d) => d.id);
  const supabase = await createClient();

  const [{ data: people }, { data: projects }] = await Promise.all([
    deptIds.length ? supabase.from("profiles").select("id, full_name, department_id").eq("status", "active").in("department_id", deptIds).order("full_name") : Promise.resolve({ data: [] as { id: string; full_name: string; department_id: string | null }[] }),
    supabase.from("projects").select("id, name").order("name"),
  ]);
  const scoped = (people ?? []).filter((p) => !f.person || p.id === f.person);
  const ids = scoped.map((p) => p.id);
  const none = ["00000000-0000-0000-0000-000000000000"];
  let taskQ = supabase.from("v_task_feed").select("user_id, status, reviewed_at, flagged, work_date").in("user_id", ids.length ? ids : none).gte("work_date", f.from).lte("work_date", f.to);
  if (f.project) taskQ = taskQ.eq("project_id", f.project);
  const [{ data: att }, { data: tasks }, { data: subs }] = await Promise.all([
    supabase.from("attendance").select("user_id, status").in("user_id", ids.length ? ids : none).gte("work_date", f.from).lte("work_date", f.to),
    taskQ,
    supabase.from("day_submissions").select("user_id, work_date, submitted_at").in("user_id", ids.length ? ids : none).gte("work_date", f.from).lte("work_date", f.to),
  ]);
  const deptName = new Map(depts.map((d) => [d.id, d.name]));
  const rows = buildReport(scoped.map((p) => ({ id: p.id, full_name: p.full_name, department: deptName.get(p.department_id ?? "") ?? "" })), att ?? [], tasks ?? [], subs ?? []);
  const title = `Turmeric report ${formatDay(f.from)} – ${formatDay(f.to)}`;

  return (
    <>
      <PageHeader crumb="Mentor" title="Reports" description="Attendance and task summaries for the departments you cover." actions={<ExportButtons rows={rows} title={title} />} />
      <Card className="mb-6">
        <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(5,1fr)_auto] lg:items-end">
          <Field label="From" htmlFor="from">
            <Input id="from" name="from" type="date" defaultValue={f.from} />
          </Field>
          <Field label="To" htmlFor="to">
            <Input id="to" name="to" type="date" defaultValue={f.to} />
          </Field>
          <Field label="Department" htmlFor="department">
            <Select id="department" name="department" defaultValue={f.department ?? ""}>
              <option value="">All yours</option>
              {depts.map((d) => (
                <option key={d.id} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Person" htmlFor="person">
            <Select id="person" name="person" defaultValue={f.person ?? ""}>
              <option value="">Everyone</option>
              {(people ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Project (tasks)" htmlFor="project">
            <Select id="project" name="project" defaultValue={f.project ?? ""}>
              <option value="">Any</option>
              {(projects ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" variant="dark">
            Apply
          </Button>
        </form>
      </Card>
      <Card>
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <caption className="sr-only">{title}</caption>
              <thead>
                <tr className="border-b border-line text-left text-muted">
                  {REPORT_COLUMNS.map((c) => (
                    <th key={c.key} scope="col" className={`py-2 font-semibold ${c.key === "name" || c.key === "department" ? "" : "text-right"}`}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.name} className="border-b border-line-soft">
                    {REPORT_COLUMNS.map((c) => (
                      <td key={c.key} className={`py-2 ${c.key === "name" ? "font-semibold text-ink-soft" : c.key === "department" ? "text-muted" : "text-right"}`}>
                        {r[c.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>No one matches these filters.</Empty>
        )}
      </Card>
    </>
  );
}
