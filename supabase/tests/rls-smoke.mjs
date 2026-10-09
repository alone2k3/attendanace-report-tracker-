// Check of the schema and security rules.
// Default: runs every migration + seed.sql in memory (PGlite). With DATABASE_URL set
// (e.g. local `supabase start`), runs the same checks against that real database inside
// a transaction that is rolled back at the end, so nothing is left behind.
// Runs every migration + seed.sql on PGlite with small stand-ins for Supabase's auth and storage.
//   npm i -D @electric-sql/pglite
//   node supabase/tests/rls-smoke.mjs .
// It is a fast guard while building; keep the real SQL tests against `supabase start` too.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';

const kit = process.argv[2];
// Every migration, in filename order, so the checks run against the real final schema.
const migrationDir = `${kit}/supabase/migrations`;
const migrations = readdirSync(migrationDir).filter((f) => f.endsWith('.sql')).sort()
  .map((f) => readFileSync(`${migrationDir}/${f}`, 'utf8'));
const seed = readFileSync(`${kit}/supabase/seed.sql`, 'utf8');

const real = !!process.env.DATABASE_URL;
let db;
if (real) {
  const { default: pg } = await import('pg');
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  db = {
    client,
    // Each statement gets its own savepoint so an expected failure doesn't abort the transaction.
    async query(sql, params) {
      await client.query('savepoint q');
      try {
        const r = await client.query(sql, params);
        await client.query('release savepoint q');
        return { rows: r.rows, affectedRows: r.rowCount };
      } catch (e) {
        await client.query('rollback to savepoint q');
        throw e;
      }
    },
    async exec(sql) { await db.query(sql); },
  };
  await client.query('begin');
} else {
  db = new PGlite();
}

// Minimal stand-ins for what Supabase provides (in-memory mode only).
if (!real) await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as
    $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  grant usage on schema public, auth, storage to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on sequences to anon, authenticated;
  grant all on all tables in schema storage to anon, authenticated;
