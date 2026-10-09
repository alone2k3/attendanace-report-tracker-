import { redirect } from "next/navigation";
import { requireMe } from "@/lib/auth";
import { activePeople } from "@/lib/people-list";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ProjectForm } from "@/components/projects/project-form";

export const metadata = { title: "New project" };

export default async function NewProjectPage() {
  const me = await requireMe();
  if (!me.department) redirect("/projects");
  const people = await activePeople();
  return (
    <>
      <PageHeader crumb="Projects" title="New project" description={`The project belongs to ${me.department.name}. Tag anyone who's involved.`} />
      <Card>
        <ProjectForm people={people} meId={me.id} />
      </Card>
    </>
  );
}
