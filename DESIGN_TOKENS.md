# Peergent Design Tokens — Project Black

The Peergent Design System is the visual and interaction foundation for every product surface. It is inspired by Linear, Stripe Dashboard, Raycast, Arc Browser, Apple, and Vercel — intelligent, calm, premium, and confident.

**Do not use:** generic Tailwind admin templates, Bootstrap, Material UI, neon cyberpunk, or heavy glassmorphism.

---

## Typography

**Font stack:** Geist Sans (`--font-geist-sans`) for UI, Geist Mono for code.

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| Display | 36–40px (`text-3xl md:text-4xl`) | 600 | Page titles |
| Heading 1 | 24px (`text-2xl`) | 600 | Section titles inside cards |
| Heading 2 | 18px (`text-lg`) | 600 | Subsections, modal titles |
| Body | 16px (`text-base`) | 400 | Descriptions, long copy |
| Body small | 14px (`text-sm`) | 400–500 | Labels, table cells, hints |
| Caption | 12px (`text-xs`) | 400–500 | Badges, metadata, table headers |

**Rules:**
- Use `tracking-tight` on headings 18px and above.
- Use `leading-6` or `leading-7` on body copy for readability.
- Primary text: `--pg-text-primary` / `text-white`.
- Secondary text: `--pg-text-secondary` / `text-slate-400`.
- Muted text: `--pg-text-muted` / `text-slate-500`.
- Accent text: `--pg-text-accent` / `text-violet-400`.

---

## Spacing

**Base unit: 8px.** All layout, padding, and gaps snap to the 8px grid.

| Token | Value | Tailwind equivalent |
|-------|-------|---------------------|
| `--pg-space-0` | 0px | `0` |
| `--pg-space-1` | 4px | `1` (half-step, micro only) |
| `--pg-space-2` | 8px | `2` |
| `--pg-space-3` | 12px | `3` |
| `--pg-space-4` | 16px | `4` |
| `--pg-space-5` | 20px | `5` |
| `--pg-space-6` | 24px | `6` |
| `--pg-space-8` | 32px | `8` |
| `--pg-space-10` | 40px | `10` |
| `--pg-space-12` | 48px | `12` |
| `--pg-space-16` | 64px | `16` |
| `--pg-space-20` | 80px | `20` |
| `--pg-space-24` | 96px | `24` |

**Common patterns:**
- Card padding: `p-5 md:p-6` (20–24px)
- Section gap between blocks: `space-y-6` or `space-y-8`
- Page header bottom margin: `mb-8` (32px)
- Form field gap: `gap-4` (16px)
- Button icon gap: `gap-2` (8px)

Programmatic access: `lib/ui/tokens.ts` → `spacing`.

---

## Radius

Soft, large corners — never sharp or tiny.

| Token | Value | Use |
|-------|-------|-----|
| `--pg-radius-sm` | 8px | Skeleton text, small chips |
| `--pg-radius-md` | 12px | Inputs, buttons (sm/md), tooltips |
| `--pg-radius-lg` | 16px | Buttons (lg), tabs container, avatars (md) |
| `--pg-radius-xl` | 24px | Cards, modals, empty states |
| `--pg-radius-2xl` | 32px | Hero panels (future) |
| `--pg-radius-full` | 9999px | Badges, progress bars, status dots |

---

## Colors

### Surfaces

| Token | Hex / value | Use |
|-------|-------------|-----|
| `--pg-bg-base` | `#030712` | App background |
| `--pg-bg-elevated` | `#0b1120` | Cards, modals, panels |
| `--pg-bg-subtle` | `#070b18` | Sidebar, inset areas |
| `--pg-bg-muted` | `rgba(255,255,255,0.03)` | Input backgrounds, hover fills |

### Accent

| Token | Value | Use |
|-------|-------|-----|
| `--pg-accent` | `#7c3aed` | Primary actions, focus rings |
| `--pg-accent-hover` | `#8b5cf6` | Primary button hover |
| `--pg-accent-muted` | `rgba(124,58,237,0.15)` | Accent backgrounds |

### Semantic

| Token | Use |
|-------|-----|
| `--pg-success` / muted | Active states, positive trends |
| `--pg-warning` / muted | Pending, caution |
| `--pg-danger` / muted | Errors, destructive actions |
| `--pg-info` / muted | Informational highlights |

### Gradients

Use sparingly — subtle only:
- Progress bar: `from-blue-500 to-violet-500`
- Avatar: `from-violet-500 to-blue-600`

Never use loud multi-stop gradients on large surfaces.

---

## Borders

| Token | Value | Use |
|-------|-------|-----|
| `--pg-border-subtle` | `rgba(255,255,255,0.06)` | Dividers inside cards |
| `--pg-border-default` | `rgba(255,255,255,0.10)` | Cards, inputs, tables |
| `--pg-border-strong` | `rgba(255,255,255,0.14)` | Emphasized containers |

**Rules:**
- Default border class: `border border-white/10`
- Hover lift: `hover:border-violet-500/25`
- Focus: `focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/20`
- Error: `border-red-500/40 focus:ring-red-500/20`

---

## Elevation

Shadows are soft and deep — never harsh drop shadows.

| Token | Value | Use |
|-------|-------|-----|
| `--pg-shadow-sm` | `0 1px 2px rgba(0,0,0,0.24)` | Tooltips, subtle lift |
| `--pg-shadow-md` | `0 8px 24px rgba(0,0,0,0.28)` | Elevated cards |
| `--pg-shadow-lg` | `0 16px 48px rgba(0,0,0,0.32)` | Modals, overlays |

