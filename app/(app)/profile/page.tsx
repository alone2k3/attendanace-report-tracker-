import { Lock } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { DeptChip, Chip } from "@/components/ui/chip";
import { NameForm, PasswordForm } from "@/components/people/profile-forms";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const me = await requireMe();
  return (
    <>
      <PageHeader crumb="Me" title="Profile" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Your details" />
          <dl className="mb-5 grid gap-3 text-[15px]">
            <div>
              <dt className="text-sm text-muted">Email</dt>
              <dd className="font-semibold text-ink-soft">{me.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Role</dt>
              <dd>
                <Chip tone="dark">{me.isAdmin ? "Admin" : me.isMentor ? "Mentor" : "Member"}</Chip>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Department</dt>
              <dd className="mt-1 flex flex-wrap items-center gap-2">
                {me.department ? <DeptChip slug={me.department.slug} name={me.department.name} /> : <span>None</span>}
                <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                  <Lock className="h-4 w-4" aria-hidden />
                  Set when you registered. Only a mentor can change it.
                </span>
              </dd>
            </div>
            {me.mentored.length ? (
              <div>
                <dt className="text-sm text-muted">You mentor</dt>
                <dd className="mt-1 flex flex-wrap gap-2">
                  {me.mentored.map((d) => (
                    <DeptChip key={d.id} slug={d.slug} name={d.name} />
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
          <NameForm name={me.fullName} />
        </Card>
        <Card>
          <CardHeader title="Password" />
          <PasswordForm />
        </Card>
      </div>
    </>
  );
}
