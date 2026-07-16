# Peergent UI Components

Reusable primitives for Project Black. Import from `@/components/ui`.

**Do not put page-specific layouts here.** Compose these primitives in route-level or feature components (`components/dashboard/`, `components/peer-detail/`, etc.).

See `DESIGN_TOKENS.md` for typography, spacing, color, motion, and accessibility rules.

---

## Button

**When to use:** Any clickable action — form submit, modal confirm, navigation trigger, inline action.

**Variants:**
- `primary` — one main action per section (violet fill)
- `secondary` — alternate actions (bordered)
- `ghost` — tertiary / toolbar actions
- `danger` — delete, remove, irreversible actions

**Sizes:** `sm` (compact rows), `md` (default), `lg` (hero CTAs).

**Props:** `loading`, `leftIcon`, `rightIcon` — use `loading` instead of disabling without feedback.

**Do not use for:** Navigation that should be a link (use `<a>` or Next.js `Link` styled separately), or card-sized click targets (use `ActionCard` or `QuickAction`).

---

## Card

**When to use:** Generic content container — wraps any grouped UI.

**Variants:**
- `default` — static panel
- `elevated` — slightly stronger shadow for emphasis
- `interactive` — clickable card with hover border

**Padding:** `none` | `sm` | `md` (default) | `lg`.

**Do not use for:** Full-page sections with title + action bar (use `Section`), or KPI display (use `MetricCard`).

---

## MetricCard

**When to use:** A single KPI or stat — label, large value, optional trend or hint.

**Example contexts:** dashboard metrics, completion percentages, counts.

**Do not use for:** Multi-field summaries, lists, or actions — those belong in `Card` + custom content.

---

## Section

**When to use:** A titled block inside a page — card with header row (title, description, optional action) and body.

**Example contexts:** "AI Workforce", "Recent activity", settings groups.

**Do not use for:** Page-level title (use `PageHeader`), or untitled content (use `Card`).

---

## PageHeader

**When to use:** Top of every page — eyebrow, title, description, action buttons.

**Example contexts:** `/peers`, `/knowledge`, `/website-intelligence`.

**Do not use for:** In-card headings (use `Section` or plain `h2`).

---

## Badge

**When to use:** Static label — category, tag, version, "Demo" label.

**Variants:** `default`, `accent`, `success`, `warning`, `danger`, `neutral`.

**Do not use for:** Live system status (use `StatusBadge`).

---

## StatusBadge

**When to use:** Entity or process status — peer active/inactive, job pending, sync error.

**Statuses:** `active`, `inactive`, `pending`, `success`, `warning`, `error`.

**Props:** `pulse` for live/active indicators.

**Do not use for:** Non-status tags like "Beta" or "Pro" (use `Badge`).

---

## Avatar

**When to use:** Represent a peer, user, or entity — initials or icon in a gradient square.

**Sizes:** `sm`, `md` (default), `lg`.

**Do not use for:** Generic icons without identity context (use inline icon in `ActionCard`).

---

## Progress

**When to use:** Determinate completion — data completeness, upload progress, onboarding steps.

**Props:** `value` (0–100), optional `label`, `showValue`.

**Do not use for:** Indeterminate loading (use `Loader` or `Skeleton`).

---

## Timeline

**When to use:** Chronological events — activity feed, analysis steps, audit log.

**Items:** `title`, `description`, `timestamp`, optional `icon`, `tone`.

**Do not use for:** Simple bullet lists or navigation menus.

---

## EmptyState

**When to use:** Zero-data scenarios — no peers, no search results, empty knowledge base.

Always provide `title` and preferably `action` with a clear next step.

**Do not use for:** Error states (use error copy + retry button in a `Card`), or loading (use `Skeleton`).

---

## Input

**When to use:** Single-line text, email, URL, password, number fields.

**Props:** `label`, `hint`, `error`, `leftIcon`, `rightIcon`.

**Do not use for:** Multi-line text (`Textarea`), or dropdowns (`Select`).

---

## Textarea

