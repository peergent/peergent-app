# Marketing Workspace Wireframes

**Status:** UX architecture — PX-23  
**Authority:** Translates [Marketing Workspace Bible](./MARKETING_WORKSPACE_BIBLE.md) only. Does not modify, extend, or reinterpret frozen founding documents.  
**Scope:** Information architecture, ASCII wireframes, interaction flows. No code, components, CSS, or implementation.  
**Audience:** Product, design, implementation — before any Marketing Workspace build sprint.

---

## How to read this document

When an entrepreneur clicks **Marketing**, they enter **Emma's office**. Every wireframe below describes **information**, not UI components.

**Frozen references:** Constitution · Product Bible · PX Foundation · Vision v13 · DESIGN_SYSTEM.md · Marketing Workspace Bible.

**Global shell (all Marketing pages):**

```
+--------------------------------------------------------------------------------+
|  ORG SHELL (Vision v13 — frozen)                                                |
|  [← Home]  [Inbox *]  [Team]  [Company]              [Emma · Marketing ●]    |
+--------------------------------------------------------------------------------+
|  PEER SCOPE — Emma · Marketing                                                  |
|  [ Workspace ]  [ Work ]  [ Content ]  [ Performance ]  [ Workflow ]  [ Settings ] |
|      ● badge if decisions pending (peer-scoped)                                 |
+--------------------------------------------------------------------------------+
|                                                                                 |
|                         << PAGE CONTENT BELOW >>                                |
|                                                                                 |
+--------------------------------------------------------------------------------+
```

**Spacing rhythm (all pages):** 8 · 12 · 16 · 24 · 32 · 40 px — same as Home Command Center (PX-21).

**Band omission rule:** Empty bands do not render. No placeholder shells.

---

## Navigation map

```
Marketing (Emma)
├── Workspace          ← default landing
├── Work
├── Content
├── Performance
├── Workflow
└── Settings
    ├── Working Agreement
    ├── Knowledge & Brand
    │   ├── Brandbook
    │   ├── Tone of Voice
    │   ├── Goals
    │   └── Memory
    ├── Connections
    │   ├── Integrations
    │   └── Accounts
    ├── Approval Rules
    ├── Budget
    └── Notifications (+ Advanced)

Drill-downs (never in tab bar):
├── Work → Engagement / Campaign
├── Content → Asset preview
├── Workspace / Campaign / Content → Review (approval)
└── Workflow → Evidence summary (power)
```

---

# 1. WORKSPACE

## 1.1 Purpose

**Why this page exists:**  
Workspace is Emma's **front door** — the peer-scoped command center. It answers *"What's happening with marketing right now, and do I need to be involved?"* in one arrival.

**When entrepreneurs visit:**  
- Default landing every time they click Marketing  
- Morning check-in  
- Quick pulse between meetings  
- After notification that Emma needs a decision  

**When they should NOT visit:**  
- To browse every draft → Content  
- To analyze weekly trends in depth → Performance  
- To inspect how Emma reasoned → Workflow  
- To connect integrations → Settings  

Delegation-first entrepreneurs may **never leave this page**.

---

## 1.2 Business Question

**Primary question (one):**  
*"Is my marketing under control — and do I need to act?"*

Secondary questions answered in passing:  
- What did Emma accomplish recently?  
- Is marketing creating value?  
- What is Emma working on?  
- What does Emma recommend?

---

## 1.3 Information Hierarchy

Top → bottom. Order is **non-negotiable** (Bible Band A–G).

| Order | Band | Why this position |
|-------|------|-------------------|
| 1 | **A — Presence** | Establishes *who* the entrepreneur is talking to and *what Emma is doing now* — emotional anchor before data |
| 2 | **B — Executive Briefing** | Emma's voice — what moved since last visit; trust moment before metrics |
| 3 | **C — Business Impact** | Answers *"Is it working?"* — outcomes before tasks |
| 4 | **D — Decisions** | Attention only when needed — never above outcomes unless blocking |
| 5 | **E — Recommendation** | Forward-looking — after context, before records |
| 6 | **F — Active Work Summary** | Preview of portfolio — links to Work, not a duplicate list |
| 7 | **G — Recent Outcomes** | Closure — proof of progress today; calm, not a log |

**Why Decisions is below Business Impact:** Entrepreneurs need confidence that marketing is working before being asked to judge. Urgent decisions still appear above Recommendation and records.

**Why Workflow is absent:** Process erodes executive calm on arrival (Bible Ch. 13).

---

## 1.4 ASCII Wireframe — Workspace (full)

```
+--------------------------------------------------------------------------------+
|  WORKSPACE TAB                                                    [Emma ● Live] |
+--------------------------------------------------------------------------------+

┌─ BAND A — PRESENCE ────────────────────────────────────────────────────────────┐
│                                                                                 │
│  [Avatar]  Emma · Marketing          [ Autonomous · live ]                     │
│                                                                                 │
│  "I'm optimizing your LinkedIn campaign based on last week's results."         │
│   Then: draft email sequence for Product launch.                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      ↕ 40px

┌─ BAND B — EXECUTIVE BRIEFING ──────────────────────────────────────────────────┐
│                                                                                 │
│  Briefing van Emma                                                              │
│  ─────────────────────────────────────────────────────────────────────────     │
│  Goedemorgen.                                                                   │
│                                                                                 │
│  Deze week heb ik momentum opgebouwd op LinkedIn. Early signals zijn          │
│  positief in de Benelux-founder doelgroep.                                     │
│                                                                                 │
│  ✓  LinkedIn-campagne live gezet — 3 posts gepubliceerd                        │
│  ✓  Concurrentie-analyse Q2 afgerond                                           │
│  ✓  E-mailsequence voor Product launch voorbereid                              │
│                                                                                 │
│  € 4.280 beïnvloede omzet · 12 leads · 1 wacht op jou                         │
│                                                      [ Volledige briefing → ]  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      ↕ 40px

┌─ BAND C — BUSINESS IMPACT ─────────────────────────────────────────────────────┐
│                                                                                 │
│  Beïnvloede omzet                                    Laatste 30 dagen          │
│  ─────────────────────────────────────────────────────────────────────────     │
│                                                                                 │
│  [ +14% ▲ ]                                                                     │
│  € 12.400                                                                       │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    📈  revenue influenced (line, 30d)                  │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  LinkedIn dreef 62% van leads deze maand — sterker dan Meta in jouw segment.   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      ↕ 40px

┌─ BAND D — DECISIONS (conditional — omitted when count = 0) ──────────────────┐
│                                                                                 │
│  Wacht op jou                                                      [ 🔔 3 ]    │
│  ─────────────────────────────────────────────────────────────────────────     │
│                                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐              │
│  │ [icon]           │  │ [icon]           │  │ [icon]           │              │
│  │ LinkedIn-        │  │ Campagneplan     │  │ Support-         │              │
│  │ budgetvoorstel   │  │ zomeractie       │  │ antwoord         │              │
│  │ bevestigen       │  │ goedkeuren       │  │ goedkeuren       │              │
│  │                  │  │                  │  │                  │              │
│  │ Dan kan ik spend │  │ Emma kan dan     │  │ Klant krijgt     │              │
│  │ verhogen.        │  │ publiceren.      │  │ vandaag antwoord.│              │
│  │ 4 uur geleden    │  │ 2 uur geleden    │  │ 6 uur geleden    │              │
│  │ Bekijk →         │  │ Bekijk →         │  │ Bekijk →         │              │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘              │
│                                                                                 │
│                                          Nog 2 items in Inbox →                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      ↕ 40px

┌─ BAND E — RECOMMENDATION ──────────────────────────────────────────────────────┐
│                                                                                 │
│  Emma beveelt aan                                                               │
│  ─────────────────────────────────────────────────────────────────────────     │
│                                                                                 │
│  Verhoog LinkedIn-budget met 20%                                               │
│                                                                                 │
│  ROAS is 2,1× hoger op LinkedIn dan Meta over de laatste 14 dagen.             │
│                                                                                 │
│                                                      [ Bekijk aanbeveling → ]  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      ↕ 40px

┌─ BAND F — ACTIVE WORK SUMMARY ─────────────────────────────────────────────────┐
│                                                                                 │
│  Waar Emma aan werkt                                                            │
│  ─────────────────────────────────────────────────────────────────────────     │
│                                                                                 │
│  LinkedIn Q2 Groei          Live · 3 posts deze week · ● LinkedIn              │
│  Google Ads — Search        In progress · keyword expansion                    │
│  Website CRO — Homepage     Waiting for you · landingspagina-review            │
│  E-mail automation          Quiet · gepland 12 aug                             │
│  Concurrentie monitoring    In progress · wekelijkse read                      │
│                                                                                 │
│                                                      [ Al het werk → ]         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      ↕ 40px

┌─ BAND G — RECENT OUTCOMES ─────────────────────────────────────────────────────┐
│                                                                                 │
│  Vandaag afgerond                                                               │
│  ─────────────────────────────────────────────────────────────────────────     │
│                                                                                 │
│  ● Campagnestrategie goedgekeurd          Beïnvloedde € 1,2k pipeline   →     │
│  ● 3 LinkedIn posts gepubliceerd          847 impressies                →     │
│  ● Concurrentierapport afgerond           —                               →     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

```

