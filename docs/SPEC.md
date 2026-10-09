# Turmeric Work Tracker — product spec

Last updated 9 Oct 2026. This file is the source of truth for behaviour. The screen designs in `docs/design/reference/` show how each part looks.

## 1. What it does

One web app where Finance, Production and Creative staff:

- mark attendance;
- log their daily tasks in their own department's log;
- run projects (Creative-first) with people tagged from any department.

Mentors see who is in, what's been logged, how tasks are moving, and review or flag work.

Out of scope for v1: payroll, salary, client billing, WhatsApp, hours per task.

## 2. Roles

| Role | Who | Can do |
| --- | --- | --- |
| Member | Finance, Production, Creative staff | Check in/out; post tasks to **their own** department; create projects; tag people; see their own department's page |
| Mentor | Department heads, senior leads | Everything a member can, plus: confirm new registrations, change people's departments, read and review/flag tasks, and see attendance for the departments they're assigned |
| Admin | HR or management | Everything: users, roles, mentor assignments, departments, settings, holidays, all reports |

A mentor can mentor several departments (table `mentor_departments`). A mentor also belongs to one department and can post their own tasks there.

| Action | Member | Mentor | Admin |
| --- | --- | --- | --- |
| Check in / out | Own | Own | Own |
| Add, edit or delete a task | Own, own dept, until the day locks | Own | Own |
| See tasks | Own | Their departments | All |
| Review or flag a task, approve or send back a day | No | Their departments | All |
| Set or change someone's department | No; picked once at registration | Their departments; also confirms new sign-ups | Yes |
| Create a project | Yes | Yes | Yes |
| Reports and exports | Own | Their departments | All |
| Users, roles, mentor assignments, settings | No | No | Yes |

## 3. Departments and task fields

Departments are rows in `departments`, so more can be added later. Each department has its own types of work (`task_types`). Production and Finance have one extra text field (`detail_label`).

| Department | Types of work | Extra field | Project link |
| --- | --- | --- | --- |
| Creative | Design, Copy, Video edit, Revision, Meeting | none | Usually; pick from projects |
| Production | Shoot, Recce, Edit, Call sheet, Equipment | Location | Shoot or project |
| Finance | Invoices, Payments, Reconciliation, Vendor follow-up, Project budget | Reference (invoice or batch no.) | Optional |

Colours: Creative turmeric gold, Production saffron, Finance curry-leaf green (exact values in DESIGN.md).

## 4. Accounts: register, confirm, sign in

### Register (`/register`)

The form asks for:

- full name;
- work email;
- password (at least 6 characters);
- **department**, one of three buttons.

On submit, call `supabase.auth.signUp` with `options.data = { full_name, department: '<slug>' }`. The `handle_new_user` trigger then creates a `profiles` row with:

- `status = 'pending'`;
- `requested_department_id` set to the department they picked;
- `department_id = null`.

The person then sees `/register/pending`: "Department tag: Creative. Arjun Mehta will confirm it before you can sign in. After that, only a mentor can change your department."

The mentor names shown there come from `mentor_departments`. Mentors of that department get an in-app notification and an email.

### Mentor confirms (`/mentor/people`)

- **New registrations** lists pending profiles whose requested department is one the mentor covers. For each one the mentor can:
  - choose a department (defaults to the requested one);
  - **Approve**: calls `approve_registration(profile, department)`. The account becomes active with that department, and the person gets an email.
  - **Decline**: calls `decline_registration(profile, note)`. The account status becomes `disabled`.
- **Your people** lists active members in the mentor's departments, each with a **Move to** select. Choosing a different department shows **Save change** and **Cancel**. Save calls `change_department(profile, department, note)`. The person and the mentors of both departments are notified.
- **Department change log**, newest first, reads from `department_changes`.

### Sign in (`/login`)

Email + password. Error messages:

| Case | Message |
| --- | --- |
| Wrong email or password | "That email and password don't match." |
| Pending account | "Your registration is waiting for a mentor to confirm your department." |
| Disabled account | "This account isn't active. Talk to your mentor." |

Members can never change their own department. The profile page shows it with a lock and the line "Set when you registered. Only a mentor can change it."

## 5. Attendance (`/attendance`, Home card)

- **Check in** calls the `check_in('office' | 'wfh')` RPC. The server time is used, and the status is set automatically:
  - `present`, or `late` if after `late_after` (default 10:15 IST), or `wfh`.
- **Check out** calls `check_out()`, which records `worked_minutes`. If the person worked less than `half_day_minutes` (default 270), the status becomes `half_day`.
- Members can mark **Leave** for a date ahead of time (Phase 2: add a `mark_leave` RPC).
- Nightly job `close_day()` at 23:59 IST:
  - flags any missing check-outs (`check_out_missed`);
  - marks active people with no row as `absent`, except on holidays and weekly offs.
- **Monthly calendar:** each day is coloured P / L / W / H / A / leave. The "October so far" totals appear on Home.

## 6. Daily tasks (`/tasks`)

This is the heart of the app. Each person has **one log per day, inside their own department**.

