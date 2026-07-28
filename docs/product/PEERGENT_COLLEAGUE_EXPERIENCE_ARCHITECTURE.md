# Peergent Colleague Experience Architecture

**Status:** Product architecture (Sprint 29A)  
**Authority:** Subordinate to [Experience Constitution](../PEERGENT_EXPERIENCE_CONSTITUTION.md) and [Product Bible](../PEERGENT_PRODUCT_BIBLE.md). Does not replace blueprints or design system specs.  
**Audience:** Product, design, engineering — before Sprint 29B+ implementation.

---

## 1. Product intent

Peergent is a **Digital Workforce** platform. Customers hire **AI colleagues**, not AI dashboards.

**Design for two modes, one system:**

| Mode | Needs | Default UI |
|------|--------|------------|
| **Delegation-first** | Reassurance: running? anything for me? | Minimal depth, calm silence, one primary action |
| **Involved / power** | Inspect work, campaigns, history, performance | Same surfaces + progressive disclosure + contextual “full view” |

Never ship two products. **Simple by default → deeper on demand → admin/developer observability separate.**

---

## 2. Global customer journey

```
Login
  → HQ                    (team pulse, emotional home)
  → Command Center        (company operating picture — optional deep link from HQ)
  → Individual Peer       (six-question workspace)
  → Decision / output     (review, approve, view deliverable)
  → Engagement detail     (campaign/deal/case — only when user chooses depth)
  → Back to Peer or HQ    (never more than 2–3 taps from “approve X”)
```

### Layer ownership

| Layer | Owns | Does not own |
|-------|------|----------------|
| **HQ** | Greeting, team health, “anything important today?”, which Peer to open | Campaign plans, work units, charts, configuration |
| **Command Center** | Cross-Peer attention, working now, recently completed, up next (company-wide) | Peer settings, engagement internals, admin diagnostics |
| **Peer workspace** | Six questions for *one* colleague | Other Peers’ work, org-wide KPI walls |
| **Engagement detail** | One container of work (e.g. campaign) with presence + decisions + disclosure | Default landing for delegation-first users |
| **Output / review** | Single deliverable decision surface | Queues duplicated elsewhere |
| **Settings (Peer)** | How this colleague works | Runtime, planner, executor |

### Shortest paths (examples)

| Intent | Path |
|--------|------|
| Approve next marketing item | HQ or Command Center → **Needs you** row → Review (1 tap from CC if surfacing item) |
| Check Marketing is working | HQ → Marketing Peer → **Working on** (default tab) |
| See what Marketing finished this week | Marketing Peer → **Done** |
| Open a specific campaign (power user) | Marketing Peer → **Work** → engagement → detail |
| Connect LinkedIn | Marketing Peer → **Settings** → Connections |
| Debug continuation block | Admin inspector only (dev flag / role) |

**Rule:** Approvals never require navigating Overview → Projects → Campaign → Review Queue → Item.

---

## 3. HQ

### Purpose

HQ is the **emotional front door** after login. It answers:

- How is my digital team doing?
- Is everything under control?
- Is there anything important **today**?
- Which colleague should I open?

### Preserve (current strengths)

- Morning greeting and human tone  
- Calm layout, not a KPI wall  
- Team presence / pulse  
- Suggested start when one clear action exists  

### Should appear

- **Needs you** (aggregate count + top 1–3 items across Peers, linked to decision surfaces)  
- **Team pulse** (who is working, waiting, caught up — colleague labels)  
- **Open colleague** affordances (avatar + name + one-line status)  
- Optional: single **Suggested start** when unambiguous  

### Should not appear

- Campaign lists, project grids, work units  
- Full Command Center duplicate (HQ links to CC, does not replace it)  
- Performance charts, integration status matrices  
- Settings or knowledge editors  

### Navigation

HQ is **Home** in top-level nav. Command Center is reachable as “Today’s briefing” or equivalent — not a competing home.

---

## 4. Command Center

### Purpose

Company-wide **operating overview** for founders who want the whole team in one glance — without project-management chrome.

### Recommended sections (top → bottom)

1. **Needs your attention** — cross-Peer decisions; primary CTA per row; max 5 visible then “View all in Inbox”  
2. **Working now** — one line per active Peer (who + what in plain language)  
3. **Recently completed** — last 24–72h outcomes (human sentences, not logs)  
4. **Up next** — optional; only if non-empty and confident; otherwise omit (honest silence)

**Combine when empty:** If “Up next” is weak signal, merge into Working now as “Then: …”. Do not show four empty sections.

### Missing today (to add in product)

