# Vision v13 Evolution — Premium Visual Language

**Status:** Design system evolution blueprint  
**Authority:** Subordinate to Experience Constitution, Product Bible, Vision v13 reference (`docs/reference/peergent-vision-v13/`), PX Foundation  
**Scope:** Visual language for all Peergent surfaces — architecture only, no implementation  
**Version:** v13.1 (evolution, not replacement)  
**Date:** August 2026

---

## How to use this document

Vision v13 is the foundation. This document **evolves** it into a world-class 2026 AI operating system aesthetic.

Do not redesign from scratch. Do not copy Inspace layouts. Extract **principles** — rhythm, calm, confidence — and express them in unmistakably Peergent language: Manrope editorial type, blue–purple gradients, glass rail, peer presence, cosmic atmosphere.

When implementing any screen, ask: **Does this feel like Vision v13 evolved, or like generic SaaS?**

---

## 1. Vision v13 strengths

These are non-negotiable. Preserve and amplify.

### Brand & atmosphere

| Strength | Expression in v13 |
|---|---|
| **Cosmic premium** | Mesh orbs, bg-wash gradient, glass sidebar with blur |
| **Peer identity** | Named colleagues, role colors (Marketing blue, Sales amber, Support green) |
| **Gradient title** | Blue → purple title-grad on hero headings |
| **Dual theme** | Light wash (editorial) and dark wash (command) — both feel intentional |
| **Logo mark** | Gradient P — recognizable without wordmark |

### Navigation & architecture

| Strength | Expression in v13 |
|---|---|
| **Collapsible rail** | Org overview + peer roster — workforce, not file tree |
| **Peer subnav** | Six underline tabs — scales to every peer type |
| **Presence strip** | Peer role + status line above tabs — colleague is present |
| **Canvas modes** | narrative / workspace / dashboard / settings max-widths |
| **Section rhythm** | 42px section gap — editorial pacing |

### Component vocabulary (mockup.html)

| Pattern | Role |
|---|---|
| `.brief` | Peer voice briefing — top accent border, italic body |
| `.decision` | Attention card — amber left rail, soft fill |
| `.stat-box` | KPI — mono label, gradient value, quiet caption |
| `.work-row` | Active entity — name + meta, not pipeline jargon |
| `.row-list` | Grouped records — contained list, soft panel |
| `.sec-label` | Section header — mono uppercase, status dot variants |
| `.settings-row` | Tappable config row — name + desc + chevron |

### Typography pairing

- **Manrope** — human, editorial, 2026 SaaS quality
- **IBM Plex Mono** — labels, metadata, status — precision without coldness

### Motion foundation

- `--pg-v13-ease: cubic-bezier(0.16, 1, 0.3, 1)` — premium deceleration
- `--pg-v13-spring` — subtle bounce for presence, never for data
- Rail collapse, subview fade — already defined in mockup

---

## 2. Vision v13 weaknesses

Honest gaps between mockup intent and shipped surfaces.

### Visual consistency

| Weakness | Symptom |
|---|---|
| **Two token systems** | `--pg-v13-*` (Vision) vs `--pg-color-*` (Design System v1) used interchangeably |
| **Component bypass** | Live pages use raw `pg-v13-*` classes; `PgKpiCard`, `PgTrendChart` under-adopted |
| **Equal visual weight** | Settings-row pattern used for everything — KPIs, deliverables, workflow steps look identical |
| **Grey panel fatigue** | Large undifferentiated panels — briefing, workspace, timeline share same surface |
| **Gradient overuse risk** | Title grad on every heading would dilute; mockup uses it sparingly on hero only |

### Information design

| Weakness | Symptom |
|---|---|
| **Workflow visual language** | Timeline lists, mono status tags, step states — reads as Linear, not Inspace |
| **Missing KPI hero band** | Mockup has stat-row; live Home/Desk lead with text sections |
| **Charts orphaned** | Performance has charts; Home/Desk use inline SVG sparks inconsistently |
| **Density mismatch** | Command centers too dense; drill-downs too sparse or too technical |
| **English jargon** | “Workflow”, “Deliverables” on NL surfaces breaks colleague voice |

### Interaction

| Weakness | Symptom |
|---|---|
| **Slideshow regression** | Briefing inspector reintroduces pagination — violates mockup brief pattern |
| **Hover inconsistency** | Some rows interactive, some not — no system |
| **Loading invisible** | Skeleton exists (`PgSkeleton`) but not applied consistently |
| **Motion underused** | Presence pulse defined in CSS; rarely on live paths |

### Scale

| Weakness | Symptom |
|---|---|
| **Marketing-only polish** | Vision v13 fully expressed on Office; Home still hybrid; Inbox/Company on different shell |
| **Card taxonomy missing** | No documented rules for when stat-box vs brief vs decision vs work-row |

---

## 3. What should evolve

Evolution targets — each preserves v13 identity.

