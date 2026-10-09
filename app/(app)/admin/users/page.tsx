import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { UserRow } from "@/components/admin/user-row";
import { ButtonLink } from "@/components/ui/button";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const me = await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, full_name, email, role, status, departments!profiles_department_id_fkey(slug, name)").order("status").order("full_name");
  const pending = (data ?? []).filter((u) => u.status === "pending").length;
  return (
    <>
      <PageHeader
        crumb="Admin"
        title="Users"
        description={`${data?.length ?? 0} accounts${pending ? ` · ${pending} waiting for a mentor` : ""}. Departments change only through People & departments.`}
        actions={pending ? <ButtonLink href="/mentor/people" variant="secondary">Review registrations</ButtonLink> : null}
      />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th scope="col" className="py-2 font-semibold">Person</th>
                <th scope="col" className="py-2 font-semibold">Department</th>
                <th scope="col" className="py-2 font-semibold">Role</th>
                <th scope="col" className="py-2 font-semibold">Status</th>
                <th scope="col" className="py-2 text-right font-semibold">Account</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((u) => (
                <UserRow key={u.id} isMe={u.id === me.id} u={{ id: u.id, full_name: u.full_name, email: u.email, role: u.role, status: u.status, dept: (u.departments as { slug: string; name: string } | null) ?? null }} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
