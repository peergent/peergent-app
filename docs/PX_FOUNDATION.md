# PX Foundation — Product Experience Architecture

**Status:** Founding document for frontend product experience  
**Authority:** Subordinate to Experience Constitution, Product Bible, Vision v13 reference  
**Scope:** 12-month blueprint for customer-facing UX — architecture only, no implementation  
**Date:** August 2026

---

## How to use this document

Project Brain is stable. Intelligence layers are built. This document defines the **product experience that sits on top of them**.

When a screen feels wrong, read this document. When two routes compete, read this document. When deciding whether to show a workflow step or a business outcome, read this document.

**Do not optimize the existing experience.** Build the experience Peergent deserves.

---

## 1. Current Product

### What Peergent is today (customer-facing)

Peergent currently ships **three parallel customer experiences** that share the same backend intelligence but present it differently:

| Experience | Routes | Shell | Status |
|---|---|---|---|
| **Vision v13 Office** | `/home`, `/office/[peerId]/*` | `PgVisionShell` / `PgOfficeShell` | Intended future |
| **2.0 App shell** | `/inbox`, `/team`, `/company`, `/settings` | `PgAppShell` + `PgNav` | Phase 2–5 canonical |
| **V17 Team Studio** | `/team/[peerId]/*` | `V17CustomerShell` | Legacy, still live |

Additionally: `/hq` (second command-center entry), marketing landing at `/`, onboarding at `/website-intelligence`.

### Current navigation

**Vision shell (Home + Office peers)**

- Left rail: brand, theme, **Iedereen** (org overview), peer roster chips
- Peer mode: presence strip + six tabs — **Desk · Work · Results · Content · Market · Settings**
- Footer: command palette stub, user avatar

**PgNav shell (Inbox, Team roster, Company)**

- Four items: Command Center → `/home`, Inbox, Team, Company
- Mobile bottom nav mirrors these
- **Problem:** `/home` renders Vision shell, not PgAppShell. Navigating Home ↔ Inbox switches entire chrome.

**V17 Team shell**

- Four tabs: Today · Work · Results · Settings
- Legacy routes (`/waiting`, `/review`, `/projects`, `/content`) redirect or alias

**Route manifest gap:** `/office/*` is not classified in `route-manifest.ts`. `/team/*` is still marked canonical in implementation docs while Office code treats Team as legacy.

### Current page hierarchy

```
Org level
├── /home (IedereenView) — attention, done today, team pulse, trends
├── /hq — separate landing (duplicate entry)
├── /inbox — attention queue
├── /team — peer roster (PgAppShell)
└── /company — knowledge forms (PgAppShell)

Peer level (Office — intended)
├── /office/[peerId] — Desk
├── /office/[peerId]/work — state-grouped work list
│   └── /work/campaigns/[id] — campaign drill-down
├── /office/[peerId]/performance — metrics + charts
├── /office/[peerId]/content — content library
├── /office/[peerId]/market — market reading
└── /office/[peerId]/agreement — settings / working agreement

Peer level (Team — legacy, parallel)
├── /team/[peerId] — Today (waiting, done, next)
├── /team/[peerId]/work → /projects/[id]
├── /team/[peerId]/results — KPI cards
└── /team/[peerId]/settings — settings hub
```

Depth is reasonable. **Parallel trees** destroy clarity.

### Current information hierarchy (typical patterns)

| Surface | What leads | What follows | Dominant register |
|---|---|---|---|
| Home | Attention items (2 max) | Done today, team, trends | Mixed business + workflow |
| Desk | Decisions needing approval | Campaign buckets, in-flight, done | Workflow + some outcomes |
| Work | Blocked on you → Moving → Queued | Stage labels, channel tags | **Workflow** |
| Campaign | Title + status | Briefing (if mounted), lifecycle bar, timeline, deliverables | **Workflow** |
| Performance | Hero metrics | Charts, provider cards, recommendations | **Business** |
| Inbox | Flat attention queue | — | Attention |
| Company | Form sections | Confidence gaps | Admin |

**Pattern:** Outcome framing exists on Performance and partially on Home. Everywhere else, **process vocabulary wins**.

### Current component hierarchy

```
Shell (Vision | App | V17)
  → Presence / briefing strip
    → Subnav tabs
      → Section labels (pg-v13-sec-label)
        → Rows, settings-row pattern, or inline cards
          → Modals / inspectors for drill-down
```

**Two visual systems in parallel:**

1. Design-system `Pg*` components (64 components: `PgKpiCard`, `PgTrendChart`, `PgReviewBar`, etc.)
2. Vision pages using raw `pg-v13-*` CSS classes and bespoke markup

Many foundation components exist but are **unused** on live paths (`CommandCenter`, `PgSuggestedStart`, `RevenueAttributionPanel`, `PgReviewBar` on Office routes).

### What works today