| Area | v13 today | v13.1 evolution |
|---|---|---|
| **Tokens** | Two parallel systems | Single `--pg-v13-*` source; v1 tokens alias to v13 |
| **Cards** | Mockup CSS classes | Named card components with documented rules |
| **KPI presentation** | stat-box in mockup only | Hero KPI band on every command center |
| **Charts** | Performance tab only | One chart per command center; integrated not bolted-on |
| **Briefing** | `.brief` pattern | Unified Briefing Card — org, peer, campaign variants |
| **Workflow** | Visible timeline | Collapsed; Timeline Card for drill-down only |
| **Rows** | settings-row everywhere | Row variants: work, activity, record, config |
| **Status** | Mono tags | Human pills + optional pulse dot |
| **Spacing** | 42px sections uniform | Band system: tight within band, loose between bands |
| **Motion** | Rail + fade | Presence, counters, chart draw, card hover layer |
| **Shell** | Vision on Home/Office only | Vision shell everywhere (PX-0) |

**Do not evolve:** Rail architecture, six peer tabs, canvas max-widths, peer role colors, mesh atmosphere, Manrope/IBM Plex pairing.

---

## 4. New design language — Vision v13.1

### Design language name

**Vision v13.1 — Workforce Calm**

One sentence: *Editorial confidence for an intelligent workforce.*

### Principles (Inspace-inspired, Peergent-expressed)

| Principle | Inspace extraction | Peergent expression |
|---|---|---|
| **Rhythm** | KPI band → section → chart → list | Hero band (56px gap) → content band (32px) → footer band |
| **Hierarchy** | Number loud, label quiet | Gradient stat value OR semibold ink — never both competing |
| **Calm** | Generous whitespace, 3–4 KPIs max | Max 4 hero metrics; max 6 activity rows; max 3 decisions |
| **Confidence** | “Autonomous · live” ambient | Presence strip + pulse dot — never alarm copy |
| **Density** | Information rich but not crowded | Card interiors: 16–20px padding; lists: 14px row height rhythm |
| **Aliveness** | Queue moves, insight updates | Subtle motion on presence, counters, new activity — not parallax |

### Recognizability checklist

A screen is Peergent if it has:

- [ ] Manrope body + IBM Plex labels
- [ ] Soft panel surfaces with `--pg-v13-line-soft` borders
- [ ] At most one gradient hero element per viewport
- [ ] Peer accent color when in peer scope
- [ ] Mesh atmosphere visible on command centers
- [ ] No generic blue-grey Bootstrap energy
- [ ] No workflow step vocabulary as hero content

---

## 5. Typography scale

Extend existing v13 tokens. Do not replace Manrope/IBM Plex.

### Scale

| Token | Size | Weight | Font | Use | Max per viewport |
|---|---|---|---|---|---|
| `--pg-v13-type-display` | 42px | 800 | Manrope | Org hero (Home only) | 1 |
| `--pg-v13-type-title` | 36px | 800 | Manrope | Page title (gradient) | 1 |
| `--pg-v13-type-headline` | 22px | 700 | Manrope | Card titles, peer name | 3 |
| `--pg-v13-type-brief` | 17px | 500 italic | Manrope | Briefing body, peer voice | 2 blocks |
| `--pg-v13-type-body` | 15px | 400 | Manrope | Default prose | — |
| `--pg-v13-type-sub` | 14.5px | 400 | Manrope | Supporting copy | — |
| `--pg-v13-type-caption` | 13px | 500 | Manrope | Row secondary, meta | — |
| `--pg-v13-type-stat` | 28px | 800 | Manrope | KPI value (hero) | 4 |
| `--pg-v13-type-stat-sm` | 24px | 800 | Manrope | KPI value (inline) | — |
| `--pg-v13-type-label` | 10px | 700 | IBM Plex Mono | Card labels, section labels | — |
| `--pg-v13-type-eyebrow` | 10.5px | 400 | IBM Plex Mono | Context tags, presence | — |
| `--pg-v13-type-micro` | 9.5px | 500 | IBM Plex Mono | Timestamps, source tags | — |

### Hierarchy rules

1. **One display or title grad per viewport** — never stack gradient headings
2. **Labels always mono, always uppercase, always faint** — they whisper
3. **Stat values never italic** — confidence is upright
4. **Brief italic only for peer voice** — Emma speaks in brief; system never italicizes
5. **Line height:** titles 1.08, body 1.55, labels 1.2
6. **Max line length:** 600px prose, 720px briefing, full canvas for charts

---

## 6. Spacing scale

Unify on 4px grid. Map v13 section gap into **bands**.

### Base scale (existing + extensions)

