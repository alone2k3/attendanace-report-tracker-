# Turmeric Work Tracker

Attendance, daily task logs and projects for turmeric's Finance, Production and Creative teams. Built with Next.js 16 (App Router), Tailwind CSS 4, Supabase (Postgres, Auth, Storage, RLS, pg_cron) and Resend, hosted on Vercel.

| Path | What it is |
| --- | --- |
| `CLAUDE.md` | Rules and conventions for working on the code |
| `docs/SPEC.md` | Behaviour (source of truth) |
| `docs/DESIGN.md` | Turmeric black-and-gold design system |
| `docs/BUILD_PLAN.md` | The phase plan this app was built from |
| `docs/design/reference/` | Approved screen designs |
| `supabase/migrations/` | Schema, RLS and RPCs (never edit an applied migration) |
| `supabase/tests/rls-smoke.mjs` | 83 security-rule checks |
| `tests/unit`, `tests/e2e` | Vitest and Playwright |
| `scripts/seed-demo.mjs` | Demo data for a local or pilot database |

## Run it locally

```bash
npm install
npx supabase start            # needs Docker; applies migrations + seed
cp .env.example .env.local    # fill in the values printed by `supabase status`
npm run dev
```

Load demo people (password `turmeric-demo`, mentor `arjun@demo.turmeric`):

```bash
SUPABASE_SERVICE_ROLE_KEY=<service role from supabase status> npm run seed:demo
```

## Checks

```bash
npm run lint
npm run typecheck
npm run test        # unit tests
npm run test:db     # 83 RLS checks in memory (PGlite)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres npm run test:db   # same checks on real local Supabase, rolled back
E2E_SUPABASE_URL=http://127.0.0.1:54321 E2E_SUPABASE_ANON_KEY=<publishable> E2E_SUPABASE_SERVICE_ROLE_KEY=<service role> npm run test:e2e
npm run gen:types   # after every migration
```

CI (`.github/workflows/ci.yml`) runs all of these on every push and pull request.

## Make yourself admin (after the first sign-up)

Run in the Supabase SQL editor:

```sql
update public.profiles
   set role = 'admin', status = 'active',
       department_id = (select id from public.departments where slug = 'creative')
 where email = 'you@yourcompany.com';
```

Then use **Admin → Users** to make mentors and **Admin → Mentors** to assign their departments. Everything else is done in the app.

## Scheduled jobs

| Job | When | How |
| --- | --- | --- |
| `close_day()` (missed check-outs, absences) | 23:59 IST = `29 18 * * *` UTC | pg_cron in Supabase (already scheduled on the hosted project) |
| Task reminder email + in-app | 18:30 IST = `0 13 * * *` UTC | Vercel Cron → `/api/cron/reminder` |
| Mentor digest email | 10:00 IST = `30 4 * * *` UTC | Vercel Cron → `/api/cron/digest` |

To schedule `close_day()` on a new project: enable **pg_cron** under Database → Extensions, then run
`select cron.schedule('close-day', '29 18 * * *', $$select public.close_day()$$);`

Cron routes need the header `Authorization: Bearer $CRON_SECRET`; Vercel adds it automatically when `CRON_SECRET` is set.

## Production checklist

1. **Supabase → Authentication → Sign In / Providers → Email:** turn **off** "Confirm email" (the mentor approval is the gate), *or* set up custom SMTP (Resend) under Authentication → Emails. The built-in mailer only sends to your Supabase team, so staff sign-ups fail without one of these.
2. **Supabase → Authentication → URL configuration:** Site URL = your Vercel URL; add `https://<your-domain>/**` to redirect URLs.
3. **Vercel → Project → Environment variables:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`, `TZ_APP=Asia/Kolkata`.
4. **Resend:** verify your sending domain and use it in `EMAIL_FROM`. Without `RESEND_API_KEY` the app logs emails instead of sending.
5. **Supabase advisors** (Database → Advisors): security should show only the intentional `SECURITY DEFINER` RPCs.
6. **Backups:** daily backups are on for paid plans; on the free plan, export regularly.