### Workspace — compact variant (nothing to decide)

When Band D is empty and briefing is quiet:

```
┌─ BAND A — PRESENCE ────────────────────────────────────────────────────────────┐
│  Emma · Marketing · Working                                                     │
│  "Alles loopt volgens plan. Ik werk verder aan LinkedIn Q2 Groei."             │
└─────────────────────────────────────────────────────────────────────────────────┘
        ↕ 40px
┌─ BAND C — BUSINESS IMPACT ───────────────── (B may collapse to one line) ────────┐
│  ...                                                                            │
└─────────────────────────────────────────────────────────────────────────────────┘
        ↕ 40px
┌─ BAND F — ACTIVE WORK SUMMARY ─────────────────────────────────────────────────┐
│  ...                                                                            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

Bands E and G omitted when empty. Never show empty Decision shell.

---

## 1.5 Interaction Flow — Workspace

```
Arrive at Marketing
    → lands on Workspace (always)

Band D card "Bekijk →"
    → Review surface (full deliverable)
    → Approve / Send back with feedback
    → Returns to Workspace OR Campaign (context preserved)
    → Review bar visible until complete

Band E "Bekijk aanbeveling →"
    → Performance (scroll to recommendation) OR inline expansion on Workspace
    → Single CTA to accept/dismiss/snooze (power: dismiss)

Band F row click
    → Campaign / Engagement drill-down

Band F "Al het werk →"
    → Work tab

Band G outcome "→"
    → Campaign drill-down OR Content (if publish outcome)

Band C "Koppel Google Analytics" (empty state)
    → Settings → Connections

Header Inbox badge (org shell)
    → Inbox (all peers) — not duplicate of Band D
```

---

## 1.6 Empty State — Workspace

**Scenario:** New customer, no campaigns, no integrations.

```
┌─ BAND A — PRESENCE ────────────────────────────────────────────────────────────┐
│  Emma · Marketing · Beschikbaar                                                 │
│  "Ik ben klaar om je eerste campagne te bedenken op basis van je doelen."      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─ BAND B — EXECUTIVE BRIEFING ──────────────────────────────────────────────────┐
│  Briefing van Emma                                                              │
│  ─────────────────────────────────────────────────────────────────────────     │
│  We zijn net begonnen. Ik heb je website en merk doorgenomen — hier is        │
│  wat ik al weet, en wat ik nog nodig heb om te starten.                        │
│                                                                                 │
│  ✓  Merkcontext geladen vanuit je website                                      │
│  ○  Nog geen live campagnes                                                   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─ BAND C — BUSINESS IMPACT ──────────────────────────────────────────────────────┐
│  Beïnvloede omzet                                                               │
│  ─────────────────────────────────────────────────────────────────────────     │
│  Nog geen data — koppel Google Analytics om marketingbijdrage te meten.        │
│                                                      [ Naar koppelingen → ]    │
└─────────────────────────────────────────────────────────────────────────────────┘

(Bands D, E, G omitted)

┌─ BAND F — ACTIVE WORK SUMMARY ─────────────────────────────────────────────────┐
│  Waar Emma aan werkt                                                            │
│  ─────────────────────────────────────────────────────────────────────────     │
│  Nog geen actief werk.                                                         │
│                                                      [ Start eerste campagne ] │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Voice:** Emma, calm, one CTA. No fake metrics.

---

## 1.7 Power User Mode — Workspace

| Default hidden | Power disclosure |
|----------------|------------------|
| Full briefing history | "Volledige briefing →" expands archive |
| All active work rows (5 max) | Work tab for full portfolio + search |
| Recommendation dismiss/snooze | Power: snooze 7d, mark not relevant |
| Band C period toggle | 7d / 30d / 90d on chart |
| Footer stats in briefing | Always visible for power users (setting) |
| Link to Workflow | Never on Workspace hero — Workflow tab only |

---

# 2. WORK

## 2.1 Purpose

**Why this page exists:**  
Work is Emma's **portfolio of responsibilities** — everything she actively owns across channels and engagements. Not a campaign database. Not a task manager.

**When entrepreneurs visit:**  
- Weekly review of marketing portfolio  
- Find a specific engagement (LinkedIn, Google Ads, CRO, etc.)  
- See what's live vs waiting vs quiet  
- Enter campaign drill-down  

**When they should NOT visit:**  
- Daily check-in → Workspace  
- Review a draft visually → Content  
- Analyze ROI trends → Performance  
- See pipeline stages → Workflow  

---

## 2.2 Business Question

**Primary question (one):**  
*"What is Emma responsible for — and what's the state of each piece of work?"*

---

## 2.3 Information Hierarchy

| Order | Information | Why |
|-------|-------------|-----|
| 1 | Page title + optional search | Orientation — portfolio, not inventory |
| 2 | **Needs you** group | Decisions first — business urgency |
| 3 | **In progress** group | Momentum — Emma is actively working |
| 4 | **Live** group | What's in market right now |
| 5 | **Quiet** group | Scheduled/paused — visible but de-emphasized |
| 6 | **Completed** (collapsed) | History without clutter |