| Token | Value | Use |
|---|---|---|
| `--pg-v13-space-1` | 4px | Icon gaps, dot margins |
| `--pg-v13-space-2` | 8px | Inline chips, tight stacks |
| `--pg-v13-space-3` | 12px | Card internal small gaps |
| `--pg-v13-space-4` | 16px | Card padding (compact) |
| `--pg-v13-space-5` | 20px | Card padding (default) |
| `--pg-v13-space-6` | 24px | Card padding (comfortable) |
| `--pg-v13-space-8` | 32px | Between cards in a band |
| `--pg-v13-space-10` | 40px | Band internal top padding |
| `--pg-v13-space-12` | 48px | Between subsections |
| `--pg-v13-space-14` | 56px | **Band gap** (evolved from 42px section-gap) |
| `--pg-v13-space-16` | 64px | Command center band separation |
| `--pg-v13-space-20` | 80px | Hero breathing room |

### Band system

```
┌─ Band A: Hero (64px below previous) ─────────────────┐
│  [KPI] [KPI] [KPI] [KPI]     ← 32px gap between     │
└──────────────────────────────────────────────────────┘
         ↕ 56px
┌─ Band B: Attention (56px below) ─────────────────────┐
│  [Decision] [Decision]       ← 8px gap between       │
└──────────────────────────────────────────────────────┘
         ↕ 56px
┌─ Band C: Narrative (56px below) ─────────────────────┐
│  [Chart card — full width]                             │
└──────────────────────────────────────────────────────┘
```

**Rule:** Tight inside bands. Loose between bands. Never uniform 42px everywhere — that flattens hierarchy.

### Canvas padding (preserve v13)

| Mode | Max width | Horizontal pad |
|---|---|---|
| narrative (Home, Desk) | 960px | 48px → 24px mobile |
| workspace (Work, Campaign) | 1080px | 48px → 20px mobile |
| dashboard (Performance) | 1160px | 48px → 16px mobile |
| settings (Agreement) | 920px | 48px → 20px mobile |

---

## 7. Elevation, radius, shadows, borders

### Border radius (preserve v13)

| Token | Value | Use |
|---|---|---|
| `--pg-v13-r-sm` | 8px | Chips, small buttons |
| `--pg-v13-r-md` | 12px | Rows, inputs, compact cards |
| `--pg-v13-r-lg` | 16px | Standard cards, stat-box |
| `--pg-v13-r-pill` | 999px | Status pills, CTA capsules |
| `--pg-v13-r-xl` | 24px | Modals, briefing card (hero) |

### Elevation levels

| Level | Name | Shadow | Border | Use |
|---|---|---|---|---|
| 0 | **Flush** | none | none | Row lists inside parent card |
| 1 | **Panel** | none | `--pg-v13-line-soft` | Default card, stat-box |
| 2 | **Raised** | `--pg-v13-shadow` | `--pg-v13-line-soft` | Briefing, decision, modals |
| 3 | **Floating** | shadow + blur backdrop | `--pg-v13-line` | Inspector, command palette |
| 4 | **Atmosphere** | mesh orbs | — | Command center background only |

**Rule:** Never shadow + heavy border on same element. Raised cards use shadow OR border, not both at full strength.

### Color usage

| Role | Token | Rule |
|---|---|---|
| Canvas | `--pg-v13-bg-wash` | Always — never flat white/black alone |
| Card surface | `--pg-v13-surface` or `--pg-v13-panel` | Surface for opaque; panel for glass |
| Primary text | `--pg-v13-ink` | Headlines, stat values (non-gradient) |
| Secondary | `--pg-v13-ink-soft` | Body, descriptions |
| Metadata | `--pg-v13-ink-faint` | Labels, timestamps |
| Action | `--pg-v13-blue` | Links, primary buttons, active tab |
| Peer accent | `--pg-v13-marketing/sales/support` | Top border on briefing, tab indicator |
| Attention | `--pg-v13-attention` | Decisions only — never decorative |
| Success | `--pg-v13-success` | Positive trends, live status |
| Gradient value | `--pg-v13-grad` on text | KPI hero values only — max 4 per view |
| Gradient soft | `--pg-v13-grad-soft` | Insight card backgrounds, chart fill |

### Accent gradients — when allowed

| Allowed | Forbidden |
|---|---|
| Page title (1×) | Every section heading |
| KPI values in hero band | Table cell values |
| Logo mark | Body text |
| Chart area fill (low opacity) | Card backgrounds at full saturation |
| Insight card left accent | Workflow timeline icons |

---

## 8. Card system — master rules

### Universal card anatomy

```
┌─ Optional: accent top border (2px peer color) ─────────┐
│  LABEL · mono · 10px · faint                            │
│  Primary content (headline / stat / voice)              │
│  Secondary content (caption / meta)                     │
│  [Optional: CTA row]                                    │
└─────────────────────────────────────────────────────────┘
  padding: 20–24px · radius: lg · elevation: panel or raised
```

### Priority tiers

