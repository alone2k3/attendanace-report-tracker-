# Build plan — prompts for Claude Code

Build one phase per session (or a few sessions per phase).

1. Paste the phase's prompt into Claude Code.
2. Let it show you a plan.
3. Answer its questions, then let it build.
4. Check the "Done when" list before moving on.

Every prompt starts with the same line, so Claude Code reloads the context each time.

**Before you start**

- Create a Supabase project and a Vercel project linked to the GitHub repo.
- Install the Supabase CLI and Docker for local development.
- Copy `.env.example` to `.env.local` and fill it in.

---

## Phase 0 — Project setup

```
Read CLAUDE.md and every file in docs/ first. Then do Phase 0 from docs/BUILD_PLAN.md only.

Set up the project in this repo:
- Next.js (App Router) with TypeScript strict, Tailwind CSS and shadcn/ui, current stable versions.
- Fonts Outfit and Figtree via next/font; turmeric tokens from docs/DESIGN.md in app/globals.css, mapped to shadcn variables.
- Supabase SSR clients in lib/supabase (server, client, middleware) and middleware that refreshes the session and sends signed-out users to /login.
- `supabase init` for local dev. Keep supabase/migrations/0001_init.sql and supabase/seed.sql exactly as they are; run `supabase db reset` and generate types/database.ts.
- The app shell from docs/DESIGN.md: black sidebar with public/brand/turmeric-logo.png, ivory content area, phone layout. Placeholder pages for every route in docs/SPEC.md §14.
- ESLint, Vitest, Playwright, and the npm scripts listed in CLAUDE.md. Add @electric-sql/pglite as a dev dependency and an npm script "test:db" that runs `node supabase/tests/rls-smoke.mjs .`
- .env.example as provided; make sure .env.local is git-ignored.
Show me your plan before writing code. Stop when Phase 0 is done; don't start Phase 1.
```

**Done when**

- `npm run dev` shows the shell with the logo.
- `typecheck`, `lint`, `test` and `test:db` pass.
- `supabase db reset` runs clean.
- Types are generated.

---

## Phase 1 — Accounts, registration, departments

```
Read CLAUDE.md and every file in docs/ first. Then do Phase 1 from docs/BUILD_PLAN.md only.

Build accounts exactly as docs/SPEC.md §4 describes, matching docs/design/reference/NewUpdate.dc.html (signed-out states and the mentor's People & departments state):
- /register: full name, work email, password (min 6), department buttons from the departments table. Call supabase.auth.signUp with options.data { full_name, department: slug }. Then /register/pending with the mentor names for that department.
- /login with the error messages in §4 (pending and disabled accounts get their own message). Middleware blocks non-active accounts from app routes.
- /profile shows the department locked ("Set when you registered. Only a mentor can change it.").
- /mentor/people for mentors: New registrations (department select, Approve -> approve_registration, Decline -> decline_registration), Your people (Move to select, Save change -> change_department), Department change log from department_changes.
- Sidebar shows only the member's own department; mentors see their departments plus mentor links.
- Map RPC exceptions to friendly messages. Email sending can log to the console for now behind lib/email.ts (Resend comes in Phase 6).
Add Playwright: register -> mentor approves -> member signs in. Show me your plan first. Stop after Phase 1.
```

**Done when**

- A new person registers and can't sign in until approved.
- A mentor approves them, choosing the department.
- The member sees only their department.
- The mentor can move them, and the change log shows it.
- `test:db` and e2e tests pass.

---

## Phase 2 — Attendance

```
Read CLAUDE.md and every file in docs/ first. Then do Phase 2 from docs/BUILD_PLAN.md only.

Build attendance per docs/SPEC.md §5 and the Home attendance card in docs/design/reference/Main.dc.html:
- Home card states: not checked in -> Check in (office / WFH) -> checked in at time with On time/Late chip -> Check out -> done for today with worked time. Use the check_in and check_out RPCs (server time only).
- /attendance monthly calendar with P/L/W/H/A/leave chips and month totals.
- Add a new migration with a mark_leave(p_date date, p_note text) RPC: future or today only, no existing check-in, inserts status 'leave'. RLS stays read-only for attendance.
- Document the pg_cron schedule for close_day() (23:59 IST = 18:29 UTC) in README.
- Vitest for IST helpers and the late / half-day rules.
Show me your plan first. Stop after Phase 2.
```

**Done when**

- Check in, check out and leave all work.
- Late and half day are set correctly.
- The calendar shows the month.
- Tests pass.

---

## Phase 3 — Daily tasks (the core)

```
Read CLAUDE.md and every file in docs/ first. Then do Phase 3 from docs/BUILD_PLAN.md only.

Build /tasks per docs/SPEC.md §6, matching the member view in docs/design/reference/NewUpdate.dc.html:
- "Your department" banner with the lock line.
- Add-a-task form driven by the member's department: task_types for "Type of work"/"Category", departments.detail_label for the extra field (Location / Reference), project select where relevant, status Done / In progress. No hours field.
- Today's log: tiles (Tasks, Done, In progress), "Tasks by type" chips, task rows with status toggle and remove, "This week · tasks you logged" strip.
- "Send day to {mentor}" -> submit_day(). Show Sent for review / Approved / Sent back (with the mentor's note) states; when sent back, the day stays editable.
- Show mentor flags and notes on the member's tasks (task_reviews).
- Writes via Server Actions with Zod; RLS does the enforcement. Optimistic updates are fine.
Add Playwright: member adds two tasks, toggles one, sends the day. Show me your plan first. Stop after Phase 3.
```

