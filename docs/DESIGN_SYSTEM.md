# Peergent Design System

**Status:** Single source of truth for all Peergent UI  
**Version:** 2.0 (Vision v13.1)  
**Authority:** Experience Constitution · Product Bible · [PX Foundation](./PX_FOUNDATION.md) · [Vision v13 Evolution](./VISION_V13_EVOLUTION.md) · `docs/reference/peergent-vision-v13/`  
**Scope:** Tokens, components, cards, charts, motion, interaction — implementation foundation  
**Date:** August 2026

---

## How to use this document

This is the **LEGO brick catalogue** for Peergent. Every future screen — Home, Office, Inbox, every Peer workspace — is assembled from this system.

**Do not build page-specific UI.** Build or compose system components.

**Do not invent tokens.** Use `--pg-*` names defined here.

**Do not create decorative cards.** Every card answers one business question.

When values in code differ from this document during PX-3 migration, **update code to match this document**.

Engineering quick reference: [`docs/design-system/V1.md`](./design-system/V1.md) (will alias to this spec).

---

## 1. Design philosophy

### What Peergent UI is

Peergent is **The AI Workforce Operating System.** The interface presents **business outcomes** from **digital colleagues** — not AI processes, not admin dashboards.

### Design goals

| Goal | Expression |
|---|---|
| **Premium** | Restraint, whitespace, nothing superfluous |
| **Calm** | One thing matters; no manufactured urgency |
| **Alive** | Presence, subtle motion — workforce working |
| **Confident** | Real numbers or honest empty; no fake charts |
| **Human** | Peer voice, colleague copy, Dutch/EN register |
| **Operational** | Decisions and value visible in 15 seconds |
| **Modern (2026)** | Manrope editorial, glass surfaces, soft depth |
| **Business-first** | KPIs, impact, recommendations — not step counts |

### What Peergent UI is not

- Technical (workflow steps, brain layers, evidence chains as hero)
- AI-first (model output aesthetics, confidence scores everywhere)
- Dashboard-first (chart walls, equal-weight tiles, CRM grids)

### The one question per component

Before adding any component, answer:

> **What business question does this help the customer answer?**

If there is no answer, the component does not ship.

### Priority tiers (visual weight)

| Tier | Name | Max per viewport | Visual treatment |
|---|---|---|---|
| **P0** | Hero | 1 band | Raised elevation, gradient stat or briefing voice |
| **P1** | Attention | 3 | Amber accent, decision border |
| **P2** | Insight | 2 | grad-soft fill, peer recommendation |
| **P3** | Record | List-unlimited | Panel border, compact rows |
| **P4** | Config | List-unlimited | settings-row pattern |
| **P5** | System | 0 default | Drill-down / dev only |

---

## 2. Visual language

### Brand signatures (non-negotiable)

- **Type:** Manrope (human) + IBM Plex Mono (labels)
- **Color:** Blue → indigo → purple gradient accents on dark/light washes
- **Atmosphere:** Mesh orbs on command centers; glass rail with blur
- **Peers:** Named colleagues with role accent colors
- **Voice:** Italic brief for peer speech; upright for system facts

### Peer accent colors

| Peer / Dept | Token | Light | Dark use |
|---|---|---|---|
| Marketing | `--pg-peer-marketing` | `#3E5FEE` | `#5B7CFA` |
| Sales | `--pg-peer-sales` | `#C9822E` | `#EFAA53` |
| Support | `--pg-peer-support` | `#0E9A73` | `#3FC79A` |
| Finance | `--pg-peer-finance` | `#0E8F6C` | `#3FC79A` |
| Operations | `--pg-peer-operations` | `#6470E8` | `#7C8CF8` |
| Default / Org | `--pg-peer-org` | gradient blue→purple | same |

Peer accent appears on: briefing top border, active tab indicator, presence dot, chart primary series.

### Canvas modes

| Mode | Max width token | Use |
|---|---|---|
| narrative | `--pg-canvas-narrative` (960px) | Home, Desk |
| workspace | `--pg-canvas-workspace` (1080px) | Work, Campaign, Content |
| dashboard | `--pg-canvas-dashboard` (1160px) | Performance, Market |
| settings | `--pg-canvas-settings` (920px) | Agreement, Company |
| prose | `--pg-canvas-prose` (720px) | Briefing body, long-form |

### Band layout

Command centers use **bands** — not uniform section gaps.

```
Band (64px margin-top)
  └─ 2–4 components (32px gap between)
```

---

## 3. Token system

**Canonical prefix:** `--pg-`  
**Implementation files:** `app/themes/peergent-vision-v13.css` (visual), `app/globals.css` (legacy alias layer), `lib/design-system/tokens.ts` (TS export)

Legacy `--pg-color-*` and `--pg-v13-*` **alias to** tokens below during migration.

---

### 3.1 Typography

#### Font families

