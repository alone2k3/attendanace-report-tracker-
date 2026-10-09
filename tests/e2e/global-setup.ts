import { admin, MENTOR } from "./helpers";

/** Ensures the mentor account exists: active, Creative, mentoring Creative + Production. */
export default async function globalSetup() {
  const a = admin();
  const { data: list } = await a.auth.admin.listUsers({ perPage: 1000 });
  let user = list?.users.find((u) => u.email === MENTOR.email);
  if (!user) {
    const { data, error } = await a.auth.admin.createUser({ email: MENTOR.email, password: MENTOR.password, email_confirm: true, user_metadata: { full_name: MENTOR.name, department: "creative" } });
    if (error) throw error;
    user = data.user!;
  }
  const { data: depts } = await a.from("departments").select("id, slug");
  const id = (s: string) => depts!.find((d) => d.slug === s)!.id;
  await a.from("profiles").update({ role: "mentor", status: "active", department_id: id("creative") }).eq("id", user.id);
  await a.from("mentor_departments").upsert([
    { mentor_id: user.id, department_id: id("creative") },
    { mentor_id: user.id, department_id: id("production") },
  ]);
}
