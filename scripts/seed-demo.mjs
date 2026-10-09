// Loads realistic demo data for a pilot (names from the reference designs).
// NEVER run against production. It refuses any non-local Supabase URL unless you pass
// --i-know-this-is-not-production.
//
//   SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-demo.mjs
//
// Everyone gets the password "turmeric-demo".
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const local = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(url);
if (!key) throw new Error('Set SUPABASE_SERVICE_ROLE_KEY');
if (!local && !process.argv.includes('--i-know-this-is-not-production')) {
  console.error(`Refusing to seed demo data into ${url}. This script is for local or pilot databases only.`);
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });
const PASSWORD = 'turmeric-demo';
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

const people = [
  { name: 'Admin', email: 'admin@demo.turmeric', dept: 'creative', role: 'admin', mentors: [] },
  { name: 'Arjun Mehta', email: 'arjun@demo.turmeric', dept: 'creative', role: 'mentor', mentors: ['creative', 'production'] },
  { name: 'Kavya Rao', email: 'kavya@demo.turmeric', dept: 'finance', role: 'mentor', mentors: ['finance'] },
  { name: 'Priya Sundar', email: 'priya@demo.turmeric', dept: 'creative' },
  { name: 'Divya N', email: 'divya@demo.turmeric', dept: 'creative' },
  { name: 'Ravi Kumar', email: 'ravi@demo.turmeric', dept: 'production' },
  { name: 'Meena Iyer', email: 'meena@demo.turmeric', dept: 'finance' },
  { name: 'Sanjay Pillai', email: 'sanjay@demo.turmeric', dept: 'production', pending: true },
];

const { data: depts } = await db.from('departments').select('id, slug');
const deptId = (s) => depts.find((d) => d.slug === s).id;
const { data: types } = await db.from('task_types').select('id, name, department_id');
const typeId = (slug, name) => types.find((t) => t.department_id === deptId(slug) && t.name === name)?.id ?? null;
const { data: existing } = await db.auth.admin.listUsers({ perPage: 1000 });
const ids = {};

for (const p of people) {
  let user = existing.users.find((u) => u.email === p.email);
  if (!user) {
    const { data, error } = await db.auth.admin.createUser({ email: p.email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: p.name, department: p.dept } });
    if (error) throw error;
    user = data.user;
  }
  ids[p.email.split('@')[0]] = user.id;
  if (!p.pending) await db.from('profiles').update({ status: 'active', role: p.role ?? 'member', department_id: deptId(p.dept) }).eq('id', user.id);
  if (p.mentors?.length) await db.from('mentor_departments').upsert(p.mentors.map((s) => ({ mentor_id: user.id, department_id: deptId(s) })));
}

// Projects
const { data: proj } = await db.from('projects').upsert(
  [
    { name: 'Diwali festive campaign', client: 'Chai Point', department_id: deptId('creative'), created_by: ids.priya, status: 'in_progress', priority: 'high', start_date: today, due_date: '2026-10-20' },
    { name: 'Monsoon menu shoot', client: 'Bombay Canteen', department_id: deptId('creative'), created_by: ids.priya, status: 'review', priority: 'normal', start_date: today, due_date: '2026-10-14' },
  ],
  { onConflict: 'id' },
).select('id, name');
for (const p of proj ?? []) {
  await db.from('project_members').upsert([ids.priya, ids.divya, ids.ravi, ids.meena].map((u) => ({ project_id: p.id, user_id: u, added_by: ids.priya })), { onConflict: 'project_id,user_id' });
  await db.from('project_todos').insert([
    { project_id: p.id, title: 'Key visual', done: true, created_by: ids.priya },
    { project_id: p.id, title: 'Copy deck', done: false, created_by: ids.priya, due_date: today },
  ]);
}

// Today's attendance and tasks
const at = (h, m) => new Date(`${today}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+05:30`).toISOString();
await db.from('attendance').upsert([
  { user_id: ids.priya, work_date: today, check_in_at: at(9, 52), status: 'present' },
  { user_id: ids.ravi, work_date: today, check_in_at: at(10, 31), status: 'late' },
  { user_id: ids.meena, work_date: today, check_in_at: at(9, 40), status: 'wfh' },
]);
await db.from('daily_tasks').insert([
  { user_id: ids.priya, department_id: deptId('creative'), work_date: today, title: 'Diwali key visual, round 2', task_type_id: typeId('creative', 'Design'), project_id: proj?.[0]?.id, status: 'done' },
  { user_id: ids.priya, department_id: deptId('creative'), work_date: today, title: 'Social calendar, November', task_type_id: typeId('creative', 'Copy'), status: 'in_progress' },
  { user_id: ids.ravi, department_id: deptId('production'), work_date: today, title: 'Recce for the monsoon shoot', task_type_id: typeId('production', 'Recce'), detail: 'Bandra', project_id: proj?.[1]?.id, status: 'done' },
  { user_id: ids.meena, department_id: deptId('finance'), work_date: today, title: 'Vendor invoices for Diwali print run', task_type_id: typeId('finance', 'Invoices'), detail: 'INV-2291', status: 'done' },
]);
console.log(`Demo data loaded into ${url}. Sign in as arjun@demo.turmeric / ${PASSWORD} (mentor).`);