| Token | Stack |
|---|---|
| `--pg-font-sans` | `"Manrope", system-ui, sans-serif` |
| `--pg-font-mono` | `"IBM Plex Mono", ui-monospace, monospace` |

#### Type scale

| Token | Size | Weight | Line | Font | Use |
|---|---|---|---|---|---|
| `--pg-type-display` | 42px | 800 | 1.05 | sans | Org hero (1× per page) |
| `--pg-type-title` | 36px | 800 | 1.08 | sans | Page title (gradient allowed) |
| `--pg-type-headline` | 22px | 700 | 1.2 | sans | Card titles |
| `--pg-type-voice` | 17px | 500 | 1.55 | sans | Peer brief (italic) |
| `--pg-type-body` | 15px | 400 | 1.55 | sans | Default prose |
| `--pg-type-body-sm` | 14px | 400 | 1.5 | sans | Secondary prose |
| `--pg-type-caption` | 13px | 500 | 1.4 | sans | Row meta |
| `--pg-type-stat-hero` | 28px | 800 | 1.1 | sans | KPI hero value |
| `--pg-type-stat` | 24px | 800 | 1.1 | sans | KPI inline value |
| `--pg-type-label` | 10px | 700 | 1.2 | mono | Card labels (uppercase) |
| `--pg-type-eyebrow` | 10.5px | 400 | 1.2 | mono | Context tags |
| `--pg-type-micro` | 9.5px | 500 | 1.2 | mono | Timestamps |

#### Typography rules

1. One gradient title per viewport (`--pg-gradient-title` on `--pg-type-title` only)
2. KPI gradient values: `--pg-gradient-stat` on stat tokens only, max 4 per view
3. Labels always mono, uppercase, `--pg-text-faint`
4. Peer voice always `--pg-type-voice` + `font-style: italic`
5. Tabular nums on all metrics (`font-variant-numeric: tabular-nums`)

---

### 3.2 Spacing (4px grid)

| Token | Value |
|---|---|
| `--pg-space-0` | 0 |
| `--pg-space-1` | 4px |
| `--pg-space-2` | 8px |
| `--pg-space-3` | 12px |
| `--pg-space-4` | 16px |
| `--pg-space-5` | 20px |
| `--pg-space-6` | 24px |
| `--pg-space-8` | 32px |
| `--pg-space-10` | 40px |
| `--pg-space-12` | 48px |
| `--pg-space-14` | 56px |
| `--pg-space-16` | 64px |
| `--pg-space-20` | 80px |
| `--pg-space-24` | 96px |

#### Semantic spacing

| Token | Value | Use |
|---|---|---|
| `--pg-band-gap` | 56px | Between bands |
| `--pg-band-gap-lg` | 64px | After hero band |
| `--pg-card-padding-sm` | 16px | Compact cards |
| `--pg-card-padding` | 20px | Default cards |
| `--pg-card-padding-lg` | 24px | Briefing, chart cards |
| `--pg-row-padding-y` | 14px | List rows |
| `--pg-canvas-padding-x` | 48px (24px @ mobile) | Canvas horizontal |

---

### 3.3 Radius

| Token | Value | Use |
|---|---|---|
| `--pg-radius-sm` | 8px | Chips, small buttons |
| `--pg-radius-md` | 12px | Rows, inputs |
| `--pg-radius-lg` | 16px | Standard cards |
| `--pg-radius-xl` | 24px | Briefing, modals |
| `--pg-radius-full` | 9999px | Pills, avatars |

---

### 3.4 Elevation

| Level | Token | Shadow | Border |
|---|---|---|---|
| 0 flush | `--pg-elevation-0` | none | none |
| 1 panel | `--pg-elevation-1` | none | `--pg-border-soft` |
| 2 raised | `--pg-elevation-2` | `--pg-shadow-md` | `--pg-border-soft` |
| 3 floating | `--pg-elevation-3` | `--pg-shadow-lg` | `--pg-border` |
| 4 atmosphere | — | mesh orbs | — |

**Rule:** Do not combine full shadow + heavy border at equal strength.

---

### 3.5 Shadows

| Token | Value |
|---|---|
| `--pg-shadow-sm` | `0 1px 2px rgba(20,22,50,0.05)` |
| `--pg-shadow-md` | `0 1px 2px rgba(20,22,50,0.05), 0 16px 36px -20px rgba(20,22,50,0.18)` |
| `--pg-shadow-lg` | `0 8px 24px -8px rgba(20,22,50,0.15), 0 24px 48px -16px rgba(20,22,50,0.12)` |
| `--pg-shadow-primary` | `0 8px 20px rgba(91,124,250,0.35)` (primary button only) |

Dark theme: increase opacity ~2×, same structure.

---

### 3.6 Colors — semantic

#### Surfaces (light / dark values in CSS theme blocks)