| Tier | Visual weight | Max per viewport | Examples |
|---|---|---|---|
| **P0 Hero** | Raised, gradient stat or brief italic | 1 band (4 KPIs OR 1 briefing) | KPI band, Campaign briefing |
| **P1 Attention** | Attention border or fill | 3 | Decision, Approval |
| **P2 Insight** | grad-soft background | 2 | Recommendation, Market signal |
| **P3 Record** | Panel border | unlimited in lists | Work row, Activity row |
| **P4 Config** | settings-row pattern | unlimited | Agreement items |
| **P5 System** | hidden by default | 0 on customer default | Brain status, automation internals |

### Interaction defaults

| Property | Default | Exception |
|---|---|---|
| Clickable | Only P1–P3 with destination | KPI with href |
| Hover | translateY(-1px) + border darken | P0 briefing — no hover lift |
| Expand | Accordion within P0 briefing | Not separate page |
| Animation | 200ms ease on hover | Chart draw 600ms on enter |
| Focus | `pg-focus-premium` ring | All interactive |

---

## 9. Card catalog — every card defined

### Business KPI Card (P0)

| Attribute | Specification |
|---|---|
| **Purpose** | Single business metric with trend |
| **Priority** | P0 — hero band |
| **When** | Home, Desk, Performance top |
| **Density** | Label + value + trend chip + period — 4 lines max |
| **Interaction** | Optional href to drill-down |
| **Expand** | No |
| **Hover** | Subtle lift if clickable |
| **Animation** | Counter roll on first paint (600ms, ease-out) |
| **Visual** | stat-box pattern: panel, lg radius, gradient value |

### Today's Progress Card (P2)

| Attribute | Specification |
|---|---|
| **Purpose** | Summarize day's accomplishments quantitatively |
| **Priority** | P2 |
| **When** | Home secondary band |
| **Density** | One sentence + 2–3 micro stats |
| **Interaction** | Link to activity or peer desk |
| **Expand** | No |
| **Visual** | grad-soft left accent |

### Peer Recommendation Card (P2) — “Emma recommends”

| Attribute | Specification |
|---|---|
| **Purpose** | One proactive suggestion from peer |
| **Priority** | P2 |
| **When** | Desk, Home (single) |
| **Density** | Peer tag + one sentence + one CTA |
| **Interaction** | Primary CTA inline |
| **Expand** | No |
| **Visual** | quote-panel pattern from mockup |

### Campaign Performance Card (P0–P1)

| Attribute | Specification |
|---|---|
| **Purpose** | Post-publish campaign outcomes |
| **Priority** | P0 when live; P1 in lists |
| **When** | Performance, campaign post-approval |
| **Density** | 3 KPIs + sparkline |
| **Interaction** | Click → campaign or optimization |
| **Expand** | Chart expandable on mobile |
| **Visual** | Chart card variant |

### Live Activity Row (P3) — not a card

| Attribute | Specification |
|---|---|
| **Purpose** | Informational event narrative |
| **Priority** | P3 |
| **When** | Home feed max 6 — **not** on Desk if Inbox exists |
| **Density** | done-row pattern: dot + sentence + time |
| **Interaction** | Optional link |
| **Animation** | New items slide in 200ms |
| **Visual** | row-list bare — no card wrapper per row |

### ROI Card (P0)

| Attribute | Specification |
|---|---|
| **Purpose** | Value Peergent created — revenue or time |
| **Priority** | P0 on Home when real data exists |
| **When** | Home hero, Performance summary |
| **Density** | Single large value + comparison period |
| **Interaction** | Link to Performance |
| **Expand** | No |
| **Visual** | Hero KPI with “Attributed” micro label |
| **Rule** | **Absent when no real data** — never fake |

### Savings / Revenue / Growth Cards (P0)

Variants of Business KPI Card with fixed semantic labels:

| Variant | Label pattern | Trend |
|---|---|---|
| Revenue | `OMZET TOEGESCHREVEN` | % vs prior period |
| Savings | `TIJD BESPAARD` | hours + trend |
| Growth | `GROEI` | % with direction chip |

### Pipeline Card (P2) — Sales peer

| Attribute | Specification |
|---|---|
| **Purpose** | Pipeline value summary |
| **When** | Sales Desk, Sales Performance |
| **Density** | Total value + stage breakdown bar |
| **Visual** | Funnel progress pattern (Inspace-inspired) — horizontal bars, not CRM columns |

### Customer Needs Card (P1)

| Attribute | Specification |
|---|---|
| **Purpose** | What peer needs from customer |
| **Priority** | P1 when blocking |
| **When** | Briefing card section, Desk when blocked |
| **Density** | Max 3 items; title + reason + blocking badge |
| **Interaction** | CTA per item when action exists |
| **Visual** | attention-soft panel items inside briefing |

### Approval Card (P1) — Decision variant

| Attribute | Specification |
|---|---|
| **Purpose** | Single judgment request |
| **Priority** | P1 |
| **When** | Desk, Inbox, Briefing footer |
| **Density** | decision pattern: title + context + one primary button |
| **Interaction** | Approve / defer |
| **Visual** | attention border-left 2.5px |

