-- Turmeric Work Tracker: initial schema, row-level security and RPCs.
-- Order: types -> tables -> helper functions -> triggers -> RLS -> RPCs -> grants -> storage.
-- Rules this file enforces (see CLAUDE.md):
--   * Department is picked at registration, confirmed by a mentor, and only mentors/admins change it.
--   * Members post tasks only to their own department; mentors review/flag but never edit tasks.
--   * Tasks have no hours. Work dates are calendar days in Asia/Kolkata.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('member', 'mentor', 'admin');
create type public.account_status as enum ('pending', 'active', 'disabled');
create type public.task_status as enum ('in_progress', 'done');
create type public.attendance_status as enum ('present', 'late', 'half_day', 'wfh', 'leave', 'absent', 'holiday');
create type public.project_status as enum ('planning', 'in_progress', 'review', 'revision', 'completed', 'on_hold');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  detail_label text,               -- 'Location' (Production), 'Reference' (Finance), null otherwise
  created_at timestamptz not null default now()
);

create table public.task_types (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments (id) on delete cascade,
  name text not null,
  sort int not null default 0,
  unique (department_id, name)
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 120),
  email text not null unique,
  avatar_url text,
  role public.user_role not null default 'member',
  status public.account_status not null default 'pending',
  department_id uuid references public.departments (id),            -- set only by approve/change RPCs
  requested_department_id uuid references public.departments (id),  -- the tag picked at registration
  approved_by uuid references public.profiles (id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint active_needs_department check (status <> 'active' or department_id is not null or role = 'admin')
);

create table public.mentor_departments (
  mentor_id uuid not null references public.profiles (id) on delete cascade,
  department_id uuid not null references public.departments (id) on delete cascade,
  primary key (mentor_id, department_id)
);

create table public.department_changes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  from_department_id uuid references public.departments (id),
  to_department_id uuid references public.departments (id),
  kind text not null check (kind in ('approved', 'moved', 'declined')),
  changed_by uuid not null references public.profiles (id),
  note text,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  client text,
  brief text,
  department_id uuid not null references public.departments (id),
  created_by uuid not null references public.profiles (id),
  status public.project_status not null default 'planning',
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  start_date date,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  added_by uuid not null references public.profiles (id),
  added_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table public.project_todos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  assignee_id uuid references public.profiles (id) on delete set null,
  due_date date,
  done boolean not null default false,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  storage_path text,               -- project-files/{project_id}/{uuid}-{name}
  external_url text,               -- Drive / Frame.io / YouTube link for big videos
  file_name text not null,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes <= 26214400),
  uploaded_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint file_or_link check (storage_path is not null or external_url is not null)
);

create table public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  department_id uuid not null references public.departments (id),
  work_date date not null default ((now() at time zone 'Asia/Kolkata')::date),
  title text not null check (char_length(title) between 1 and 300),
  task_type_id uuid references public.task_types (id),
  project_id uuid references public.projects (id) on delete set null,
  detail text check (detail is null or char_length(detail) <= 200),  -- Location / Reference
  status public.task_status not null default 'done',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index daily_tasks_dept_date on public.daily_tasks (department_id, work_date);
create index daily_tasks_user_date on public.daily_tasks (user_id, work_date);
create index daily_tasks_project on public.daily_tasks (project_id);

-- Mentor-owned marks on a task, kept apart so mentors never write to daily_tasks.
create table public.task_reviews (
  task_id uuid primary key references public.daily_tasks (id) on delete cascade,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  flagged boolean not null default false,
  flag_note text,
  updated_by uuid not null references public.profiles (id),
  updated_at timestamptz not null default now()
);

create table public.day_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  department_id uuid not null references public.departments (id),
  work_date date not null,
  submitted_at timestamptz not null default now(),
  review_status text not null default 'submitted' check (review_status in ('submitted', 'approved', 'sent_back')),
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  review_note text,
  unique (user_id, work_date)
);
create index day_submissions_dept_status on public.day_submissions (department_id, review_status);

create table public.attendance (
  user_id uuid not null references public.profiles (id) on delete cascade,
  work_date date not null,
  check_in_at timestamptz,
  check_out_at timestamptz,
  status public.attendance_status not null,
  worked_minutes int,
  check_out_missed boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  primary key (user_id, work_date)
);

