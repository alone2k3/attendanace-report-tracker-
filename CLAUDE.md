# Turmeric Work Tracker — guide for Claude Code

An internal web app for turmeric's Finance, Production and Creative departments.

- People check in and out each day.
- People log their daily tasks in their own department's log.
- The Creative team runs projects and tags people from any department.
- Mentors monitor, review and flag work.
- Admins manage settings.

**Read these before writing code, every session:**

1. `docs/SPEC.md`: what to build. This is the source of truth for behaviour.
2. `docs/DESIGN.md`: how it looks (turmeric black and gold).
3. `docs/BUILD_PLAN.md`: the order to build in. Do one phase at a time.
4. `supabase/migrations/0001_init.sql`: the schema, row-level security and RPCs. Build on it; don't redesign it.
5. `docs/design/reference/`: the approved screen designs. Use them for layout, copy and interactions.

When a request conflicts with these files, ask before changing direction.

## Stack

- **Next.js** (App Router) + **TypeScript** in strict mode.
- **Tailwind CSS** + **shadcn/ui**.
- **Supabase**: Postgres, Auth (email + password), Storage, row-level security, Edge Functions, pg_cron.
- **Vercel** hosting. Pushes to `main` deploy to production, and each pull request gets a preview URL.
- **Resend** for email (reminders, digests, account notices).
- Libraries:
  - React Hook Form + Zod for forms.
  - TanStack Table for tables.
  - Recharts for charts.
  - date-fns + date-fns-tz for dates.
  - SheetJS and jsPDF for exports.
- Install current stable versions. Check each library's docs rather than assuming an API from memory.

## Commands

Phase 0 creates these:

```
npm run dev          # local app
npm run build        # production build
npm run lint
npm run typecheck    # tsc --noEmit
npm run test         # vitest
npm run test:e2e     # playwright
supabase start       # local Supabase
supabase db reset    # re-run migrations + seed locally
supabase gen types typescript --local > types/database.ts   # = npm run gen:types
npm run test:db      # RLS checks (PGlite); set DATABASE_URL to run them on local Supabase
npm run seed:demo    # demo data, local/pilot only
```

## Folder layout

```
app/
  (auth)/login, register, register/pending
  (app)/dashboard, tasks, attendance, projects, projects/new, projects/[id],
        departments/[slug], notifications, profile
  mentor/            overview (tabs: Overview, Task manager), people
  admin/             users, departments, mentors, settings
  reports/
  api/cron/          reminder, digest (called by Supabase cron or Vercel cron)
components/ui/       shadcn components
components/<feature>/  attendance, tasks, projects, mentor, people, charts, layout
lib/supabase/        server.ts, client.ts, middleware.ts
lib/                 dates.ts (IST helpers), permissions.ts, email.ts, validations/
supabase/migrations/ timestamped SQL, never edit one that has been applied
supabase/seed.sql
types/database.ts    generated, never hand-written
docs/
```

## Rules that must never break

1. **Security lives in the database.** Every table has row-level security (RLS). Hiding a button is never the protection.
   - The service-role key is used only in cron/email server routes and Edge Functions.
   - It is never used in browser code or in request handlers acting for a user.
2. **A department is set once and only a mentor can change it.**
   - A person picks a department tag when they register.
   - A mentor of that department confirms or corrects it before the account becomes active.
   - After that, only a mentor (or admin) can change it, through the `change_department` RPC.
   - Clients can never write `profiles.department_id`, `role` or `status` directly; column grants block it.
3. **Members post tasks only to their own department.** RLS enforces `department_id = my_department()`.
4. **Mentors read, review and flag tasks in their departments. They never edit a member's task.**
5. **Tasks have no hours field.** Worked time comes only from attendance check-in and check-out.
6. **Time:** store `timestamptz` in UTC. Work days are calendar dates in `Asia/Kolkata`. Show everything in IST.
7. **Reminders go by email.** No WhatsApp for now.
8. **Visibility follows the role:**
   - Members see only their own department in navigation and data.
   - Mentors see their assigned departments.
   - Admins see everything.
9. **Mobile-first.** Every screen works at 360 px wide; people post from their phones.
10. **Accessible.** Use real `<button>`, `<a>` and `<label>` elements, keep touch targets at least 44 px, and keep text contrast at least 4.5:1.

## Conventions

- Server Components by default. Use Client Components only where there's interaction.
- Writes go through Server Actions. Validate input with Zod on the server, then either call Supabase with the user's session or call an RPC. Department, review and attendance changes always use their RPCs.
- Supabase clients come from `lib/supabase/*`. Middleware refreshes the session and sends signed-out users to `/login`.
- Use the generated types in `types/database.ts`. Re-generate them after every migration.
- Write a new migration for every schema change. Name it with a timestamp. Include RLS policies in the same migration as the table.
- Copy is plain, short and in sentence case. Dates look like "Fri, 9 Oct" and times like "9:52 AM".
- Feature components live in `components/<feature>`. Keep files under about 200 lines.
- Errors show a human message. Never show raw Postgres errors to users; map RPC exceptions to friendly text.

## Tests

- **Unit (Vitest):** IST date helpers, attendance rules (late, half day), task grouping and counts.
- **Database:** SQL tests that prove the rules above, run against local Supabase. At minimum:
  - A member cannot insert a task into another department.
  - A member cannot update their own `department_id`, `role` or `status`.
  - A mentor cannot update a member's task title.
  - A mentor of Creative cannot read Finance tasks.
  - A pending account cannot insert tasks.
- **End-to-end (Playwright) smoke paths:**
  - Register, mentor approves, member signs in and posts a task.
  - Mentor reviews and flags a task.
  - Member checks in and out.

## Definition of done for each phase

- `typecheck`, `lint` and all tests pass.
- Matches the reference design and works at 360 px.
- No console errors, no RLS bypasses, no secrets in code.
- `docs/` is updated if behaviour changed.

## Don't

- Don't add WhatsApp, hours-per-task or payroll.
- Don't let any client choose or change a profile's department.
- Don't put the service-role key in client code or `NEXT_PUBLIC_*` variables.
- Don't commit `.env.local`.
