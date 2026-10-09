import { Plus } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { projectCards } from "@/lib/project-cards";
import { todayIST } from "@/lib/dates";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Empty } from "@/components/ui/card";
import { PillLinks } from "@/components/ui/segmented";
import { PROJECT_LABEL } from "@/components/ui/chip";
import { ProjectCard } from "@/components/projects/project-card";

export const metadata = { title: "Projects" };

const STATUSES = ["planning", "in_progress", "review", "revision", "completed", "on_hold"] as const;

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ status?: string; mine?: string }> }) {
  const me = await requireMe();
  const sp = await searchParams;
  const all = await projectCards();
  const today = todayIST();
  const mine = sp.mine === "1";
  const scoped = mine ? all.filter((p) => p.team.some((t) => t.name === me.fullName) || p.owner === me.fullName) : all;
  const list = scoped.filter((p) => (sp.status ? p.status === sp.status : p.status !== "completed"));
  const q = (patch: Record<string, string | undefined>) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries({ status: sp.status, mine: sp.mine, ...patch })) if (v) u.set(k, v);
    const s = u.toString();
    return s ? `/projects?${s}` : "/projects";
  };

  return (
    <>
      <PageHeader
        crumb="Me"
        title="Projects"
        description="Tag people from any department. Daily tasks can link to a project."
        actions={
          me.department ? (
            <ButtonLink href="/projects/new">
              <Plus className="h-5 w-5" aria-hidden />
              New project
            </ButtonLink>
          ) : null
        }
      />
      <div className="mb-5 flex flex-col gap-3">
        <PillLinks label="Whose projects" items={[{ href: q({ mine: undefined }), label: "All projects", active: !mine }, { href: q({ mine: "1" }), label: "Mine", active: mine }]} />
        <PillLinks
          label="Status"
          items={[
            { href: q({ status: undefined }), label: `Open · ${scoped.filter((p) => p.status !== "completed").length}`, active: !sp.status },
            ...STATUSES.map((s) => ({ href: q({ status: s }), label: `${PROJECT_LABEL[s]} · ${scoped.filter((p) => p.status === s).length}`, active: sp.status === s })),
          ]}
        />
      </div>
      {list.length ? (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <ProjectCard key={p.id} p={p} today={today} />
          ))}
        </ul>
      ) : (
        <Empty>No projects here yet.</Empty>
      )}
    </>
  );
}