| Token | Role |
|---|---|
| `--pg-bg-wash` | Page gradient background |
| `--pg-bg-solid` | Fallback solid |
| `--pg-surface` | Opaque cards, inputs |
| `--pg-panel` | Glass / translucent panels |
| `--pg-panel-hover` | Hover on panel rows |
| `--pg-glass` | Sidebar, overlays |

#### Text

| Token | Role |
|---|---|
| `--pg-text` | Primary ink |
| `--pg-text-soft` | Body secondary |
| `--pg-text-faint` | Labels, metadata |
| `--pg-text-inverse` | On primary buttons |

#### Borders

| Token | Role |
|---|---|
| `--pg-border` | Standard |
| `--pg-border-soft` | Cards, rows |
| `--pg-border-attention` | Decision cards |

#### State

| Token | Role |
|---|---|
| `--pg-state-positive` | Success, live, good trend |
| `--pg-state-attention` | Needs you, warning |
| `--pg-state-negative` | Error, failure |
| `--pg-state-info` | Informational hint |
| `--pg-state-working` | Peer active (blue) |
| `--pg-state-idle` | Peer idle (faint) |

#### Action

| Token | Role |
|---|---|
| `--pg-action-primary` | Primary button fill |
| `--pg-action-primary-hover` | Hover |
| `--pg-action-primary-pressed` | Active |
| `--pg-action-muted` | Active nav, subtle fill |

---

### 3.7 Gradients

| Token | Use |
|---|---|
| `--pg-gradient-title` | Page title text (1×) |
| `--pg-gradient-stat` | KPI value text (hero band) |
| `--pg-gradient-brand` | Logo mark, primary button |
| `--pg-gradient-soft` | Insight card background, chart area fill |
| `--pg-gradient-mesh-a` | Orb top-right |
| `--pg-gradient-mesh-b` | Orb bottom-left |

**Forbidden:** Gradient on body text, table cells, every heading, decorative backgrounds at full saturation.

---

### 3.8 Motion

