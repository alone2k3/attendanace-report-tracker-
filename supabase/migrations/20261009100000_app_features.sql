-- Turmeric Work Tracker: features for phases 2-7 plus fixes from the security audit.
-- Builds on 0001_init.sql (never edited). Sections:
--   1. Audit fixes (self-review, self-demotion, project ownership, function grants)
--   2. Team visibility (teammates read their own department's log and attendance)
--   3. Attendance: mark_leave
--   4. Public mentor names for /register/pending
--   5. Task feed view (security_invoker so RLS still applies)
--   6. Notifications fired by triggers (registration, flags, tagging, review, moves)
--   7. Email reminder rate limit
--   8. Admin RPCs (status, departments, task types)
--   9. Project comments

-- ---------------------------------------------------------------------------
-- 1. Audit fixes
-- ---------------------------------------------------------------------------

-- A mentor also posts their own tasks; they must not approve their own day.
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
  if v_sub.user_id = auth.uid() and not public.is_admin() then
    raise exception 'You can''t review your own day';
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
    perform public.notify(v_sub.user_id, 'day_approved', 'Your day was approved', null, '/tasks');
  else
    perform public.notify(v_sub.user_id, 'day_sent_back', 'Your mentor sent your day back', p_note, '/tasks');
  end if;
end;
$$;

-- Mentors review and flag other people's tasks, not their own.
alter policy "mentors add marks" on public.task_reviews
  with check (
    updated_by = auth.uid() and (
      public.is_admin()
      or exists (
        select 1 from public.daily_tasks t
        where t.id = task_id and t.user_id <> auth.uid() and public.mentors_department(t.department_id)
      )
    )
  );
alter policy "mentors change marks" on public.task_reviews
  using (
    public.is_admin()
    or exists (
      select 1 from public.daily_tasks t
      where t.id = task_id and t.user_id <> auth.uid() and public.mentors_department(t.department_id)
    )
  )
  with check (
    updated_by = auth.uid() and (
      public.is_admin()
      or exists (
        select 1 from public.daily_tasks t
        where t.id = task_id and t.user_id <> auth.uid() and public.mentors_department(t.department_id)
      )
    )
  );

-- An admin can't remove their own admin role (it would lock everyone out of settings).
create or replace function public.admin_set_role(p_profile uuid, p_role public.user_role)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;
  if p_profile = auth.uid() and p_role <> 'admin' then
    raise exception 'You can''t remove your own admin role';
  end if;
  update public.profiles set role = p_role where id = p_profile;
  if p_role = 'member' then
    delete from public.mentor_departments where mentor_id = p_profile;
  end if;
end;
$$;

-- Team members may update a project, but its owner and department stay fixed
-- (only admins can change them). Without this, any tagged person could move a
-- project into another department.
create or replace function public.guard_project_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.created_by is distinct from old.created_by or new.department_id is distinct from old.department_id)
     and not public.is_admin() then
    raise exception 'Only an admin can change a project''s owner or department';
  end if;
  return new;
end;
$$;
create trigger projects_guard_owner
  before update on public.projects
  for each row execute function public.guard_project_owner();

-- Uploaded file sizes are also capped on the bucket itself.
update storage.buckets
   set file_size_limit = 26214400,
       allowed_mime_types = array[
         'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml',
         'application/pdf', 'application/zip', 'application/x-zip-compressed',
         'application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/vnd.ms-excel',
         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
         'application/vnd.ms-powerpoint',
         'application/vnd.openxmlformats-officedocument.presentationml.presentation'
       ]
 where id = 'project-files';

-- Helper functions don't need to be reachable by signed-out visitors.
revoke execute on function public.setting(text) from public, anon;
revoke execute on function public.can_edit_day(date) from public, anon;
revoke execute on function public.mentors_department(uuid) from public, anon;
revoke execute on function public.my_department() from public, anon;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.setting(text) to authenticated;
grant execute on function public.can_edit_day(date) to authenticated;
grant execute on function public.mentors_department(uuid) to authenticated;
grant execute on function public.my_department() to authenticated;
grant execute on function public.is_admin() to authenticated;
revoke execute on function public.guard_project_owner() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Team visibility: a department's log is private to its team and mentors.
-- ---------------------------------------------------------------------------
create policy "teammates read own department's tasks" on public.daily_tasks
  for select to authenticated using (department_id = public.my_department());