Groups are **business states**, not Brain stages. Rows are **engagements** — campaigns, ongoing programs, monitoring workstreams.

---

## 2.4 ASCII Wireframe — Work

```
+--------------------------------------------------------------------------------+
|  WORK TAB                                                                       |
+--------------------------------------------------------------------------------+

  Waar Emma aan werkt                                    [ 🔍 Zoeken... ]

  ─── Wacht op jou ───────────────────────────────────────────────────────────

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  Website CRO — Homepage                                                      │
  │  Waiting for you · landingspagina-review nodig                              │
  │  ● Web                                    Updated 2 uur geleden        →   │
  └─────────────────────────────────────────────────────────────────────────────┘

  ─── In uitvoering ──────────────────────────────────────────────────────────

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  LinkedIn Q2 Groei                                                           │
  │  Emma optimaliseert content op basis van vorige week                         │
  │  ● LinkedIn                               Updated 34 min geleden       →   │
  └─────────────────────────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  Google Ads — Search                                                         │
  │  Keyword expansion en advertentietesten                                      │
  │  ● Google                                 Updated 3 uur geleden        →   │
  └─────────────────────────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  Concurrentie monitoring                                                     │
  │  Wekelijkse markt- en concurrentie-read                                      │
  │  ● Intel                                  Updated gisteren              →   │
  └─────────────────────────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  SEO — Organisch groei                                                       │
  │  Contentcluster en technische fixes prioriteren                              │
  │  ● SEO                                    Updated 2 dagen geleden      →   │
  └─────────────────────────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  Audience optimalisatie                                                      │
  │  ICP-verfijning op basis van leadkwaliteit                                   │
  │  ● Multi                                  Updated 3 dagen geleden      →   │
  └─────────────────────────────────────────────────────────────────────────────┘

  ─── Live ───────────────────────────────────────────────────────────────────

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  Meta Retargeting — Q2                                                       │
  │  Live sinds 4 aug · € 240 spend deze week · ROAS 2,4×                      │
  │  ● Meta                                   Updated 1 uur geleden        →   │
  └─────────────────────────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  E-mail nurture — Product launch                                             │
  │  Live · sequence 2 van 4 actief                                            │
  │  ● Email                                  Updated 5 uur geleden        →   │
  └─────────────────────────────────────────────────────────────────────────────┘

  ─── Rustig ─────────────────────────────────────────────────────────────────

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  Landing page — Webinar aug                                                  │
  │  Gepland · gaat live 12 aug                                                  │
  │  ● Web                                    Updated 4 dagen geleden      →   │
  └─────────────────────────────────────────────────────────────────────────────┘

  ─── Afgerond (laatste 30 dagen) ─────────────────────────── [ ▼ uitklappen ] ─

  (collapsed — 4 items hidden)

```

### Work row anatomy (information only)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Title — business name of engagement]                                       │
│  [One status sentence — human language, optional Emma voice]                 │
│  [Channel dot(s) — max 3]              [Relative time]              [ → ]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Never on row face:** percent bars, stage chips, draft counts as hero, work unit IDs.

---

## 2.5 Interaction Flow — Work

```
Work tab
    → Scan groups top to bottom
    → Click row → Campaign / Engagement drill-down

Search
    → Filters rows inline (title + channel + status text)

"Needs you" row
    → Drill-down → Band Decision on campaign page
    OR direct to Review if single deliverable

Completed expand
    → Shows last 30 days
    → Power: filter by channel, date range

← Workspace via tab or org shell
```

---

## 2.6 Empty State — Work

```
  Waar Emma aan werkt

  ─────────────────────────────────────────────────────────────────────────────

  Emma heeft nog geen actief werk in marketing.

  "Wil je dat ik een campagne voorstel op basis van je doelen?"

                              [ Laat Emma een campagne bedenken ]

  ─── Blocked variant ─────────────────────────────────────────────────────────

  Emma kan niet publiceren tot LinkedIn is gekoppeld.

                              [ Koppel LinkedIn → Settings ]
```

---

## 2.7 Power User Mode — Work

| Default | Power |
|---------|-------|
| 5 groups, completed collapsed | Expand completed · filter by channel · sort by updated |
| Row → drill-down only | Row expand inline: budget snippet, draft count link to Content |
| Search by title | Search + filter chips: Channel · Status · Date |
| — | Export portfolio summary (future) |
| — | Link "See pipeline position →" per row (Workflow tab, pre-filtered) |

---

# 3. CONTENT

## 3.1 Purpose

**Why this page exists:**  
Content is Emma's **creative studio** — preview-first, publishing-first. What the market actually sees.

**When entrepreneurs visit:**  
- Review what was published this week  
- Preview drafts before approving  
- Check scheduled posts  
- Audit brand consistency visually  

**When they should NOT visit:**  
- Approve strategy (not content yet) → Workspace / Campaign  
- See if marketing is working → Performance  
- Manage integrations → Settings  

---

## 3.2 Business Question

**Primary question (one):**  
*"What has Emma created — and what's live in market?"*

---

## 3.3 Information Hierarchy

| Order | Information | Why |
|-------|-------------|-----|
| 1 | **Waiting for you** strip (max 3) | Approvals before browsing — same attention law as Home |
| 2 | Filter chips | Orientation without table chrome |
| 3 | **Live** grid | Publishing-first — proof in market |
| 4 | **Scheduled** grid | What's coming |
| 5 | **Drafts** grid | Work in progress — lower priority |
| 6 | Grouping by channel (optional toggle) | Power — alternative to status-first |

Content types represented as **preview cards**, not files: LinkedIn posts, Instagram, Meta ads, Google ads, emails, blog articles, landing pages, video thumbnails.

---

## 3.4 ASCII Wireframe — Content

```
+--------------------------------------------------------------------------------+
|  CONTENT TAB                                                                    |
+--------------------------------------------------------------------------------+

  Content van Emma

  ─── Wacht op jou (max 3) ────────────────────────────────────────────────────

  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │ [preview]    │  │ [preview]    │  │ [preview]    │
  │ LinkedIn post│  │ Email #2     │  │ Meta ad      │
  │ Needs approval│  │ Needs approval│  │ Needs approval│
  │ [ Review ]   │  │ [ Review ]   │  │ [ Review ]   │
  └──────────────┘  └──────────────┘  └──────────────┘

  [ All ] [ LinkedIn ] [ Email ] [ Ads ] [ Web ] [ Live ] [ Drafts ]

  ─── Live ───────────────────────────────────────────────────────────────────

  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │
  │ │ thumbnail│ │  │ │ thumbnail│ │  │ │ thumbnail│ │  │ │ thumbnail│ │
  │ │ + copy   │ │  │ │ + copy   │ │  │ │ ad visual│ │  │ │ hero img │ │
  │ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │
  │ LinkedIn     │  │ LinkedIn     │  │ Meta       │  │ Landing page │
  │ "Waarom AI-  │  │ "3 fouten in │  │ Retarget Q2│  │ Webinar aug  │
  │  workforce.."│  │  B2B groei"  │  │            │  │              │
  │ Live · 2d    │  │ Live · 4d    │  │ Live · 1w  │  │ Live · 3d    │
  │ Q2 Groei     │  │ Q2 Groei     │  │ Meta Q2    │  │ Webinar      │
  │ [ View live ]│  │ [ View live ]│  │ [ View live]│  │ [ View live ]│
  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘

  ─── Gepland ────────────────────────────────────────────────────────────────

  ┌──────────────┐  ┌──────────────┐
  │ [preview]    │  │ [preview]    │
  │ Email #3     │  │ LinkedIn     │
  │ Scheduled 12 │  │ Scheduled 14 │
  │ aug 09:00    │  │ aug 08:30    │
  └──────────────┘  └──────────────┘

  ─── Concepten ────────────────────────────────────────────────────────────────

  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │ [preview]    │  │ [preview]    │  │ [preview]    │
  │ Blog draft   │  │ Google ad    │  │ Video script │
  │ Draft        │  │ Draft        │  │ Draft        │
  └──────────────┘  └──────────────┘  └──────────────┘

```