### Alert Card (P1)

| Attribute | Specification |
|---|---|
| **Purpose** | Urgent but non-decision signal |
| **When** | Rare — integration failure, deadline |
| **Density** | One line + action |
| **Visual** | attention-soft, no gradient |

### Opportunity Card (P2)

| Attribute | Specification |
|---|---|
| **Purpose** | Proactive business opportunity |
| **When** | Market tab, Desk insight slot |
| **Density** | Insight sentence + “Explore →” |
| **Visual** | grad-soft + sparkle icon (peer-colored) |

### Brain Status Card (P5) — customer hidden

| Attribute | Specification |
|---|---|
| **Purpose** | Internal readiness — dev/diagnostic only |
| **When** | Never on customer default; dev mode only |
| **Visual** | Muted panel, mono labels |

### Automation Status Card (P3)

| Attribute | Specification |
|---|---|
| **Purpose** | “Autonomous · live” ambient confidence |
| **When** | Desk presence strip, Performance header — **not** standalone card |
| **Density** | Inline: pulse dot + mono label |
| **Visual** | Not a card — presence chip |

### Market Signal Card (P2)

| Attribute | Specification |
|---|---|
| **Purpose** | External change worth knowing |
| **When** | Market tab, Desk compact (max 2) |
| **Density** | Observation + source + optional chart spark |
| **Visual** | Panel with peer accent top border |

### Briefing Card (P0) — unified

| Attribute | Specification |
|---|---|
| **Purpose** | Peer handover — org, peer, or campaign scope |
| **Priority** | P0 |
| **Variants** | Org (Home narrative), Peer (Desk), Campaign (approval) |
| **When** | See Command Center / Workspace sections |
| **Density** | Campaign: max 720px; 2-min readable |
| **Expand** | Sections accordion inside card — **never** slideshow |
| **Visual** | brief pattern: raised, peer top border, italic voice |

### Timeline Card (P5) — drill-down only

| Attribute | Specification |
|---|---|
| **Purpose** | How peer executed — process depth |
| **When** | Collapsed disclosure only |
| **Density** | Max 10 steps; human labels |
| **Expand** | `<details>` default closed |
| **Visual** | row-list; no card elevation |

### Chart Card (P1–P2)

| Attribute | Specification |
|---|---|
| **Purpose** | One chart, one story |
| **When** | Home (1), Performance (primary), Market (optional) |
| **Density** | Label + chart + one insight sentence |
| **Interaction** | Period toggle; optional drill-down |
| **Animation** | Path draw 600ms on enter; respect reduced-motion |
| **Visual** | surface card, 24px padding, chart fills width |

### Insight Card (P2) — “NOVA-INZICHT” pattern

| Attribute | Specification |
|---|---|
| **Purpose** | Single AI-generated business insight |
| **When** | Desk, Performance, Home |
| **Density** | Label `PEER-INZICHT` + one paragraph + link |
| **Visual** | grad-soft background, purple tint, sparkle |

### Empty State Card (P2)

| Attribute | Specification |
|---|---|
| **Purpose** | Peer voice when no data |
| **When** | Any empty zone |
| **Density** | Peer proposal + one delegate CTA |
| **Visual** | Centered, no border, italic brief style |

### Loading State

| Attribute | Specification |
|---|---|
| **Purpose** | Maintain spatial memory during fetch |
| **Visual** | Skeleton matching target card geometry — shimmer 1.5s |
| **Rule** | Never spinner alone on command centers |

---

## 10. Motion philosophy

### North star

> Motion confirms the workforce is alive — never that the software is busy.

### Principles

| # | Principle | Implementation |
|---|---|---|
| M1 | **Subtle over flashy** | Max 400ms; no bounce on data |
| M2 | **Purposeful** | Every animation answers “what changed?” |
| M3 | **Reduced motion respect** | `prefers-reduced-motion: reduce` disables all non-essential |
| M4 | **Enter only** | Charts and counters animate on first paint — not on every re-render |
| M5 | **Presence = pulse** | Working peers: 2s opacity pulse on status dot |
| M6 | **Hover = affordance** | 1px lift on clickable cards only |
| M7 | **Transition = context** | Page changes: 200ms fade; modals: 250ms slide-up mobile |

### Motion tokens (extend v13)

| Token | Value | Use |
|---|---|---|
| `--pg-v13-motion-instant` | 80ms | Hover color |
| `--pg-v13-motion-fast` | 120ms | Button press |
| `--pg-v13-motion-normal` | 200ms | Card hover, tab switch |
| `--pg-v13-motion-moderate` | 250ms | Modal enter |
| `--pg-v13-motion-slow` | 400ms | Rail collapse |
| `--pg-v13-motion-chart` | 600ms | Chart path draw |
| `--pg-v13-motion-counter` | 800ms | KPI roll (ease-out) |
| `--pg-v13-motion-pulse` | 2000ms | Presence dot loop |