create policy "teammates read own department's attendance" on public.attendance
  for select to authenticated using (
    exists (
      select 1 from public.profiles p
      where p.id = attendance.user_id and p.department_id = public.my_department()
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Attendance: mark leave ahead of time
-- ---------------------------------------------------------------------------
create or replace function public.mark_leave(p_date date, p_note text default null)
returns public.attendance language plpgsql security definer set search_path = public as $$
declare
  v_row public.attendance;
  v_existing public.attendance;
begin
  if public.my_department() is null then
    raise exception 'Your account is not active';
  end if;
  if p_date is null or p_date < public.today_ist() then
    raise exception 'Leave can only be marked for today or a future date';
  end if;
  if p_date > public.today_ist() + 180 then
    raise exception 'Leave can be marked up to 180 days ahead';
  end if;
  if p_note is not null and char_length(p_note) > 200 then
    raise exception 'Keep the leave note under 200 characters';
  end if;

  select * into v_existing from public.attendance where user_id = auth.uid() and work_date = p_date;
  if found and v_existing.check_in_at is not null then
    raise exception 'You''ve already checked in that day';
  end if;
  if found and v_existing.status = 'leave' then
    raise exception 'You''re already on leave that day';
  end if;

  insert into public.attendance (user_id, work_date, status, note)
  values (auth.uid(), p_date, 'leave', nullif(btrim(p_note), ''))
  on conflict (user_id, work_date) do update
    set status = 'leave', note = excluded.note
    where public.attendance.check_in_at is null
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.cancel_leave(p_date date)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_date < public.today_ist() then
    raise exception 'Past leave can''t be changed';
  end if;
  delete from public.attendance
   where user_id = auth.uid() and work_date = p_date and status = 'leave' and check_in_at is null;
  if not found then
    raise exception 'No leave found for that day';
  end if;
end;
$$;

revoke execute on function public.mark_leave(date, text) from public, anon;
revoke execute on function public.cancel_leave(date) from public, anon;
grant execute on function public.mark_leave(date, text) to authenticated;
grant execute on function public.cancel_leave(date) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Mentor names for /register/pending (names only; no emails)
-- ---------------------------------------------------------------------------
create or replace function public.department_mentor_names(p_slug text)
returns table (full_name text)
language sql stable security definer set search_path = public as $$
  select p.full_name
  from public.mentor_departments md
  join public.departments d on d.id = md.department_id
  join public.profiles p on p.id = md.mentor_id
  where d.slug = p_slug and p.status = 'active' and p.role in ('mentor', 'admin')
  order by p.full_name;
$$;
revoke execute on function public.department_mentor_names(text) from public;
grant execute on function public.department_mentor_names(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Task feed for the mentor task manager. security_invoker keeps RLS in force.
-- ---------------------------------------------------------------------------
create view public.v_task_feed with (security_invoker = on) as
select
  t.id,
  t.user_id,
  p.full_name as user_name,
  t.department_id,
  d.slug as department_slug,
  d.name as department_name,
  t.work_date,
  t.title,
  t.task_type_id,
  tt.name as task_type_name,
  t.project_id,
  pr.name as project_name,
  t.detail,
  t.status,
  t.created_at,
  t.updated_at,
  r.reviewed_by,
  r.reviewed_at,
  coalesce(r.flagged, false) as flagged,
  r.flag_note
from public.daily_tasks t
join public.profiles p on p.id = t.user_id
join public.departments d on d.id = t.department_id
left join public.task_types tt on tt.id = t.task_type_id
left join public.projects pr on pr.id = t.project_id
left join public.task_reviews r on r.task_id = t.id;

revoke all on public.v_task_feed from anon;
grant select on public.v_task_feed to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Notifications from triggers
-- ---------------------------------------------------------------------------
create or replace function public.notify_mentors(p_department uuid, p_kind text, p_title text, p_body text, p_link text, p_except uuid default null)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, kind, title, body, link)
  select distinct md.mentor_id, p_kind, p_title, p_body, p_link
  from public.mentor_departments md
  join public.profiles p on p.id = md.mentor_id
  where md.department_id = p_department
    and p.status = 'active'
    and (p_except is null or md.mentor_id <> p_except);
$$;
revoke execute on function public.notify_mentors(uuid, text, text, text, text, uuid) from public, anon, authenticated;

-- New registration -> mentors of the requested department.
create or replace function public.on_profile_registered() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'pending' and new.requested_department_id is not null then
    perform public.notify_mentors(new.requested_department_id, 'registration',
      'New registration: ' || new.full_name, 'Confirm their department to activate the account.', '/mentor/people');
  end if;
  return new;
end;
$$;
create trigger profiles_registered
  after insert on public.profiles
  for each row execute function public.on_profile_registered();

-- Department moved -> mentors of the old and new departments (the person is notified by change_department).
create or replace function public.on_department_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_name text;
begin
  if new.kind = 'moved' then
    select full_name into v_name from public.profiles where id = new.profile_id;
    perform public.notify_mentors(new.from_department_id, 'department_changed',
      v_name || ' moved departments', new.note, '/mentor/people', new.changed_by);
    perform public.notify_mentors(new.to_department_id, 'department_changed',
      v_name || ' joined your department', new.note, '/mentor/people', new.changed_by);
  end if;
  return new;
end;
$$;
create trigger department_changes_notify
  after insert on public.department_changes
  for each row execute function public.on_department_change();

-- Task flagged -> the task owner.
create or replace function public.on_task_flagged() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_task public.daily_tasks%rowtype;
begin
  if new.flagged and (tg_op = 'INSERT' or not coalesce(old.flagged, false)) then
    select * into v_task from public.daily_tasks where id = new.task_id;
    perform public.notify(v_task.user_id, 'task_flagged', 'Your mentor flagged: ' || left(v_task.title, 80),
      new.flag_note, '/tasks');
  end if;
  return new;
end;
$$;
create trigger task_reviews_flag_notify
  after insert or update on public.task_reviews
  for each row execute function public.on_task_flagged();

-- Tagged on a project -> the tagged person.
create or replace function public.on_project_member_added() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_name text;
begin
  if new.user_id <> new.added_by then
    select name into v_name from public.projects where id = new.project_id;
    perform public.notify(new.user_id, 'project_tagged', 'You were tagged on ' || v_name, null,
      '/projects/' || new.project_id);
  end if;
  return new;
end;
$$;
create trigger project_members_notify
  after insert on public.project_members
  for each row execute function public.on_project_member_added();

-- Project moved to review -> mentors of the project's department.
create or replace function public.on_project_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'review' and old.status is distinct from 'review' then
    perform public.notify_mentors(new.department_id, 'project_review', new.name || ' is ready for review', null,
      '/projects/' || new.id, auth.uid());
  end if;
  return new;
end;
$$;
create trigger projects_status_notify
  after update of status on public.projects
  for each row execute function public.on_project_status();

revoke execute on function public.on_profile_registered() from public, anon, authenticated;
revoke execute on function public.on_department_change() from public, anon, authenticated;
revoke execute on function public.on_task_flagged() from public, anon, authenticated;
revoke execute on function public.on_project_member_added() from public, anon, authenticated;
revoke execute on function public.on_project_status() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. Email reminder log: one reminder per person per day per kind
-- ---------------------------------------------------------------------------
create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  work_date date not null default ((now() at time zone 'Asia/Kolkata')::date),
  kind text not null check (kind in ('checkin_reminder', 'task_reminder', 'digest')),
  sent_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (user_id, work_date, kind)
);
alter table public.email_log enable row level security;
create policy "mentors read reminder log" on public.email_log
  for select to authenticated using (
    user_id = auth.uid() or public.is_admin()
    or exists (select 1 from public.profiles p where p.id = email_log.user_id and public.mentors_department(p.department_id))
  );
-- Rows are written by claim_checkin_reminder (below) and by cron routes with the service role.

-- Returns true only the first time today, so the caller sends at most one email.
create or replace function public.claim_checkin_reminder(p_profile uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_dept uuid;
  v_id uuid;
begin
  select department_id into v_dept from public.profiles where id = p_profile and status = 'active';
  if v_dept is null then
    raise exception 'This person isn''t active';
  end if;
  if not (public.is_admin() or public.mentors_department(v_dept)) then
    raise exception 'Only a mentor of this person''s department can remind them';
  end if;
  insert into public.email_log (user_id, kind, sent_by)
  values (p_profile, 'checkin_reminder', auth.uid())
  on conflict (user_id, work_date, kind) do nothing
  returning id into v_id;
  if v_id is not null then
    perform public.notify(p_profile, 'checkin_reminder', 'Reminder: check in for today', null, '/dashboard');
  end if;
  return v_id is not null;
end;
$$;
revoke execute on function public.claim_checkin_reminder(uuid) from public, anon;
grant execute on function public.claim_checkin_reminder(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Admin RPCs
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_status(p_profile uuid, p_status public.account_status)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_dept uuid;
  v_role public.user_role;
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;
  if p_profile = auth.uid() then
    raise exception 'You can''t change your own account status';
  end if;
  select department_id, role into v_dept, v_role from public.profiles where id = p_profile;
  if not found then
    raise exception 'Person not found';
  end if;
  if p_status = 'active' and v_dept is null and v_role <> 'admin' then
    raise exception 'Approve the registration with a department first';
  end if;
  update public.profiles set status = p_status where id = p_profile;
end;
$$;
revoke execute on function public.admin_set_status(uuid, public.account_status) from public, anon;
grant execute on function public.admin_set_status(uuid, public.account_status) to authenticated;

-- ---------------------------------------------------------------------------
-- 9. Project comments
-- ---------------------------------------------------------------------------
create table public.project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index project_comments_project on public.project_comments (project_id, created_at);
alter table public.project_comments enable row level security;
create policy "active users read project comments" on public.project_comments
  for select to authenticated using (public.my_department() is not null or public.is_admin());
create policy "active users comment on projects" on public.project_comments
  for insert to authenticated with check (
    author_id = auth.uid() and (public.my_department() is not null or public.is_admin())
  );
create policy "authors and admins delete comments" on public.project_comments
  for delete to authenticated using (author_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Scheduling (run once in the SQL editor after enabling pg_cron):
--   select cron.schedule('close-day', '29 18 * * *', $$select public.close_day()$$);
-- ---------------------------------------------------------------------------