`);

if (!real) {
  for (const m of migrations) await db.exec(m);
  await db.exec(seed);
  console.log('Migration and seed ran cleanly.');
} else {
  console.log('Running against', process.env.DATABASE_URL.replace(/:[^:@/]+@/, ':***@'));
}

const ids = {
  arjun: '00000000-0000-0000-0000-00000000000a',
  priya: '00000000-0000-0000-0000-00000000000b',
  meena: '00000000-0000-0000-0000-00000000000c',
  divya: '00000000-0000-0000-0000-00000000000d',
  admin: '00000000-0000-0000-0000-00000000000e',
};
const signUp = (id, email, name, dept) => db.query(
  `insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)`,
  [id, email, JSON.stringify({ full_name: name, department: dept })]
);
await signUp(ids.arjun, 'Arjun@yourcompany.com', 'Arjun Mehta', 'creative');
await signUp(ids.priya, 'priya@yourcompany.com', 'Priya Sundar', 'creative');
await signUp(ids.meena, 'meena@yourcompany.com', 'Meena Iyer', 'finance');
await signUp(ids.divya, 'divya@yourcompany.com', 'Divya N', 'creative');
await signUp(ids.admin, 'admin@yourcompany.com', 'Admin', 'creative');

const dept = {};
for (const r of (await db.query(`select id, slug from public.departments`)).rows) dept[r.slug] = r.id;
const type = {};
for (const r of (await db.query(`select t.id, d.slug, t.name from public.task_types t join public.departments d on d.id = t.department_id`)).rows) type[`${r.slug}:${r.name}`] = r.id;

// Bootstrap as superuser (what the first admin does in the SQL editor).
await db.query(`update public.profiles set role='admin', status='active', department_id=$2 where id=$1`, [ids.admin, dept.creative]);
await db.query(`update public.profiles set role='mentor', status='active', department_id=$2 where id=$1`, [ids.arjun, dept.creative]);
await db.query(`insert into public.mentor_departments values ($1, $2), ($1, $3)`, [ids.arjun, dept.creative, dept.production]);
await db.query(`update public.profiles set status='active', department_id=$2 where id=$1`, [ids.priya, dept.creative]);
await db.query(`update public.profiles set status='active', department_id=$2 where id=$1`, [ids.meena, dept.finance]);

let pass = 0, fail = 0;
async function as(user, fn) {
  await db.exec('reset role');
  if (user === 'anon') {
    await db.query(`select set_config('request.jwt.claim.sub', '', false)`);
    await db.exec('set role anon');
  } else {
    await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [ids[user]]);
    await db.exec('set role authenticated');
  }
  try { return await fn(); } finally { await db.exec('reset role'); }
}
async function expectOk(label, fn) {
  try { const r = await fn(); pass++; console.log('PASS', label); return r; }
  catch (e) { fail++; console.log('FAIL', label, '->', e.message); }
}
async function expectError(label, fn, match) {
  try { await fn(); fail++; console.log('FAIL', label, '-> no error'); }
  catch (e) {
    if (match && !e.message.includes(match)) { fail++; console.log('FAIL', label, '-> wrong error:', e.message); }
    else { pass++; console.log('PASS', label, '(' + e.message + ')'); }
  }
}
function check(label, cond, detail = '') {
  if (cond) { pass++; console.log('PASS', label); } else { fail++; console.log('FAIL', label, detail); }
}

// Registration
const divya = (await db.query(`select status, requested_department_id, department_id, email from public.profiles where id=$1`, [ids.divya])).rows[0];
check('sign-up creates a pending profile with the requested tag', divya.status === 'pending' && divya.requested_department_id === dept.creative && divya.department_id === null);
const arjunEmail = (await db.query(`select email from public.profiles where id=$1`, [ids.arjun])).rows[0].email;
check('email stored lower-case', arjunEmail === 'arjun@yourcompany.com');

await as('divya', () => expectError('pending account cannot add tasks', () =>
  db.query(`insert into public.daily_tasks (user_id, department_id, title) values ($1, $2, 'x')`, [ids.divya, dept.creative])));
await as('divya', () => expectError('pending account cannot check in', () => db.query(`select public.check_in()`), 'not active'));
await as('priya', () => expectError('member cannot approve a registration', () =>
  db.query(`select public.approve_registration($1, $2)`, [ids.divya, dept.creative]), 'Only a mentor'));
await as('arjun', async () => {
  const r = await db.query(`select id from public.profiles where status='pending' and id = any($1)`, [Object.values(ids)]);
  check('mentor sees pending sign-ups for their department', r.rows.length === 1);
});
await as('arjun', () => expectOk('mentor approves into a corrected department', () =>
  db.query(`select public.approve_registration($1, $2)`, [ids.divya, dept.production])));
const divya2 = (await db.query(`select status, department_id from public.profiles where id=$1`, [ids.divya])).rows[0];
check('approved account is active in the chosen department', divya2.status === 'active' && divya2.department_id === dept.production);

// Department is locked for members
await as('priya', () => expectError('member cannot update own department_id', () =>
  db.query(`update public.profiles set department_id=$1 where id=$2`, [dept.finance, ids.priya]), 'permission denied'));
await as('priya', () => expectError('member cannot update own role', () =>
  db.query(`update public.profiles set role='admin' where id=$1`, [ids.priya]), 'permission denied'));
await as('priya', () => expectOk('member can update own name', () =>
  db.query(`update public.profiles set full_name='Priya S' where id=$1`, [ids.priya])));
await as('priya', () => expectError('member cannot call change_department on self', () =>
  db.query(`select public.change_department($1, $2)`, [ids.priya, dept.finance]), 'own department'));
await as('meena', () => expectError('member cannot move someone else', () =>
  db.query(`select public.change_department($1, $2)`, [ids.priya, dept.finance]), 'Only a mentor'));

// Tasks
let priyaTask;
await as('priya', () => expectError('member cannot post to another department', () =>
  db.query(`insert into public.daily_tasks (user_id, department_id, title) values ($1, $2, 'x')`, [ids.priya, dept.finance])));
await as('priya', () => expectError('type of work must match department', () =>
  db.query(`insert into public.daily_tasks (user_id, department_id, title, task_type_id) values ($1, $2, 'x', $3)`, [ids.priya, dept.creative, type['finance:Invoices']]), 'another department'));
await as('priya', async () => {
  const r = await expectOk('member posts a task to own department', () =>
    db.query(`insert into public.daily_tasks (user_id, department_id, title, task_type_id, status) values ($1, $2, 'Diwali key visual', $3, 'done') returning id`, [ids.priya, dept.creative, type['creative:Design']]));
  priyaTask = r?.rows[0]?.id;
});
await as('priya', () => expectError('member cannot post for a past day', () =>
  db.query(`insert into public.daily_tasks (user_id, department_id, title, work_date) values ($1, $2, 'old', public.today_ist() - 2)`, [ids.priya, dept.creative])));
let meenaTask;
await as('meena', async () => {
  const r = await db.query(`insert into public.daily_tasks (user_id, department_id, title, task_type_id) values ($1, $2, 'Invoices', $3) returning id`, [ids.meena, dept.finance, type['finance:Invoices']]);
  meenaTask = r.rows[0].id;
});
await as('arjun', async () => {
  const fin = await db.query(`select count(*)::int n from public.daily_tasks where department_id=$1`, [dept.finance]);
  check('Creative/Production mentor cannot read Finance tasks', fin.rows[0].n === 0);
  const cre = await db.query(`select count(*)::int n from public.daily_tasks where department_id=$1 and user_id = any($2)`, [dept.creative, Object.values(ids)]);
  check('mentor reads their department tasks', cre.rows[0].n === 1);
  const upd = await db.query(`update public.daily_tasks set title='hacked' where id=$1`, [priyaTask]);
  check('mentor cannot edit a member task', upd.affectedRows === 0);
});
await as('priya', async () => {
  const other = await db.query(`select count(*)::int n from public.daily_tasks where user_id=$1`, [ids.meena]);
  check('member cannot read another member tasks', other.rows[0].n === 0);
});
await as('arjun', () => expectOk('mentor flags a task in their department', () =>
  db.query(`insert into public.task_reviews (task_id, flagged, flag_note, updated_by) values ($1, true, 'Add the file link', $2)`, [priyaTask, ids.arjun])));
await as('arjun', () => expectError('mentor cannot mark a task outside their departments', () =>
  db.query(`insert into public.task_reviews (task_id, flagged, updated_by) values ($1, true, $2)`, [meenaTask, ids.arjun])));
await as('priya', async () => {
  const r = await db.query(`select flagged, flag_note from public.task_reviews where task_id=$1`, [priyaTask]);
  check('member sees the flag on their task', r.rows[0]?.flagged === true);
});
await as('priya', () => expectError('member cannot write review marks', () =>
  db.query(`update public.task_reviews set flagged=false, updated_by=$2 where task_id=$1 returning task_id`, [priyaTask, ids.priya]).then((r) => { if (r.rows.length === 0) throw new Error('no rows changed (blocked)'); })));

// Day review
let sub;
await as('priya', () => expectOk('member sends their day', () => db.query(`select public.submit_day()`)));
await as('arjun', async () => {
  sub = (await db.query(`select id from public.day_submissions where user_id=$1`, [ids.priya])).rows[0]?.id;
  check('mentor sees the submission', !!sub);
});
await as('arjun', () => expectError('sending back needs a note', () =>
  db.query(`select public.review_day($1, 'sent_back')`, [sub]), 'note'));
await as('arjun', () => expectOk('mentor sends the day back with a note', () =>
  db.query(`select public.review_day($1, 'sent_back', 'Please link the project')`, [sub])));
await as('priya', () => expectOk('member resends after fixing', () => db.query(`select public.submit_day()`)));
await as('arjun', () => expectOk('mentor approves the day', () => db.query(`select public.review_day($1, 'approved')`, [sub])));
const reviewed = (await db.query(`select reviewed_by from public.task_reviews where task_id=$1`, [priyaTask])).rows[0];
check('approving a day marks its done tasks reviewed', reviewed?.reviewed_by === ids.arjun);
const notes = (await db.query(`select count(*)::int n from public.notifications where user_id=$1`, [ids.priya])).rows[0].n;
check('member was notified (sent back)', notes >= 1);
await as('priya', () => expectError('member cannot write directly to day_submissions', () =>
  db.query(`update public.day_submissions set review_status='approved' where user_id=$1 returning id`, [ids.priya]).then((r) => { if (r.rows.length === 0) throw new Error('no rows changed (blocked)'); })));

// Attendance
await as('priya', () => expectOk('member checks in', () => db.query(`select public.check_in('office')`)));
await as('priya', () => expectError('second check-in is refused', () => db.query(`select public.check_in('office')`), 'already checked in'));
await as('priya', () => expectOk('member checks out', () => db.query(`select public.check_out()`)));
await as('priya', () => expectError('member cannot insert attendance directly', () =>
  db.query(`insert into public.attendance (user_id, work_date, status) values ($1, public.today_ist() + 1, 'present')`, [ids.priya])));
await as('priya', () => expectError('member cannot run close_day', () => db.query(`select public.close_day()`), 'permission denied'));
await as('priya', () => expectError('member cannot call notify', () => db.query(`select public.notify($1, 'x', 'y')`, [ids.priya]), 'permission denied'));
await db.query(`select public.close_day()`);
const att = (await db.query(`select p.full_name, a.status from public.attendance a join public.profiles p on p.id=a.user_id order by 1`)).rows;
console.log('  attendance after close_day:', att.map((r) => `${r.full_name}=${r.status}`).join(', '));

// Mentor moves someone
await as('arjun', () => expectOk('mentor moves a member to another department', () =>
  db.query(`select public.change_department($1, $2, 'Joining the shoot team')`, [ids.priya, dept.production])));
await as('priya', () => expectError('after the move, old department is closed to them', () =>
  db.query(`insert into public.daily_tasks (user_id, department_id, title) values ($1, $2, 'x')`, [ids.priya, dept.creative])));
await as('priya', () => expectOk('after the move, new department works', () =>
  db.query(`insert into public.daily_tasks (user_id, department_id, title, task_type_id) values ($1, $2, 'Recce', $3)`, [ids.priya, dept.production, type['production:Recce']])));
const log = (await db.query(`select kind from public.department_changes order by created_at`)).rows.map((r) => r.kind);
check('department change log has approved + moved', log.includes('approved') && log.includes('moved'));

// Anonymous
await as('anon', async () => {
  const d = await db.query(`select count(*)::int n from public.departments`);
  check('anonymous can read departments (for /register)', d.rows[0].n === 3);
  const p = await db.query(`select count(*)::int n from public.profiles`);
  check('anonymous cannot read profiles', p.rows[0].n === 0);
});

// Admin
await as('admin', () => expectOk('admin sets a role', () => db.query(`select public.admin_set_role($1, 'mentor')`, [ids.meena])));
await as('admin', () => expectOk('admin assigns mentor departments', () => db.query(`select public.admin_set_mentor_departments($1, $2::uuid[])`, [ids.meena, `{${dept.finance}}`])));
await as('meena', async () => {
  const r = await db.query(`select count(*)::int n from public.daily_tasks where department_id=$1 and user_id = any($2)`, [dept.finance, Object.values(ids)]);
  check('new Finance mentor reads Finance tasks', r.rows[0].n === 1);
});
await as('arjun', () => expectError('non-admin cannot set roles', () => db.query(`select public.admin_set_role($1, 'admin')`, [ids.arjun]), 'Admins only'));

// ---------------------------------------------------------------------------
// Checks for 20261009100000_app_features.sql
// ---------------------------------------------------------------------------
const notifKinds = async (user) => (await db.query(`select kind from public.notifications where user_id=$1`, [ids[user]])).rows.map((r) => r.kind);
ids.ravi = '00000000-0000-0000-0000-00000000000f';
await signUp(ids.ravi, 'ravi@yourcompany.com', 'Ravi K', 'production');
check('mentors are notified of a new registration', (await notifKinds('arjun')).includes('registration'));
check('member is notified when a task is flagged', (await notifKinds('priya')).includes('task_flagged'));

// Mentors don't review themselves
let arjunTask;
await as('arjun', async () => {
  arjunTask = (await db.query(`insert into public.daily_tasks (user_id, department_id, title) values ($1, $2, 'Mentor own task') returning id`, [ids.arjun, dept.creative])).rows[0].id;
  await db.query(`select public.submit_day()`);
});
await as('arjun', () => expectError('mentor cannot flag their own task', () =>
  db.query(`insert into public.task_reviews (task_id, flagged, updated_by) values ($1, true, $2)`, [arjunTask, ids.arjun])));
await as('arjun', async () => {
  const own = (await db.query(`select id from public.day_submissions where user_id=$1`, [ids.arjun])).rows[0].id;
  await expectError('mentor cannot approve their own day', () => db.query(`select public.review_day($1, 'approved')`, [own]), 'own day');
});

// Team visibility: Priya and Divya are both in Production now
await as('divya', async () => {
  const r = await db.query(`select count(*)::int n from public.daily_tasks where department_id=$1`, [dept.production]);
  check('teammates read their own department log', r.rows[0].n >= 1);
  const c = await db.query(`select count(*)::int n from public.daily_tasks where department_id=$1`, [dept.creative]);
  check('members still cannot read another department log', c.rows[0].n === 0);
  const a = await db.query(`select count(*)::int n from public.attendance where user_id=$1`, [ids.priya]);
  check('teammates see each other in Team today', a.rows[0].n === 1);
  const f = await db.query(`select count(*)::int n from public.v_task_feed where department_slug='creative'`);
  check('task feed view keeps RLS (no other department rows)', f.rows[0].n === 0);
});
await as('meena', async () => {
  const r = await db.query(`select count(*)::int n from public.v_task_feed where department_slug='production'`);
  check('Finance mentor sees no Production tasks in the feed', r.rows[0].n === 0);
});
await as('arjun', async () => {
  const r = await db.query(`select count(*)::int n from public.v_task_feed where department_slug='finance'`);
  check('Creative/Production mentor sees no Finance tasks in the feed', r.rows[0].n === 0);
});

// Leave
await as('priya', () => expectOk('member marks leave for tomorrow', () => db.query(`select public.mark_leave(public.today_ist() + 1, 'Family function')`)));
await as('priya', () => expectError('leave twice is refused', () => db.query(`select public.mark_leave(public.today_ist() + 1)`), 'already on leave'));
await as('priya', () => expectError('leave for a past day is refused', () => db.query(`select public.mark_leave(public.today_ist() - 1)`), 'today or a future'));
await as('priya', () => expectError('leave on a day already checked in is refused', () => db.query(`select public.mark_leave(public.today_ist())`), 'already checked in'));
await as('priya', () => expectOk('member cancels future leave', () => db.query(`select public.cancel_leave(public.today_ist() + 1)`)));
await as('anon', () => expectError('anonymous cannot mark leave', () => db.query(`select public.mark_leave(public.today_ist() + 1)`), 'permission denied'));

// Register pending page
await as('anon', async () => {
  const r = await db.query(`select full_name from public.department_mentor_names('creative')`);
  check('anonymous sees mentor names for the pending page', r.rows.map((x) => x.full_name).includes('Arjun Mehta'));
  await expectError('anonymous cannot read settings via setting()', () => db.query(`select public.setting('late_after')`), 'permission denied');
});

// Projects: tagging, ownership guard, comments
let project;
await as('priya', async () => {
  project = (await db.query(`insert into public.projects (name, department_id, created_by) values ('Diwali shoot', $1, $2) returning id`, [dept.production, ids.priya])).rows[0].id;
  await db.query(`insert into public.project_members (project_id, user_id, added_by) values ($1, $2, $3)`, [project, ids.meena, ids.priya]);
});
check('tagged person is notified', (await notifKinds('meena')).includes('project_tagged'));
await as('meena', () => expectError('team member cannot move a project to another department', () =>
  db.query(`update public.projects set department_id=$1 where id=$2`, [dept.finance, project]), 'Only an admin'));
await as('meena', () => expectOk('team member updates project status', () =>
  db.query(`update public.projects set status='review' where id=$1`, [project])));
check('project in review notifies department mentors', (await notifKinds('arjun')).includes('project_review'));
await as('meena', () => expectOk('active user comments on a project', () =>
  db.query(`insert into public.project_comments (project_id, author_id, body) values ($1, $2, 'Budget approved')`, [project, ids.meena])));
await as('divya', () => expectError('cannot comment as someone else', () =>
  db.query(`insert into public.project_comments (project_id, author_id, body) values ($1, $2, 'x')`, [project, ids.meena])));

// Reminder rate limit
await as('arjun', async () => {
  const a = (await db.query(`select public.claim_checkin_reminder($1) ok`, [ids.divya])).rows[0].ok;
  const b = (await db.query(`select public.claim_checkin_reminder($1) ok`, [ids.divya])).rows[0].ok;
  check('reminder is claimed once per person per day', a === true && b === false);
});
await as('meena', () => expectError('mentor of another department cannot remind', () =>
  db.query(`select public.claim_checkin_reminder($1)`, [ids.divya]), 'Only a mentor'));
await as('divya', () => expectError('member cannot write the email log', () =>
  db.query(`insert into public.email_log (user_id, kind) values ($1, 'digest')`, [ids.divya])));

// Admin
await as('admin', () => expectError('admin cannot remove their own admin role', () =>
  db.query(`select public.admin_set_role($1, 'member')`, [ids.admin]), 'own admin role'));
await as('admin', () => expectOk('admin disables an account', () => db.query(`select public.admin_set_status($1, 'disabled')`, [ids.divya])));
await as('divya', () => expectError('disabled account cannot add tasks', () =>
  db.query(`insert into public.daily_tasks (user_id, department_id, title) values ($1, $2, 'x')`, [ids.divya, dept.production])));
await as('priya', () => expectError('member cannot disable accounts', () => db.query(`select public.admin_set_status($1, 'disabled')`, [ids.meena]), 'Admins only'));
await as('priya', () => expectError('member cannot mark notifications for others', () =>
  db.query(`update public.notifications set read_at=now() where user_id=$1 returning id`, [ids.meena]).then((r) => { if (r.rows.length === 0) throw new Error('no rows changed (blocked)'); })));
await as('priya', () => expectError('member cannot rewrite a notification title', () =>
  db.query(`update public.notifications set title='x' where user_id=$1`, [ids.priya]), 'permission denied'));

if (real) { await db.client.query('rollback'); await db.client.end(); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
