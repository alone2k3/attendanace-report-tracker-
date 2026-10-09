# Design guide — turmeric black and gold

The look comes from the turmeric logo: glittering turmeric gold on black.

- The app uses a **black sidebar** with the logo.
- Content sits on a **warm ivory** page with white cards.
- **Gold** marks the main action on each screen.
- The approved screens are in `docs/design/reference/` (see the README there).

## Logo

- `public/brand/turmeric-logo.png`: cropped, on black. Use it in the sidebar at 150 px wide and on the sign-in panel at 240 px.
- `public/brand/turmeric-logo-original.png`: the original square file.
- Always place the logo on pure black (`#000000`). It has a black background.

## Colour tokens

### Brand

| Token | Hex | Use |
| --- | --- | --- |
| `ink` | #000000 | Sidebar, sign-in panel, dark stat tiles |
| `ink-soft` | #14110A | Headings, dark buttons, selected pills |
| `text` | #3B3426 | Body text |
| `muted` | #6B6250 | Secondary text, captions (passes 4.5:1 on ivory and white) |
| `ivory` | #FAF6EC | Page background |
| `card` | #FFFFFF | Cards |
| `line` | #E9E1CC | Card borders |
| `line-soft` | #F0E9D6 | Row dividers inside cards |
| `field` | #FFFDF7 | Input background |
| `field-line` | #DCD2B8 | Input and secondary-button borders |
| `gold` | #C9A23F | Primary buttons (black text), accents, progress fills |
| `gold-light` | #F0CF6E | Gold text on black (numbers in dark tiles, active nav) |
| `gold-deep` | #7A5C0E | Links on light backgrounds |
| `gold-tint` | #F6EDCF | Gold chips; text on it #6E5410 |
| `nav-active` | #2A2311 | Active sidebar item background |
| `nav-text` | #E9E1CC | Sidebar links |
| `nav-label` | #8E8366 | Sidebar section labels |
| `segmented` | #F1EADA | Background of tab and segmented controls |

### Departments

Each department has a fill, a tint, text to use on the tint, and a dot colour for black backgrounds.

| Department | Fill | Tint | Text on tint | Dot on black | Icon on fill |
| --- | --- | --- | --- | --- | --- |
| Creative | #C9A23F | #F6EDCF | #6E5410 | #D9B24A | black |
| Production | #D9692B | #FBE6D8 | #9A3F0E | #E07A3A | black |
| Finance | #5E7F35 | #E6EFD9 | #3E5A1E | #8DB05A | white |

Colours always come with a text label (a chip or name), never colour alone.

### Status

| Meaning | Background | Text |
| --- | --- | --- |
| Present, done, approved, reviewed | #E3EFE5 | #1F5F37 |
| Late, pending, needs changes | #FBEBD0 | #7A4A00 |
| Work from home, in review | #E1ECF7 | #1F4F82 |
| Leave, holiday, planning | #EFEBE1 | #5F5848 |
| Absent, not in yet, flagged | #F8E1DE | #8C2A20 |
| In progress | #F6EDCF | #6E5410 |

## Type

- **Outfit** (500, 600, 700) for headings and big numbers. **Figtree** (400, 500, 600) for everything else. Load both with `next/font/google`.

| Use | Font and size |
| --- | --- |
| Page title (H1) | Outfit 34 / 600, letter-spacing −0.01em |
| Section title (H2) | Outfit 20–22 / 600 |
| Big number in tiles | Outfit 28–40 / 600 |
| Body | Figtree 15 |
| Secondary | 13–14 |
| Captions | 12 |
| Small uppercase labels | 11–12, letter-spacing 0.14em, colour `muted` (`nav-label` in the sidebar) |

## Shape and spacing

- **Radius:**
  - cards 18;
  - stat tiles 14–18;
  - buttons and inputs 12;
  - sidebar items 10;
  - chips and pills 999.
- **Spacing:**
  - page padding 32 px top, 40 px sides (16 px on phones);
  - gaps between sections 24–28;
  - inside cards 22–24.
- No shadows and no gradients. Cards use a 1 px `line` border.
- Content `max-width` is 1160 px.

## Tailwind / shadcn setup

Put the tokens in `app/globals.css` and map them to shadcn's variables.

