-- Departments, types of work and default settings. Safe to re-run.

insert into public.departments (slug, name, color, detail_label) values
  ('creative',   'Creative',   '#C9A23F', null),
  ('production', 'Production', '#D9692B', 'Location'),
  ('finance',    'Finance',    '#5E7F35', 'Reference')
on conflict (slug) do nothing;

insert into public.task_types (department_id, name, sort)
select d.id, t.name, t.sort
from public.departments d
join (values
  ('creative',   'Design',           1),
  ('creative',   'Copy',             2),
  ('creative',   'Video edit',       3),
  ('creative',   'Revision',         4),
  ('creative',   'Meeting',          5),
  ('production', 'Shoot',            1),
  ('production', 'Recce',            2),
  ('production', 'Edit',             3),
  ('production', 'Call sheet',       4),
  ('production', 'Equipment',        5),
  ('finance',    'Invoices',         1),
  ('finance',    'Payments',         2),
  ('finance',    'Reconciliation',   3),
  ('finance',    'Vendor follow-up', 4),
  ('finance',    'Project budget',   5)
) as t(slug, name, sort) on t.slug = d.slug
on conflict (department_id, name) do nothing;

insert into public.settings (key, value) values
  ('timezone',          'Asia/Kolkata'),
  ('office_start',      '10:00'),
  ('office_end',        '19:00'),
  ('late_after',        '10:15'),
  ('half_day_minutes',  '270'),
  ('task_edit_lock',    '23:59'),
  ('reminder_at',       '18:30'),
  ('mentor_digest_at',  '10:00'),
  ('weekly_off',        'sun')
on conflict (key) do nothing;

-- After the first person signs up, make them admin in the SQL editor:
--   update public.profiles
--      set role = 'admin', status = 'active',
--          department_id = (select id from public.departments where slug = 'creative')
--    where email = 'you@yourcompany.com';