create table public.settings (
  key text primary key,
  value text not null
);

create table public.holidays (
  day date primary key,
  name text not null
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_unread on public.notifications (user_id) where read_at is null;

-- ---------------------------------------------------------------------------
-- Helper functions (security definer so policies can call them without recursion)
-- ---------------------------------------------------------------------------
create or replace function public.today_ist() returns date
language sql stable as $$
  select (now() at time zone 'Asia/Kolkata')::date;
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.my_department() returns uuid
language sql stable security definer set search_path = public as $$
  select department_id from public.profiles
  where id = auth.uid() and status = 'active';
$$;

create or replace function public.mentors_department(dept uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.mentor_departments md
    join public.profiles p on p.id = md.mentor_id
    where md.mentor_id = auth.uid()
      and md.department_id = dept
      and p.status = 'active'
      and p.role in ('mentor', 'admin')
  );
$$;

create or replace function public.can_edit_day(p_date date) returns boolean
language sql stable security definer set search_path = public as $$
  select p_date = public.today_ist()
      or exists (
        select 1 from public.day_submissions s
        where s.user_id = auth.uid() and s.work_date = p_date and s.review_status = 'sent_back'
      );
$$;

create or replace function public.setting(p_key text) returns text
language sql stable security definer set search_path = public as $$
  select value from public.settings where key = p_key;
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
-- New sign-up -> pending profile carrying the department tag picked on /register.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_dept uuid;
begin
  select id into v_dept from public.departments
  where slug = new.raw_user_meta_data ->> 'department';

  insert into public.profiles (id, full_name, email, role, status, requested_department_id)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    lower(new.email),
    'member',
    'pending',
    v_dept
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Type of work must belong to the task's department; keep updated_at fresh.
create or replace function public.validate_daily_task() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.task_type_id is not null and not exists (
    select 1 from public.task_types t
    where t.id = new.task_type_id and t.department_id = new.department_id
  ) then
    raise exception 'That type of work belongs to another department';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger daily_tasks_validate
  before insert or update on public.daily_tasks
  for each row execute function public.validate_daily_task();

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger projects_touch
  before update on public.projects
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.departments enable row level security;
alter table public.task_types enable row level security;
alter table public.profiles enable row level security;
alter table public.mentor_departments enable row level security;
alter table public.department_changes enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_todos enable row level security;
alter table public.project_files enable row level security;
alter table public.daily_tasks enable row level security;
alter table public.task_reviews enable row level security;
alter table public.day_submissions enable row level security;
alter table public.attendance enable row level security;
alter table public.settings enable row level security;
alter table public.holidays enable row level security;
alter table public.notifications enable row level security;

-- Departments and types of work: the register page needs them before sign-in.
create policy "anyone reads departments" on public.departments
  for select to anon, authenticated using (true);
create policy "admins manage departments" on public.departments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "signed-in users read task types" on public.task_types
  for select to authenticated using (true);
create policy "admins manage task types" on public.task_types
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Profiles
create policy "read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "active users read active colleagues" on public.profiles
  for select to authenticated using (status = 'active' and public.my_department() is not null);
create policy "mentors read pending sign-ups for their departments" on public.profiles
  for select to authenticated using (status = 'pending' and public.mentors_department(requested_department_id));
create policy "admins read all profiles" on public.profiles
  for select to authenticated using (public.is_admin());
create policy "update own name and photo" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Mentor assignments are not sensitive (members see who reviews them).
create policy "signed-in users read mentor assignments" on public.mentor_departments
  for select to authenticated using (true);

create policy "read relevant department changes" on public.department_changes
  for select to authenticated using (
    profile_id = auth.uid()
    or public.is_admin()
    or public.mentors_department(from_department_id)
    or public.mentors_department(to_department_id)
  );

-- Projects (readable by every active person so any department can link tasks to them)
create policy "active users read projects" on public.projects
  for select to authenticated using (public.my_department() is not null or public.is_admin());
create policy "members create projects in their department" on public.projects
  for insert to authenticated with check (created_by = auth.uid() and department_id = public.my_department());
create policy "owner, team and mentors update projects" on public.projects
  for update to authenticated
  using (
    created_by = auth.uid() or public.is_admin() or public.mentors_department(department_id)
    or exists (select 1 from public.project_members m where m.project_id = projects.id and m.user_id = auth.uid())
  )
  with check (
    created_by = auth.uid() or public.is_admin() or public.mentors_department(department_id)
    or exists (select 1 from public.project_members m where m.project_id = projects.id and m.user_id = auth.uid())
  );
create policy "owner and admins delete projects" on public.projects
  for delete to authenticated using (created_by = auth.uid() or public.is_admin());

create policy "active users read project members" on public.project_members
  for select to authenticated using (public.my_department() is not null or public.is_admin());
create policy "owner and mentors manage project members" on public.project_members
  for all to authenticated
  using (exists (
    select 1 from public.projects p where p.id = project_id
      and (p.created_by = auth.uid() or public.mentors_department(p.department_id) or public.is_admin())
  ))
  with check (
    added_by = auth.uid() and exists (
      select 1 from public.projects p where p.id = project_id
        and (p.created_by = auth.uid() or public.mentors_department(p.department_id) or public.is_admin())
    )
  );

create policy "active users read project to-dos" on public.project_todos
  for select to authenticated using (public.my_department() is not null or public.is_admin());
create policy "project team manages to-dos" on public.project_todos
  for all to authenticated
  using (exists (
    select 1 from public.projects p where p.id = project_id and (
      p.created_by = auth.uid() or public.mentors_department(p.department_id) or public.is_admin()
      or exists (select 1 from public.project_members m where m.project_id = p.id and m.user_id = auth.uid())
    )
  ))
  with check (exists (
    select 1 from public.projects p where p.id = project_id and (
      p.created_by = auth.uid() or public.mentors_department(p.department_id) or public.is_admin()
      or exists (select 1 from public.project_members m where m.project_id = p.id and m.user_id = auth.uid())
    )
  ));

create policy "active users read project files" on public.project_files
  for select to authenticated using (public.my_department() is not null or public.is_admin());
create policy "project team adds files" on public.project_files
  for insert to authenticated with check (
    uploaded_by = auth.uid() and exists (
      select 1 from public.projects p where p.id = project_id and (
        p.created_by = auth.uid()
        or exists (select 1 from public.project_members m where m.project_id = p.id and m.user_id = auth.uid())
      )
    )
  );
create policy "uploaders and admins delete files" on public.project_files
  for delete to authenticated using (uploaded_by = auth.uid() or public.is_admin());

-- Daily tasks: members write only their own, only in their own department, only while the day is open.
create policy "read own tasks" on public.daily_tasks
  for select to authenticated using (user_id = auth.uid());
create policy "mentors read their departments' tasks" on public.daily_tasks
  for select to authenticated using (public.mentors_department(department_id));
create policy "admins read all tasks" on public.daily_tasks
  for select to authenticated using (public.is_admin());
create policy "add tasks to own department" on public.daily_tasks
  for insert to authenticated with check (
    user_id = auth.uid() and department_id = public.my_department() and public.can_edit_day(work_date)
  );
create policy "edit own tasks while the day is open" on public.daily_tasks
  for update to authenticated
  using (user_id = auth.uid() and public.can_edit_day(work_date))
  with check (user_id = auth.uid() and department_id = public.my_department() and public.can_edit_day(work_date));
create policy "delete own tasks while the day is open" on public.daily_tasks
  for delete to authenticated using (user_id = auth.uid() and public.can_edit_day(work_date));

-- Task reviews/flags: mentors of the task's department write; the task owner reads.
create policy "task owners read marks" on public.task_reviews
  for select to authenticated using (
    exists (select 1 from public.daily_tasks t where t.id = task_id and t.user_id = auth.uid())
  );
create policy "mentors read marks" on public.task_reviews
  for select to authenticated using (
    public.is_admin()
    or exists (select 1 from public.daily_tasks t where t.id = task_id and public.mentors_department(t.department_id))
  );
create policy "mentors add marks" on public.task_reviews
  for insert to authenticated with check (
    updated_by = auth.uid() and (
      public.is_admin()
      or exists (select 1 from public.daily_tasks t where t.id = task_id and public.mentors_department(t.department_id))
    )
  );
create policy "mentors change marks" on public.task_reviews
  for update to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.daily_tasks t where t.id = task_id and public.mentors_department(t.department_id))
  )
  with check (
    updated_by = auth.uid() and (
      public.is_admin()
      or exists (select 1 from public.daily_tasks t where t.id = task_id and public.mentors_department(t.department_id))
    )
  );