### Content card anatomy

```
┌──────────────────┐
│ [Visual preview] │  ← aspect ratio matches channel (1:1 LI, 16:9 video, email subject block)
│ [Channel badge]  │
│ [Headline — business title, NOT filename]
│ [Status pill]    │  Live · Scheduled · Draft · Needs approval
│ [Campaign tag]   │  secondary line
│ [Primary action] │  View live · Review · Preview
└──────────────────┘
```

---

## 3.5 Interaction Flow — Content

```
Content tab
    → Default: Live grid first (below waiting strip if any)

"Review" on waiting strip card
    → Review surface (review bar pinned)
    → Approve → card moves to Scheduled or Live
    → Send back → Emma revises; card stays in Drafts

Card click (non-waiting)
    → Asset preview panel (full preview + metadata + campaign link)
    → "Open in campaign →" optional

"View live"
    → External URL (LinkedIn, live page) in new tab

Filter chip
    → Filters grid in place (no page reload feel)

Campaign tag click
    → Campaign drill-down

Work tab link "3 drafts ready"
    → Content pre-filtered to that campaign
```

---

## 3.6 Empty State — Content

```
  Content van Emma

  ─────────────────────────────────────────────────────────────────────────────

  Nog geen content.

  "Zodra je de strategie voor LinkedIn Q2 Groei goedkeurt, begin ik hier met
   posts en e-mails."

                              [ Ga naar campagne → ]
```

---

## 3.7 Power User Mode — Content

| Default | Power |
|---------|-------|
| Status-grouped grids | Toggle: group by Campaign · group by Channel |
| Preview panel | Side-by-side version compare (v1 vs v2) |
| Single Review action | Bulk approve (only if policy allows in Settings) |
| — | Filter by date range, performance label ("top performer") |
| — | Link to Workflow evidence for creative decisions |

---

# 4. PERFORMANCE

## 4.1 Purpose

**Why this page exists:**  
Performance is Emma's **report to the business** — closes the loop between marketing activity and commercial outcomes. Optimized for weekly review, not hourly monitoring.

**When entrepreneurs visit:**  
- Weekly/monthly business review  
- Validate Emma's recommendation with data  
- Understand channel mix efficiency  
- Board/investor prep  

**When they should NOT visit:**  
- Daily pulse → Workspace Band C snapshot  
- Fix integration → Settings  
- Approve content → Content / Workspace  

---

## 4.2 Business Question

**Primary question (one):**  
*"Is marketing creating business value?"*

---

## 4.3 Information Hierarchy

| Order | Information | Why |
|-------|-------------|-----|
| 1 | Hero KPI (one dominant metric) | Answers the question in 3 seconds |
| 2 | Supporting KPIs (2–4 smaller) | Context without KPI wall |
| 3 | Primary trend chart + period toggle | Direction over time |
| 4 | Insight sentence | "So what" — mandatory |
| 5 | Emma recommendation (optimization) | Action from data |
| 6 | Channel breakdown (collapsible) | Depth on demand |
| 7 | Historical wins narrative (optional) | Story, not log |

---

## 4.4 ASCII Wireframe — Performance

```
+--------------------------------------------------------------------------------+
|  PERFORMANCE TAB                                                                |
+--------------------------------------------------------------------------------+

  Marketingresultaten                              [ 7d ] [ 30d ● ] [ 90d ]

  ─── HERO KPIs ───────────────────────────────────────────────────────────────

  ┌─────────────────────────────────────┐  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │  BEÏNVLOEDE OMZET                    │  │ Leads    │ │ ROAS     │ │ CPL      │
  │  € 12.400                           │  │ 47       │ │ 2,4×     │ │ € 28     │
  │  +14% vs vorige periode             │  │ +8       │ │ +0,3     │ │ −€ 4     │
  │  bron: HubSpot + GA4                │  │ GA4      │ │ Meta+LI  │ │ Ads      │
  └─────────────────────────────────────┘  └──────────┘ └──────────┘ └──────────┘

  ─── TREND ───────────────────────────────────────────────────────────────────

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  Beïnvloede omzet over tijd                                                  │
  │  ┌───────────────────────────────────────────────────────────────────────┐ │
  │  │                    📈 line chart (single series)                       │ │
  │  └───────────────────────────────────────────────────────────────────────┘ │
  │  LinkedIn dreef 62% van leads deze maand — sterker dan Meta in segment.    │
  └─────────────────────────────────────────────────────────────────────────────┘

  ─── EMMA BEVELT AAN ─────────────────────────────────────────────────────────

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  Verschuif 20% budget van Meta naar LinkedIn                                 │
  │  ROAS 2,1× op LinkedIn vs 1,4× op Meta (14 dagen).                          │
  │                                                      [ Bekijk · Meer → ]    │
  └─────────────────────────────────────────────────────────────────────────────┘

  ─── Per kanaal ───────────────────────────────────────────── [ ▼ uitklappen ] 

  (collapsed default)

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  Kanaal          Spend      Leads     ROAS      Bijdrage                     │
  │  ─────────────────────────────────────────────────────────────────────     │
  │  LinkedIn        € 840      29        2,1×      62%                          │
  │  Meta            € 1.120    14        1,4×      30%                          │
  │  Google Ads      € 620      8         1,8×      17%                          │
  │  Email           —          6         —         11%                          │
  └─────────────────────────────────────────────────────────────────────────────┘

  ─── Wins deze maand ─────────────────────────────────────────────────────────

  ● Best performing post: "3 fouten in B2B groei" — 2,4× gemiddelde engagement
  ● LinkedIn Q2 Groei: 47 leads · € 12,4k influenced
  ● E-mail sequence #2: 34% open rate (boven benchmark)

```

### Secondary chart (power / expanded Performance)

When channel breakdown expanded, optional second chart:

```
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  Leads per kanaal (bar, horizontal)                                          │
  │  LinkedIn ████████████████████ 29                                            │
  │  Meta     ██████████ 14                                                      │
  │  Google   █████ 8                                                            │
  └─────────────────────────────────────────────────────────────────────────────┘
```

Max 3 charts on Performance total (Bible). Default view: **one chart**.

---

## 4.5 Interaction Flow — Performance

