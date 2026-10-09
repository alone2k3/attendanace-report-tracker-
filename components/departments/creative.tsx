import { Plus } from "lucide-react";
import type { ProjectCardData } from "@/components/projects/project-card";
import { ProjectCard } from "@/components/projects/project-card";
import { Card, CardHeader, Empty } from "@/components/ui/card";
import { PillLinks } from "@/components/ui/segmented";
import { PROJECT_LABEL } from "@/components/ui/chip";
import { ButtonLink } from "@/components/ui/button";

const ORDER = ["planning", "in_progress", "review", "revision", "on_hold", "completed"] as const;

export function CreativeBoard({ projects, status, today, canCreate }: { projects: ProjectCardData[]; status?: string; today: string; canCreate: boolean }) {
  const open = projects.filter((p) => p.status !== "completed");
  const list = status ? projects.filter((p) => p.status === status) : open;
  return (
    <Card>
      <CardHeader
        title="Projects"
        action={
          canCreate ? (
            <ButtonLink href="/projects/new">
              <Plus className="h-5 w-5" aria-hidden />
              New project
            </ButtonLink>
          ) : null
        }
      />
      <PillLinks
        label="Filter projects by status"
        items={[
          { href: "/departments/creative", label: `All open · ${open.length}`, active: !status },
          ...ORDER.map((s) => ({ href: `/departments/creative?status=${s}`, label: `${PROJECT_LABEL[s]} · ${projects.filter((p) => p.status === s).length}`, active: status === s })),
        ]}
      />
      <div className="mt-4">
        {list.length ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {list.map((p) => (
              <ProjectCard key={p.id} p={p} today={today} />
            ))}
          </ul>
        ) : (
          <Empty>No projects with this status.</Empty>
        )}
      </div>
    </Card>
  );
}
