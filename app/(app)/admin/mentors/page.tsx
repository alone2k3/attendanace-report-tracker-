import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, Empty } from "@/components/ui/card";
import { MentorRow } from "@/components/admin/mentor-row";

export const metadata = { title: "Mentors" };

export default async function MentorsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: mentors }, { data: depts }, { data: md }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, departments!profiles_department_id_fkey(slug)").in("role", ["mentor", "admin"]).eq("status", "active").order("full_name"),
    supabase.from("departments").select("id, slug, name").order("name"),
    supabase.from("mentor_departments").select("mentor_id, department_id"),
  ]);
  return (
    <>
      <PageHeader crumb="Admin" title="Mentors" description="Choose which departments each mentor covers. Make someone a mentor on the Users page first." />
      <Card>
        {mentors?.length ? (
          <ul className="divide-y divide-line-soft">
            {mentors.map((m) => (
              <MentorRow
                key={m.id}
                mentor={{ id: m.id, full_name: m.full_name, role: m.role, slug: (m.departments as { slug: string } | null)?.slug ?? null }}
                departments={depts ?? []}
                assigned={(md ?? []).filter((r) => r.mentor_id === m.id).map((r) => r.department_id)}
              />
            ))}
          </ul>
        ) : (
          <Empty>No mentors yet.</Empty>
        )}
      </Card>
    </>
  );
}