```
Performance tab
    → Read hero KPI + insight
    → Period toggle updates chart + deltas

Recommendation CTA
    → Expansion with rationale + affected campaigns
    → "Apply" may route to Campaign or Settings (budget) — one primary path

Channel breakdown expand
    → Table + optional bar chart
    → Row click → Campaign drill-down filtered

Disconnected metric
    → "Connect Meta Ads →" links Settings → Connections

Workspace Band C
    → Shallow snapshot only; "Meer in Performance →" for depth
```

---

## 4.6 Empty State — Performance

```
  Marketingresultaten

  ─────────────────────────────────────────────────────────────────────────────

  Nog geen resultaten zichtbaar.

  "Koppel je analytics en advertentie-accounts zodat ik kan laten zien wat
   marketing bijdraagt."

  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
  │ Google Analytics│  │ LinkedIn Ads    │  │ Meta Ads        │
  │ Niet gekoppeld  │  │ Niet gekoppeld  │  │ Niet gekoppeld  │
  │ [ Koppel ]      │  │ [ Koppel ]      │  │ [ Koppel ]      │
  └─────────────────┘  └─────────────────┘  └─────────────────┘

  (No fake charts. No zeros implying data exists.)
```

---

## 4.7 Power User Mode — Performance

| Default | Power |
|---------|-------|
| 1 trend chart | Up to 3 charts (each distinct question) |
| 30d default period | 7d / 90d / custom range |
| One recommendation | "Meer inzichten →" list (max 5) |
| Channel table collapsed | Always expanded (user preference) |
| Source badges | Click source → connection health in Settings |
| — | Export PDF summary (future) |
| — | Compare periods (this month vs last) |

---

# 5. WORKFLOW

## 5.1 Purpose

**Why this page exists:**  
Workflow is **opt-in transparency** into how Emma thinks — the Brain pipeline in plain language. A confession booth of competence, not the product hero.

**When entrepreneurs visit:**  
- Trust-building early relationship  
- Something failed — "where did it get stuck?"  
- Power user curiosity  
- Operator debugging (with admin flag)  

**When they should NOT visit:**  
- Daily check-in → Workspace  
- Approve work → Workspace / Campaign / Review  
- See business outcomes → Performance  

**Why NOT part of default Workspace:** Process visible first makes Peergent feel like automation software; destroys sixty-second test; creates anxiety from constantly advancing steps (Bible Ch. 13).

---

## 5.2 Business Question

**Primary question (one):**  
*"How did Emma think through this — and where is she now?"*

---

## 5.3 Information Hierarchy

| Order | Information | Why |
|-------|-------------|-----|
| 1 | Page intro (one line, Emma voice) | Frames as transparency, not status dashboard |
| 2 | **Active engagements** list | Current pipeline positions |
| 3 | Per engagement: current stage + narrative | Plain language |
| 4 | Expand: stage history | Depth on demand |
| 5 | **Completed** (collapsed, searchable) | Archive |

Pipeline stages (customer language, fixed order):

```
Understanding your market      (Research)
Analyzing options              (Reasoning)
Reading competitors & trends   (Marketing Intelligence)
Applying your brand            (Brand)
Choosing direction             (Strategy)
Building the plan              (Planning)
Creating content               (Creative)
Going live                     (Publishing)
Measuring results              (Performance)
```

---

## 5.4 ASCII Wireframe — Workflow

```
+--------------------------------------------------------------------------------+
|  WORKFLOW TAB                                                                   |
+--------------------------------------------------------------------------------+

  Hoe Emma werkt

  "Dit is waar ik ben in mijn denkproces — je hoeft hier niet te komen,
   tenzij je wilt zien hoe ik tot een beslissing kwam."

  ─── Actief ───────────────────────────────────────────────────────────────────

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  LinkedIn Q2 Groei                                                           │
  │  ● Measuring results                                                         │
  │  "Ik analyseer de resultaten van week 1 en bereid optimalisatie voor."      │
  │                                                      [ ▼ Stappen tonen ]    │
  └─────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  Google Ads — Search                                                         │
  │  ● Creating content                                                          │
  │  "Ik schrijf advertentievarianten voor de keyword expansion."                │
  │                                                      [ ▼ Stappen tonen ]    │
  └─────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  Website CRO — Homepage                                                      │
  │  ○ Waiting — Choosing direction                                              │
  │  "Ik wacht op jouw goedkeuring van de landingspagina-strategie."           │
  │                                                      [ ▼ Stappen tonen ]    │
  └─────────────────────────────────────────────────────────────────────────────┘

  ─── Expanded stage history (one engagement) ─────────────────────────────────

  LinkedIn Q2 Groei — stappen
  ─────────────────────────────────────────────────────────────────────────────
  ✓  Understanding your market           28 jul
  ✓  Reading competitors & trends        29 jul
  ✓  Applying your brand                 29 jul
  ✓  Choosing direction                  30 jul  → Strategy approved by you
  ✓  Building the plan                   31 jul
  ✓  Creating content                    2 aug
  ✓  Going live                          4 aug   → 3 posts published
  ●  Measuring results                   now

  [ Hoe Emma besliste → ]          (evidence summary — one level deep)

  ─── Afgerond ────────────────────────────────────────────── [ 🔍 Zoeken... ] ─

  ▶  Meta Retargeting Q2 — completed 1 aug
  ▶  Concurrentierapport juli — completed 28 jul

```

### Pipeline visual (optional compact strip inside expanded view)

```
  Understanding → Analyzing → Intel → Brand → Strategy → Planning → Creative → Live → Results
  ─────────────────────────────────────●────────────────────────────────────────────────────
                                      ↑ you are here
```

Never show node IDs, capability names, or executor labels in default view.

---

## 5.5 Interaction Flow — Workflow

```
Workflow tab
    → Scan active engagements
    → Expand "Stappen tonen" → stage history

"Hoe Emma besliste →"
    → Evidence summary page (plain language bullets + sources)
    → NOT raw JSON in default path
    → Admin: "Open inspector →" (role-gated)

Stage failure
    → Plain language error + one recovery action
    → Link to Settings if connection-related
    → Decision link if approval gate

Completed search
    → Filter archived engagements

Campaign disclosure "Pipeline position →"
    → Workflow tab pre-filtered to that engagement
```

---

## 5.6 Empty State — Workflow

```
  Hoe Emma werkt

  ─────────────────────────────────────────────────────────────────────────────

  Geen actieve pipelines.

  "Zodra ik aan een campagne begin, zie je hier waar ik ben in mijn proces."

                              [ Terug naar Workspace ]
```

---

## 5.7 Power User Mode — Workflow

| Default | Power |
|---------|-------|
| Plain stage names | Toggle timeline density |
| One-line output per completed stage | Expand stage → full output summary |
| Evidence summary (human) | Admin inspector link |
| — | Compare two engagements side by side |
| — | Export pipeline report |

---

# 6. SETTINGS

## 6.1 Purpose

**Why this page exists:**  
Settings is **configure once** — how Emma works, what she knows, what she's connected to. Not daily operations.

**When entrepreneurs visit:**  
- Initial onboarding setup  
- Connect/disconnect integrations  
- Change autonomy or approval rules  
- Update brand voice or goals  