- Explicit **completed** and **in progress** team-wide strips (aligned with colleague language)  
- Clear link from completed → Peer **Done** or deliverable view  

### Language

- Use: “Emma is writing creative direction”, “Strategy approved”, “Waiting for your review”  
- Avoid: review queue, work unit, artifact, runtime  

---

## 5. Individual Peer workspace — six questions IA

The Peer workspace is organized around **six customer questions**, not feature tabs.

| # | Question | Primary section (EN) | Primary section (NL) |
|---|----------|----------------------|----------------------|
| 1 | What is this Peer working on right now? | **Working on** | **Bezig met** |
| 2 | Does this Peer need anything from me? | **Waiting for me** | **Wacht op mij** |
| 3 | What has this Peer completed? | **Done** | **Afgerond** |
| 4 | What engagements is this Peer responsible for? | **Work** | **Werk** |
| 5 | How is this Peer performing? | **Results** | **Resultaten** |
| 6 | How do I configure this Peer? | **Settings** | **Instellingen** |

### Naming decision

**Rejected as primary nav labels:** Overview, Projects, Review, Responsibilities, Knowledge, Connections, Performance (too generic or technical).

**Chosen system:**

- **Working on** — presence-first default landing for delegation-first users (implements Sprint 28B direction at Peer level).  
- **Waiting for me** — Peer-scoped inbox (subset of global Inbox filtered to this Peer).  
- **Done** — value delivered, grouped by time.  
- **Work** — engagements list (Campaigns for Marketing; domain label per Peer).  
- **Results** — outcomes and trends, not “Performance” dashboard.  
- **Settings** — consolidated configuration.

**Mobile:** Bottom or top segmented control with max 5 visible; **Results** may live under Settings → “See results” for v1 mobile if needed, but desktop shows six.

### Tab order (default)

`Working on` | `Waiting for me` | `Done` | `Work` | `Results` | `Settings`

Badge only on **Waiting for me** (count).

---

## 6. Section specifications

### 6.1 Working on

**Question:** What is this Peer working on right now?

| Aspect | Spec |
|--------|------|
| **Default** | Peer avatar, name, presence pill, one first-person sentence, optional “then” line, **no** stats |
| **Primary action** | At most one: Review N items / Continue setup / Start — or none when caught up |
| **Empty / caught up** | “You’re caught up. I’m on the next step when ready.” |
| **Disclosure** | “More about this engagement” → engagement detail; history/versions on deliverable |
| **Must not show** | % complete bars, phase chip grids, work unit lists, publish targets |
| **States (customer)** | Working · Waiting for you · Caught up · Preparing · Blocked (needs help) · Failed safely |

Map internal states to minimal customer set; admin sees full state machine.

---

### 6.2 Waiting for me

**Question:** Does this Peer need anything from me?

| Aspect | Spec |
|--------|------|
| **Default** | Compact rows: icon, title, status, age, action (Review / Connect / Choose…) |
| **Grouping** | By urgency: Decisions first, then Setup/connect, then Clarifications |
| **Priority** | Oldest decision first within Decisions; user can sort by “Newest” in power disclosure |
| **Empty** | “I don’t need anything from you right now.” (calm, no CTA) |
| **Must not show** | “Review queue”, artifact IDs, dependency graphs |

Global **Inbox** nav = all Peers; this tab = filtered Inbox for one Peer.

---

### 6.3 Done

**Question:** What has this Peer completed?

| Aspect | Spec |
|--------|------|
| **Structure** | Today / Yesterday / This week / Older |
| **Line format** | “Campaign strategy completed” · link to view |
| **Disclosure** | Version history, compare → from deliverable detail only |
| **Filter** | By engagement, by type (power) |
| **Admin-only** | Raw event log, decision IDs, idempotency markers |

Not a system log. Dedupe repeated “Approved” lines.

---

### 6.4 Work (engagements)

**Question:** What is this Peer responsible for?

**Platform concept:** **Engagement** (internal); customer label **Work** with Peer-specific item noun.

| Peer | Customer list label (EN) | Item noun (EN) |
|------|--------------------------|----------------|
| Marketing | Work | Campaign |
| Sales | Work | Deal / Sequence |
| Support | Work | Case |
| Planner | Work | Schedule |
| Finance | Work | Report run |
| HR | Work | Cycle |
| Admin / Invoice | Work | Process |

**List behavior:** Active first (needs you / in progress), then Quiet, then Completed — searchable, sorted by updated.

**Opening engagement (delegation-first):** Same as current **presence-first engagement page** (Working on at engagement scope), not legacy dashboard.