-- Day submissions: read only; written through submit_day / review_day.
create policy "read own submissions" on public.day_submissions
  for select to authenticated using (user_id = auth.uid());
create policy "mentors read their departments' submissions" on public.day_submissions
  for select to authenticated using (public.mentors_department(department_id) or public.is_admin());

-- Attendance: read only; written through check_in / check_out / close_day.
create policy "read own attendance" on public.attendance
  for select to authenticated using (user_id = auth.uid());
create policy "mentors read their departments' attendance" on public.attendance
  for select to authenticated using (
    public.is_admin()
    or exists (select 1 from public.profiles p where p.id = attendance.user_id and public.mentors_department(p.department_id))
  );

create policy "signed-in users read settings" on public.settings
  for select to authenticated using (true);
create policy "admins manage settings" on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "signed-in users read holidays" on public.holidays
  for select to authenticated using (true);
create policy "admins manage holidays" on public.holidays
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "read own notifications" on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy "mark own notifications read" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Notifications are inserted by RPCs below and by server code using the service role.

-- ---------------------------------------------------------------------------
-- RPCs (security definer; each checks the caller itself)
-- ---------------------------------------------------------------------------
create or replace function public.notify(p_user uuid, p_kind text, p_title text, p_body text default null, p_link text default null)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, kind, title, body, link)
  values (p_user, p_kind, p_title, p_body, p_link);