**When they should NOT visit:**  
- Daily check-in → Workspace  
- Review performance → Performance  

---

## 6.2 Business Question

**Primary question (one):**  
*"How does Emma work — and what does she know about my business?"*

---

## 6.3 Information Hierarchy

| Order | Section | Why |
|-------|---------|-----|
| 1 | Working agreement summary | Most impactful — autonomy mode in plain language |
| 2 | Connections status strip | Blockers surface here |
| 3 | Category list (nav within Settings) | Progressive disclosure |
| 4 | Selected category detail | Edit surface |

### Settings category map (Bible + PX-23 scope)

| Category | Contains (from brief) |
|----------|------------------------|
| **Working Agreement** | Autonomy mode · default behavior summary |
| **Knowledge & Brand** | Brandbook · Tone of Voice · Goals · Memory · ICP alignment |
| **Connections** | Integrations · Accounts (LinkedIn, Meta, GA4, HubSpot, email) |
| **Approval Rules** | Gates: strategy · budget · publish · brand-sensitive |
| **Budget** | Spend limits · channel caps · alert thresholds |
| **Notifications** | What Emma may interrupt you for |
| **Advanced** | Responsibilities · locale · power tools |

---

## 6.4 ASCII Wireframe — Settings index

```
+--------------------------------------------------------------------------------+
|  SETTINGS TAB                                                                   |
+--------------------------------------------------------------------------------+

  Instellingen — Emma · Marketing

  ─── Werkafspraak ────────────────────────────────────────────────────────────

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  Hoe Emma werkt                                                              │
  │  "Emma bereidt campagnes voor en wacht op jouw goedkeuring vóór publicatie."│
  │  Mode: Samenwerken                                              [ Wijzig ]  │
  └─────────────────────────────────────────────────────────────────────────────┘

  ─── Koppelingen (samenvatting) ───────────────────────────────────────────────

  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
  │ LinkedIn   │ │ Meta Ads   │ │ GA4        │ │ HubSpot    │
  │ ✓ Verbonden│ │ ✗ Ontbreekt│ │ ✓ Verbonden│ │ ✗ Ontbreekt│
  └────────────┘ └────────────┘ └────────────┘ └────────────┘
                              [ Alle koppelingen → ]

  ─── Categorieën ─────────────────────────────────────────────────────────────

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  Kennis & merk                                                               │
  │  Brandbook · Tone of voice · Doelen · Memory                            →   │
  └─────────────────────────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  Goedkeuringsregels                                                          │
  │  Wanneer Emma je om een beslissing vraagt                               →   │
  └─────────────────────────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  Budget                                                                      │
  │  Limieten · waarschuwingen · kanaalplafonds                             →   │
  └─────────────────────────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  Meldingen                                                                   │
  │  Wanneer Emma je mag onderbreken                                        →   │
  └─────────────────────────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  Geavanceerd                                                                 │
  │  Verantwoordelijkheden · taal · tools                                   →   │
  └─────────────────────────────────────────────────────────────────────────────┘

```

---

## 6.5 ASCII Wireframe — Settings sub-pages

### Knowledge & Brand

```
  ← Instellingen    Kennis & merk

  ─── Brandbook ───────────────────────────────────────────────────────────────
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  Merkidentiteit · logo gebruik · kleuren · visuele regels                   │
  │  Laatst bijgewerkt: 14 jul · Emma gebruikt dit bij creatieve werk      →   │
  └─────────────────────────────────────────────────────────────────────────────┘

  ─── Tone of Voice ───────────────────────────────────────────────────────────
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  Professioneel-warm · je/jij · geen jargon                                  │
  │  [ Bekijk · Bewerk ]                                                        │
  └─────────────────────────────────────────────────────────────────────────────┘

  ─── Doelen ──────────────────────────────────────────────────────────────────
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  Primair: Leadgeneratie Benelux founders                                    │
  │  Secundair: Merkbekendheid LinkedIn                                         │
  │  [ Bewerk doelen ]                                                          │
  └─────────────────────────────────────────────────────────────────────────────┘

  ─── Memory ──────────────────────────────────────────────────────────────────
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  Wat Emma onthoudt over je bedrijf, campagnes, en eerdere beslissingen.     │
  │  "Emma onthoudt dat je Q2 focust op LinkedIn, niet Meta."                   │
  │  [ Bekijk memory → ]                                                        │
  └─────────────────────────────────────────────────────────────────────────────┘
```

### Connections (Integrations + Accounts)

```
  ← Instellingen    Koppelingen

  ─── Advertenties & analytics ────────────────────────────────────────────────

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  LinkedIn Ads          ✓ Verbonden · sync 12 min geleden    [ Beheer ]     │
  │  Meta Ads              ✗ Niet gekoppeld                      [ Koppel ]      │
  │  Google Ads            ✓ Verbonden · sync 1 uur geleden     [ Beheer ]     │
  │  Google Analytics 4    ✓ Verbonden · sync 30 min geleden    [ Beheer ]     │
  └─────────────────────────────────────────────────────────────────────────────┘

  ─── CRM & email ─────────────────────────────────────────────────────────────

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  HubSpot               ✗ Niet gekoppeld                      [ Koppel ]      │
  │  E-mail (SendGrid)     ✓ Verbonden                          [ Beheer ]     │
  └─────────────────────────────────────────────────────────────────────────────┘

  ─── Social accounts ─────────────────────────────────────────────────────────

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  LinkedIn Company Page ✓ @CompanyName                       [ Beheer ]     │
  │  Instagram             ✗ Niet gekoppeld                      [ Koppel ]      │
  └─────────────────────────────────────────────────────────────────────────────┘
```

### Approval Rules

```
  ← Instellingen    Goedkeuringsregels

  Emma vraagt je beslissing wanneer:

  [✓] Strategie goedgekeurd moet worden vóór creatie
  [✓] Budget boven € 500 / week
  [✓] Publicatie naar live kanalen
  [✓] Merkgevoelige content (campagnes met juridische claims)
  [ ] Concurrentie-analyse rapporten
  [ ] Routine analytics pulls

  [ Opslaan ]
```

### Budget

```
  ← Instellingen    Budget

  Maandelijks marketingbudget (totaal)     € 5.000
  Waarschuwing bij                         80% van limiet

  Per kanaal:
  LinkedIn Ads    max € 2.000 / maand
  Meta Ads        max € 2.000 / maand
  Google Ads      max € 1.500 / maand

  [ Opslaan ]
```

---

## 6.6 Interaction Flow — Settings

```
Any blocked state in product ("Koppel LinkedIn")
    → Settings → Connections (deep link)

Working agreement change
    → Confirmation modal explaining behavior change
    → Returns to Settings index with updated summary

Brandbook / Tone edit
    → Document editor or structured form
    → Save → Emma acknowledges in next briefing

Approval rule toggle
    → Immediate effect on future gates (not retroactive)

Never from Settings:
    → Performance charts
    → Campaign list
    → Workflow timeline as default
```

---

## 6.7 Empty State — Settings

Settings is rarely empty. **Partial setup state:**