- **Delegation-first creation** — “Laat Emma een campagne bedenken”
- **Vision v13 visual language** — when applied consistently
- **Office six-destination peer model** — Desk, Work, Results, Content, Market, Agreement scales to future peers
- **Performance tab** — closest to business dashboard intent
- **Inbox** — single-purpose attention queue
- **Executive Briefing concept** — correct signature moment (execution needs refinement)
- **Presence strip + peer identity** — colleague framing
- **Agreement tab** — consolidates scattered settings

### What the customer actually experiences

A capable AI system wearing **three different product skins**, with workflow steps, blocked states, and evidence modals surfacing more prominently than business outcomes. The product feels like **operating software** more often than **managing a workforce**.

---

## 2. Problems

### Structural problems

| # | Problem | Impact |
|---|---|---|
| P1 | **Three nav systems, two shells** | Home ↔ Inbox breaks continuity; users cannot build spatial memory |
| P2 | **Dual canonical trees** (Office vs Team) | Same data, different UX; links rewrite at boundaries; engineering and design duplicate effort |
| P3 | **Home identity crisis** | `IedereenView` (live), `CommandCenter` (built, unused), `FigmaHomePort` (reference), `/hq` (alternate landing) |
| P4 | **Office absent from route manifest** | IA drift; Team still documented as canonical |
| P5 | **Component adoption gap** | Pg metrics/charts exist; Vision uses inline CSS; two quality bars |

### Information problems

| # | Problem | Where |
|---|---|---|
| P6 | **Work ↔ Live Activity overlap** | Home “completed today” = Desk “done today” = Team Today done rows = CommandCenter Live Activity |
| P7 | **Attention duplicated** | Home waiting, Desk decisions, Team Today waiting, Inbox — same items, four surfaces |
| P8 | **Three “plans” on one campaign** | Emma intro steps, briefing execution phases, 10-step workflow timeline |
| P9 | **Three status systems on campaign** | Lifecycle bar, workflow timeline, briefing status pill |
| P10 | **Executive Briefing surrounded by workflow** | Briefing is business moment; page below is pipeline UI |
| P11 | **“Alles bekijken” regresses UX** | Summary card → slideshow inspector; context switch from colleague to analyst |
| P12 | **Guided mode downgrades experience** | No briefing; approval queue instead of handover |

### Vocabulary problems

| # | Problem | Example |
|---|---|---|
| P13 | **Workflow language on customer surfaces** | Blocked, Queued, Workflow, Deliverables, Evidence, Executive summary |
| P14 | **Internal layer names visible** | Research, Reasoning, Readiness, strategy run diagnostics |
| P15 | **English product jargon in Dutch colleague voice** | Deliverables, Workflow, Review centre |
| P16 | **Mono status lines** | Uppercase technical labels instead of human status |

### Business-outcome problems

| # | Problem | Impact |
|---|---|---|
| P17 | **No live org dashboard** | Home trends often empty; demo path fakes KPIs (violates product rules) |
| P18 | **ROI dormant** | `RevenueAttributionPanel` built but not on default Home path |
| P19 | **Work cards show stage, not value** | “Planning” not “+340 clicks this week” |
| P20 | **Done today shows tasks, not impact** | “Strategy completed” not “Campaign ready — est. 12 leads/week” |
| P21 | **No cross-peer value view** | Cannot answer “how much is my workforce creating?” |

### Trust problems

| # | Problem | Impact |
|---|---|---|
| P22 | **Fake demo metrics on Home** | Undermines premium positioning when prospect sees demo |
| P23 | **Dev diagnostics on customer pages** | Strategy failure shows provider/token details |
| P24 | **Inconsistent review UX** | Phase 0 `PgReviewBar` on Team; modals on Office |
| P25 | **Briefing gate invisible failure** | Campaign page looks unchanged when briefing doesn't mount — user thinks product is broken |

### Scale problems

| # | Problem | Impact |
|---|---|---|
| P26 | **Marketing-only depth** | Sales, Support, Finance peers have no Office implementation |
| P27 | **Company page is admin forms** | Not a business context command center |
| P28 | **No peer-agnostic PX system** | Each new peer risks bespoke screens |

---

## 3. Vision

### The product Peergent deserves

When a customer opens Peergent every morning, they feel:

> **"My digital colleagues already started. I know what moved, what needs me, and what value we're creating — in under sixty seconds."**

Not:

> "I need to check six tabs, three status bars, and a workflow timeline to understand if Emma finished."

### Benchmark principles (not layouts)

