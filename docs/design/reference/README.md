# Reference screens

These are the approved screen designs, exported from the design canvas. Each file is a "Design Component" page.

- The HTML and inline styles show the exact layout, spacing, colours and copy.
- The `<script type="text/x-dc">` block at the bottom shows the interactions and sample data.
- They are not runnable on their own: they need the canvas runtime, `support.js`. Read them as the spec for how each screen looks and behaves, then build the real thing with Next.js, Tailwind and shadcn/ui.
- Image sources like `/_blob/24da…` point to the logo. Use `public/brand/turmeric-logo.png` instead.

| File | What it shows |
| --- | --- |
| `NewUpdate.dc.html` | The sign-in page with demo accounts, and registration with a department tag. Signed in as a member: the department-locked daily task log. Signed in as a mentor: the People & departments page (approve or decline new registrations, change a department, change log). |
| `Main.dc.html` | Member home: attendance card, today card, month strip, department card, projects, "Tagged you" |
| `Mentor.dc.html` | Mentor view. **Overview** tab: tiles, review queue, not checked in, projects to watch, People & departments card. **Task manager** tab: filters, tiles, process, department progress, week chart, by person, list and board. |
| `Creative.dc.html` | Creative department page: projects board with filters, a new-project form, today's updates, team today |
| `Production.dc.html` | Production page: shoot schedule tabs, deliverables, updates, team |
| `Finance.dc.html` | Finance page: expandable updates with task lines, work by category, projects tagging Finance, team |

Where a design and `docs/SPEC.md` disagree, the spec wins. The main known difference: tasks have no hours.