| Token | Duration | Easing |
|---|---|---|
| `--pg-motion-instant` | 80ms | `--pg-ease-out` |
| `--pg-motion-fast` | 120ms | `--pg-ease-out` |
| `--pg-motion-normal` | 200ms | `--pg-ease-out` |
| `--pg-motion-moderate` | 250ms | `--pg-ease-out` |
| `--pg-motion-slow` | 400ms | `--pg-ease-out` |
| `--pg-motion-chart` | 600ms | `--pg-ease-out` |
| `--pg-motion-counter` | 800ms | `--pg-ease-out` |
| `--pg-motion-pulse` | 2000ms | ease-in-out (infinite) |
| `--pg-ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | |
| `--pg-ease-spring` | `cubic-bezier(0.34, 1.4, 0.4, 1)` | Accordion, approve morph |

`prefers-reduced-motion: reduce` → all except instant opacity; disable pulse, counter, chart draw.

---

### 3.9 Opacity & blur

| Token | Value | Use |
|---|---|---|
| `--pg-opacity-disabled` | 0.45 | Disabled controls |
| `--pg-opacity-muted` | 0.7 | Secondary icons |
| `--pg-blur-glass` | 22px | Rail, modal backdrop |
| `--pg-blur-panel` | 16px | Briefing glass |
| `--pg-scrim` | 0.35 light / 0.55 dark | Modal overlay |

---

### 3.10 Grid & breakpoints

#### Grid

- **12-column** implicit grid on dashboard canvases
- KPI band: 4 equal columns desktop, 2×2 tablet, 1 col mobile
- Gutters: `--pg-space-8` (32px) desktop, `--pg-space-4` mobile

#### Breakpoints

| Token | Width | Behavior |
|---|---|---|
| `--pg-bp-sm` | 640px | Stack KPI 2×2 |
| `--pg-bp-md` | 768px | Rail collapsible optional |
| `--pg-bp-lg` | 1024px | Full desktop layout |
| `--pg-bp-xl` | 1280px | Dashboard max width engaged |
| `--pg-bp-2xl` | 1536px | No further content stretch |

**Rule:** Prose and briefing never exceed `--pg-canvas-prose` (720px) regardless of breakpoint.

---

### 3.11 Icon sizing

| Token | Size | Use |
|---|---|---|
| `--pg-icon-xs` | 12px | Inline with micro text |
| `--pg-icon-sm` | 14px | Row trailing, delta arrows |
| `--pg-icon-md` | 16px | Default UI icons |
| `--pg-icon-lg` | 20px | Card header icons |
| `--pg-icon-xl` | 24px | Empty state |

Icons: Lucide, stroke 2–2.5, `aria-hidden` when decorative.

---

## 4. Component catalogue

### 4.1 Primitives (build first)

| Component | Status | Role |
|---|---|---|
| `PgButton` | Exists | primary, ghost, sm, link, danger |
| `PgCard` | Exists | Base surface + elevation variants |
| `PgMetric` | Exists | Number with emphasis tier |
| `PgStatusPill` | Exists | Human status label |
| `PgSkeleton` | Exists | Loading placeholders |
| `PgField` | Exists | Form inputs |
| `PgFilterBar` | Exists | Pill toggles |
| `PgSectionHeader` | Exists | Band labels with optional action |

### 4.2 Shell (exists — maintain)

| Component | Role |
|---|---|
| `PgVisionShell` | Org + peer chrome |
| `PgOfficeShell` | Peer tab canvas |
| `PgTeamRail` | Peer roster |
| `PgPeerTabs` | Six destination tabs |
| `PgPresenceLine` | Peer status strip |

### 4.3 Cards (PX-3 target — see §5)

All `Pg*Card` components compose `PgCard` + tokens + optional `PgMetric`.

### 4.4 Charts (compose into PgChartCard)

| Component | Status | Role |
|---|---|---|
| `PgTrendChart` | Exists | Line / area series |
| `PgChartFrame` | Exists | Padding, title, period toggle |
| `PgSparkline` | **New** | Inline mini trend |

### 4.5 Review & depth (exists)

| Component | Role |
|---|---|
| `PgReviewBar` | Sticky approve/reject — never unmount in review |
| `PgInspector` | Plan/reasoning drill-down — no workflow CTAs |

---

## 5. Card catalogue

Every card: **one business question.** Full spec per component.

---

### PgHeroCard

| Field | Specification |
|---|---|
| **Business question** | “What is the single most important number right now?” |
| **Priority** | P0 |
| **Purpose** | One headline KPI for page or band |
| **Hierarchy** | Label (mono) → Value (stat-hero, optional gradient) → Delta → Period |
| **Max density** | 4 lines |
| **Spacing** | `--pg-card-padding-lg` |
| **Elevation** | raised (2) |
| **Hover** | `translateY(-1px)` if `href` set |
| **Animation** | Counter roll 800ms on mount |
| **Expand** | No |
| **Mobile** | Full width in band |
| **Desktop** | 1 of 4 in KPI grid |
| **A11y** | `aria-label={label + value}`; delta has text, not color alone |
| **Example** | Home: “Waarde gecreëerd · €41.200 · +12% · deze maand” (real data only) |
| **Implementation** | Compose `PgKpiCard` + `PgMetric emphasis="hero"` |

---

### PgMetricCard

| Field | Specification |
|---|---|
| **Business question** | “How are we doing on this metric?” |
| **Priority** | P0 (in band) / P3 (inline) |
| **Purpose** | Standard KPI tile in hero band |
| **Hierarchy** | Label → Value (stat, gradient optional) → Delta chip → Caption |
| **Max density** | 4 lines |
| **Spacing** | `--pg-card-padding` |
| **Elevation** | panel (1) |
| **Hover** | Lift if clickable |
| **Animation** | Counter roll on band enter |
| **Mobile** | 2-column grid |
| **Desktop** | 4-column grid |
| **A11y** | Same as PgHeroCard |
| **Example** | “Kanalen live · 3 · +1 deze week” |
| **Maps from** | v13 `.stat-box` · existing `PgKpiCard` |

---

### PgInsightCard

| Field | Specification |
|---|---|
| **Business question** | “What should I know that I might have missed?” |
| **Priority** | P2 |
| **Purpose** | Single AI-generated business insight |
| **Hierarchy** | Eyebrow `PEER-INZICHT` → Insight paragraph → Optional link |
| **Max density** | 3 lines + link |
| **Spacing** | `--pg-card-padding-lg` |
| **Surface** | `--pg-gradient-soft` background, no heavy border |
| **Hover** | Border softens to peer accent if clickable |
| **Animation** | Fade in 200ms on appear |
| **Expand** | No |
| **Mobile** | Full width |
| **Desktop** | Max 480px or half band |
| **A11y** | `article` + heading |
| **Example** | “LinkedIn presteert boven verwachting — overweeg budget te verschuiven.” |
| **Maps from** | existing `PgInsightCard` · v13 `.quote-panel` |

---

### PgRecommendationCard

| Field | Specification |
|---|---|
| **Business question** | “What does my peer suggest I do next?” |
| **Priority** | P2 |
| **Purpose** | One proactive peer recommendation with CTA |
| **Hierarchy** | Peer tag → Recommendation (voice or headline) → Primary CTA |
| **Max density** | 2 sentences + 1 button |
| **Spacing** | `--pg-card-padding-lg` |
| **Elevation** | panel (1), peer accent top border 2px |
| **Hover** | None on card; button standard |
| **Animation** | None |
| **Mobile** | CTA full width |
| **Desktop** | CTA inline right |
| **A11y** | CTA descriptive: “Open campagne planning” not “Continue” |
| **Example** | “Emma · Marketing — Rond de Q2-campagne af voor publicatie.” [Open campagne] |
| **Maps from** | `PgSuggestedStart` · Desk “Emma recommends” |

---

### PgApprovalCard

| Field | Specification |
|---|---|
| **Business question** | “What do I need to approve, and why?” |
| **Priority** | P1 |
| **Purpose** | Single judgment request |
| **Hierarchy** | Title → What approving unblocks → Age → Primary action |
| **Max density** | Title + 1 line context + 1 CTA |
| **Spacing** | `--pg-card-padding` |
| **Surface** | `--pg-state-attention-soft` fill, 2.5px left border attention |
| **Hover** | None |
| **Animation** | On approve: button → check, card fade out 300ms |
| **Mobile** | CTA full width below text |
| **Desktop** | CTA right-aligned |
| **A11y** | `role="group"` + `aria-labelledby` |
| **Example** | “Keur Q2 campagne goed” / “Emma kan dan publiceren en meten.” |
| **Maps from** | existing `PgDecisionCard` · v13 `.decision` |

**Rule:** Renaming note — `PgApprovalCard` is the canonical name; `PgDecisionCard` aliases during migration.

---

### PgBriefingCard

| Field | Specification |
|---|---|
| **Business question** | “What has my peer prepared, and do I trust it?” |
| **Priority** | P0 |
| **Purpose** | Handover moment — org, peer, or campaign scope |
| **Hierarchy** | Peer identity → Title → Status pill → Human summary → Sections (accordion) → Footer actions |
| **Max density** | 2-min read default; sections collapsed |
| **Spacing** | `--pg-card-padding-lg`; max-width 720px |
| **Elevation** | raised (2); peer accent top border 2px |
| **Hover** | None on card |
| **Expand** | Accordion sections inside — **never** slideshow |
| **Mobile** | Full width; footer CTAs stacked |
| **Desktop** | Centered prose width; CTAs row |
| **A11y** | `article`; accordion `aria-expanded` |
| **Example** | “Emma heeft je campagne voorbereid” + approve + view depth link |
| **Status** | **New** — replaces scattered briefing markup |

**Variants:** `org` | `peer` | `campaign` — same component, different footer actions.

---

### PgActivityCard

| Field | Specification |
|---|---|
| **Business question** | “What happened recently?” (informational) |
| **Priority** | P3 |
| **Purpose** | Single activity event — prefer row in list over standalone card |
| **Hierarchy** | Dot → Title → Description → Time (micro) |
| **Max density** | 2 lines + timestamp |
| **Spacing** | `--pg-row-padding-y` vertical |
| **Elevation** | flush in `PgActivityList` |
| **Hover** | Background `--pg-panel-hover` if link |
| **Animation** | Slide in 200ms when new |
| **Mobile** | Same |
| **Desktop** | Max 6 in Home band |
| **A11y** | `time` element with `datetime` |
| **Example** | “Emma publiceerde 3 LinkedIn posts · 2 uur geleden” |
| **Maps from** | `PgActivityRow` · v13 `.done-row` |

**Note:** Use **list of rows**, not individual elevated cards, for activity feeds.

---

### PgChartCard

| Field | Specification |
|---|---|
| **Business question** | “How is this changing over time?” |
| **Priority** | P1 |
| **Purpose** | One chart + one insight sentence |
| **Hierarchy** | Label → Chart (70%) → Insight line (30%) → Period toggle |
| **Max density** | 1 chart + 1 sentence |
| **Spacing** | `--pg-card-padding-lg` |
| **Elevation** | panel (1) |
| **Hover** | None |
| **Animation** | Path draw 600ms; area fade 200ms after |
| **Expand** | Full width on mobile |
| **Desktop** | Band width |
| **A11y** | Chart `role="img"` + `aria-label` summary; data table fallback hidden |
| **Example** | “Organische zichtbaarheid · 30 dagen” + line chart + “Groei hervat na indexatie.” |
| **Compose** | `PgChartFrame` + `PgTrendChart` |

---

### PgTimelineCard

| Field | Specification |
|---|---|
| **Business question** | “How did my peer build this?” (depth only) |
| **Priority** | P5 — drill-down default **closed** |
| **Purpose** | Process steps for curious customer |
| **Hierarchy** | Disclosure trigger → Human step labels (not IDs) |
| **Max density** | 10 steps max visible |
| **Spacing** | `--pg-card-padding` when open |
| **Elevation** | flush inside disclosure |
| **Hover** | Step row hover if evidence link |
| **Animation** | Accordion 250ms spring |
| **Mobile** | Full width |
| **Desktop** | Max workspace width |
| **A11y** | `<details>`/`<summary>` or button with `aria-expanded` |
| **Example** | “Hoe Emma tot dit advies kwam” → collapsed by default |
| **Maps from** | `PgTimeline` · workflow timeline (hidden by default) |

---

### PgOpportunityCard

| Field | Specification |
|---|---|
| **Business question** | “What opportunity should I consider?” |
| **Priority** | P2 |
| **Purpose** | Proactive market or growth opportunity |
| **Hierarchy** | Label → Opportunity statement → Explore link |
| **Max density** | 2 lines |
| **Surface** | panel + peer accent dot |
| **Hover** | Lift 1px if clickable |
| **Example** | “Concurrent X investeert in LinkedIn — ruimte in jouw segment.” |
| **Status** | **New** |

---

### PgAlertCard

| Field | Specification |
|---|---|
| **Business question** | “Is something wrong that I must know?” |
| **Priority** | P1 (rare) |
| **Purpose** | Urgent non-decision signal |
| **Hierarchy** | Alert title → Context → Single action |
| **Max density** | 2 lines + CTA |
| **Surface** | attention-soft, no gradient |
| **Example** | “Advertentie-account losgekoppeld — Emma kan niet publiceren.” [Verbind opnieuw] |
| **Status** | **New** — use sparingly |

---

### PgPeerStatusCard

| Field | Specification |
|---|---|
| **Business question** | “What is this peer doing right now?” |
| **Priority** | P3 (usually inline, not card) |
| **Purpose** | Peer presence in team pulse |
| **Hierarchy** | Avatar → Name · Role → Status line → Optional metric |
| **Max density** | 2 lines |
| **Form** | **Prefer chip/row** over elevated card |
| **Animation** | Pulse dot when `working` |
| **Example** | “Emma · Marketing · Campagne voorbereiden” |
| **Maps from** | `PgPeerPresence` · team pulse rows |

---

### PgAutomationCard

| Field | Specification |
|---|---|
| **Business question** | “Is autonomous execution active?” |
| **Priority** | P3 — **ambient, not standalone card** |
| **Purpose** | Confidence chip: autonomous mode |
| **Hierarchy** | Pulse dot + mono label |
| **Form** | Inline in presence strip or Performance header |
| **Example** | `● AUTONOMOUS · LIVE` |
| **Rule** | Never a full card on customer UI — chip only |

---

### PgPerformanceCard

| Field | Specification |
|---|---|
| **Business question** | “How is this campaign/entity performing?” |
| **Priority** | P0–P1 |
| **Purpose** | Post-publish outcome summary |
| **Hierarchy** | Entity name → 2–3 KPIs → Sparkline → Recommendation link |
| **Max density** | 3 metrics + mini chart |
| **Elevation** | raised when hero; panel in lists |
| **Example** | Campaign live: leads, spend, ROAS + 7-day sparkline |
| **Compose** | `PgMetricCard` × 3 + `PgSparkline` in grid |
| **Status** | **New** composite |

---

### PgEmptyStateCard

| Field | Specification |
|---|---|
| **Business question** | “What can I do here when nothing exists yet?” |
| **Priority** | P2 |
| **Purpose** | Peer-voice invitation to delegate |
| **Hierarchy** | Optional icon → Peer proposal (voice) → Primary delegate CTA |
| **Max density** | 2 lines + 1 CTA |
| **Elevation** | none — centered, no border |
| **Hover** | CTA only |
| **Example** | “Emma is klaar om je eerste campagne te bedenken.” [Nieuwe campagne] |
| **Maps from** | `PgEmptyState` |

---

## 6. Chart catalogue

### Philosophy

> Charts answer questions. They never exist because charts look nice.

Every chart must declare its **question** in the card label.

| Chart | Question it answers | Allowed surfaces |
|---|---|---|
| Line | How is this metric changing? | Home, Performance, Market |
| Area | What is cumulative growth? | Home, Performance |
| Bar (vertical) | How do categories compare? | Performance |
| Bar (horizontal) | What is funnel progress? | Desk, Performance |
| Sparkline | Is this trending up or down? | Metric cards, work rows |
| KPI counter | What is the current total? | Hero band (not a chart) |

### Visual rules

| Rule | Value |
|---|---|
| Primary series color | `--pg-peer-marketing` or `--pg-action-primary` |
| Secondary series | indigo, purple at 70% opacity |
| Area fill | gradient-soft at 12% max opacity |
| Grid lines | `--pg-border-soft`, horizontal only |
| Axis labels | Hidden default; show on “Details” toggle |
| Tooltip | Surface elevated, mono date, sans value |
| Empty | Peer voice message, not empty grid |
| Period toggle | 7d / 30d / 90d pill buttons |
| Max charts per command center | 1 |
| Max charts per Performance | 3 |

### Trend indicators (non-chart)

| Element | Use |
|---|---|
| Delta chip | `%` or absolute with arrow icon |
| Direction color | Green only when `upIsGood` and real comparison exists |
| Sparkline | 7-point max, no axes, 24px height |
| Counter animation | Numbers ≥1000 roll on mount |

### Forbidden

- Pie / donut charts
- 3D effects
- Dual y-axes
- Chart without label
- Fake/demo series in production

---

## 7. Motion catalogue

### Philosophy

> Motion confirms the workforce is alive — not that the software is loading.

| Category | Animation | Duration | When |
|---|---|---|---|
| **Counter** | Roll 0 → value | 800ms ease-out | KPI band first mount |
| **Chart draw** | stroke-dashoffset | 600ms | Chart card enter viewport |
| **Chart fill** | opacity 0 → 1 | 200ms | After line completes |
| **Card hover** | translateY(-1px) | 200ms | Clickable cards only |
| **Presence pulse** | scale + opacity | 2000ms loop | Peer status `working` |
| **Activity enter** | translateY(8px) + fade | 200ms | New feed item |
| **Accordion** | height + chevron rotate | 250ms spring | Briefing sections |
| **Tab indicator** | underline slide | 200ms | Peer tabs |
| **Page transition** | opacity crossfade | 200ms | Route change |
| **Modal** | slide up + fade | 250ms | Mobile sheet |
| **Approve success** | icon morph + card fade | 300ms | Approval card |
| **Skeleton shimmer** | gradient slide | 1500ms loop | Loading only |
| **Mesh drift** | orb position | 60s loop | Command centers only |

### Forbidden motion

- Parallax scroll
- Confetti / particles
- Full-page spinner without skeleton
- Bouncing badges
- Slideshow page transitions
- Infinite pulse on CTAs

---

## 8. Interaction rules

### Hover

| Element | Hover |
|---|---|
| Clickable card | `-1px` Y, border darken |
| Ghost button | Background `--pg-panel-hover` |
| Primary button | `--pg-action-primary-hover` + shadow |
| Row link | Background `--pg-panel-hover` |
| Non-interactive card | **No hover** |

### Focus

- Class: `pg-focus-premium`
- Ring: 2px `--pg-action-primary` at 40% opacity, 2px offset
- Visible on all interactive elements
- Never `outline: none` without replacement

### Loading

| Surface | Pattern |
|---|---|
| Command center | `PgHomeSkeleton` matching band geometry |
| Card | `PgSkeleton` matching card size |
| Chart | Skeleton rectangle + shimmer |
| Button | Disabled + label “…” |
| **Never** | Bare spinner on full page |

### Empty

- Always peer voice via `PgEmptyStateCard`
- Always one primary delegate action
- Never “No data” alone

### Success

- Inline status text, `--pg-state-positive`
- Optional check icon morph on approve
- No modal celebration

### Error

- `--pg-state-negative` text
- Peer voice explanation + recovery action
- Never stack traces on customer UI

### Presence indicators

| State | Visual |
|---|---|
| Working | Blue pulse dot 6px |
| Waiting | Amber static dot |
| Live / success | Green static dot |
| Idle | Faint dot 4px |
| Blocked | Amber left border on row — not red |

---

## 9. Accessibility rules

### WCAG 2.2 AA minimum

| Requirement | Rule |
|---|---|
| Color contrast | 4.5:1 body, 3:1 large text and UI components |
| Status | Never color alone — always text label |
| Focus | Visible on all interactives |
| Headings | Semantic order; one h1 per view |
| Landmarks | `main`, `nav`, `article` on cards |
| Accordions | `aria-expanded`, `aria-controls` |
| Charts | Text summary required |
| Motion | `prefers-reduced-motion` honored |
| Touch targets | Min 44×44px mobile |
| Language | `lang` on html; copy matches locale |

### Copy accessibility

- Buttons: verb + object (“Campagne goedkeuren” not “OK”)
- Links: destination clear (“Alle items in Inbox (3)”)
- Status: human time (“2 uur geleden” not ISO strings in UI)

---

## 10. Implementation strategy

### File structure (target)

```
app/themes/
  peergent-vision-v13.css    ← canonical CSS tokens
  peergent-tokens.css        ← semantic aliases
  peergent-foundation.css    ← maps legacy → canonical