### Specific animations

| Element | Animation |
|---|---|
| **KPI counter** | Count from 0 → value over 800ms, ease-out — only first mount |
| **Chart line** | SVG stroke-dashoffset draw, 600ms |
| **Chart area fill** | Fade in after line completes, 200ms |
| **Card hover** | `translateY(-1px)` + border-color shift, 200ms |
| **New activity row** | `translateY(8px)` + fade in, 200ms |
| **Presence dot** | Scale 1 → 1.15 → 1, opacity 0.7 → 1, 2s loop |
| **Gradient mesh** | Ultra-slow orb drift, 60s loop — command centers only |
| **Briefing expand** | Accordion height + chevron rotate, 250ms spring |
| **Tab underline** | Slide to active tab, 200ms ease |
| **Decision approve** | Button → success check morph, 300ms — then card fade out |

### Forbidden motion

- Parallax scroll
- Confetti / celebration particles
- Loading spinners on full page (use skeleton)
- Infinite shimmer on static content
- Slide deck page transitions for briefing
- Bouncing badges

---

## 11. Command Center philosophy — Home redefined

### The 15-second test

On `/home`, within 15 seconds the customer knows:

| Question | Answer location | Visual |
|---|---|---|
| What happened? | Hero KPI band + activity band | Numbers + 3–6 rows |
| What is happening? | Team pulse | Peer chips with presence |
| What requires me? | Needs-you band (max 2) | Decision cards |
| What opportunities exist? | One insight card | P2 grad-soft |
| What value is Peergent creating? | ROI / Revenue KPI | P0 gradient stat |

### Home band layout (v13.1)

```
Presence: Good morning · Thursday 6 August          [Inbox badge →]

Band A — Hero KPI (4 cards)
  [Revenue/value] [Work completed] [Attention count] [Trend direction]

Band B — Needs you (0–2 decision cards)
  → Link: "All items in Inbox (N)"

Band C — Suggested start (1 recommendation card)
  Emma / peer voice · one CTA

Band D — Team pulse (peer row)
  [Emma · working] [Mason · idle] [Zara · waiting] → tap to Desk

Band E — Trend (1 chart card)
  30-day value curve · one sentence insight beneath

Band F — Recent movement (max 6 activity rows)
  Informational only · not actionable
```

### What Home is not