Cards also use `backdrop-blur` lightly. Avoid stacking more than two elevation levels on one screen.

---

## Animations

### Durations

| Token | Value | Use |
|-------|-------|-----|
| `--pg-duration-fast` | 120ms | Hover color, row highlight |
| `--pg-duration-base` | 180ms | Buttons, borders, modals |
| `--pg-duration-slow` | 280ms | Progress bars, layout shifts |

### Easing

| Token | Curve | Use |
|-------|-------|-----|
| `--pg-ease-standard` | `cubic-bezier(0.4,0,0.2,1)` | Default transitions |
| `--pg-ease-enter` | `cubic-bezier(0,0,0.2,1)` | Fade-in, content reveal |
| `--pg-ease-emphasis` | `cubic-bezier(0.16,1,0.3,1)` | Modal scale-in |

### Keyframes

| Name | Effect |
|------|--------|
| `pg-fade-in` | Opacity + 4px upward translate |
| `pg-scale-in` | Opacity + scale 0.96 → 1 |
| `pg-spin` | Loader rotation |
| `pg-pulse-soft` | Subtle opacity pulse for skeletons |

Utility classes: `.pg-animate-in`, `.pg-spinner`, `.pg-pulse-soft`.

---

## Hover

Hover states should feel responsive but never flashy.

- **Buttons:** background shift + optional `active:scale-[0.98]`
- **Cards (interactive):** border tint to violet, slight background darken
- **Table rows:** `hover:bg-white/[0.02]`
- **Quick actions:** border + background lift, icon color to violet
- **Links:** color shift only — no underline animation unless in prose

Always pair hover with `transition-[…] duration-[var(--pg-duration-base)]`.

---

## Motion

**Philosophy:** Motion confirms intent; it never decorates.

- Enter: fade + slight translate or scale (max 4px / 4% scale)
- Exit: faster than enter (future — prefer unmount without animation for now)
- Loading: spinner or skeleton — never blocking spinners on full pages without context
- Status: `StatusBadge` pulse for live/active indicators only
- Respect `prefers-reduced-motion` in future page migrations (wrap in `@media` when applying globally)

---

## Grid

### Page layout

```
┌─────────────────────────────────────────┐
│ Sidebar (fixed) │ Main (flex-1)         │
│                 │  PageHeader           │
│                 │  Content grid         │
└─────────────────────────────────────────┘
```

- Main content max readable width: `max-w-7xl` for dashboards
- Metric grids: `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4`
- Two-column sections: `grid grid-cols-1 lg:grid-cols-2 gap-6`
- Card internal layout: flex with `gap-4` (16px)

### Gutters

- Mobile: `px-4` (16px)
- Tablet+: `px-6` or `px-8` (24–32px)

---

## Responsive rules

| Breakpoint | Behavior |
|------------|----------|
| `< sm` (default) | Single column, stacked headers, full-width buttons |
| `sm` | 2-column metric grids |
| `md` | Increased card padding, larger page titles |
| `lg` | PageHeader actions beside title, 2-column layouts |
| `xl` | 3–4 column metric grids |

**Rules:**
- Never hide critical actions on mobile — stack instead.
- Tables scroll horizontally inside `overflow-x-auto` wrappers.
- Modals: `max-h-[90vh]` with scrollable body, `p-4` viewport inset.

---

## Interaction philosophy

1. **One primary action per context** — violet filled button.
2. **Secondary actions** — ghost or secondary bordered button.
3. **Destructive actions** — danger variant, never primary placement.
4. **Feedback is immediate** — loading states on buttons, skeletons for content.
5. **Empty states guide** — always offer a next step.
6. **Density is low** — prefer whitespace over cramming.

---

## Animation philosophy

- Duration under 300ms for UI feedback.
- No bounce, no elastic, no parallax.
- Stagger lists only when ≤ 6 items (future).
- Progress and timeline communicate process — not decoration.

---

## Accessibility rules

- All interactive elements: visible `focus-visible:ring-2` states.
- Form fields: associated `<label>` via `htmlFor` / `id`.
- Modals: `role="dialog"`, `aria-modal`, Escape to close, body scroll lock.
- Progress: `role="progressbar"` with `aria-valuenow`.
- Loaders: `role="status"` with `aria-label`.
- Tooltips: `role="tooltip"`, `aria-describedby` on trigger.
- Color is never the only signal — pair status colors with labels.
- Minimum touch target: 44px height for primary actions (`h-11` buttons).

---

## Component naming conventions

| Rule | Example |
|------|---------|
| PascalCase file and export | `MetricCard.tsx` → `MetricCard` |
| Barrel export from `components/ui/index.ts` | `import { Button } from "@/components/ui"` |
| Props type suffix `Props` | `ButtonProps`, `CardProps` |
| Variants as string unions | `"primary" \| "secondary"` |
| No page-specific components in `ui/` | Use `components/dashboard/` for page composites |
| Prefix CSS variables with `--pg-` | `--pg-radius-md` |
| Prefix animation classes with `pg-` | `pg-animate-in` |

**Composition over configuration:** prefer `children` and slots (`action`, `footer`, `leftIcon`) over dozens of boolean props.

---

## File reference

| Location | Purpose |
|----------|---------|
| `app/globals.css` | CSS custom properties, keyframes, body defaults |
| `lib/ui/tokens.ts` | JS spacing/radius/duration constants |
| `lib/ui/cn.ts` | Class name helper |
| `components/ui/` | Reusable primitives |
| `components/ui/README.md` | When to use each component |