$$;

create or replace function public.approve_registration(p_profile uuid, p_department uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_req uuid;
  v_status public.account_status;
  v_name text;
begin
  select requested_department_id, status into v_req, v_status
  from public.profiles where id = p_profile for update;

  if not found or v_status <> 'pending' then
    raise exception 'This registration is not waiting for approval';
  end if;
  if not (public.is_admin() or public.mentors_department(v_req)) then
    raise exception 'Only a mentor of the requested department can approve this';
  end if;
  select name into v_name from public.departments where id = p_department;
  if v_name is null then
    raise exception 'Unknown department';
  end if;

  update public.profiles
     set status = 'active', department_id = p_department, approved_by = auth.uid(), approved_at = now()
   where id = p_profile;

  insert into public.department_changes (profile_id, from_department_id, to_department_id, kind, changed_by)
  values (p_profile, v_req, p_department, 'approved', auth.uid());

  perform public.notify(p_profile, 'registration_approved', 'You''re in: ' || v_name, null, '/tasks');
end;
$$;

create or replace function public.decline_registration(p_profile uuid, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_req uuid;
  v_status public.account_status;
begin
  select requested_department_id, status into v_req, v_status
  from public.profiles where id = p_profile for update;

  if not found or v_status <> 'pending' then
    raise exception 'This registration is not waiting for approval';
  end if;
  if not (public.is_admin() or public.mentors_department(v_req)) then
    raise exception 'Only a mentor of the requested department can decline this';
  end if;

  update public.profiles set status = 'disabled' where id = p_profile;
  insert into public.department_changes (profile_id, from_department_id, to_department_id, kind, changed_by, note)
  values (p_profile, v_req, null, 'declined', auth.uid(), p_note);
end;
$$;

create or replace function public.change_department(p_profile uuid, p_department uuid, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_old uuid;
  v_status public.account_status;
  v_role public.user_role;
  v_name text;
begin
  if p_profile = auth.uid() then
    raise exception 'You can''t change your own department';
  end if;

  select department_id, status, role into v_old, v_status, v_role
  from public.profiles where id = p_profile for update;

  if not found or v_status <> 'active' or v_role <> 'member' then
    raise exception 'Only active members can be moved';
  end if;
  if not (public.is_admin() or public.mentors_department(v_old)) then
    raise exception 'Only a mentor of this person''s department can change it';
  end if;
  select name into v_name from public.departments where id = p_department;
  if v_name is null then
    raise exception 'Unknown department';
  end if;
  if v_old = p_department then
    return;
  end if;

  update public.profiles set department_id = p_department where id = p_profile;
  insert into public.department_changes (profile_id, from_department_id, to_department_id, kind, changed_by, note)
  values (p_profile, v_old, p_department, 'moved', auth.uid(), p_note);

  perform public.notify(p_profile, 'department_changed', 'Your department is now ' || v_name, p_note, '/tasks');
end;
$$;

create or replace function public.submit_day(p_date date default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_date date := coalesce(p_date, public.today_ist());
  v_dept uuid := public.my_department();
begin
  if v_dept is null then
    raise exception 'Your account is not active';
  end if;
  if not public.can_edit_day(v_date) then
    raise exception 'This day is closed';
  end if;
  if not exists (select 1 from public.daily_tasks where user_id = auth.uid() and work_date = v_date) then
    raise exception 'Add at least one task before sending your day';
  end if;

  insert into public.day_submissions (user_id, department_id, work_date)
  values (auth.uid(), v_dept, v_date)
  on conflict (user_id, work_date) do update
    set submitted_at = now(), review_status = 'submitted', reviewed_by = null, reviewed_at = null
    where public.day_submissions.review_status <> 'approved';
end;
$$;

create or replace function public.review_day(p_submission uuid, p_decision text, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_sub public.day_submissions%rowtype;
begin
  select * into v_sub from public.day_submissions where id = p_submission for update;
  if not found then
    raise exception 'Submission not found';
  end if;
  if not (public.is_admin() or public.mentors_department(v_sub.department_id)) then
    raise exception 'Only a mentor of this department can review it';
  end if;
  if p_decision not in ('approved', 'sent_back') then
    raise exception 'Unknown decision';
  end if;
  if p_decision = 'sent_back' and coalesce(btrim(p_note), '') = '' then
    raise exception 'Add a note when sending a day back';
  end if;

  update public.day_submissions
     set review_status = p_decision, reviewed_by = auth.uid(), reviewed_at = now(), review_note = p_note
   where id = p_submission;

  if p_decision = 'approved' then
    insert into public.task_reviews (task_id, reviewed_by, reviewed_at, updated_by)
    select t.id, auth.uid(), now(), auth.uid()
    from public.daily_tasks t
    where t.user_id = v_sub.user_id and t.work_date = v_sub.work_date and t.status = 'done'
    on conflict (task_id) do update
      set reviewed_by = excluded.reviewed_by, reviewed_at = excluded.reviewed_at,
          updated_by = excluded.updated_by, updated_at = now();
  else
    perform public.notify(v_sub.user_id, 'day_sent_back', 'Your mentor sent your day back', p_note, '/tasks');
  end if;
end;
$$;

create or replace function public.check_in(p_mode text default 'office')
returns public.attendance language plpgsql security definer set search_path = public as $$
declare
  v_today date := public.today_ist();
  v_local time := (now() at time zone 'Asia/Kolkata')::time;
  v_late time := coalesce(public.setting('late_after'), '10:15')::time;
  v_row public.attendance;
begin
  if public.my_department() is null then
    raise exception 'Your account is not active';
  end if;
  if p_mode not in ('office', 'wfh') then
    raise exception 'Unknown check-in mode';
  end if;

  insert into public.attendance (user_id, work_date, check_in_at, status)
  values (
    auth.uid(), v_today, now(),
    case when p_mode = 'wfh' then 'wfh'::public.attendance_status
         when v_local > v_late then 'late'::public.attendance_status
         else 'present'::public.attendance_status end
  )
  on conflict (user_id, work_date) do nothing
  returning * into v_row;

  if v_row.user_id is null then
    raise exception 'You''ve already checked in today';
  end if;
  return v_row;
end;
$$;

create or replace function public.check_out()
returns public.attendance language plpgsql security definer set search_path = public as $$
declare
  v_half int := coalesce(public.setting('half_day_minutes'), '270')::int;
  v_row public.attendance;
begin
  update public.attendance a
     set check_out_at = now(),
         worked_minutes = floor(extract(epoch from (now() - a.check_in_at)) / 60)::int,
         status = case
           when a.status in ('present', 'late')
                and floor(extract(epoch from (now() - a.check_in_at)) / 60) < v_half
           then 'half_day'::public.attendance_status
           else a.status end
   where a.user_id = auth.uid()
     and a.work_date = public.today_ist()
     and a.check_in_at is not null
     and a.check_out_at is null
  returning * into v_row;

  if v_row.user_id is null then
    raise exception 'Check in first, or you''ve already checked out';
  end if;
  return v_row;
end;
$$;

-- Nightly at 23:59 IST (18:29 UTC) via pg_cron; not callable by clients.
create or replace function public.close_day()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_today date := public.today_ist();
  v_off text := lower(coalesce(public.setting('weekly_off'), 'sun'));
begin
  update public.attendance
     set check_out_missed = true
   where work_date = v_today and check_in_at is not null and check_out_at is null;

  if exists (select 1 from public.holidays where day = v_today)
     or position(to_char(v_today, 'dy') in v_off) > 0 then
    return;
  end if;

  insert into public.attendance (user_id, work_date, status)
  select p.id, v_today, 'absent'
  from public.profiles p
  where p.status = 'active' and p.department_id is not null
  on conflict (user_id, work_date) do nothing;
end;
$$;

create or replace function public.admin_set_role(p_profile uuid, p_role public.user_role)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;
  update public.profiles set role = p_role where id = p_profile;
end;
$$;

create or replace function public.admin_set_mentor_departments(p_mentor uuid, p_departments uuid[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;
  delete from public.mentor_departments where mentor_id = p_mentor;
  insert into public.mentor_departments (mentor_id, department_id)
  select p_mentor, d from unnest(p_departments) as d;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
-- Profiles: clients may only change their name and photo. Department, role and status
-- change only through the RPCs above.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

-- Notifications: clients may only set read_at.
revoke update on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

-- Functions are executable by PUBLIC by default; lock them down.
revoke execute on function public.notify(uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.close_day() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

revoke execute on function public.approve_registration(uuid, uuid) from public, anon;
revoke execute on function public.decline_registration(uuid, text) from public, anon;
revoke execute on function public.change_department(uuid, uuid, text) from public, anon;
revoke execute on function public.submit_day(date) from public, anon;
revoke execute on function public.review_day(uuid, text, text) from public, anon;
revoke execute on function public.check_in(text) from public, anon;
revoke execute on function public.check_out() from public, anon;
revoke execute on function public.admin_set_role(uuid, public.user_role) from public, anon;
revoke execute on function public.admin_set_mentor_departments(uuid, uuid[]) from public, anon;

grant execute on function public.approve_registration(uuid, uuid) to authenticated;
grant execute on function public.decline_registration(uuid, text) to authenticated;
grant execute on function public.change_department(uuid, uuid, text) to authenticated;
grant execute on function public.submit_day(date) to authenticated;
grant execute on function public.review_day(uuid, text, text) to authenticated;
grant execute on function public.check_in(text) to authenticated;
grant execute on function public.check_out() to authenticated;
grant execute on function public.admin_set_role(uuid, public.user_role) to authenticated;
grant execute on function public.admin_set_mentor_departments(uuid, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: private bucket for project files, path {project_id}/{uuid}-{file name}
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

create policy "active users read project files" on storage.objects
  for select to authenticated
  using (bucket_id = 'project-files' and public.my_department() is not null);

create policy "project team uploads project files" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'project-files'
    and exists (
      select 1 from public.projects p
      where p.id::text = (storage.foldername(name))[1]
        and (
          p.created_by = auth.uid()
          or exists (select 1 from public.project_members m where m.project_id = p.id and m.user_id = auth.uid())
        )
    )
  );

create policy "uploaders delete their project files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'project-files' and owner = auth.uid());

-- ---------------------------------------------------------------------------
-- Scheduling (run once in the SQL editor after enabling pg_cron in the dashboard):
--   select cron.schedule('close-day', '29 18 * * *', $$select public.close_day()$$);
-- Email reminders (18:30 IST) and the mentor digest (10:00 IST) are server routes
-- in app/api/cron/*, triggered by Vercel Cron or pg_net; see docs/BUILD_PLAN.md.
-- ---------------------------------------------------------------------------