**Power user:** “Open full detail” → plans, timelines, versions, collaboration panel (collapsed).

---

### 6.5 Results

**Question:** How is this Peer performing?

| Aspect | Spec |
|--------|------|
| **Default** | 3–5 outcome cards: e.g. content published, leads influenced, time saved (when data exists) |
| **Tone** | “How Emma is helping the business” not analytics SaaS |
| **Disclosure** | Trends, channel breakdown when integrations connected |
| **Empty** | “Connect tools in Settings to see results here.” |
| **Future** | GA4, Ads, Meta, LinkedIn, CRM, email — via Integration Hub (see Master Roadmap) |

Lower visit frequency; not a default tab for delegation-first (still available, not promoted on HQ).

---

### 6.6 Settings

**Question:** How do I configure this Peer?

**Hierarchy (EN / NL):**

| Category (EN) | (NL) | Contains |
|---------------|------|----------|
| How this Peer works | Hoe deze collega werkt | Autonomy, approval policy, working hours (future) |
| Knowledge & brand | Kennis & merk | Knowledge base, brand context, voice |
| Connections | Koppelingen | OAuth integrations |
| Notifications | Meldingen | What to ping user for |
| Advanced | Geavanceerd | Responsibilities (power), tools, locale |

**Hide from default:** Runtime, planner config, executor toggles, brain registry — admin/dev only.

---

## 7. Power-user access model

**No permanent Simple/Advanced toggle.**

| Depth | Access |
|-------|--------|
| Default | Six sections, progressive disclosure on rows and engagement |
| Contextual | “History & details”, “Open full campaign”, filters on Done |
| Role / flag | Admin Campaign Inspector, technical metadata links (dev) |

Involved users live in **Work** + engagement detail + Done filters; delegation users may never open **Work**.

---

## 8. Admin / developer separation

| Customer presenter | Admin presenter |
|--------------------|-----------------|
| Colleague language | Work units, artifacts, lifecycle |
| Decisions & outcomes | Review decisions map, continuation diagnostics |
| Presence states | Runtime, planner, executor |
| Done narrative | Event log, idempotency, JSON VMs |
| One primary action | Full observability panels |

**One domain truth** — existing review VMs, collaboration VMs, workspace state. Two presenters (already established for Marketing campaign inspector).

---

## 9. Cross-Peer workspace skeleton

Reusable **PeerWorkspaceShell**:

1. Presence header (peer-scoped)  
2. Nav: Working on · Waiting for me · Done · Work · Results · Settings  
3. Engagement detail template (presence + waiting + done preview + disclosure)  
4. Review surface (shared `PgReviewBar` pattern)  
5. Settings categories (plug domain fields)

Domain plugins: engagement noun, deliverable types, Done line copy, Results metrics source.

---

## 10. Information placement matrix

| Capability | Customer location | Admin / power |
|------------|-------------------|---------------|
| Approve deliverable | Waiting for me → Review | Inspector decisions |
| Version history | Deliverable disclosure | Inspector JSON |
| Campaign plan | Work → engagement disclosure | Planner view |
| Knowledge | Settings | — |
| Connections | Settings | — |
| Responsibilities | Settings → Advanced | Internal catalog |
| Company Brain | Company nav (future) | — |
| Team-wide attention | HQ + Command Center + Inbox | — |

---

## 11. Relationship to current Marketing UI

Sprint 28B moved **campaign engagement detail** toward presence-first **Working on** pattern. Sprint 29B+ should:

- Align **Peer default route** to **Working on** (not Work tab grid).  
- Map **Waiting for me** to Peer inbox + global Inbox.  
- Retire tab sprawl (Overview, Content, Knowledge as top tabs) into Settings + Work + Results.  

No change to review pipeline, VMs, or persistence required — **navigation and presenter ownership** only.

---

## 12. Design principles (colleague IA)

1. Delegation over dashboard  
2. Colleague before container (campaign/deal)  
3. Six questions, six sections  
4. One primary action per screen state  
5. Honest silence  
6. Progressive disclosure over modes  
7. Shortest path to decision  
8. Human Done narrative, not logs  
9. Results optional, not home  
10. Settings absorb technical tabs  

---

## References

- [Product README](./README.md)  
- [Master Roadmap](./PEERGENT_MASTER_ROADMAP.md)  
- [Experience Constitution](../PEERGENT_EXPERIENCE_CONSTITUTION.md)  
- [Product Bible](../PEERGENT_PRODUCT_BIBLE.md)  
- [Design System v1](../design-system/V1.md)  