```css
@theme {
  --color-ink: #000000;
  --color-ink-soft: #14110A;
  --color-text: #3B3426;
  --color-muted: #6B6250;
  --color-ivory: #FAF6EC;
  --color-card: #FFFFFF;
  --color-line: #E9E1CC;
  --color-line-soft: #F0E9D6;
  --color-field: #FFFDF7;
  --color-field-line: #DCD2B8;
  --color-gold: #C9A23F;
  --color-gold-light: #F0CF6E;
  --color-gold-deep: #7A5C0E;
  --color-gold-tint: #F6EDCF;
  --color-creative: #C9A23F;
  --color-creative-tint: #F6EDCF;
  --color-creative-ink: #6E5410;
  --color-production: #D9692B;
  --color-production-tint: #FBE6D8;
  --color-production-ink: #9A3F0E;
  --color-finance: #5E7F35;
  --color-finance-tint: #E6EFD9;
  --color-finance-ink: #3E5A1E;
  --radius-card: 18px;
  --radius-control: 12px;
}
:root {
  --background: #FAF6EC;
  --foreground: #3B3426;
  --primary: #C9A23F;
  --primary-foreground: #000000;
  --secondary: #FFFFFF;
  --secondary-foreground: #14110A;
  --muted-foreground: #6B6250;
  --border: #E9E1CC;
  --input: #DCD2B8;
  --ring: #C9A23F;
  --radius: 12px;
}
```

That block is written for Tailwind v4's `@theme`. If the project uses Tailwind v3, put the same values under `theme.extend.colors` instead.

Department colours come from the `departments.color` column for fills. Keep the tint, text and dot values in a small map in `lib/departments.ts`, keyed by slug.

## Layout

- **App shell:**
  - The black sidebar (`flex: 1 1 240px`) has:
    - the logo;
    - a small "Work tracker" label;
    - sections Me / My department / Mentor;
    - the user card and Sign out at the bottom.
  - The content (`flex: 999 1 560px`) sits to its right.
  - On phones the sidebar wraps above the content. A sheet menu behind a button is also fine.
- **Sidebar visibility:**
  - Members see only **their own** department link, with the note "Other departments' logs are private to their teams and mentors."
  - Mentors see their departments plus Mentor view and People & departments.
- **Page header:**
  - breadcrumb (13–14, muted);
  - H1;
  - a one-line description;
  - actions on the right (secondary, then primary).
- A "Sample data" dashed chip appears only in the design references. Don't ship it.

## Components

- **Buttons:**
  - Primary: gold fill, black text, 700.
  - Secondary: white with a `field-line` border.
  - Dark: `ink-soft` fill, ivory text.
  - Text links: `gold-deep`, underlined.
  - All buttons at least 44 px tall (48–50 for main actions).
- **Pills and segmented controls:**
  - Selected: `ink-soft` fill, ivory text.
  - Unselected: white with a `field-line` border.
  - Segmented controls (Overview / Task manager, List / Board) sit on a `segmented` track.
- **Stat tile:**
  - The first tile in a row is dark: black, a `gold-light` number and an ivory label.
  - The others are white.
  - Optional small "of 12" suffix in muted.
- **Department banner** (on Daily tasks):
  - 2 px `ink-soft` border, department icon tile, "Your department" label and name;
  - a lock icon with "Tagged when you registered. You can only post to {dept}, and only a mentor can change your department."
- **Chips:** department chips (tint + text on tint), status chips (status table), count chips ("Design · 2").
- **Task row:** time, title (600) + meta line (muted), status toggle chip, remove icon button.
- **Person row** (mentor):
  - avatar in the department tint with initials, name and department;
  - right-aligned numbers;
  - the selected row gets a #FFF4D6 background.
- **Progress:** thin bars on a #EFE7D2 track with a gold or department fill. Segmented bars on project cards.
- **Charts:** Recharts grouped bars with department fills, small value labels above the bars, and the today label in bold.
- **Icons:** 20 px stroke icons (lucide-react fits). Never emoji.

## Screens and their reference files

| Screen | Route | Reference file |
| --- | --- | --- |
| Sign in, register, pending | /login, /register, /register/pending | `NewUpdate.dc.html` (signed-out states) |
| Daily tasks | /tasks | `NewUpdate.dc.html` (sign in as a member) |
| People & departments | /mentor/people | `NewUpdate.dc.html` (sign in as Arjun) and the card in `Mentor.dc.html` |
| Home | /dashboard | `Main.dc.html` |
| Mentor view (Overview + Task manager) | /mentor | `Mentor.dc.html` |
| Creative page | /departments/creative | `Creative.dc.html` |
| Production page | /departments/production | `Production.dc.html` |
| Finance page | /departments/finance | `Finance.dc.html` |

Two parts of the reference designs are out of date:

- The Home and Finance references still mention hours in a few places. **Tasks have no hours**, so show counts instead.
- The Home "Daily update" card becomes a "Today's tasks" card linking to /tasks.

## Accessibility

- Text contrast is at least 4.5:1. All the token pairs above pass. Don't put gold text on white; use `gold-deep`.
- Use real `<button>`, `<a href>`, `<label>` and `<select>` elements.
- Icon-only buttons get an `aria-label`.
- Tabs use `role="tablist"`. Toggles use `aria-pressed`.
- Errors use `role="alert"` and say what to do next.
- Everything works with the keyboard and at 360 px wide.