- **Header:** the "Your department" banner, showing the department name, its colour, a lock icon and the line "Tagged when you registered. You can only post to Creative, and only a mentor can change your department."
- **Add a task form.** Fields depend on the department (§3):
  - What did you do? (required, up to 300 characters);
  - type of work / category;
  - project (where relevant);
  - Location or Reference (Production and Finance only);
  - status: Done or In progress.
  - **There is no hours field.** Button: "Add to Creative log".
- **My Creative log · today:**
  - Tiles: Tasks, Done, In progress.
  - Chips for tasks by type, e.g. "Design · 2".
  - A list of tasks: time, title, meta line, a status toggle, and remove.
  - A "This week · tasks you logged" strip, with today highlighted.
- **Send day to {mentor}** calls `submit_day()`. It needs at least one task. The day then shows as "Sent for review".
- **Editing:** tasks can be added, edited or deleted until 23:59 IST that day, or later if the mentor **sends the day back**. `can_edit_day()` enforces this in RLS.
- **Reminder:** at 18:30 IST, anyone who checked in but has no tasks, or hasn't sent their day, gets an email and an in-app notification.
- **Moving departments:** if someone is moved, their tasks from before the move stay in the old department, and new tasks go to the new department. The data is tracked separately.

## 7. Projects (`/projects`, `/projects/[id]`)

- Any active member can create one. It's mainly used by Creative. Fields: name, client, brief, start date, due date, priority (low / normal / high).
- **Status:** planning → in_progress → review → revision → completed, or on_hold.
- **Team:** tag people from any department; each shows a department chip. Tagged people are notified, and the project appears on their dashboard.
- **To-dos** (`project_todos`): title, assignee, due date, done.
- **Files** (`project_files`): uploads go to the private bucket `project-files/{project_id}/...`.
  - Limit 25 MB each. Allowed: images, PDF, Office files, ZIP.
  - Big videos are added as Drive, Frame.io or YouTube-unlisted links.
- **Daily tasks** can link to a project. The project page has an **Updates** tab listing every task linked to it.
- Moving to **review** notifies the mentors of the project's department.

## 8. Department pages (`/departments/[slug]`)

- **Visibility:**
  - Members see only their own department.
  - Mentors see their departments.
  - Admins see all three.
- **All department pages** have:
  - a header with the department icon tile and mentor name;
  - stat tiles: in today, tasks logged, live projects or shoots;
  - **Today's updates**;
  - **Team today**: attendance chips.
- **Creative** adds:
  - a **Projects** board with status filter pills (counts in labels);
  - project cards showing owner, status chip, due date, priority, a segmented to-do progress bar, team avatars by department colour, and department tags;
  - a **New project** button.
- **Production** adds:
  - **Shoot schedule** (Next 7 days / Done this week), with a date block, title, time, location, linked project and crew;
  - **Deliverables due**.
- **Finance** adds:
  - **Today's updates** with expandable task lines and file chips;
  - **Tasks by category this week** (counts, not hours);
  - **Projects tagging Finance**.

## 9. Mentor view (`/mentor`)

Two tabs: **Overview** and **Task manager**. A separate page, **People & departments** (`/mentor/people`), is described in §4.

### Overview tab

- Tiles:
  - days waiting for review;
  - not checked in (x of y);
  - late today;
  - missed yesterday's update.
- **Review queue:** submitted days (`day_submissions.review_status = 'submitted'`).
  - Filter pills by department.
  - **Approve** calls `review_day(id, 'approved')`, which marks every Done task that day as reviewed.
  - **Send back** calls `review_day(id, 'sent_back', note)`. A note is required, the member is notified, and they can edit that day again.
- **Not checked in yet** has an **Email reminder** button. It sends via a server route and is rate-limited to one per person per day.
- **Projects to watch:** projects in review, overdue, or due within 3 days.
- **People & departments** card: a compact version of `/mentor/people`.

### Task manager tab

Everything here is calculated from `daily_tasks` plus `task_reviews` for the mentor's departments.

- **Filters:** department (All / each covered dept) and status (All / In progress / Done / Flagged). Selecting a person adds a "Showing {name} ×" chip.
- **Tiles:**
  - tasks logged today;
  - done (with %);
  - in progress;
  - reviewed by you;
  - people who logged (x of headcount).
- **Task process today:** Logged → Done (% of logged) → Reviewed by you (% of done), each with a thin bar. Chips beside them show "Still in progress n" and "Flagged by you n".
- **Progress by department:** a done/total bar per department, plus chips for tasks by type.
- **Tasks logged this week:** a grouped bar chart (Mon–today) with one bar per department. Today updates live.
- **By person:** a table of tasks, done, in progress and last update. Selecting a row filters everything to that person. Below it, a red-tinted list: "Nothing logged yet today".
- **All tasks:** newest first.
  - **List view:** time, person + department chip, task, project · type, status chip, then **Mark reviewed** (Done tasks only) and **Flag** / **Flagged**.
  - **Board view:** columns In progress / Done · to review / Reviewed / Flagged.
  - Mentors can review and flag. They **cannot edit** a member's task.
  - Flagging asks for an optional note. The member sees the flag and note on that task, and gets a notification.