**When to use:** Multi-line text — objectives, descriptions, notes.

**Do not use for:** Single-line fields (`Input`).

---

## Select

**When to use:** Choose one option from a predefined list — status, role, sort order.

**Do not use for:** Binary toggles (future Switch component), or searchable multi-select (future Combobox).

---

## Modal

**When to use:** Focused overlay task — create/edit forms, confirmations, detail previews.

**Props:** `open`, `onClose`, `title`, `description`, `children`, `footer`, `size`.

Pass custom `footer` to replace default Cancel. Closes on Escape and backdrop click.

**Do not use for:** Full-page flows (use dedicated routes), or hover content (use `Tooltip`).

---

## Skeleton

**When to use:** Loading placeholder matching content shape — text lines, rectangles, circles.

**Variants:** `text`, `rectangular`, `circular`.

**Do not use for:** Button loading (use `Button loading`), or indeterminate spinners on small areas (`Loader`).

---

## Loader

**When to use:** Indeterminate spinner — button loading, inline refresh, small pending areas.

**Sizes:** `sm`, `md`, `lg`.

**Do not use for:** Full-page loading layouts (compose multiple `Skeleton`s instead).

---

## Tooltip

**When to use:** Supplementary hint on hover/focus — icon explanations, truncated labels.

Keep content short (one line preferred).

**Do not use for:** Required reading, forms, or mobile-primary UI (tooltips fail on touch).

---

## Table

**When to use:** Tabular data — peer lists, conversation logs, analytics rows.

Define `columns` with `header` and `cell` render functions. Handles empty state via `emptyMessage`.

**Do not use for:** Card grids, kanban boards, or ≤ 2 columns of simple key-value pairs.

---

## Tabs

**When to use:** Switch between related views on the same page — Overview / Settings, List / Grid.

Controlled component: `value` + `onChange`.

**Do not use for:** Primary navigation (use sidebar), or more than ~5 tabs (consider sub-routes).

---

## ActionCard

**When to use:** Prominent clickable tile — feature discovery, module entry, "Analyze website" style CTAs.

Optional `onClick` makes the card interactive. Include `icon`, `title`, `description`, optional `action` slot.

**Do not use for:** Simple list rows (use `QuickAction`), or static info (use `Card`).

---

## QuickAction

**When to use:** Compact shortcut row — sidebar-adjacent actions, command palette items, settings links.

Supports `onClick` or `href`.

**Do not use for:** Large marketing tiles (`ActionCard`), or primary form buttons (`Button`).

---

## Import examples

```tsx
import {
  Button,
  Card,
  PageHeader,
  Section,
  MetricCard,
  EmptyState,
} from "@/components/ui";
```

```tsx
import Button from "@/components/ui/Button";
```

Both patterns are valid. Prefer the barrel import for pages composing many primitives.

---

## Project Aurora (interaction foundation)

Premium 2026 interaction primitives — **foundation only**, not yet integrated into Overview.

See `MOTION_DESIGN.md` for durations, easing, sequencing, and loading philosophy.

| Component | When to use |
|-----------|-------------|
| `SurfaceReveal` | Single block mount animation — fade + 4px translate |
| `FadeSequence` | Stagger ≤8 children on mount (lists, metric tiles) |
| `SectionTransition` | Section enter; optional scroll-triggered reveal |
| `AnimatedNumber` | KPI count-up when value changes |
| `PremiumDivider` | Gradient hairline — plain, labeled, or vertical |
| `ThinkingState` | Inline AI cognition — presence dot + label + optional detail |
| `PresenceIndicator` | Status dot only — use inside ThinkingState or SystemState |

**Interaction recipes:** `lib/ui/interaction.ts` — `hoverLift`, `borderHighlight`, `focusPremium`, `skeletonSurface`, `successFeedback`.

**CSS utilities:** `.pg-hover-lift`, `.pg-border-highlight`, `.pg-focus-premium`, `.pg-surface-reveal-up`.

**Do not use Aurora primitives for:** business logic, layout redesign, or Overview migration until a dedicated integration phase.