components/design-system/
  Pg*.tsx                    ← all components
  cards/
    PgHeroCard.tsx
    PgMetricCard.tsx
    ...                      ← new card components

lib/design-system/
  tokens.ts                  ← TS token exports
  motion.ts                  ← duration helpers
  card-specs.ts              ← priority + density metadata (optional)

docs/
  DESIGN_SYSTEM.md           ← this document
  design-system/V1.md          ← engineering cheat sheet
```

### Component build order

1. Token unification in CSS
2. `PgCard` elevation variants aligned to spec
3. `PgMetric` + `PgMetricCard` + `PgHeroCard`
4. `PgBriefingCard`
5. `PgApprovalCard` (alias `PgDecisionCard`)
6. `PgInsightCard` + `PgRecommendationCard`
7. `PgChartCard` + `PgSparkline`
8. `PgActivityCard` (list wrapper)
9. `PgTimelineCard`
10. `PgEmptyStateCard`
11. `PgOpportunityCard` + `PgAlertCard`
12. `PgPerformanceCard` (composite)
13. Presence/automation chips (inline, not cards)

### Dev preview

Extend `/dev/vision-v13-foundation` with card gallery showing all states: default, hover, loading, empty, error.

### Testing

- Visual regression on card gallery
- a11y audit on each new component (axe)
- Reduced-motion snapshot tests

---

## 11. Migration strategy

### Token migration

| Legacy | Canonical |
|---|---|
| `--pg-v13-blue` | `--pg-action-primary` (theme-aware) |
| `--pg-v13-ink` | `--pg-text` |
| `--pg-v13-line-soft` | `--pg-border-soft` |
| `--pg-color-text-primary` | `--pg-text` |
| `--pg-color-accent` | `--pg-action-primary` |

**Phase 1:** Add canonical tokens; legacy aliases point to them  
**Phase 2:** Update components to canonical names  
**Phase 3:** Remove legacy aliases (breaking — major version)

### Component migration

| Current | Target |
|---|---|
| Inline `pg-v13-*` stat markup | `PgMetricCard` |
| `PgDecisionCard` | `PgApprovalCard` (export alias) |
| `PgKpiCard` | `PgMetricCard` (merge) |
| Briefing inline JSX | `PgBriefingCard` |
| `PgActivityRow` | `PgActivityCard` row variant |
| Raw workflow timeline | `PgTimelineCard` in disclosure |
| `ExecutiveCampaignBriefingPanel` slideshow | `PgBriefingCard` accordion |

### Page migration (out of scope for PX-3 — future sprints)

Pages adopt components incrementally per [PX Foundation migration roadmap](./PX_FOUNDATION.md#14-migration-roadmap). **PX-3 delivers components only.**

---

## 12. Component priority

| Priority | Components | Sprint |
|---|---|---|
| **P0** | Tokens, PgMetric, PgMetricCard, PgHeroCard, PgBriefingCard | PX-3 |
| **P1** | PgApprovalCard, PgChartCard, PgSparkline, motion utilities | PX-3 / PX-4 |
| **P2** | PgInsightCard, PgRecommendationCard, PgActivityCard, PgEmptyStateCard | PX-4 |
| **P3** | PgTimelineCard, PgPerformanceCard, PgOpportunityCard, PgAlertCard | PX-4 / PX-5 |
| **P4** | Presence chips, automation chip, dev gallery | PX-5 |

---

## 13. Future extensibility

### New peer types

Add peer accent token + content template — **no new card types** required.

### New metrics

Use `PgMetric` emphasis tiers — never new font sizes.

### New chart types

Propose in design review; default deny. Bar horizontal for funnels only initially.

### Dark / light

All tokens defined in theme blocks — components never hardcode hex.

### Localization

Cards accept copy from view models — components contain no user-facing strings.

### Density mode (future)

Optional `compact` prop on P3/P4 cards only — never on P0/P1.

---

## Appendix A — Card selection guide

| Business question | Component |
|---|---|
| What is the headline number? | `PgHeroCard` |
| How is this metric doing? | `PgMetricCard` |
| What should I know? | `PgInsightCard` |
| What should I do next? | `PgRecommendationCard` |
| What must I approve? | `PgApprovalCard` |
| What did my peer prepare? | `PgBriefingCard` |
| What happened recently? | `PgActivityCard` (in list) |
| How is this trending? | `PgChartCard` |
| How did peer decide? (depth) | `PgTimelineCard` |
| What opportunity exists? | `PgOpportunityCard` |
| What is wrong? | `PgAlertCard` |
| Is peer working? | Presence chip (not card) |
| Is autonomous on? | Automation chip (not card) |
| How is entity performing? | `PgPerformanceCard` |
| Nothing here yet | `PgEmptyStateCard` |

---

## Appendix B — Relationship to prior docs

| Document | Role |
|---|---|
| **DESIGN_SYSTEM.md** (this) | **Single source of truth** |
| Vision v13 Evolution | Visual language intent — implemented here |
| PX Foundation | Product IA — informs where cards appear |
| design-system/V1.md | Engineering quick reference — aliases here |
| mockup.html | Visual authority for spacing/color verification |
| peergent-vision-v13.css | Runtime token file |

---

## Appendix C — Anti-patterns

- Decorative cards with no business question
- More than 4 KPI cards in hero band
- Gradient on every heading
- Workflow steps as P0 content
- Slideshow briefing navigation
- Fake chart data
- Spinner without skeleton
- `PgAutomationCard` as full card
- Two token naming schemes in new code
- Page-specific color hex

---

*PX-3 delivers the system. PX-4+ assembles the house.*

*Every Peergent screen built after this document should be recognizable without the logo.*
