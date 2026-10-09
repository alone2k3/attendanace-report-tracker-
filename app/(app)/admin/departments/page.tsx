import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { DepartmentForm, TaskTypes } from "@/components/admin/department-editor";

export const metadata = { title: "Departments" };

export default async function DepartmentsAdminPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: depts }, { data: types }] = await Promise.all([
    supabase.from("departments").select("id, slug, name, color, detail_label").order("name"),
    supabase.from("task_types").select("id, name, department_id").order("sort"),
  ]);
  return (
    <>
      <PageHeader crumb="Admin" title="Departments" description="Names, colours, the extra task field and types of work." />
      <div className="flex flex-col gap-6">
        {(depts ?? []).map((d) => (
          <Card key={d.id}>
            <CardHeader title={d.name} />
            <DepartmentForm d={d} />
            <div className="mt-5 border-t border-line-soft pt-4">
              <TaskTypes departmentId={d.id} types={(types ?? []).filter((t) => t.department_id === d.id)} />
            </div>
          </Card>
        ))}
        <Card>
          <CardHeader title="Add a department" />
          <DepartmentForm />
        </Card>
      </div>
    </>
  );
}
