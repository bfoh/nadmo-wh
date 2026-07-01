# NADMO-WMS — Interface Design System

**Product:** Warehouse & logistics command console for Ghana's National Disaster
Management Organisation. Coordinates relief stock across HQ / regional / district
warehouses. Users: Director-General, HQ Logistics, Regional Managers, District
Officers, Auditors — often under time pressure during an emergency.

## Direction & feel
**"Situation Room."** Command-center calm authority — mission control, not a
generic SaaS or a bright civic portal. Serious, legible, government-grade.
Light default with a full dark **"night operations"** mode. NADMO green is a
scarce identity accent; readiness status carries the meaning.

## Signature — the readiness rail
Status is spoken as **ready / strained / critical / info**, expressed as a thin
left-edge accent on cards and rows (plus the sidebar's active indicator). It maps
to the existing data language (`good` / `amber_stock` / `critical_stock`). Numbers
lead and are always tabular. Use `<Card tone="critical">` etc. to show it.

## Tokens (globals.css)
- **One slate hue, lightness only** across surfaces: canvas → card → popover → inset control. Never different hues per surface.
- **Sidebar = canvas hue** (`--sidebar` equals `--background`). A border, not a color, separates it.
- **Ink text tiers:** `text-ink` (primary) · `text-ink-muted` (secondary) · `text-ink-subtle` (tertiary) · `text-ink-faint` (metadata/labels). Don't use `gray-*` or raw hex.
- **Readiness utilities:** `bg-ready` / `text-ready` / `bg-ready-soft` / `text-ready-foreground` / `border-ready-border` (and `strained`, `critical`, `info`, `neutral`). These are the ONLY status colors — never Tailwind `red-500`/`amber-50` etc. (won't adapt to dark).
- **Controls are inset:** inputs use `bg-control` + `border-control-border` (darker than surface), signalling "type here".
- Identity: `--color-nadmo-green/-gold/-red` — used sparingly (login brand panel, logo emblem).

## Depth — ONE strategy
Layered surfaces + elevation utilities `elev-1` / `elev-2` / `elev-3` (defined via
`@utility`, so `hover:elev-2` works). Light = 1px ring + two soft depths; dark
collapses toward a ring (depth shadows don't read on dark). Cards use `elev-1`;
lift to `elev-2` on hover. Reach for whitespace/tonal shift before borders; borders
are low-opacity (`--border`), never solid hex.

## Typography
- Display/headings: **Space Grotesk** (`font-display`, applied to `h1–h3` + `CardTitle`), tracking `-0.02em`.
- Body/UI: **Geist Sans** (`font-sans`).
- Figures, codes, waybill/transfer numbers: **Geist Mono** (`font-mono`) + `.nums` (tabular).
- Hierarchy comes from **weight + color + size together**, not size alone. Labels: `text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-faint`. Hero figures: `font-display text-3xl font-semibold tracking-[-0.02em] nums`.

## Spacing & radius
- Base unit **4px**; card padding `--card-spacing` = 20px (16px for `size="sm"`).
- `--radius` = 0.75rem. Scale: inputs/buttons `rounded-md`, cards `rounded-xl`, modals larger. Concentric: child radius = parent − padding.

## Component patterns (values worth keeping)
- **Button** — default `h-9 · px-3.5 · rounded-md · 14px/500`; `lg` `h-10 · px-4`; icon `size-9`. Press feedback `active:scale-[0.98]`, ease `cubic-bezier(0.23,1,0.32,1)` 150ms. Primary hover darkens via `color-mix`. Default variant already carries `bg-primary` + `text-primary-foreground` — don't re-add color classes.
- **Input** — `h-9 · rounded-md · bg-control · border-control-border`, focus ring `ring-ring/40`.
- **Card** — `rounded-xl bg-card elev-1`; optional `tone` prop paints the readiness rail (`before:` left bar, 4px).
- **StatusBadge** — dot + label pill; every workflow/stock status resolves to one of five tones via `STATUS_TONE` map. Extend that map, don't hand-roll pill colors.
- **KPI tile** (`kpi-card.tsx`) — label (11px faint, top) · icon chip (top-right, tinted) · hero figure (3xl display, tabular) · description (tone-colored). `variant` (default/success/warning/critical) → readiness tone + rail.
- **Sidebar** — grouped sections (Operations / Oversight / Administration); active item = `bg-sidebar-accent text-ink` + 2px green left indicator + green icon. Width `w-64`.
- **Topbar** — `bg-background/80 backdrop-blur`, holds `ThemeToggle`; notification badge `bg-critical`.
- **Login** — split screen: `bg-nadmo-green-dark` brand panel (coordinate-grid texture, gold accents) + form column; mobile shows a compact brand lockup.
- **Empty states** — tinted round icon chip (`bg-ready-soft`/`bg-muted`) + primary line + `text-ink-subtle` sub-line. Not a lone faded icon.
- **Tables** — header `text-[11px] uppercase tracking-[0.08em] text-ink-faint font-semibold`; rows `border-border/70`, `hover:bg-muted/50`; numeric cells `text-right … nums`.

## Consistency rules
- No raw hex or Tailwind palette colors in components — only tokens. (Emblem SVG + PWA `themeColor` are the sole exceptions.)
- Any status color must be a readiness token so it adapts to dark mode.
- Dynamic numbers get `.nums`. Headings get the display font (automatic on `h1–h3`).
- Motion: `transform`/`opacity` only, <300ms, ease-out; respect `prefers-reduced-motion`.
