# Peergent Motion Design — Project Aurora

A premium 2026 interaction language inspired by **Apple**, **Linear**, **Arc**, and **Raycast**.

Motion confirms intent. It never decorates. Every animation answers: *“What just changed, and why should I trust it?”*

**Runtime source of truth:** `app/globals.css` CSS variables  
**JS constants:** `lib/ui/motion.ts`  
**Class recipes:** `lib/ui/interaction.ts`

---

## Philosophy

| Principle | Rule |
|-----------|------|
| **Purposeful** | Animate state changes, not static layout |
| **Fast** | UI feedback ≤ 280ms; sequences ≤ 480ms total |
| **Subtle** | Max 4px translate, max 2% scale, max 2px hover lift |
| **Calm** | No bounce, elastic, parallax, or decorative loops |
| **Accessible** | Respect `prefers-reduced-motion` — all Aurora classes disable motion |
| **Honest** | Loading shows shape (skeleton), not blank spinners on content areas |

---

## Durations

| Token | Value | Use |
|-------|-------|-----|
| `--pg-duration-instant` | 80ms | Micro opacity ticks, number settle |
| `--pg-duration-fast` | 120ms | Hover color, border tint, link color |
| `--pg-duration-base` | 200ms | Buttons, focus rings, surface transitions |
| `--pg-duration-slow` | 280ms | Reveals, section enter, success flash |
| `--pg-duration-slower` | 400ms | Scroll-triggered sections, modal emphasis |
| `--pg-duration-sequence` | 480ms | Skeleton shimmer loop period |

**Rule:** Exit animations (future) should be ~25% faster than enter.

---

## Easing

| Token | Curve | Use |
|-------|-------|-----|
| `--pg-ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default — hover, borders, opacity |
| `--pg-ease-enter` | `cubic-bezier(0, 0, 0.2, 1)` | Content appearing — fade-in, reveal |
| `--pg-ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Content leaving (future) |
| `--pg-ease-emphasis` | `cubic-bezier(0.16, 1, 0.3, 1)` | Modals, section enter, success |
| `--pg-ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Reserved — micro delight only (never large surfaces) |

Linear and Raycast favor **ease-out enters**. Apple HIG recommends avoiding dramatic curves for functional UI.

---

## Hover distances

| Property | Value | Notes |
|----------|-------|-------|
| `--pg-hover-lift` | **2px** | Cards, inset groups, interactive tiles |
| Active press | `scale(0.98)` | Buttons, tappable rows |
| Active press (cards) | `scale(0.995)` | Larger surfaces — less dramatic |

**Do not exceed 4px lift.** Raycast and Linear use near-imperceptible movement.

Use `hoverLift` from `lib/ui/interaction.ts` or `.pg-hover-lift` utility class.

---

## Opacity transitions

| State | Opacity | Use |
|-------|---------|-----|
| Hidden | `0` | Pre-reveal, unmounted |
| Muted | `0.55` | Presence pulse trough, disabled-adjacent |
| Visible | `1` | Default content |

**Fade pattern:** opacity 0 → 1 with optional 4px `translateY` (`--pg-reveal-offset-y`).

**Border hover:** opacity shift on `border-white/[0.06]` → `[0.14]`, not color jumps.

---

## Loading philosophy

1. **Skeleton over spinner** for content-shaped areas (lists, cards, paragraphs).
2. **Spinner only** for indeterminate actions (button loading, inline refresh).
3. **Shimmer** (`Skeleton shimmer`) for premium rows — one slow pass, not aggressive pulse.
4. **Never block** the full viewport without context — always show page chrome.
5. **Presence modes** communicate *what* is loading:
   - `thinking` — intelligence forming
   - `watching` — monitoring for signal
   - `waiting` — blocked on user input
   - `live` — connected stream
   - `ready` — stable

Use `<ThinkingState>` for inline AI cognition; `<SystemState>` when context/timestamp is needed.

---

## Sequencing philosophy

Inspired by Apple's staged reveals and Linear's list mount:

| Rule | Value |
|------|-------|
| Stagger step | **60ms** (`--pg-stagger-step`) |
| Max staggered items | **8** — rest share last delay |
| Initial delay | 0–120ms — first paint should feel instant |
| Chapter sections | 0ms or scroll-triggered — never cascade entire pages |

**Use `<FadeSequence>`** for ≤ 8 list items or metric tiles.  
**Use `<SurfaceReveal delay={n}>`** for individual blocks.  
**Use `<SectionTransition revealOnScroll>`** for below-fold sections on marketing/feature pages.

**Do not stagger:** forms, tables, navigation, or the Overview briefing (already narrative-ordered).

---

## Component map

| Component | Role |
|-----------|------|
| `SurfaceReveal` | Single block enter — fade + translate |
| `FadeSequence` | Stagger children on mount |
| `SectionTransition` | Section enter; optional scroll reveal |
| `PresenceIndicator` | Live dot — mode-driven animation |
| `ThinkingState` | AI cognition label + presence dot |
| `AnimatedNumber` | Count-up metrics with ease-out cubic |
| `PremiumDivider` | Gradient hairline — horizontal, vertical, labeled |
| `Skeleton shimmer` | Premium loading surface |

---

## CSS utility classes

| Class | Effect |
|-------|--------|
| `.pg-animate-in` | Legacy fade-in (4px up) |
| `.pg-surface-reveal-up` | Aurora reveal from below |
| `.pg-surface-reveal-down` | Aurora reveal from above |
| `.pg-section-enter` | Slower emphasis enter |
| `.pg-hover-lift` | 2px hover lift + press reset |
| `.pg-border-highlight` | Border/background hover |
| `.pg-focus-premium` | Violet focus ring with offset |

---

## Success feedback

After a confirmed action:

1. Brief scale + opacity flash (`pg-success-flash`, 280ms, emphasis easing)
2. Optional emerald border tint on the affected row
3. Never auto-dismiss critical confirmations — inline success only

Use `successFeedback` from `lib/ui/interaction.ts` on the affected element.

---

## Empty-state language

Empty states **guide**, never blame:

- Title: what is missing (neutral)
- Description: one sentence on why it matters
- Action: single primary next step

Tone matches Chief of Staff voice — "I cannot observe X yet" not "No data found."

Use `<EmptyState tone="inspire">` for first-run; default tone for zero-result search.

---

## Integration status

**Foundation only.** Aurora primitives are exported from `@/components/ui` but not yet applied to Overview or feature pages. Migrate page-by-page in future phases.

---

## File reference

| File | Purpose |
|------|---------|
| `MOTION_DESIGN.md` | This guide |
| `AURORA_UI_AUDIT.md` | Inconsistency audit — fix in dedicated passes |
| `app/globals.css` | Keyframes, CSS variables, utility classes |
| `lib/ui/motion.ts` | JS duration/easing/stagger constants |
| `lib/ui/interaction.ts` | Composable Tailwind class recipes |