**Done when**

- Each department sees its own form fields.
- A member can't post to another department, even by calling the API directly. `test:db` proves it.
- Edits lock after the day unless the day was sent back.

---

## Phase 4 — Mentor view (Overview + Task manager)

```
Read CLAUDE.md and every file in docs/ first. Then do Phase 4 from docs/BUILD_PLAN.md only.

Build /mentor per docs/SPEC.md §9, matching docs/design/reference/Mentor.dc.html:
- Tabs: Overview and Task manager (role="tablist").
- Overview: tiles, Review queue of submitted days with department filter pills, Approve / Send back (note required) via review_day, Not checked in list with Email reminder (rate-limited to one per person per day), Projects to watch, and the People & departments card linking to /mentor/people.
- Task manager: department and status filters, person filter chip, tiles, Task process (Logged -> Done -> Reviewed by you, with in-progress and flagged chips), Progress by department with type chips, "Tasks logged this week" grouped bar chart (Recharts), By person table (click to filter) with "Nothing logged yet today", All tasks in List and Board views with Mark reviewed (done tasks only) and Flag (optional note) writing to task_reviews.
- Add a migration with a view v_task_feed (security_invoker = on) joining daily_tasks, profiles, departments, task_types, projects and task_reviews, so RLS still applies; use it for the task manager queries.
- Mentors must never be able to edit task fields; prove with a test.
Show me your plan first. Stop after Phase 4.
```

**Done when**

- All numbers match the underlying rows.
- Filters combine correctly.
- Review and flag show up for the member.
- A mentor of Creative and Production never sees Finance data.

---

## Phase 5 — Projects and department pages

```
Read CLAUDE.md and every file in docs/ first. Then do Phase 5 from docs/BUILD_PLAN.md only.

Build projects per docs/SPEC.md §7 and department pages per §8, matching Creative.dc.html, Production.dc.html and Finance.dc.html in docs/design/reference:
- /projects list, /projects/new (name, client, brief, dates, priority, tag people from any department with department chips), /projects/[id] with tabs Overview, To-dos, Updates (daily tasks linked to the project), Files (private bucket project-files, 25 MB limit, links for big videos), Comments if time allows (new migration + RLS).
- /departments/[slug] with the visibility rule (members: own; mentors: theirs; admins: all) and the department-specific sections.
- Tagging notifies people (in-app); moving a project to review notifies the department's mentors.
Show me your plan first. Stop after Phase 5.
```

**Done when**

- A Creative member creates a project, tags someone from Production, and that person sees it.
- Files upload and download through signed links.
- Department pages respect visibility.

---

## Phase 6 — Notifications, email and scheduled jobs

```
Read CLAUDE.md and every file in docs/ first. Then do Phase 6 from docs/BUILD_PLAN.md only.

Implement docs/SPEC.md §12:
- Notification bell with unread count and /notifications; mark as read (only read_at is writable).
- Resend email in lib/email.ts with simple turmeric-branded templates (logo on black header, gold button).
- Server routes app/api/cron/reminder (18:30 IST = 13:00 UTC) and app/api/cron/digest (10:00 IST = 04:30 UTC), protected by CRON_SECRET, using the service role on the server only; schedule them in vercel.json.
- Emails for registration events, department changes, day sent back and task flagged.
- Document enabling pg_cron and scheduling close_day() in README.
Show me your plan first. Stop after Phase 6.
```

**Done when**

- Each email in §12 sends once, from the server only.
- Cron routes reject calls without the secret.

---

## Phase 7 — Reports, admin, launch

```
Read CLAUDE.md and every file in docs/ first. Then do Phase 7 from docs/BUILD_PLAN.md only.

- /reports per docs/SPEC.md §11 with Excel and PDF export.
- /admin pages per §13 using admin_set_role and admin_set_mentor_departments; settings and holidays editors.
- A script to load realistic demo data for a pilot (names from the reference designs), never run in production.
- Accessibility pass (keyboard, contrast, labels, 360 px), error states, empty states, loading states.
- Production checklist: environment variables on Vercel, Supabase auth redirect URLs, RLS advisors clean, backups on.
Show me your plan first.
```

**Done when**

- The pilot with the Creative team can start.
- Admins can run everything without SQL.

---

## Tips for working with Claude Code

- Start each session with the phase prompt. If you're continuing a phase, say "Continue Phase N from where we stopped; check git log first."
- Ask it to commit at the end of each step with a clear message, and to open a pull request per phase. Vercel gives each pull request a preview link.
- If it proposes changing the schema or a rule in CLAUDE.md, make it explain why first.
- After any migration, ask it to run `npm run test:db` and regenerate the types.