## 10. Home (`/dashboard`)

- Greeting and date.
- **Attendance card** (black): Check in → Checked in at 9:52 AM · On time → Check out → Done for today.
- **Today's tasks card:** "3 tasks logged · not sent yet" with a button to `/tasks`.
- **October so far:** P / L / W / H counts and a strip of day chips.
- **My department card:** a link to the member's own department page.
- **My projects** and **Tagged you**.

## 11. Reports (`/reports`, mentors and admins)

Filters: date range, department, person, project.

- Attendance summary per person: present, late, half day, WFH, leave, absent.
- Task summary: tasks logged, done, reviewed, flagged, days sent on time.
- Exports: Excel (SheetJS) and PDF (jsPDF).

## 12. Notifications and email

Every notification gets an in-app row (`notifications`); a mentor's bell shows a count. Emails go through Resend from the server only.

| When | Who gets it | Channel |
| --- | --- | --- |
| New registration | Mentors of the requested department | In-app + email |
| Registration approved or declined | The person | Email |
| Department changed | The person; mentors of the old and new departments | In-app + email |
| 18:30 IST, no tasks or day not sent | The member | In-app + email |
| 10:00 IST daily digest (absent, late, missing logs, waiting for review) | Mentors | Email |
| Task flagged, or day sent back | The member | In-app + email |
| Tagged on a project | The tagged person | In-app |
| Project moved to review | Mentors of the project's department | In-app |

## 13. Admin (`/admin/*`)

- **Users:** list everyone; set role with `admin_set_role`; disable an account.
- **Mentors:** choose which departments each mentor covers with `admin_set_mentor_departments`.
- **Departments:** add or edit name, colour, extra-field label, and types of work.
- **Settings:** `settings` table rows: office hours, late cutoff, half-day minutes, reminder time, digest time, weekly offs.
- **Holidays:** a list of dates with names.
- **First admin:** after the first sign-up, run in SQL: `update profiles set role = 'admin', status = 'active' where email = '...';`

## 14. Pages and routes

| Route | Who | Purpose |
| --- | --- | --- |
| /login | Public | Sign in |
| /register | Public | Sign up with department tag |
| /register/pending | Public | Waiting for mentor |
| /dashboard | All | Home |
| /tasks | Members, mentors | Today's task log for own department |
| /attendance | All | Calendar, mark leave |
| /projects, /projects/new, /projects/[id] | All | Projects |
| /departments/[slug] | By visibility rule | Department page |
| /mentor | Mentors, admins | Overview + Task manager tabs |
| /mentor/people | Mentors, admins | Registrations, department changes, change log |
| /reports | Mentors, admins | Reports and exports |
| /admin/users, /admin/mentors, /admin/departments, /admin/settings | Admins | Admin |
| /notifications, /profile | All | Bell, profile |

## 15. Default business rules

Admins can change all of these in Settings.

| Rule | Default |
| --- | --- |
| Office hours | 10:00–19:00 IST, Mon–Sat |
| Late | Check-in after 10:15 |
| Half day | Worked under 4 h 30 m |
| Absent | No check-in by 23:59 on a working day, not on leave or holiday |
| Task edit lock | 23:59 IST the same day, unless the day was sent back |
| Reminder | 18:30 IST |
| Mentor digest | 10:00 IST |
| Weekly off | Sunday |
| Time zone | Asia/Kolkata |

## 15a. Additions made while building

- **Team visibility.** Active members can read their own department's daily tasks and today's attendance (for the department page's "Today's updates" and "Team today"). They still can't read other departments' logs.
- **Mentors don't review themselves.** A mentor can't approve their own day or flag/review their own tasks (admins can).
- **Leave.** `mark_leave(date, note)` for today or up to 180 days ahead, before checking in; `cancel_leave(date)` for today or later.
- **Project ownership is fixed.** Team members can update a project, but only an admin can change its owner or department.
- **Notifications** are written by database triggers: new registration (mentors), department move (mentors of both departments), task flagged (owner), tagged on a project (person), project moved to review (mentors), day approved or sent back (member).
- **Reminder limit.** `claim_checkin_reminder(profile)` allows one check-in reminder email per person per day; cron emails use the same `email_log` table so reruns don't double-send.
- **Admins** can disable or re-enable accounts (`admin_set_status`) and can't remove their own admin role.
- **Project comments** (`project_comments`) on the project page.
- **Shoot schedule** (Production page) lists projects that touch Production and start in the next 7 days; "Done this week" lists Shoot and Recce tasks logged this week.

## 16. Later (not v1)

- Leave requests with approval and balances.
- Office Wi-Fi or location check-in.
- WhatsApp or Slack reminders.
- Installable phone app (PWA).
- Per-person monthly summaries.

## 17. Open questions to confirm with the team

- Headcount per department and total, which affects Supabase and Vercel plan limits.
- Are the office timings, late rule and weekly offs above right?
- Should Finance and Production create projects too, or only Creative?
- Company Google Workspace sign-in, or email + password only?
- Max upload size for Creative files, and whether raw videos are uploaded or linked.