```
  Koppelingen

  Nog geen accounts gekoppeld.

  "Zonder koppelingen kan ik strategie en content voorbereiden,
   maar niet publiceren of resultaten meten."

  [ Koppel LinkedIn ]    [ Koppel Google Analytics ]
```

---

## 6.8 Power User Mode — Settings

| Default | Power |
|---------|-------|
| Category list | Advanced: responsibilities editor |
| Simple approval toggles | Custom gate rules per campaign type |
| Memory read-only summary | Memory edit / forget specific items |
| — | Export working agreement |
| — | Admin tools link (role-gated, outside customer Settings) |

---

# 7. CAMPAIGN DRILL-DOWN

## 7.1 Purpose

**Why this page exists:**  
One engagement's **briefing room** — business context for a single piece of Emma's portfolio. Not a project management view.

**When entrepreneurs visit:**  
- From Work row or Workspace active summary  
- From Content campaign tag  
- From Performance channel row  
- From approval card with campaign context  

**When they should NOT visit:**  
- Org-wide check-in → Workspace  
- Browse all assets → Content tab  

---

## 7.2 Business Question

**Primary question (one):**  
*"What is this campaign — where does it stand — and do I need to decide anything?"*

---

## 7.3 Information Hierarchy

| Order | Band | Why (Bible Ch. 15) |
|-------|------|---------------------|
| 1 | Campaign presence | Anchor — name, status, channel, live since |
| 2 | Campaign briefing | **Briefing first** — why this exists, strategy summary |
| 3 | Decision (conditional) | One primary approval if needed |
| 4 | Business snapshot | Campaign-scoped KPIs if live |
| 5 | Content preview strip | What the market sees / will see |
| 6 | Recommendation | Emma's next move for **this** campaign |
| 7 | Disclosure (collapsed) | Timeline, workflow link, budget, versions — **last** |

**Why briefing before business snapshot:** Intent before numbers — entrepreneur judges value in context.

**Why approval before content:** Gate may block publishing — decision before previews.

**Why technical analysis last:** Power only — protects executive default.

---

## 7.4 ASCII Wireframe — Campaign drill-down

```
+--------------------------------------------------------------------------------+
|  ← Work    Work / LinkedIn Q2 Groei                                              |
+--------------------------------------------------------------------------------+

┌─ PRESENCE ─────────────────────────────────────────────────────────────────────┐
│  LinkedIn Q2 Groei                                                              │
│  Live sinds 4 aug · ● LinkedIn · Autonomous · live                               │
│  "Ik optimaliseer posts op basis van engagement uit week 1."                    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      ↕ 40px

┌─ CAMPAIGN BRIEFING ────────────────────────────────────────────────────────────┐
│  Briefing                                                                       │
│  ─────────────────────────────────────────────────────────────────────────     │
│  Doel: Leadgeneratie bij Benelux founders via thought leadership.                │
│                                                                                 │
│  Strategie: 4-weken LinkedIn programma — 3 posts/week, 1 lead magnet,           │
│  retargeting op websitebezoekers.                                               │
│                                                                                 │
│  Doelgroep: Founder/CEO, 10–50 FTE, B2B SaaS, NL/BE.                           │
│                                                                                 │
│  [ Volledige strategie bekijken ]                                               │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      ↕ 40px

┌─ DECISION (conditional) ─────────────────────────────────────────────────────┐
│  Wacht op jou                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │  LinkedIn-budgetvoorstel bevestigen                                       │  │
│  │  Dan kan ik spend verhogen en leads meten.                    [ Bekijk → ] │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      ↕ 40px

┌─ BUSINESS SNAPSHOT (if live) ──────────────────────────────────────────────────┐
│  Resultaten · deze campagne · 30d                                               │
│  ─────────────────────────────────────────────────────────────────────────     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                          │
│  │ Leads        │  │ Spend        │  │ ROAS         │                          │
│  │ 29           │  │ € 840        │  │ 2,1×         │                          │
│  └──────────────┘  └──────────────┘  └──────────────┘                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  📈 leads over time (small trend)                                        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      ↕ 40px

┌─ CONTENT PREVIEW ──────────────────────────────────────────────────────────────┐
│  Content                                                                        │
│  ─────────────────────────────────────────────────────────────────────────     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│  │[thumb]  │ │[thumb]  │ │[thumb]  │ │[thumb]  │ │[thumb]  │ │[thumb]  │    │
│  │Live     │ │Live     │ │Live     │ │Scheduled│ │Draft    │ │Draft    │    │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
│                                           [ Alle content voor campagne → ]     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      ↕ 40px

┌─ RECOMMENDATION ───────────────────────────────────────────────────────────────┐
│  Emma beveelt aan                                                               │
│  Verhoog budget met 20% — top post drijft 40% van clicks.     [ Bekijk → ]    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      ↕ 40px

┌─ DISCLOSURE (collapsed default) ─────────────────────────────────────────────┐
│  ▶  Tijdlijn & details                                                          │
│      (version history · pipeline in Workflow · budget breakdown · notes)       │
└─────────────────────────────────────────────────────────────────────────────────┘

```

### Disclosure expanded (power)

```
  ▼  Tijdlijn & details
  ─────────────────────────────────────────────────────────────────────────────
  30 jul  Strategy approved by you
  31 jul  Plan finalized
  4 aug   Went live — 3 posts
  7 aug   Optimization started

  [ Pipelinepositie in Workflow → ]
  [ Budgetdetails ]
  [ Versiegeschiedenis strategie ]
```

**Forbidden as default hero:** 10-step lifecycle bar · phase grid · deliverable checklist · work unit list.

---

## 7.5 Interaction Flow — Campaign

```
Work row → Campaign drill-down
    → Read briefing (default scroll position = top)
    → Decision "Bekijk →" → Review surface
    → Content thumb → Asset preview OR Content tab filtered
    → "Alle content →" → Content tab
    → Recommendation → inline expand or Performance
    → Disclosure → Workflow (pre-filtered) · version history

Breadcrumb "← Work" → Work tab
Org shell "← Home" → Home (preserves scope)
```

---

## 7.6 Empty State — Campaign

New campaign, strategy phase only:

```
  Product Launch Q3
  Preparing · ● Multi-channel

  Briefing
  ─────────────────────────────────────────────────────────────────────────────
  Emma bereidt de strategie voor op basis van je Q3 doelen.
  "Ik heb nog je goedkeuring nodig voordat ik content kan maken."

  (No business snapshot — not live yet)
  (No content strip — or empty with honest copy)

  [ Strategie reviewen → ]    ← single CTA if deliverable ready
```

---

## 7.7 Power User Mode — Campaign

| Default | Power |
|---------|-------|
| Briefing summary | Full strategy document |
| 6 content thumbs | Full content grid filtered |
| Disclosure collapsed | Disclosure expanded by default (preference) |
| — | Version compare |
| — | Budget edit inline |
| — | Admin campaign inspector link |

---

# 8. REVIEW SURFACE (Approval flow)

## 8.1 Purpose

**Why this surface exists:**  
Single deliverable decision moment — strategy doc, post draft, budget proposal. Product Bible law: **review bar never disappears** during review.

**When entrepreneurs visit:**  
From any "Bekijk →" / "Review" CTA (Workspace, Campaign, Content).

