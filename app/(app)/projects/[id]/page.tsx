import { notFound } from "next/navigation";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { activePeople } from "@/lib/people-list";
import { formatDateTime, formatDay, formatTime } from "@/lib/dates";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, Empty } from "@/components/ui/card";
import { Chip, DeptChip, PROJECT_LABEL, PROJECT_TONE } from "@/components/ui/chip";
import { SegmentedLinks } from "@/components/ui/segmented";
import { StatusSelect } from "@/components/projects/status-select";
import { Team } from "@/components/projects/team";
import { Todos } from "@/components/projects/todos";
import { Files } from "@/components/projects/files";
import { Comments } from "@/components/projects/comments";
import type { Person } from "@/components/projects/member-picker";

export const metadata = { title: "Project" };

const TABS = ["overview", "todos", "updates", "files", "comments"] as const;
const TAB_LABEL: Record<(typeof TABS)[number], string> = { overview: "Overview", todos: "To-dos", updates: "Updates", files: "Files", comments: "Comments" };

export default async function ProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const me = await requireMe();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const tab = (TABS as readonly string[]).includes((await searchParams).tab ?? "") ? ((await searchParams).tab as (typeof TABS)[number]) : "overview";
  const supabase = await createClient();
  const { data: p } = await supabase
    .from("projects")
    .select("id, name, client, brief, status, priority, start_date, due_date, created_by, department_id, departments(slug, name), owner:profiles!projects_created_by_fkey(full_name)")
    .eq("id", id)
    .maybeSingle();
  if (!p) notFound();

  const [{ data: members }, { data: todos }, { data: files }, { data: comments }, { data: updates }, people] = await Promise.all([
    supabase.from("project_members").select("user_id, profiles!project_members_user_id_fkey(id, full_name, departments!profiles_department_id_fkey(slug, name))").eq("project_id", id),
    supabase.from("project_todos").select("id, title, done, due_date, assignee:profiles!project_todos_assignee_id_fkey(full_name)").eq("project_id", id).order("created_at"),
    supabase.from("project_files").select("id, file_name, size_bytes, external_url, uploaded_by, uploader:profiles!project_files_uploaded_by_fkey(full_name)").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("project_comments").select("id, body, created_at, author:profiles!project_comments_author_id_fkey(full_name, departments!profiles_department_id_fkey(slug))").eq("project_id", id).order("created_at"),
    supabase.from("v_task_feed").select("id, title, status, work_date, created_at, user_name, department_slug, department_name, task_type_name").eq("project_id", id).order("created_at", { ascending: false }).limit(100),
    tab === "overview" ? activePeople() : Promise.resolve([] as Person[]),
  ]);

  const team: Person[] = (members ?? []).map((m) => {
    const pr = m.profiles as unknown as { id: string; full_name: string; departments: { slug: string; name: string } | null };
    return { id: pr.id, full_name: pr.full_name, dept: pr.departments };
  });
  const dept = p.departments as { slug: string; name: string } | null;
  const isTeam = p.created_by === me.id || team.some((t) => t.id === me.id);
  const isMentorHere = me.isAdmin || me.mentored.some((d) => d.id === p.department_id);
  const canEdit = isTeam || isMentorHere;
  const canManageTeam = p.created_by === me.id || isMentorHere;

  return (
    <>
      <PageHeader
        crumb={`Projects · ${dept?.name ?? ""}`}
        title={p.name}
        description={[p.client, `Owner ${(p.owner as { full_name: string } | null)?.full_name ?? ""}`].filter(Boolean).join(" · ")}
        actions={<StatusSelect projectId={p.id} status={p.status} canEdit={canEdit} />}
      />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Chip tone={PROJECT_TONE[p.status]}>{PROJECT_LABEL[p.status]}</Chip>
        {dept ? <DeptChip slug={dept.slug} name={dept.name} /> : null}
        <Chip tone={p.priority === "high" ? "bad" : "neutral"}>{p.priority} priority</Chip>
        {p.start_date ? <span className="text-sm text-muted">Starts {formatDay(p.start_date)}</span> : null}
        {p.due_date ? <span className="text-sm text-muted">· Due {formatDay(p.due_date)}</span> : null}
      </div>
      <div className="mb-5 overflow-x-auto">
        <SegmentedLinks label="Project sections" items={TABS.map((t) => ({ href: `/projects/${id}${t === "overview" ? "" : `?tab=${t}`}`, label: TAB_LABEL[t], active: tab === t }))} />
      </div>

      {tab === "overview" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Brief" />
            {p.brief ? <p className="whitespace-pre-line text-[15px]">{p.brief}</p> : <Empty>No brief yet.</Empty>}
          </Card>
          <Card>
            <CardHeader title={`Team · ${team.length}`} />
            <Team projectId={id} members={team} people={people} canManage={canManageTeam} ownerId={p.created_by} />
          </Card>
        </div>
      ) : null}

      {tab === "todos" ? (
        <Card>
          <CardHeader title="To-dos" />
          <Todos projectId={id} team={team} canEdit={canEdit} todos={(todos ?? []).map((t) => ({ id: t.id, title: t.title, done: t.done, due_date: t.due_date, assignee: (t.assignee as { full_name: string } | null)?.full_name ?? null }))} />
        </Card>
      ) : null}

      {tab === "updates" ? (
        <Card>
          <CardHeader title="Updates" sub="Daily tasks linked to this project that you're allowed to see." />
          {updates?.length ? (
            <ul className="divide-y divide-line-soft">
              {updates.map((u) => (
                <li key={u.id} className="flex flex-wrap items-start gap-3 py-3">
                  <span className="w-[120px] shrink-0 text-sm text-muted">
                    {formatDay(u.work_date!)} · {formatTime(u.created_at)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-semibold text-ink-soft">{u.user_name}</span>
                      <DeptChip slug={u.department_slug ?? ""} name={u.department_name ?? ""} />
                    </p>
                    <p className="font-semibold text-ink-soft">{u.title}</p>
                    {u.task_type_name ? <p className="text-sm text-muted">{u.task_type_name}</p> : null}
                  </div>
                  <Chip tone={u.status === "done" ? "ok" : "gold"}>{u.status === "done" ? "Done" : "In progress"}</Chip>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No linked tasks yet.</Empty>
          )}
        </Card>
      ) : null}

      {tab === "files" ? (
        <Card>
          <CardHeader title="Files" />
          <Files
            projectId={id}
            meId={me.id}
            canUpload={isTeam}
            files={(files ?? []).map((f) => ({ id: f.id, file_name: f.file_name, size_bytes: f.size_bytes, external_url: f.external_url, uploaded_by: f.uploaded_by, uploader: (f.uploader as { full_name: string } | null)?.full_name ?? "" }))}
          />
        </Card>
      ) : null}

      {tab === "comments" ? (
        <Card>
          <CardHeader title="Comments" />
          <Comments
            projectId={id}
            comments={(comments ?? []).map((c) => {
              const a = c.author as unknown as { full_name: string; departments: { slug: string } | null } | null;
              return { id: c.id, body: c.body, when: formatDateTime(c.created_at), author: a?.full_name ?? "", slug: a?.departments?.slug ?? null };
            })}
          />
        </Card>
      ) : null}
    </>
  );
}