- Not a work list (that's Work tab)
- Not a workflow timeline
- Not a dashboard of every peer's internals
- Not fake demo metrics in production

### Home briefing variant (optional P0)

When org-level narrative exists, a **Briefing Card** may replace Band C:

- Italic peer-voice summary of the week
- Top accent: org gradient (not peer color)
- Max 3 lines visible; expand for detail

---

## 12. Peer Workspace philosophy

### Desk — peer command center

Mirror Home structure at peer scope:

```
Band A — Presence + hero outcome
  "Emma is preparing your Q2 campaign" + one KPI

Band B — Decisions (max 3)

Band C — Active work summary (3–5 work rows — not full Work tab)

Band D — Recommendation (1 insight card)

Band E — Done today (2–3 done-rows with impact labels)

Band F — Market signal (1 card) → link to Market tab
```

### Work / Results / Content / Market / Agreement

| Tab | Canvas mode | Lead element | Card mix |
|---|---|---|---|
| **Work** | workspace | Outcome-framed work rows | P3 work rows grouped by business state |
| **Results** | dashboard | KPI hero band + chart | P0 KPI + P1 chart + P2 insights |
| **Content** | workspace | Filter bar + content grid | P3 content preview cards |
| **Market** | dashboard | Market read narrative | P2 signal cards + optional chart |
| **Agreement** | settings | Overview rows | P4 config rows → drill-down |

### Future peers — same system

| Peer | Desk hero KPI | Work entity | Results lead metric |
|---|---|---|---|
| Marketing | Active campaigns | Campaigns | ROAS / leads |
| Sales | Pipeline value | Deals | Revenue influenced |
| Finance | Close progress | Reports | Savings / accuracy |
| HR | Open roles | Requisitions | Time-to-hire |
| Support | Queue health | Tickets | CSAT |
| Planner | Milestones on track | Plans | On-time % |
| Analytics | Reports delivered | Dashboards | Decisions influenced |
| CEO | Org health score | Summaries | Strategic KPIs |

Same tabs. Same bands. Same card taxonomy. Different data templates.

---

## 13. Chart philosophy

### One chart, one story

| Rule | Detail |
|---|---|
| **Max charts per view** | 1 on command centers; 3 on Performance |
| **Chart types allowed** | Line (trends), bar (comparison), horizontal bar (funnel progress) |
| **Forbidden** | Pie charts, donut charts, gauge walls, sparkline grids without context |
| **Color** | Single series: `--pg-v13-blue`; multi: blue, indigo, purple at 80% opacity |
| **Fill** | Area fill at 12% opacity max — grad-soft direction |
| **Axes** | Minimal — faint grid, no axis labels unless user toggles detail |
| **Period** | Default 30d; toggle 7d / 90d inline |
| **Empty** | Peer voice: “Nog geen data — Emma heeft X nodig om trends te tonen.” |
| **Integration** | Chart lives inside Chart Card — never bare SVG in page |

### Inspace principle applied

Inspace shows one search performance chart with a one-line insight beneath. Peergent copies the **ratio**: 70% chart, 30% insight — not the layout.

### Chart + KPI relationship

- KPIs answer “how much?”
- Chart answers “compared to when?”
- Insight answers “so what?”

All three belong together in one band — never separate pages for the same metric.

---

## 14. Animation philosophy — workforce alive

### Alive indicators

| Signal | Visual | Where |
|---|---|---|
| Peer working | Pulse dot on presence | Desk, Home team pulse |
| Campaign live | Success dot + “Live sinds …” | Work row, campaign collapsed header |
| Autonomous mode | `AUTONOMOUS · LIVE` mono chip | Desk, Performance |
| New activity | Row slide-in | Home feed |
| Optimization running | Soft gradient shift on chart card border | Campaign post-publish |

### Not alive (avoid false energy)

- Spinning loaders
- Typing indicators when nothing is generating
- Pulsing CTAs
- Animated mesh on every page (command centers only)

---

## 15. Information hierarchy

### Global priority stack

```
1. Attention (decisions)        — P1 cards, amber
2. Value (KPIs, ROI)            — P0 cards, gradient stats
3. Narrative (briefing, insight)— P0/P2, peer voice
4. Active work (summary)        — P3 rows
5. Trends (charts)              — P1 chart cards
6. Activity (informational)     — P3 rows, max 6
7. Records (content, history)   — P3/P4, on demand
8. Process (timeline, evidence) — P5, drill-down only
```

### Typography maps to priority

| Priority | Type treatment |
|---|---|
| 1–2 | stat 28px or title grad |
| 3 | brief 17px italic |
| 4–5 | headline 22px or body 15px |
| 6–7 | caption 13px |
| 8 | label 10px mono — collapsed |

---

## 16. Component hierarchy

### Page composition stack

```
PgVisionShell
├── Mesh atmosphere (command centers only)
├── Rail (org | peer scope)
├── Presence strip (peer scope)
├── Subnav tabs (peer scope)
└── Canvas (mode-specific max-width)
    ├── Band A (hero)
    ├── Band B (attention)
    ├── Band C (narrative)
    ├── Band D (supporting)
    └── Band E (records / optional)
```

### Component mapping (evolve Pg* to v13.1)

| v13.1 card | Pg component (target) | v13 CSS class (interim) |
|---|---|---|
| Business KPI | `PgKpiCard` | `.stat-box` |
| Briefing | `PgBriefingCard` (new) | `.brief` |
| Decision / Approval | `PgDecisionCard` | `.decision` |
| Insight | `PgInsightCard` | `.quote-panel` |
| Work row | `PgWorkRow` (new) | `.work-row` |
| Activity row | `PgActivityRow` | `.done-row` |
| Chart | `PgChartCard` (new) | — |
| Config | `PgSettingsRow` | `.settings-row` |
| Record list | `PgRowList` | `.row-list` |

**Migration path:** CSS classes remain valid during transition; components wrap classes, then tokens move to components.

### Buttons (preserve v13)

| Variant | Class | Use |
|---|---|---|
| Primary | `.pg-v13-btn` | One per viewport region |
| Ghost | `.pg-v13-btn--ghost` | Secondary |
| Small | `.pg-v13-btn--sm` | Inline actions |
| Link | `.pg-v13-btn--link` | Tertiary disclosure |

### Status indicators

| State | Visual | Never |
|---|---|---|
| Live / success | Green dot + label | Green entire card |
| Working | Blue pulse dot | Blue progress bar as hero |
| Waiting / attention | Amber dot + label | Amber alarm copy |
| Idle | Faint dot | Grey disabled appearance |
| Blocked | Amber left border on row | Red unless failure |

Human labels: “Live sinds 12 maart” not `PUBLISHED`. “Wacht op jou” not `AWAITING_REVIEW`.

### Tables

Minimal use. Prefer row-list. When tables required (Performance comparison):

- No outer border grid
- Row dividers only (`--pg-v13-line-soft`)
- Mono labels in header row
- Right-align numbers
- Max 6 columns

### Dropdowns / filters

- Pill toggles preferred over native `<select>` on dashboard surfaces
- Filter bar: `PgFilterBar` — ghost buttons, active = filled panel

---

## 17. Dashboard philosophy

### Dashboard definition

A dashboard answers **“how are we doing?”** — not **“what are the steps?”**

### Dashboard surfaces

| Surface | Dashboard? | Lead |
|---|---|---|
| Home | Yes — org dashboard | KPI hero |
| Desk | Yes — peer dashboard | Peer KPI + decisions |
| Performance | Yes — full dashboard | Charts + KPIs |
| Market | Partial | Signals + optional trend |
| Work | No — workspace list | Outcome rows |
| Campaign default | No — handover | Briefing card |
| Agreement | No — settings | Config rows |

### Dashboard band recipe

```
KPI row (4 max) → primary chart → insight → recommendations (2 max)
```

Never: workflow timeline, step counts, brain readiness, automation logs.

---

## 18. Migration strategy

### Phase V1 — Token unification (week 1)

- Document `--pg-v13-*` as single source in `peergent-vision-v13.css`
- Alias `--pg-color-*` → v13 equivalents in foundation layer
- Add new type tokens (display, headline, stat-sm)
- Add band spacing tokens (space-14, space-16)

### Phase V2 — Card components (weeks 2–4)

- Implement `PgBriefingCard`, `PgWorkRow`, `PgChartCard` wrapping existing CSS
- Refactor `PgKpiCard` to v13.1 stat-box spec
- Add Storybook / dev preview entries in `/dev/vision-v13-foundation`

### Phase V3 — Home evolution (weeks 4–6)

- Rebuild `IedereenView` on band system + card components
- Remove fake demo KPIs from production path
- Integrate `PgTrendChart` in Chart Card

### Phase V4 — Desk evolution (weeks 6–8)

- Rebuild `VisionDeskView` on band system
- Deduplicate Home/Desk content per PX Foundation rules

### Phase V5 — Campaign briefing (weeks 8–10)

- Unified `PgBriefingCard` for campaign approval
- Remove slideshow inspector pattern
- Timeline Card collapsed by default

### Phase V6 — Performance polish (weeks 10–11)

- Chart Card standardization
- KPI + insight pairing

### Phase V7 — Shell extension (weeks 11–12)

- Apply Vision shell to Inbox, Team, Company
- Single motion layer app-wide

### Phase V8 — Documentation & QA (week 12)

- Vision v13 screenshots updated
- 390px / 1440px verification pass
- Compare every Office route to mockup.html

---

## 19. Priority implementation order

| Order | Deliverable | Depends on | Outcome |
|---|---|---|---|
| **1** | Token + spacing unification | — | One language |
| **2** | Card catalog components (P0–P3) | 1 | Reusable building blocks |
| **3** | Motion tokens + presence pulse | 1 | Workforce feels alive |
| **4** | Home band rebuild | 1, 2, 3 | 15-second org arrival |
| **5** | Briefing Card unified | 2 | Signature moment fixed |
| **6** | Desk band rebuild | 2, 4 | Peer arrival matches Home quality |
| **7** | Chart Card + Performance | 2 | Dashboard quality |
| **8** | Work row reframing | 2 | Business language on lists |
| **9** | Timeline Card drill-down | 2 | Process hidden by default |
| **10** | Shell + motion everywhere | 1–3 | No chrome breaks |
| **11** | Second peer template (Sales) | 6–8 | System scales |
| **12** | Mockup + screenshot refresh | all | Vision v13 authority updated |

---

## 20. Relationship to other documents

| Document | Relationship |
|---|---|
| **PX Foundation** | IA and product philosophy — this doc implements visually |
| **Vision v13 mockup.html** | Visual authority — evolved, not replaced |
| **peergent-vision-v13.css** | Token implementation target |
| **Design System v1** | Converges into v13.1; Pg* components adopt v13.1 card specs |
| **Experience Constitution** | Emotional principles — calm, premium, trust |
| **Product Bible** | Law 9: typography before containers; Law 47: one thing matters |

---

## Appendix A — Quick reference card picker

| I need to show… | Use card | Tier |
|---|---|---|
| A number with trend | Business KPI | P0 |
| Emma's recommendation | Peer Recommendation | P2 |
| Approve this campaign | Briefing + Approval footer | P0 + P1 |
| Something needs you | Decision / Approval | P1 |
| What Emma did (info) | Live Activity Row | P3 |
| Active campaign | Work Row | P3 |
| 30-day trend | Chart Card | P1 |
| Competitor moved | Market Signal | P2 |
| How Emma decided (depth) | Timeline Card (collapsed) | P5 |
| Integration settings | Config Row | P4 |
| Nothing yet | Empty State | P2 |

---

## Appendix B — Anti-patterns (v13.1)

- Slideshow briefing (Previous/Next)
- Three KPI systems on one page
- settings-row for KPIs
- Gradient on every heading
- Workflow as hero
- Fake metrics
- Spinner without skeleton
- Brain status on customer UI
- HubSpot form grid on Company
- Copying Inspace sidebar layout verbatim

---

*Vision v13.1 evolves the foundation. The mesh, the rail, the peers, the gradients — all stay. What changes is discipline: bands not blocks, cards not rows, outcomes not workflows, calm not noise.*

*This document is the visual blueprint for every Peergent screen for the next 12 months.*