---

## 8.2 Business Question

**Primary question (one):**  
*"Is this good enough to proceed?"*

---

## 8.3 Information Hierarchy

| Order | Information | Why |
|-------|-------------|-----|
| 1 | Deliverable title + type | Context |
| 2 | Emma intro (1–2 sentences) | Why this is in front of you |
| 3 | Deliverable body (preview) | The actual work |
| 4 | Review bar (sticky) | Approve · Send back · optional View campaign |

---

## 8.4 ASCII Wireframe — Review

```
+--------------------------------------------------------------------------------+
|  ← Terug naar Workspace                                    LinkedIn Q2 Groei    |
+--------------------------------------------------------------------------------+

  LinkedIn-budgetvoorstel

  "Ik stel voor het budget te verhogen van € 700 naar € 840 per week op basis
   van leadkwaliteit in de eerste 7 dagen."

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  [Deliverable preview — budget table, strategy doc, post mockup, etc.]       │
  │                                                                              │
  │  Huidig          Voorgesteld        Verwacht effect                          │
  │  € 700/wk        € 840/wk           +12 leads/wk (model)                     │
  │                                                                              │
  └─────────────────────────────────────────────────────────────────────────────┘

+--------------------------------------------------------------------------------+
|  REVIEW BAR (sticky — never disappears)                                         |
|  [ ← Terug ]     [ Geef feedback ]              [ Goedkeuren ✓ ]               |
+--------------------------------------------------------------------------------+
```

---

## 8.5 Interaction Flow — Review

```
CTA "Bekijk →"
    → Review surface
    → Read deliverable
    → Approve → confirmation → return to origin (Workspace/Campaign/Content)
    → Send back → feedback field → Emma revises → item returns to queue
    → Back → origin without decision (state preserved)
```

---

## 8.6 Empty State

N/A — Review only opens with a deliverable.

---

## 8.7 Power User Mode

| Default | Power |
|---------|-------|
| Deliverable preview | Version history sidebar |
| — | View evidence summary |
| — | Admin inspector link |

---

# 9. COMPLETE NAVIGATION FLOWS

## 9.1 Primary delegation path (most entrepreneurs)

```
Home
  ↓ click Marketing (peer chip / nav)
Marketing · Workspace
  ↓ scan 60 seconds — done (no click)
  OR
  ↓ Band D "Bekijk →"
Review → Approve
  ↓
Workspace (updated briefing)
```

## 9.2 Weekly business review path

```
Home
  ↓
Marketing · Workspace (pulse)
  ↓
Performance (deep metrics)
  ↓
Campaign drill-down (specific channel)
  ↓
Content (verify live assets)
  ↓
Workspace
```

## 9.3 Content approval path

```
Home · Wacht op jou
  ↓ OR Marketing · Workspace · Band D
Review
  ↓
Content (asset now Live)
  ↓
Workspace
```

## 9.4 Work portfolio path

```
Marketing · Workspace
  ↓ "Al het werk →"
Work
  ↓ click "Google Ads — Search"
Campaign drill-down
  ↓ Disclosure → Workflow
Workflow (pipeline stages)
  ↓ Evidence summary
  ↓
Work (back)
```

## 9.5 Setup / blocked path

```
Marketing · Workspace
  ↓ Band C "Koppel GA4"
Settings → Connections
  ↓ OAuth complete
  ↓
Workspace (Performance data unlocks over time)
```

## 9.6 Recommendation path

```
Marketing · Workspace · Band E
  ↓ "Bekijk aanbeveling"
Performance (recommendation expanded)
  OR Campaign drill-down (if campaign-specific)
  ↓ Accept / Dismiss / Snooze (power)
  ↓
Workspace
```

## 9.7 Org Inbox cross-peer path

```
Home · Wacht op jou (3 items, 1 is Emma)
  ↓
Inbox (org — all peers)
  ↓ Emma item
Review
  ↓
Marketing · Workspace (NOT duplicate queue on Workspace if same item)
```

## 9.8 Full route map (all nodes)

```
                                    ┌─────────────┐
                                    │    HOME     │
                                    └──────┬──────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              │                            │                            │
              ▼                            ▼                            ▼
        ┌──────────┐               ┌──────────────┐              ┌──────────┐
        │  INBOX   │               │  MARKETING   │              │  TEAM    │
        └────┬─────┘               │  WORKSPACE   │              └──────────┘
             │                     └──────┬───────┘
             │                            │
             └──────────────┬─────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
   ┌───────────┐     ┌────────────┐     ┌─────────────┐
   │  REVIEW   │     │ WORKSPACE  │     │  SETTINGS   │
   └───────────┘     │   (tabs)   │     └─────────────┘
                     └─────┬──────┘
                           │
     ┌─────────┬───────────┼───────────┬─────────┐
     │         │           │           │         │
     ▼         ▼           ▼           ▼         ▼
  WORK    CONTENT    PERFORMANCE   WORKFLOW   SETTINGS
     │         │           │           │       sub-pages
     │         │           │           │
     └────┬────┴─────┬─────┘           │
          │          │                 │
          ▼          ▼                 ▼
     CAMPAIGN   ASSET PREVIEW    EVIDENCE SUMMARY
     DRILL-DOWN                      (power)
          │
          └──── → REVIEW
          └──── → CONTENT (filtered)
          └──── → WORKFLOW (filtered)
          └──── → PERFORMANCE
```

---

# 10. MOBILE CONSIDERATIONS (information only)

No separate mobile IA — same six tabs. Adaptations:

| Desktop band | Mobile behavior |
|--------------|-----------------|
| Workspace Band C chart | Full width, same priority |
| Band D 3 approval cards | Horizontal scroll OR stack (max 3) |
| Work groups | Accordion sections |
| Content grid | 2-column → 1-column |
| Performance KPIs | Hero stacks above supporting |
| Settings categories | Full-width list |

**Sixty-second test applies on mobile.**

---

# 11. IMPLEMENTATION READINESS CHECKLIST

Before writing code, implementation must confirm:

- [ ] Every page answers exactly **one** primary business question  
- [ ] Workspace bands A–G in order; empty bands omitted  
- [ ] Work groups are business states, not Brain stages  
- [ ] Content is preview-first; no default tables  
- [ ] Performance: hero KPI + one chart + insight on default  
- [ ] Workflow absent from Workspace; plain-language stages only  
- [ ] Campaign: briefing → decision → snapshot → content → recommendation → disclosure  
- [ ] Review bar never disappears during review  
- [ ] Settings: no charts, no campaign lists  
- [ ] All empty states use Emma voice + one CTA  
- [ ] No workflow vocabulary on default paths  
- [ ] Visual parity target: Home Command Center (PX-21)  

---

# 12. DOCUMENT AUTHORITY

| Document | Role |
|----------|------|
| [Marketing Workspace Bible](./MARKETING_WORKSPACE_BIBLE.md) | Architecture — this wireframe doc translates it |
| This document | Wireframes + flows — frozen after PX-23 |
| Future implementation sprints | Build exactly this; no design decisions in code |

---

*After PX-23: Marketing Workspace wireframes are frozen. Implementation references this document and the Bible. No code until an explicit build sprint.*
