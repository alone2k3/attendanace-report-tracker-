"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { commentSchema, firstError, linkSchema, projectSchema, projectStatusSchema, todoSchema, uuid } from "@/lib/validations";

export async function createProject(_: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const me = await requireMe();
  if (!me.department) return { ok: false, error: "You need a department to create a project." };
  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    client: formData.get("client") ?? undefined,
    brief: formData.get("brief") ?? undefined,
    startDate: formData.get("startDate") ?? "",
    dueDate: formData.get("dueDate") ?? "",
    priority: formData.get("priority") ?? "normal",
    members: formData.getAll("members").map(String),
  });
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const p = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({ name: p.name, client: p.client ?? null, brief: p.brief ?? null, start_date: p.startDate ?? null, due_date: p.dueDate ?? null, priority: p.priority, department_id: me.department.id, created_by: me.id })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: friendlyError(error, "We couldn't create the project.") };
  const members = [...new Set([me.id, ...p.members])];
  const { error: mErr } = await supabase.from("project_members").insert(members.map((user_id) => ({ project_id: data.id, user_id, added_by: me.id })));
  if (mErr) return { ok: false, error: friendlyError(mErr, "The project was created but tagging people failed.") };
  revalidatePath("/projects");
  redirect(`/projects/${data.id}`);
}

export async function updateProjectStatus(projectId: string, status: string): Promise<ActionResult> {
  await requireMe();
  const s = projectStatusSchema.safeParse(status);
  if (!uuid.safeParse(projectId).success || !s.success) return { ok: false, error: "Pick a valid status." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").update({ status: s.data }).eq("id", projectId).select("id");
  if (error) return { ok: false, error: friendlyError(error) };
  if (!data?.length) return { ok: false, error: "Only the owner, the team or a mentor can change this project." };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  return { ok: true };
}

export async function addMembers(projectId: string, userIds: string[]): Promise<ActionResult> {
  const me = await requireMe();
  const parsed = z.object({ projectId: uuid, userIds: z.array(uuid).min(1).max(50) }).safeParse({ projectId, userIds });
  if (!parsed.success) return { ok: false, error: "Pick at least one person." };
  const supabase = await createClient();
  const { error } = await supabase.from("project_members").upsert(
    userIds.map((user_id) => ({ project_id: projectId, user_id, added_by: me.id })),
    { onConflict: "project_id,user_id", ignoreDuplicates: true },
  );
  if (error) return { ok: false, error: friendlyError(error, "Only the project owner or a mentor can tag people.") };
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function removeMember(projectId: string, userId: string): Promise<ActionResult> {
  await requireMe();
  if (!uuid.safeParse(projectId).success || !uuid.safeParse(userId).success) return { ok: false, error: "Invalid person." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("project_members").delete().eq("project_id", projectId).eq("user_id", userId).select("user_id");
  if (error) return { ok: false, error: friendlyError(error) };
  if (!data?.length) return { ok: false, error: "Only the project owner or a mentor can remove people." };
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function addTodo(_: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const me = await requireMe();
  const parsed = todoSchema.safeParse({ projectId: formData.get("projectId"), title: formData.get("title"), assigneeId: formData.get("assigneeId") ?? "", dueDate: formData.get("dueDate") ?? "" });
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const t = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("project_todos").insert({ project_id: t.projectId, title: t.title, assignee_id: t.assigneeId ?? null, due_date: t.dueDate ?? null, created_by: me.id });
  if (error) return { ok: false, error: friendlyError(error, "Only the project team can add to-dos.") };
  revalidatePath(`/projects/${t.projectId}`);
  return { ok: true };
}

export async function toggleTodo(projectId: string, todoId: string, done: boolean): Promise<ActionResult> {
  await requireMe();
  if (!uuid.safeParse(todoId).success) return { ok: false, error: "Invalid to-do." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("project_todos").update({ done }).eq("id", todoId).select("id");
  if (error || !data?.length) return { ok: false, error: friendlyError(error, "Only the project team can change to-dos.") };
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function deleteTodo(projectId: string, todoId: string): Promise<ActionResult> {
  await requireMe();
  if (!uuid.safeParse(todoId).success) return { ok: false, error: "Invalid to-do." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("project_todos").delete().eq("id", todoId).select("id");
  if (error || !data?.length) return { ok: false, error: friendlyError(error, "Only the project team can remove to-dos.") };
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

const MAX_BYTES = 25 * 1024 * 1024;

/** Records a file the browser already uploaded to project-files/{projectId}/... (storage RLS checked the upload). */
export async function recordFile(projectId: string, path: string, name: string, mime: string, size: number): Promise<ActionResult> {
  const me = await requireMe();
  if (!uuid.safeParse(projectId).success || !path.startsWith(`${projectId}/`) || path.includes("..")) return { ok: false, error: "Invalid file." };
  if (size > MAX_BYTES) return { ok: false, error: "Files can be up to 25 MB. Add big videos as a link." };
  const supabase = await createClient();
  const { error } = await supabase.from("project_files").insert({ project_id: projectId, storage_path: path, file_name: name.slice(0, 200), mime_type: mime.slice(0, 120), size_bytes: size, uploaded_by: me.id });
  if (error) return { ok: false, error: friendlyError(error, "Only the project team can add files.") };
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function addLink(_: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const me = await requireMe();
  const parsed = linkSchema.safeParse({ projectId: formData.get("projectId"), name: formData.get("name"), url: formData.get("url") });
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.from("project_files").insert({ project_id: parsed.data.projectId, external_url: parsed.data.url, file_name: parsed.data.name, uploaded_by: me.id });
  if (error) return { ok: false, error: friendlyError(error, "Only the project team can add links.") };
  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { ok: true };
}

export async function fileUrl(fileId: string): Promise<ActionResult<string>> {
  await requireMe();
  if (!uuid.safeParse(fileId).success) return { ok: false, error: "Invalid file." };
  const supabase = await createClient();
  const { data: f } = await supabase.from("project_files").select("storage_path, external_url").eq("id", fileId).maybeSingle();
  if (!f) return { ok: false, error: "File not found." };
  if (f.external_url) return { ok: true, data: f.external_url };
  const { data, error } = await supabase.storage.from("project-files").createSignedUrl(f.storage_path!, 60, { download: true });
  if (error || !data) return { ok: false, error: "We couldn't open that file." };
  return { ok: true, data: data.signedUrl };
}

export async function deleteFile(projectId: string, fileId: string): Promise<ActionResult> {
  await requireMe();
  if (!uuid.safeParse(fileId).success) return { ok: false, error: "Invalid file." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("project_files").delete().eq("id", fileId).select("storage_path");
  if (error || !data?.length) return { ok: false, error: friendlyError(error, "Only the uploader can remove this file.") };
  if (data[0].storage_path) await supabase.storage.from("project-files").remove([data[0].storage_path]);
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function addComment(_: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const me = await requireMe();
  const parsed = commentSchema.safeParse({ projectId: formData.get("projectId"), body: formData.get("body") });
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.from("project_comments").insert({ project_id: parsed.data.projectId, author_id: me.id, body: parsed.data.body });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { ok: true };
}
