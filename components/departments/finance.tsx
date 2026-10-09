import type { FeedRow } from "@/lib/mentor";
import { summarizeTasks } from "@/lib/tasks";
import { Card, CardHeader, Empty } from "@/components/ui/card";
import { Bar } from "@/components/ui/stat";
import { ProjectCard, type ProjectCardData } from "@/components/projects/project-card";

export function CategoriesThisWeek({ rows }: { rows: FeedRow[] }) {
  const s = summarizeTasks(rows);
  const max = Math.max(1, ...s.byType.map((t) => t.count));
  return (
    <Card>
      <CardHeader title="Tasks by category this week" sub="Counts of tasks logged, not hours." />
      {s.byType.length ? (
        <ul className="flex flex-col gap-3">
          {s.byType.map((t) => (
            <li key={t.name}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-semibold text-ink-soft">{t.name}</span>
                <span className="text-muted">{t.count}</span>
              </div>
              <Bar value={(t.count / max) * 100} color="#5E7F35" label={`${t.name}: ${t.count} tasks`} />
            </li>
          ))}
        </ul>
      ) : (
        <Empty>No tasks logged this week.</Empty>
      )}
    </Card>
  );
}

export function ProjectsTagging({ projects, today }: { projects: ProjectCardData[]; today: string }) {
  return (
    <Card>
      <CardHeader title="Projects tagging Finance" />
      {projects.length ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} p={p} today={today} />
          ))}
        </ul>
      ) : (
        <Empty>No open projects tag Finance yet.</Empty>
      )}
    </Card>
  );
}
