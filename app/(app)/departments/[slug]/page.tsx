import { notFound } from "next/navigation";
import { requireMe } from "@/lib/auth";
import { canSeeDepartment } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { departmentData } from "@/lib/department-page";
import { projectCards } from "@/lib/project-cards";
import type { Dept } from "@/lib/departments";
import { Card, CardHeader } from "@/components/ui/card";
import { StatRow, StatTile } from "@/components/ui/stat";
import { DeptHeader, TeamToday, TodaysUpdates } from "@/components/departments/shared";
import { CreativeBoard } from "@/components/departments/creative";
import { Deliverables, ShootSchedule, type Deliverable, type Shoot } from "@/components/departments/production";
import { CategoriesThisWeek, ProjectsTagging } from "@/components/departments/finance";

export const metadata = { title: "Department" };

export default async function DepartmentPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ status?: string; shoots?: string }> }) {
  const me = await requireMe();
  const { slug } = await params;
  const sp = await searchParams;
  // Members see only their own department; mentors theirs; admins all. RLS backs this up.
  if (!canSeeDepartment(me, slug)) notFound();
  const supabase = await createClient();
  const { data: dept } = await supabase.from("departments").select("id, slug, name, color, detail_label").eq("slug", slug).maybeSingle();
  if (!dept) notFound();
  const d = await departmentData(dept as Dept);
  const cards = await projectCards();
  const own = cards.filter((p) => p.department_id === dept.id);
  const touching = cards.filter((p) => p.department_id === dept.id || p.depts.some((x) => x.slug === dept.slug));
  const inToday = d.people.filter((p) => d.att.get(p.id)?.check_in_at).length;
  const onLeave = d.people.filter((p) => d.att.get(p.id)?.status === "leave").length;

  let third: { label: string; value: number };
  let extra: React.ReactNode = null;
  if (slug === "creative") {
    third = { label: "Live projects", value: own.filter((p) => !["completed", "on_hold"].includes(p.status)).length };
    extra = <CreativeBoard projects={own} status={sp.status} today={d.today} canCreate={me.department?.id === dept.id} />;
  } else if (slug === "production") {
    const ids = touching.map((p) => p.id);
    const [{ data: proj }, { data: todos }] = await Promise.all([
      ids.length ? supabase.from("projects").select("id, name, client, start_date").in("id", ids).gte("start_date", d.today).lte("start_date", d.soon).order("start_date") : Promise.resolve({ data: [] as { id: string; name: string; client: string | null; start_date: string | null }[] }),
      ids.length ? supabase.from("project_todos").select("id, title, due_date, project_id, projects(name), assignee:profiles!project_todos_assignee_id_fkey(full_name)").in("project_id", ids).eq("done", false).lte("due_date", d.soon).order("due_date") : Promise.resolve({ data: [] }),
    ]);
    const crew = new Map(touching.map((p) => [p.id, p.team.filter((t) => t.slug === "production").map((t) => t.name)]));
    const upcoming: Shoot[] = (proj ?? []).map((p) => ({ id: p.id, name: p.name, client: p.client, date: p.start_date!, crew: crew.get(p.id) ?? [] }));
    const done = d.weekFeed.filter((t) => t.task_type_name === "Shoot" || t.task_type_name === "Recce");
    const deliverables: Deliverable[] = (todos ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      due_date: t.due_date!,
      project: (t.projects as { name: string } | null)?.name ?? "",
      projectId: t.project_id,
      assignee: (t.assignee as { full_name: string } | null)?.full_name ?? null,
    }));
    third = { label: "Shoots this week", value: upcoming.length + done.filter((t) => t.task_type_name === "Shoot").length };
    extra = (
      <div className="grid gap-6 lg:grid-cols-2">
        <ShootSchedule upcoming={upcoming} done={done} tab={sp.shoots ?? "next"} />
        <Deliverables items={deliverables} today={d.today} />
      </div>
    );
  } else if (slug === "finance") {
    third = { label: "On leave", value: onLeave };
    const tagging = cards.filter((p) => p.status !== "completed" && p.department_id !== dept.id && p.depts.some((x) => x.slug === "finance"));
    extra = (
      <div className="grid gap-6 lg:grid-cols-2">
        <CategoriesThisWeek rows={d.weekFeed} />
        <ProjectsTagging projects={tagging} today={d.today} />
      </div>
    );
  } else {
    third = { label: "Live projects", value: own.filter((p) => p.status !== "completed").length };
  }

  return (
    <>
      <DeptHeader dept={dept as Dept} mentors={d.mentorNames} count={d.people.length} />
      <div className="flex flex-col gap-6">
        <StatRow>
          <StatTile dark label="In today" value={inToday} suffix={`of ${d.people.length}`} />
          <StatTile label="Tasks logged today" value={d.todayFeed.length} />
          <StatTile label={third.label} value={third.value} />
        </StatRow>
        {extra}
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader title="Today's updates" />
            <TodaysUpdates rows={d.todayFeed} detailLabel={dept.detail_label} expandable={slug === "finance"} />
          </Card>
          <TeamToday people={d.people} att={d.att} />
        </div>
      </div>
    </>
  );
}
