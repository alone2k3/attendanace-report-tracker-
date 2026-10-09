import { requireMentor } from "@/lib/auth";
import { peopleData } from "@/lib/people";
import { formatDateTime } from "@/lib/dates";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, Empty } from "@/components/ui/card";
import { RegistrationRow } from "@/components/people/registration-row";
import { PersonMoveRow } from "@/components/people/person-move-row";
import { ChangeLog } from "@/components/people/change-log";

export const metadata = { title: "People & departments" };

export default async function PeoplePage() {
  const me = await requireMentor();
  const { depts, byId, pending, people, changes } = await peopleData(me);

  return (
    <>
      <PageHeader crumb="Mentor" title="People & departments" description="Confirm new sign-ups and move people between departments. Only mentors can change a department." />
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader title={`New registrations · ${pending.length}`} sub="Choose a department (it defaults to the one they tagged), then approve." />
          {pending.length ? (
            <ul className="divide-y divide-line-soft">
              {pending.map((p) => (
                <RegistrationRow key={p.id} departments={depts} person={{ id: p.id, full_name: p.full_name, email: p.email, requested: p.requested, created: formatDateTime(p.created_at) }} />
              ))}
            </ul>
          ) : (
            <Empty>No one is waiting.</Empty>
          )}
        </Card>

        <Card>
          <CardHeader title="Your people" sub="Moving someone keeps their earlier tasks in the old department. New tasks go to the new one." />
          {people.length ? (
            <ul className="divide-y divide-line-soft">
              {people.map((p) => {
                const current = p.department_id ? byId.get(p.department_id) : undefined;
                if (!current) return null;
                return <PersonMoveRow key={p.id} person={p} current={current} departments={depts} canMove={p.role === "member"} />;
              })}
            </ul>
          ) : (
            <Empty>No active people in your departments yet.</Empty>
          )}
        </Card>

        <Card>
          <CardHeader title="Department change log" />
          <ChangeLog changes={changes} byId={byId} />
        </Card>
      </div>
    </>
  );
}