Extracted from [Inspace](https://inspace.io), Linear, Notion, Stripe, Vercel, Arc, Raycast:

| Product | Principle to extract |
|---|---|
| **Inspace** | **Outcomes first.** KPI cards lead. AI status is ambient (“Autonomous · live”). Work queue is secondary. One insight card, not a process log. Business language: pages live, traffic, citations — not pipeline stages. |
| **Linear** | **Density with clarity.** One primary action per view. Keyboard-native depth. Status is subtle, never the hero. |
| **Notion** | **Document calm.** Generous whitespace. One column of truth. Expand for depth; never force pagination for default view. |
| **Stripe** | **Confidence through precision.** Numbers are real or absent. No fake charts. Empty states honest. |
| **Vercel** | **Premium developer-grade polish.** Typography hierarchy, restrained color, motion with purpose. |
| **Arc / Raycast** | **Spatial consistency.** One chrome everywhere. Context switches feel intentional, not jarring. |

**Peergent synthesis:** Inspace's outcome framing + Notion's calm + Linear's focus + Stripe's honesty + Vision v13's brand (cosmic gradients, peer presence, premium dark/light surfaces).

### Three-year experience picture

```
Morning → Home (org command center)
         → One glance: value created, attention needed, team pulse
         → Tap peer → Desk (peer command center)
         → One glance: what Emma did, what she recommends, one decision
         → Drill down only when curious

Never → Workflow timeline as default
Never → Three status systems
Never → Same item on Home, Desk, and Inbox
```

Every future peer (Sales, Support, Finance, HR, CEO) inherits the same **Desk → Work → Results → Content → Market → Agreement** architecture with peer-specific content, not peer-specific navigation.

---

## 4. Product Philosophy

### Peergent is NOT

- A dashboard (metrics for their own sake)
- An AI chatbot (conversation as primary interface)
- An automation platform (zapier with an avatar)
- A workflow builder (steps, stages, evidence chains as hero content)

### Peergent IS

**The AI Workforce Operating System.**

Users manage intelligent digital colleagues. Colleagues manage the work.

### The five daily questions

Every screen must help answer at least one:

1. **What happened today?**
2. **What did my colleagues accomplish?**
3. **What is happening right now?**
4. **What requires my attention?**
5. **What value is Peergent creating?**

If a screen answers none of these, it should not exist as a primary destination.

### Business, not workflows

| Customer language | System language (hidden) |
|---|---|
| "Emma prepared your campaign" | Strategy + planning + decision graph complete |
| "12 leads this week" | Conversion events from performance layer |
| "Waiting on your budget approval" | Required customer input blocks node X |
| "Live since March 12" | Published state + schedule metadata |
| "Emma recommends shifting budget to LinkedIn" | Optimization planning output |

The intelligence can be deep. The presentation must be shallow.

### Bounded autonomy (experience expression)

- Colleagues act freely within scope
- They stop precisely where judgment belongs to the customer
- The product surfaces **decisions**, not **steps**
- Approval is a handover moment, not a QA queue

---

## 5. Information Architecture

### Target IA (12-month)

```
ORGANIZATION
/home                    Org Command Center — morning arrival
/inbox                   Attention queue — actionable only
/team                    Workforce roster — entry to peers
/company                 Business context — confidence, not forms

PEER (repeat per peer type)
/office/[peerId]                    Desk — peer command center
/office/[peerId]/work               Active work — outcome-framed list
/office/[peerId]/work/[entity]/[id] Entity drill-down (campaign, deal, ticket…)
/office/[peerId]/performance        Outcomes dashboard
/office/[peerId]/content            Published work + review
/office/[peerId]/market               External signals + competitive read
/office/[peerId]/agreement            Working agreement + connections

ACCOUNT
/settings                 User + org preferences
```

### Page classification

| Type | Purpose | Examples | Nav visibility |
|---|---|---|---|
| **Command center** | Arrival + orientation + one primary action | Home, Desk | Primary |
| **Workspace zone** | Ongoing work in a domain | Work, Content, Performance | Secondary tab |
| **Drill-down** | Single entity depth | Campaign detail, content detail, provider detail | Never in nav |
| **Attention** | Items requiring judgment | Inbox, inline decision cards | Primary (Inbox) or embedded (Desk) |
| **Records** | Historical reference | Content library, agreement sections | Secondary tab |
| **Admin** | Configuration | Company gaps, connections | Tertiary / Agreement |

### Deprecate

| Route / surface | Reason |
|---|---|
| `/team/[peerId]/*` | Superseded by Office; maintain redirects only |
| `/hq` as separate landing | Merge into `/home` |
| `CommandCenter.tsx` duplicate stack | Merge useful parts into Home; delete duplicate |
| `FigmaHomePort` on production path | Dev/reference only |
| Marketing workspace tab chrome on customer paths | Legacy studio shell |

### Duplicate information — resolution rules

| Information | Single owner | Others show |
|---|---|---|
| Actionable attention | **Inbox** (org) + **Desk decisions** (peer) | Home shows max 2 with link to Inbox |
| Done today (org) | **Home** | Desk shows peer-scoped only |
| Done today (peer) | **Desk** | Not on Home, not on Work |
| In-flight work | **Desk** (summary) | Work tab is full list |
| Live activity narrative | **Home** (max 6, informational) | Not on Desk, not on Work |
| Campaign status | **Campaign drill-down** | Desk/Work show one-line outcome label |
| Performance metrics | **Performance tab** | Desk shows one hero metric + link |
| Recommendations | **Desk** (peer) + **Performance** (optimization) | Not in workflow timeline |
| Briefings | **Home** (org), **Desk** (peer), **Campaign** (approval) | Never duplicated |

### Where each audit dimension lands

| # | Audit question | Target state |
|---|---|---|
| 1 | Navigation | Single Vision shell everywhere; PgNav merged into Vision rail |
| 2 | Page hierarchy | Org → Peer Desk → Zone → Drill-down |
| 3 | Information hierarchy | Attention → Outcomes → Recommendations → Records |
| 4 | Component hierarchy | Shell → Command band → Content bands → Rows |
| 5 | Duplicates | See resolution rules above |
| 6 | Workflow dominates | Collapse to drill-down; never default |
| 7 | Customer doesn't care | Hidden behind “How [Peer] decided” — one path |
| 8 | Dashboards missing | Home hero KPIs, Performance, cross-peer value |
| 9 | KPI cards | Home, Desk, Performance, post-publish campaign |
| 10 | Graphs | Home trends, Performance, Market over time |
| 11 | ROI | Home hero, Performance top, weekly narrative |
| 12 | Business impact | Work cards, Done today, Briefing, Results |
| 13 | Recommendations | Desk, Performance, single Home suggestion |
| 14 | Activity feeds | Home only (informational); Inbox owns actionable |
| 15 | Briefings | Home org, Desk peer, Campaign approval — three moments, no overlap |
| 16 | Simplify | Campaign detail, Work list, Company, Team Today (deprecate) |
| 17 | Enrich | Home, Performance, Market, Desk |
| 18 | Command centers | Home (org), Desk (peer) |
| 19 | Peer workspaces | Office six tabs |
| 20 | Drill-down only | Campaign, content, provider, agreement section, review item |

---

## 6. Navigation Architecture

### Target: one shell, two scopes

**Single chrome:** `PgVisionShell` everywhere (Home, Inbox, Team, Company, Office).

**Org scope (no peer selected)**

| Rail item | Route | Role |
|---|---|---|
| Iedereen | `/home` | Org command center |
| Inbox | `/inbox` | Attention (badge) |
| Team | `/team` | Workforce roster |
| Company | `/company` | Business context |
| [Peer chips] | `/office/[peerId]` | Enter peer scope |
| Settings | `/settings` | Account |

**Peer scope (peer selected)**

| Tab | Route | Role |
|---|---|---|
| Desk | `/office/[peerId]` | Peer command center |
| Work | `/office/[peerId]/work` | Active work list |
| Results | `/office/[peerId]/performance` | Outcomes |
| Content | `/office/[peerId]/content` | Published work |
| Market | `/office/[peerId]/market` | External signals |
| Agreement | `/office/[peerId]/agreement` | Working agreement |

**Back to org:** Rail “Iedereen” always visible; breadcrumb optional on drill-down.

### Navigation principles

1. **Never more than 6 peer tabs** — scales to all peer types
2. **Inbox is org-level only** — peer attention lives on Desk
3. **Drill-down never adds nav items** — back link + context header
4. **Command palette (future)** — Raycast-style jump to any entity
5. **No shell switch on navigation** — critical fix from current state

### What to remove from navigation

- `/hq` as separate destination
- V17 four-tab Team shell
- PgAppShell sidebar as parallel system
- Legacy marketing workspace tabs (Review, Performance as top-level studio tabs)

---

## 7. Command Center Philosophy

### Definition

A command center answers the **arrival question** in sixty seconds. It is not a dashboard of everything. It is the **editorial front page** of that scope.

### Org Command Center (`/home`)

**Purpose:** “What happened in my organization while I was away?”

**Structure (top → bottom):**

1. **Greeting + date** — calm, no animation noise
2. **Hero KPI band** — 3–4 cards max: value created, work completed, attention count, trend direction
   - Real data or honest empty — never fake demo numbers in production
3. **Needs you** — max 2 items, link to Inbox for rest
4. **One recommendation** — single suggested start (`PgSuggestedStart` pattern)
5. **Team pulse** — peer status chips: working / waiting / idle — tap to Desk
6. **Trend chart** — one graph, one story (30-day value or visibility curve)
7. **Recent movement** — max 6 informational items, not actionable (Inbox owns action)

**Not on Home:** Full work lists, workflow timelines, campaign detail, duplicate Done today from every peer.

### Peer Command Center (`/office/[peerId]` Desk)

**Purpose:** “What is [Peer] doing for me right now?”

**Structure:**

1. **Presence line** — human status: “Emma is preparing your Q2 campaign”
2. **Hero outcome** — one metric or progress indicator tied to active work
3. **Decisions** — max 3, inline approve/defer — not a queue page
4. **Active work summary** — 3–5 rows, outcome labels, link to Work tab
5. **One recommendation** — Emma suggests next best action
6. **Done today** — 2–3 items with impact, not task names
7. **Market signal** — one insight, link to Market tab

**Not on Desk:** Full workflow timeline, deliverable lists, lifecycle bars, duplicate of Work tab.

### Command center vs workspace zone

| Command center | Workspace zone |
|---|---|
| Arrival + orientation | Sustained work |
| Max 2 screens of content | Scrollable depth allowed |
| One primary action | Multiple actions OK |
| Summary only | Full lists |
| Updated on return | Updated on demand |

---

## 8. Peer Workspace Philosophy

### Definition

A peer workspace is the **operating environment for one digital colleague**. It should feel like entering Emma's office — not opening a project management tool.

### Six zones (peer-agnostic)

| Zone | Question it answers | Peer examples |
|---|---|---|
| **Desk** | What's happening? | Emma: campaign status. Sales peer: pipeline pulse. |
| **Work** | What's active? | Campaigns, sequences, tickets, requisitions |
| **Results** | What's the impact? | ROAS, leads, CSAT, cost saved |
| **Content** | What was produced? | Ads, emails, docs, scripts |
| **Market** | What's changing outside? | Competitors, trends, signals |
| **Agreement** | How do we work together? | Autonomy, brand, connections |

### Work zone — reframed

**Current:** Blocked on you → Blocked elsewhere → Moving → Queued → Finished

**Target:** Outcome-framed rows:

| Instead of | Show |
|---|---|
| “Planning” | “Campaign strategy ready for approval” |
| “Blocked on you” | “Emma needs your budget confirmation” |
| “Queued” | “Scheduled · launches March 18” |
| “Moving” | “Live · +12 leads this week” |

State grouping may remain internally; **customer-visible labels are business events**.

### Campaign drill-down — reframed

**Default view:** Emma's handover card (briefing) — one screen, one decision.

**Collapsed by default:** Lifecycle bar, workflow timeline, deliverable inventory.

**One depth path:** “How Emma decided” — progressive disclosure, same visual language, no slideshow.

**Post-approval:** Briefing collapses to one line; page becomes **update feed** from Emma, not dashboard.

### Scaling to future peers

| Peer | Desk hero | Work entities | Results KPIs |
|---|---|---|---|
| Marketing (Emma) | Campaign pulse | Campaigns | ROAS, leads, reach |
| Sales | Pipeline pulse | Deals, sequences | Revenue, conversion |
| Support | Queue pulse | Tickets | CSAT, resolution time |
| Finance | Close pulse | Reports, reconciliations | Cash impact, savings |
| HR | Hiring pulse | Requisitions, candidates | Time-to-hire |
| CEO | Org pulse | Cross-peer summaries | Strategic KPIs |

Same shell. Same tab names. Different content templates.

---

## 9. Design Principles

### PX principles (derived from brand moodboard + benchmarks)

1. **Calm over urgent** — never manufacture crisis; competence handles things
2. **One thing matters** — each screen state has one primary action
3. **Typography before containers** — hierarchy through type, not boxes
4. **Whitespace is premium** — if in doubt, remove; Inspace-level breathing room
5. **Real or absent** — no fake metrics, no placeholder charts (Stripe rule)
6. **Colleague voice** — peers speak; system labels never appear on customer surfaces
7. **Confidence, not surveillance** — show outcomes and recommendations, not process logs
8. **Expand, don't paginate** — default view is complete; depth is optional
9. **Recognizable without logo** — Peergent gradients, peer presence, editorial layout
10. **2026 modern** — soft shadows, rounded corners, subtle motion, no dashboard clutter

### Anti-patterns (explicitly forbidden)

- Slide deck navigation (1/N, Previous/Next) on default views
- Three status indicators for one entity
- Mono uppercase status lines as primary communication
- English product jargon on Dutch surfaces
- Grey undifferentiated panels with equal visual weight
- Workflow timelines as hero content
- Duplicate Emma messaging on same page
- Dev diagnostics on customer paths
- HubSpot-style CRM form grids on Company page
- Linear-style issue states on business work cards

### Visual foundation (from moodboard)

- **Palette:** Dark navy base, purple-to-blue gradients, cyan accents, green for positive state
- **Logo:** Gradient P mark — use sparingly; peer avatars carry identity on peer surfaces
- **Typography:** Satoshi / design-system scale — editorial headings, calm body
- **Motifs:** Cosmic/neural gradients for hero moments only — not decorative everywhere
- **Peer presence:** Named colleagues with role tags — never “AI Agent #3”

---

## 10. Card System

### Card taxonomy

| Card type | Purpose | Max per screen | Example |
|---|---|---|---|
| **KPI card** | Single metric + trend + period | 4 in hero band | “1,840 clicks · +12% this month” |
| **Decision card** | One judgment request | 3 on Desk | “Approve Q2 campaign direction” |
| **Work row** | One active entity summary | Unlimited in lists | Campaign name + outcome label |
| **Insight card** | One recommendation | 1–2 | “Shift budget to LinkedIn” |
| **Activity row** | Informational event | 6 max on feed | “Emma published 3 pages” |
| **Content card** | Produced artifact preview | Grid in Content tab | Ad preview, email subject |
| **Briefing card** | Handover moment | 1 | Executive briefing |
| **Empty card** | Peer voice proposal | 1 | “Emma is ready to start — delegate a campaign” |

### Card anatomy (KPI)

```
┌─────────────────────────────┐
│ LABEL (mono, faint, 10px)   │
│ Value (24–32px, semibold)   │
│ Trend chip (+12% ↑ green)   │
│ Period (12px, soft)         │
└─────────────────────────────┘
```

Reference: Inspace hero cards — label quiet, number loud, trend secondary.

### Card anatomy (Decision)

```
┌─────────────────────────────┐
│ [Peer avatar] Peer · Role   │
│ Decision title (16px)       │
│ One-line context (14px)     │
│ [Primary CTA]  [Defer]      │
└─────────────────────────────┘
```

### Card rules

1. **One idea per card** — never combine KPI + workflow step + CTA
2. **Cards don't nest more than one level** — drill-down opens new surface
3. **Equal visual weight = failure** — hero cards larger; metadata smaller
4. **Borders soft** — `pg-v13-line-soft`; shadows minimal
5. **Use PgKpiCard, PgDecisionCard, PgInsightCard** — stop inline CSS one-offs

---

## 11. Dashboard System

### Dashboard hierarchy

| Level | Dashboard | Primary metrics |
|---|---|---|
| **Org** | Home | Total value created, work completed, attention count, team utilization |
| **Peer** | Performance tab | Peer-specific KPIs (Marketing: traffic, leads, ROAS) |
| **Entity** | Campaign post-publish | Campaign performance, optimization recommendation |
| **Provider** | Performance provider drill-down | Channel-specific metrics |

### What belongs on dashboards

- KPI cards with real trends
- One primary chart per screen (not chart walls)
- Recommendation panel (1–3 items)
- Period selector (7d / 30d / 90d)
- Honest empty states with peer voice

### What does NOT belong

- Workflow step completion counts
- Internal confidence scores as hero metrics
- Decision counts (“6 decisions”)
- Brain layer readiness indicators
- Fake demo data

### Graph placement

| Surface | Graph type | Story |
|---|---|---|
| Home | Area/line — 30-day value curve | “Your workforce created X over time” |
| Performance | Multi-series by channel | “Where results come from” |
| Market | Competitive trend (future) | “How you compare” |
| Campaign optimization | Before/after or trend | “Since launch” |

Use existing `PgTrendChart`, `PgChartFrame` — adopt consistently.

### ROI placement

| Surface | ROI expression |
|---|---|
| Home hero | “€X attributed · Y hours saved” (when real) |
| Performance top | ROI summary card |
| Desk | One-line weekly impact |
| Weekly email (future) | Narrative ROI paragraph |

Retire `RevenueAttributionPanel` as orphan — integrate or remove.

---

## 12. Spacing System

### Density targets

| Surface type | Density | Reference |
|---|---|---|
| Command center | **Low** — 24–32px section gaps | Inspace home |
| Workspace list | **Medium** — 16–24px between rows | Linear list |
| Drill-down detail | **Medium-low** — briefing card max 720px | Notion document |
| Dashboard | **Medium** — KPI band tight, chart breathes | Inspace analytics |
| Settings / Agreement | **Medium** — form sections spaced | Stripe settings |

### Layout widths

| Content | Max width | Rationale |
|---|---|---|
| Briefing / narrative | 720px | Readable prose |
| Command center content | 960px | KPI band + sections |
| Full dashboard | 1200px | Charts need width |
| Settings forms | 640px | Form readability |

### Section rhythm

```
Section label (pg-v13-sec-label)
  16px gap
Content block
  32–48px gap
Next section label
```

**Current problem:** Sections stack with uniform small gaps — feels dense and same-weight. Command centers need **large gaps between bands**, small gaps within bands.

### Mobile (390px)

- KPI cards stack 1-column
- CTAs full-width
- Briefing card full-bleed with 16px padding
- Peer tabs scroll horizontal
- No horizontal overflow on any surface

---

## 13. Component Inventory

### Keep and adopt widely

| Component | Use on |
|---|---|
| `PgVisionShell` | All customer routes |
| `PgOfficeShell` | Peer scope pages |
| `PgKpiCard` | Home, Desk, Performance |
| `PgTrendChart` / `PgChartFrame` | Home, Performance, Market |
| `PgDecisionCard` | Home, Desk, Inbox |
| `PgInsightCard` | Desk, Performance, Market |
| `PgStatusPill` | Human status labels |
| `PgPeerPresence` | Desk, campaign working state |
| `PgReviewBar` | All review surfaces (Office + Team) |
| `PgInspector` | Evidence / depth drill-down |
| `PgEmptyState` | Peer voice empty states |
| `PgSuggestedStart` | Home single recommendation |
| `PgActivityRow` | Home recent movement |
| `PgMarketInsights` | Desk, Market |
| `PgMorningNarrative` | Home greeting band |

### Merge / refactor

| Component | Action |
|---|---|
| `CommandCenter.tsx` stack | Merge KPI + activity into Home; delete duplicate |
| `IedereenView` inline markup | Rebuild on Pg* components |
| `CampaignWorkflowTimeline` | Move to drill-down only; collapse always |
| `CampaignLifecycleBar` | Remove from default campaign view |
| `OfficeExecutiveBriefingInspector` | Replace slideshow with in-card expansion |
| `PgAppShell` + `PgNav` | Merge into Vision shell rail |
| `V17CustomerShell` | Deprecate after Office cutover |

### Retire from customer surfaces

| Component / pattern | Reason |
|---|---|
| `CampaignStrategyDevDiagnostics` | Developer-only |
| Slideshow briefing navigation | Analyst UX, not colleague UX |
| Mono uppercase status as hero | Technical register |
| `pg-v13-settings-row` for everything | Overused; flatten hierarchy |
| Fake demo KPIs in production paths | Trust violation |
| Marketing workspace tab layout | Legacy studio |

### Missing components (to design)

| Component | Purpose |
|---|---|
| `PgBriefingCard` | Unified handover (Home org, Desk peer, Campaign) |
| `PgUpdateFeed` | Post-approval campaign/entity updates from peer |
| `PgWorkRow` | Outcome-framed work list item |
| `PgHeroBand` | KPI row container for command centers |
| `PgDepthDrawer` | Single “how peer decided” progressive disclosure |
| `PgValueSummary` | Cross-peer ROI band for Home |
| `PgPeerTabBar` | Unified peer navigation |

---

## 14. Migration Roadmap

### Phase PX-0 — Foundation (weeks 1–2)

**Goal:** One shell, one IA document, no new features.

- Unify on `PgVisionShell` for Inbox, Team, Company
- Add `/office/*` to route manifest; mark `/team/[peerId]/*` deprecated
- Merge `/hq` into `/home`
- Remove fake demo KPIs from production Home path
- Document link rewrite boundary (`toOfficeHref`) as official

### Phase PX-1 — Home command center (weeks 3–5)

**Goal:** Morning arrival feels like Inspace — outcomes, not tasks.

- Hero KPI band (real data or honest empty)
- Needs you (max 2) → Inbox
- Single recommendation
- Team pulse with Office links
- One trend chart
- Recent movement (6 max, informational)
- Retire `CommandCenter` duplicate

### Phase PX-2 — Desk command center (weeks 5–7)

**Goal:** Peer arrival is Emma's office, not a mini-dashboard.

- Presence-first layout
- Decisions inline (max 3)
- Active work summary (not full Work duplicate)
- One recommendation + one market signal
- Done today with impact labels
- Remove duplicate sections that mirror Home

### Phase PX-3 — Work zone reframing (weeks 7–9)

**Goal:** Work list shows business events, not pipeline states.

- Outcome-framed row labels
- Merge or differentiate Desk campaign overview vs Work list clearly
- Remove “blocked elsewhere” from customer view
- Channel tags demoted to metadata

### Phase PX-4 — Campaign experience (weeks 9–12)

**Goal:** Campaign page is handover, not workflow tool.

- Emma owns page hierarchy (briefing first, title secondary)
- Collapse lifecycle bar, timeline, deliverables by default
- Unified briefing card (`PgBriefingCard`)
- Single depth path (no slideshow inspector)
- Post-approval update feed
- `PgReviewBar` on Office review path
- Guided mode gets briefing quality

*Uses existing Executive Briefing data — no Brain changes.*

### Phase PX-5 — Performance & Results (weeks 12–14)

**Goal:** Results tab is the outcome home.

- Adopt PgKpiCard + PgTrendChart consistently
- ROI summary at top
- Recommendations panel
- Deprecate Team Results route

### Phase PX-6 — Company & Agreement (weeks 14–16)

**Goal:** Business context, not admin forms.

- Company: confidence KPI + gaps as cards, not form grid
- Agreement: keep overview → section pattern (already good)

### Phase PX-7 — Inbox & attention (weeks 16–17)

**Goal:** One attention system.

- Inbox owns all actionable items org-wide
- Home/Desk show previews only
- Deduplicate waiting items across surfaces

### Phase PX-8 — Team deprecation (weeks 17–20)

**Goal:** One peer tree.

- Redirect all `/team/[peerId]/*` to Office equivalents
- Remove V17CustomerShell from customer paths
- Remove marketing workspace customer chrome

### Phase PX-9 — Multi-peer scale (weeks 20–28)

**Goal:** PX system works for peer #2.

- Abstract peer content templates
- Sales peer Office implementation (Desk + Work + Results)
- Cross-peer value summary on Home

### Phase PX-10 — Polish & verification (weeks 28–32)

- Vision v13 comparison pass every surface
- 390px + 1440px verification
- Accessibility audit
- Remove all remaining workflow-hero patterns

---

## 15. Recommended Implementation Order

Priority is **experience coherence before new peer types before Creative Layer**.

| Order | Initiative | Depends on | Outcome |
|---|---|---|---|
| **1** | Single shell (PX-0) | — | Navigation stops breaking |
| **2** | Home command center (PX-1) | PX-0 | Morning arrival works |
| **3** | Campaign handover (PX-4) | PX-0 | Signature moment fixed |
| **4** | Desk command center (PX-2) | PX-1 | Peer arrival works |
| **5** | Work reframing (PX-3) | PX-4 | Work list speaks business |
| **6** | Attention dedup (PX-7) | PX-1, PX-2 | Inbox/Home/Desk stop competing |
| **7** | Performance adoption (PX-5) | PX-0 | Charts/KPIs consistent |
| **8** | Company reframe (PX-6) | PX-0 | Business context premium |
| **9** | Team deprecation (PX-8) | PX-1–7 | One product, not three |
| **10** | Multi-peer templates (PX-9) | PX-8 | Scale beyond Marketing |
| **11** | Creative Layer UX (post-PX-4) | Campaign handover | Creative review as business choice |
| **12** | Pixel Brain UX (post-PX-9) | Multi-peer | Visual craft stays hidden |
| **13** | Performance Brain UX (post-PX-5) | Results dashboard | Narrative before charts |

### What NOT to do before PX-4 completes

- Creative Brain customer surfaces
- New peer types without template system
- More Brain layers exposed to customer
- Feature parity with HubSpot/Linear workflows
- Optimizing individual screens in isolation

### Success criteria (12-month)

1. Customer opens Home → understands org state in 60 seconds
2. Customer opens Desk → understands peer state in 30 seconds
3. Customer opens Campaign → makes approval decision in 2 minutes
4. Zero duplicate attention items across Home/Desk/Inbox
5. Zero workflow timelines on default views
6. One shell, one peer tree, one review pattern
7. Real metrics or honest empty — never fake
8. Second peer type shipped with <20% new UI code
9. Vision v13 recognizable on every Office surface
10. Product feels like Inspace in **information quality**, not layout copy

---

## Appendix A — Current vs Target (quick reference)

| Surface | Current lead | Target lead |
|---|---|---|
| Home | Waiting items | Hero KPIs + needs you |
| Desk | Decisions + campaign buckets | Presence + hero outcome |
| Work | Blocked/Moving/Queued | Outcome-framed work rows |
| Campaign | Title + workflow | Emma briefing handover |
| Performance | Metrics (good) | ROI + recommendations |
| Inbox | Queue (good) | Queue (keep) |
| Company | Form grid | Confidence KPI + gaps |

## Appendix B — Inspace principles applied to Peergent

From [inspace.io](https://inspace.io) and reference screenshots:

| Inspace pattern | Peergent equivalent |
|---|---|
| “Autonomous · live” ambient status | Peer presence strip on Desk |
| KPI cards: pages live, traffic, citations | Home hero + Performance tab |
| One insight card (“NOVA-INZICHT”) | Desk recommendation + Home suggested start |
| Funnel progress bars | Campaign progress as outcome, not internal stages |
| Queue as secondary panel | Work tab, not Desk or Home |
| Business language throughout | Colleague copy rules — no workflow jargon |
| Calm whitespace, card hierarchy | PX spacing system + card taxonomy |

## Appendix C — Relationship to existing docs

| Document | Relationship |
|---|---|
| Experience Constitution | Emotional principles — PX Foundation implements them |
| Product Bible | 100 laws — PX Foundation operationalizes daily judgment |
| Vision v13 mockup + screenshots | Visual authority — PX Foundation defines when/how to apply |
| IMPLEMENTATION.md | Engineering phases — PX phases supersede UI portions |
| Project Brain docs | Stable — not in scope for PX |

---

*This document is the blueprint for Peergent's product experience layer. Implementation sprints reference PX phase numbers. No Brain architecture changes required.*
