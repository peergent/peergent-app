# Campaign Experience — Architecture Audit (Sprint 15)

**Status:** Audit only — no implementation in this document.  
**Date:** 2026-07-26  
**Scope:** Customer-facing campaign flow today; gap analysis vs target Campaign Workspace; smallest safe path for Sprint 15.

**Related code:** `features/marketing-workspace/`, `lib/peer-experience/marketing/view-models/`, `lib/campaign/`, `lib/marketing-workspace/`, `hooks/useMarketingWorkspace.ts`.

---

## Executive summary

Peergent has a **mature Marketing Workspace** (Projects, Content, Review, Performance, etc.) backed by **sessionStorage workspace state** and **API-generated** strategy/plan/drafts. The **Campaign domain**, **assembler**, and **list/detail read models** exist but are **mostly not wired to customer UI** except a **flag-gated, read-only Campaigns block** on the Projects tab.

**Canonical customer route for “work” today:** `/team/[peerId]/work` (Projects list) and `/team/[peerId]/projects/[projectId]` (project detail). Campaign cards **only link** when `campaign.id === MarketingProject.id` (rare today). The synthetic plan fallback campaign (`marketing-plan-campaign`) is **non-clickable** by design.

**Recommended navigation:** **Option D (phased)**, starting with **Option A** — keep the **Projects** tab, evolve **project detail** into the Campaign Workspace shell, and treat **MarketingProject** as the persistence anchor until Campaign storage exists.

**Sprint 15 Action 1 (proposed):** Read-only **Campaign detail sections** on the existing project detail route, driven by `buildMarketingCampaignDetailViewModel` + domain `assembleCampaign` projection — **no DB**, flag-gated, Projects UX preserved.

---

## 1. Current campaign-related customer flow

### 1.1 Marketing Peer entry

| Step | Route | Component | Data source | Data nature | Customer can act? | Classification |
|------|--------|-----------|-------------|-------------|-------------------|----------------|
| Team peer home | `/team/[peerId]` | `MarketingStudioPage` → `MarketingOverviewPage` | `MarketingPeerDomainInput` via `useMarketingWorkspace` + `buildMarketingPeerDomainInput` | **Real** workspace state + API understanding; metrics often **setup/placeholder** | Yes (insights dismiss, responsibility plan approve, links) | **Canonical** (Peergent 2.0 workspace) |
| Shell chrome | (all tabs) | `MarketingWorkspaceLayout`, `MarketingAgentHero`, `MarketingObjectiveCard`, `MarketingWorkspaceTabs` | `buildMarketingWorkspaceShellViewModel` | Derived from workspace + responsibilities | Pause work, message/delegate (alcove), tab nav | Canonical |

**Workspace hook (`useMarketingWorkspace`):**

- **Peer record:** Supabase (`fetchOrganizationPeerById`).
- **Understanding:** API `GET /api/marketing-intelligence/understanding` (Context Engine-backed server-side).
- **Strategy / plan / drafts:** Generated via API routes (`/api/marketing-intelligence/strategy`, `plan`, `content-draft`); results persisted in **`sessionStorage`** key `peergent-marketing-workspace:{peerId}` (`loadMarketingWorkspaceState` / `patchMarketingWorkspaceState`).
- **Projects, work units, responsibilities, automations, activity feed, approval overlays, publication packages, stored metrics:** **sessionStorage** (normalized + migrations for projects/responsibilities).
- **Integration connections:** **localStorage** (`loadIntegrationConnections`).
- **Not in customer UI today:** assembled `Campaign[]`, `MarketingDecisionRecord`, `CreativeBrief` payloads.

Legacy **`buildMarketingViewModel`** (timeline/deliverable) still exists under `lib/peer-experience/marketing/` for older studio paths; the **Marketing Workspace tabs** are the primary **canonical** surface.

---

### 1.2 Projects tab (includes Campaigns section)

| Step | Route | Component | Data source | Data nature | Customer can act? | Classification |
|------|--------|-----------|-------------|-------------|-------------------|----------------|
| Projects list | `/team/[peerId]/work` | `ProjectsTab` | `buildMarketingProjectsViewModel` | **Real** `MarketingProject[]` + derived status/progress from work units & drafts | Yes — open project, filters, “New project” → work href | Canonical |
| **Campaigns block** (flag) | Same | `MarketingCampaignsSection` | `buildMarketingCampaignViewModelSourceFromDomainInput` → `buildMarketingCampaignsViewModel` | **No persisted Campaign** — **fallback** from strategy/plan + draft counts; optional future `campaigns[]` | **Read-only**; next-action links only | **Transitional** (Sprint 14) |
| Project cards | Same | `ProjectsTab` (grid) | Same VM + `deriveProjectStatus` / `buildProjectCardSteps` | Real projects + derived progress | Yes — navigate to `/team/[peerId]/projects/[id]` | Canonical |

**Feature flag:** `MARKETING_CAMPAIGN_WORKSPACE_ENABLED` / `NEXT_PUBLIC_MARKETING_CAMPAIGN_WORKSPACE_ENABLED` (default **off**). When off, tab matches pre–Action 14 behavior.

---

### 1.3 Project detail

| Step | Route | Component | Data source | Data nature | Customer can act? | Classification |
|------|--------|-----------|-------------|-------------|-------------------|----------------|
| Project detail | `/team/[peerId]/projects/[projectId]` | `ProjectDetailTab` | `buildMarketingProjectDetailViewModel` + `buildProjectExperience` | **Real** project + work units + drafts scoped to project | Yes — review CTA, content links, phases, publishing/monitoring copy | Canonical (project-centric, not Campaign domain) |
| Missing project | Same | Empty state | N/A | N/A | Back to Projects | Canonical |

**Campaign read model:** `buildMarketingCampaignDetailViewModel` is **implemented but not rendered** in any customer component.

---

### 1.4 Content

| Step | Route | Component | Data source | Data nature | Customer can act? | Classification |
|------|--------|-----------|-------------|-------------|-------------------|----------------|
| Content library | `/team/[peerId]/content` | `ContentTab` | `buildMarketingContentViewModel` | **Real** drafts (+ publication state) from sessionStorage | Preview modal, create content modal, filters | Canonical |
| Content detail | `/team/[peerId]/content/[contentId]` | (detail route / modal patterns) | Content detail VM | Real draft | Review-oriented actions via workspace handlers | Canonical |

Drafts link to projects via `findProjectIdForDraft` (work unit `projectId`).

---

### 1.5 Review

| Step | Route | Component | Data source | Data nature | Customer can act? | Classification |
|------|--------|-----------|-------------|-------------|-------------------|----------------|
| Review queue | `/team/[peerId]/review` | `ReviewTab` | `buildMarketingReviewViewModel`, `ApprovalDeliverableCard` | Drafts `ready_for_review` + overlays | Approve, reject, edit, schedule, publish (workspace handlers) | Canonical |
| Project-scoped review | `/team/[peerId]/projects/[id]?section=reviews&deliverableId=` | `ProjectDetailTab` + review href | Same drafts | Real | Same | Canonical |

---

### 1.6 Performance

| Step | Route | Component | Data source | Data nature | Customer can act? | Classification |
|------|--------|-----------|-------------|-------------|-------------------|----------------|
| Performance | `/team/[peerId]/performance` | `PerformanceTab` | `buildMarketingPerformanceViewModel`, `resolvePeerPerformance` | **storedMetrics** (session) + drafts; often **empty/setup** until published + sync | Filter, view insights link | Canonical (grounded when metrics exist) |
| Scoped performance | Query `campaignId` / `contentId` | Same | Filters | Derived | Navigate | Canonical |

Project detail passes `performanceHref` with `campaignId: project.id` (project id used as campaign scope label, not Campaign domain id).

---

### 1.7 Activity feed

| Surface | Component | Data source | Nature | Act? | Class |
|---------|-----------|-------------|--------|------|-------|
| Overview “activity” | `OverviewTab` | `buildMarketingOverviewViewModel` → activity slice | sessionStorage feed + synthetic entries from workspace events | View | Canonical |
| Project detail timeline | `ProjectDetailTab` → `exp.timeline` | `buildProjectExperience` | Derived from work units / project events | View | Canonical |
| Review sidebar activity | `ReviewTab` | `buildMarketingActivities` | Derived | View | Canonical |

No separate **Campaign-scoped** activity store.

---

### 1.8 Responsibilities

| Step | Route | Component | Data source | Nature | Act? | Class |
|------|--------|-----------|-------------|------|------|-------|
| List | `/team/[peerId]/responsibilities` | `ResponsibilitiesTab` | `buildMarketingResponsibilitiesViewModel` | sessionStorage responsibilities + evaluation | Enable/configure (workspace) | Canonical |
| Detail | `/team/[peerId]/responsibilities/[id]` | `ResponsibilityDetailTab` | Detail VM | Real | Plan approve, links | Canonical |

Campaign workforce fallback on list cards maps **enabled responsibilities** (conservative labels only).

---

### 1.9 Strategy and plan (customer-visible)

Strategy and plan are **not a dedicated tab** in `MARKETING_PEER_TABS`. They appear indirectly:

- **Knowledge** tab — understanding gaps, brain insights (`buildMarketingKnowledgeViewModel`, website scan link to real ingestion).
- **Overview** — results metrics, project count, approval queue.
- **Workspace generation** — user triggers strategy/plan/draft via delegation, lifecycle recommendations (`lib/marketing-workspace/recommendations.ts`), and API calls from `useMarketingWorkspace`.
- **Campaign fallback card** — uses plan/strategy **summaries** (can be long on card today).

**Data:** strategy/plan JSON in **sessionStorage** after API generation; understanding from **API/Supabase-backed** intelligence profile.

---

## 2. Current project detail experience

### 2.1 Route and stack

- **Route:** `/team/[peerId]/projects/[projectId]`
- **Page:** `app/team/[peerId]/projects/[projectId]/page.tsx` → `MarketingPeerPageFrame` → **`ProjectDetailTab`**
- **Primary VM:** `buildMarketingProjectDetailViewModel`
- **Experience layer:** `buildProjectExperience` → `ProjectExperienceViewModel` (hero, phases, next step, timeline, content, publishing, monitoring, learning, questions)

### 2.2 Existing sections (customer-visible)

| Section | Source | Campaign analogue |
|---------|--------|-------------------|
| Hero (title, goal, progress, status, primary CTA) | `exp.hero` | Campaign header + progress |
| Phases | `exp.phases` | Lifecycle (not same as Campaign status enum) |
| What happens next | `exp.nextStep` | Next action |
| WorkUnits steps | `buildProjectCardSteps` | Department activity (internal name hidden in copy) |
| Publishing / monitoring / learning | Conditional blocks | Performance / recommendations (partial) |
| Questions | `exp.questions` | — |
| Activity timeline | `exp.timeline` | Activity |
| Generated content grid | `vm.contentItems` | Deliverables |
| Sidebar (responsibility, performance link) | `exp.sidebar` | Workforce / performance entry |

### 2.3 Can it display Campaign data?

| Question | Answer |
|----------|--------|
| Safe to render `MarketingCampaignDetailViewModel`? | **Yes**, as an additive read-only layer — no raw domain objects in VM. |
| Sections already sufficient for target IA? | **Partially** — deliverables, approvals (via review CTAs), activity, performance links exist; **Recommendations** and **Campaign-level goal/audience/channels** are weak or absent. |
| Missing for Campaign IA | Explicit **Goal** (business + marketing), **Audience**, **Channels**, **Approval queue summary**, **Recommendations** list, **Budget** (only if explicitly supplied), unified **Campaign status** (vs project status labels). |
| **`buildMarketingCampaignDetailViewModel` wired?** | **No** UI consumer yet. |

### 2.4 Project ID vs Campaign ID alignment

| ID type | Origin | Typical value |
|---------|--------|----------------|
| `MarketingProject.id` | `createMarketingProject` / migration | Opaque string (project entity) |
| Assembled `Campaign.id` | `CampaignSource.campaignId` | Caller-defined (e.g. `campaign-1` in tests) |
| Fallback list id | Constant `marketing-plan-campaign` | Synthetic |

**Link rule today:** `linkEnabled === true` only when **`campaign.id === project.id`**. Most deployments will **not** align unless Action 15 intentionally sets `assembleCampaign({ campaignId: project.id, ... })` when creating/linking.

**Risk:** Campaign card href to project detail **only works** after ID alignment or dedicated campaign detail route.

---

## 3. Existing UI assets to reuse (do not rebuild)

| Asset | Location | Reuse for Campaign |
|-------|----------|-------------------|
| Project/campaign cards | `mw-project-card`, `mw-glass`, `mw-projects-grid` | Campaign cards (compact) |
| Status chips | `mw-project-status`, `--planning`, `--blocked` | Campaign status |
| Progress | `mw-project-pct`, `mw-project-track`, `mw-project-fill` | Progress or “Not measured yet” |
| Section headers | `mw-section`, `mw-section-head`, `mw-section-title` | All detail sections |
| Detail hero | `mw-detail-hero`, `mw-detail-title` | Campaign header |
| Phase/step lists | `mw-detail-phases`, `mw-step` | Timeline / phases (optional) |
| Timeline | `mw-timeline`, `mw-tl-row` | Activity |
| Content grid | `mw-content-grid` (project detail) | Deliverables |
| Approval UI | `ApprovalDeliverableCard`, review tab patterns | Approvals |
| Empty states | `mw-empty-inline`, overview empty copy | Campaign empty |
| Performance entry | `getPerformanceHref`, Performance tab sections | Performance |
| Modals | `MwContentPreviewModal`, `MwModal` | Preview only (read-only sprint) |
| Tabs nav | `MarketingWorkspaceTabs`, `mw-tabs` | Future sub-nav **inside** detail, not new top-level tab yet |
| Next action CTA | `mw-btn-primary`, `mw-section-link` | Primary CTA |
| Campaign meta list | `mw-campaign-meta`, `mw-campaign-next` | Compact card metadata |

**Avoid exposing:** `WorkUnits` heading in customer Campaign copy (rename to “Progress” / “Activity” in campaign context).

---

## 4. Target Campaign Experience (customer-facing)

Six sections inside a **Campaign Workspace** (detail-first; list stays on Projects tab for Phase 1).

### 4.1 Overview

| | |
|--|--|
| **Purpose** | Orient: what this campaign is, status, progress, goal, next action. |
| **Visible** | Title, status, progress (or unknown), concise goal, channels summary, owner/peer line. |
| **Primary CTA** | Next action (review, continue planning, etc.). |
| **Data source** | `buildMarketingCampaignDetailViewModel` + project hero fallback; `assembleCampaign` from domain when no stored campaign. |
| **Fallback** | Plan/strategy-derived campaign; progress **not measured**; no budget unless explicit. |
| **Must not expose** | Decision records, brief internals, prompts, assembly trace, gaps. |

### 4.2 Activity

| | |
|--|--|
| **Purpose** | Show what the marketing peer did recently on this campaign. |
| **Visible** | Timeline entries (milestones, updates). |
| **Primary CTA** | None or “View all activity” (future). |
| **Data source** | Project `exp.timeline` today; campaign VM `activitySummary`; feed filtered by project/draft ids. |
| **Fallback** | Empty timeline copy. |
| **Must not expose** | WorkUnit ids, internal event types. |

### 4.3 Deliverables

| | |
|--|--|
| **Purpose** | Content created for this campaign. |
| **Visible** | Title, channel, status (Draft / Waiting for approval / Published). |
| **Primary CTA** | Open content or review. |
| **Data source** | Drafts linked via work unit `projectId` or plan activity references (`linkedContent` in campaign VM). |
| **Fallback** | Empty deliverables. |
| **Must not expose** | Creative brief ids as “brief engine” — optional neutral “Reference” labels only if needed later. |

### 4.4 Approvals

| | |
|--|--|
| **Purpose** | What needs customer decision before publish. |
| **Visible** | Count waiting for approval, link to Review. |
| **Primary CTA** | Review approvals. |
| **Data source** | Draft status `ready_for_review`; `approvalQueue` on campaign detail VM. |
| **Fallback** | “No approvals pending.” |
| **Must not expose** | Overlay internals, validation traces. |

### 4.5 Performance

| | |
|--|--|
| **Purpose** | Results when published and metrics exist. |
| **Visible** | Summary line, link to Performance tab (scoped). |
| **Primary CTA** | View performance. |
| **Data source** | `storedMetrics`, `resolvePeerPerformance`; campaign VM `performance`. |
| **Fallback** | “Performance data not available yet” (no invented KPIs). |
| **Must not expose** | Token/cost, model names. |

### 4.6 Recommendations

| | |
|--|--|
| **Purpose** | What to do next to improve outcomes. |
| **Visible** | Short recommendation bullets (explicit only). |
| **Primary CTA** | Derived from recommendation type (future); Sprint 15 read-only list. |
| **Data source** | Campaign assembler `recommendations` when supplied; brain insights **not** mixed without curation. |
| **Fallback** | Empty section hidden. |
| **Must not expose** | LLM rationale chains, “insights engine” internals. |

---

## 5. Product language

**Use:** Campaign, Goal, Progress, Deliverables, Waiting for approval, Content created, Performance, Recommendation, Next action, Planning, Blocked.

**Do not use in UI:** Marketing Decision, Creative Brief, Context Package, Assembler, gaps, evidence, WorkUnit (customer-facing), token, model.

Presenter layer already filters some internal warning strings (`sanitizeCustomerCampaignWarnings`); extend pattern for detail UI.

---

## 6. Navigation recommendation

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A** | Keep **Projects** tab; evolve **project detail** into Campaign Workspace | Reuses route, persistence, review/content links; smallest migration | Tab label “Projects” vs “Campaign” mental model |
| **B** | Rename Projects → Campaigns | Clear product story | Breaking rename, URLs/bookmarks, responsibilities copy |
| **C** | New top-level Campaigns tab | Clear separation | 10th tab, duplicate list vs projects, more nav churn |
| **D** | Phased: A now → optional B/C after persistence | Safe, reversible | Requires discipline to avoid two systems |

**Recommendation: D → start with A.**

- Keep `/team/[peerId]/work` and **`MARKETING_PEER_TABS`** unchanged for Sprint 15.
- Treat **`MarketingProject` as the persisted campaign instance** until Campaign DB exists.
- Align **`assembleCampaign({ campaignId: project.id })`** when projecting read models for detail.
- Optionally rename section title **“Campaigns”** on work tab (already present when flag on) without renaming the tab yet.

---

## 7. Campaign card redesign (compact)

**Problem today:** Fallback cards can show **long strategy/plan summary** as goal/title; too many meta lines.

**Proposed compact card fields (max ~8 lines):**

| Field | Rule |
|-------|------|
| **Title** | Campaign name or plan summary **truncated** (~60 chars) |
| **Status** | Chip: Planning, Active, Blocked, etc. |
| **Progress** | `NN%` or **“Not measured yet”** |
| **Goal** | **One line**, truncated (~80 chars) — marketing objective only, not full strategy JSON |
| **Channels** | Up to 3 labels, then “+N” |
| **Waiting for approval** | Show only if count > 0 |
| **Content created** | Show only if count > 0 |
| **Blocked** | Show only if blocked count > 0 |
| **Next action** | Single link line (existing `nextAction.label`) |
| **href** | Link **only** if `linkEnabled`; else static card |

**Hide on card:** Audience paragraph, full timeline, workforce list, recommendation essay, creative brief counts (internal-adjacent), description block.

---

## 8. Campaign detail information architecture

**Proposed hierarchy (top → bottom):**

1. **Campaign header** — title, status, progress — reuse `mw-detail-hero` / campaign VM header fields.  
2. **Next action** — primary CTA — reuse hero primary CTA pattern + `nextAction` from campaign VM.  
3. **Goal** — business + marketing objectives (short) — new subsection or extend `mw-kn-helper`.  
4. **Overview strip** — channels, timeline summary, audience one-liner — compact meta row.  
5. **Deliverables** — reuse project detail content grid + `linkedContent`.  
6. **Approvals** — queue summary + link to Review — reuse review href patterns.  
7. **Performance** — summary + link — reuse `performanceHref` block from project sidebar.  
8. **Recommendations** — list from campaign VM (explicit only).  
9. **Activity / timeline** — reuse `mw-timeline` / project `exp.timeline`.  
10. **Department activity** — workforce from campaign VM OR responsibility link (customer: “Your marketing peer’s focus areas”) — **no fabricated completion**.

**Component mapping:**

| IA block | Existing component / VM |
|----------|-------------------------|
| Header | `ProjectDetailTab` hero **or** new `CampaignDetailHeader` using campaign VM |
| Deliverables | `vm.contentItems` / `linkedContent` |
| Approvals | `ReviewTab` patterns, `approvalQueue` |
| Performance | `PerformanceTab` + `buildContentPerformanceSummary` |
| Activity | `exp.timeline` |
| Recommendations | Campaign VM `recommendations` |

---

## 9. Persistence reality

| Capability | Today | Source | Notes |
|------------|-------|--------|-------|
| Campaign list | Fallback or test-only assembled | Derived from plan/strategy | Not persisted |
| Campaign detail VM | Computable | `assembleCampaign` + domain | Not persisted |
| Project / “campaign instance” | Yes | sessionStorage `projects` | **Canonical persistence anchor** |
| Strategy / plan | Yes | sessionStorage + API | Regeneratable |
| Content drafts | Yes | sessionStorage + API | Linked via work units |
| Approvals / publish | Yes | Draft status + overlays | Real actions |
| Performance metrics | Sometimes | sessionStorage `metrics` | Often empty until sync |
| Campaign workforce | Partial | Responsibilities + optional assembler seed | No peer id fabrication |
| Budget / KPI / recommendations | Only if explicitly in source | Assembler | **Do not fake** |
| Marketing Decision / Creative Brief | Domain only | Not in workspace state | **Never show raw** |

**Future Campaign persistence:** Store `Campaign` record (or project ↔ campaign mapping) in Supabase — **out of scope for Sprint 15 start**.

---

## 10. Ordered Sprint 15 implementation plan

### Action 15.1 — Read-only Campaign detail on project route (recommended first)

| | |
|--|--|
| **Objective** | Customer opening a **real project** sees a coherent **Campaign** read-only summary on the same URL; compact cards on work tab. |
| **Files affected** | `ProjectDetailTab.tsx` (additive sections), new `CampaignDetailSections.tsx` (or similar under `features/marketing-workspace/details/`), `marketing-campaign-card-presenter.ts` (compact fields), `build-marketing-campaigns-view-model.ts` (truncation + `linkEnabled` policy), optional `buildMarketingCampaignDetailViewModel` caller mapping `projectId` → `CampaignSource`, tests under `features/marketing-workspace/__tests__/`. |
| **Visible change** | Flag on: shorter campaign cards; project detail shows Campaign blocks (Goal, Progress, Deliverables summary, Waiting for approval, Next action). Flag off: unchanged. |
| **Risk** | Low — read-only; duplicate hero if not merged carefully. Mitigate: campaign block **below** or **replace** redundant goal lines only. |
| **Tests** | Presenter compact output; detail VM wired with `campaignId === projectId`; no internal strings; fallback project not broken. |
| **Rollback** | Disable flag or remove `CampaignDetailSections` import from `ProjectDetailTab`. |
| **Database** | **None** |

### Action 15.2 — ID alignment helper

| | |
|--|--|
| **Objective** | When building campaign read models for UI, set `campaignId: project.id` from domain input. |
| **Files** | `buildMarketingCampaignViewModelSourceFromDomainInput`, optional `projectToCampaignSource.ts`. |
| **Visible** | Campaign cards link to matching project detail. |
| **Risk** | Medium — wrong mapping if multiple campaigns per org. Mitigate: one fallback campaign + N project-scoped assemblies only. |
| **Tests** | linkEnabled true when ids match. |
| **Rollback** | Revert helper. |
| **DB** | None |

### Action 15.3 — Compact card UI only

| | |
|--|--|
| **Objective** | Implement §7 compact card spec in presenter + `MarketingCampaignsSection`. |
| **Files** | Presenter, section component, CSS tokens if needed. |
| **Visible** | Cards fit product spec. |
| **Risk** | Low. |
| **Rollback** | Revert presenter. |
| **DB** | None |

### Action 15.4 — Campaign sub-nav on detail (read-only tabs)

| | |
|--|--|
| **Objective** | In-page anchors: Overview, Deliverables, Approvals, Performance, Activity, Recommendations (scroll or query `section=` reuse). |
| **Files** | `ProjectDetailTab` or `CampaignDetailSections`, reuse `parseProjectSearchParams`. |
| **Visible** | Faster scanning. |
| **Risk** | Low. |
| **Rollback** | Remove sub-nav. |
| **DB** | None |

### Action 15.5 — Optional tab rename (B)

| | |
|--|--|
| **Objective** | Rename tab label Projects → Campaigns only (URL stays `/work`). |
| **Files** | `marketing-peer-links.ts`, copy, tests. |
| **Visible** | Label change. |
| **Risk** | Medium — support/docs. |
| **Rollback** | Revert label. |
| **DB** | None |

### Action 15.6 — Campaign persistence (future)

| | |
|--|--|
| **Objective** | Supabase campaign entity linked to projects. |
| **DB** | **Migration required** — not Sprint 15.1. |

---

## 11. Acceptance criteria (Sprint 15 complete — customer view)

- [ ] Campaign cards are **compact** and understandable (no wall of strategy text).
- [ ] Clicking a **linked** campaign opens a **coherent** detail experience on `/team/[peerId]/projects/[projectId]`.
- [ ] **No broken links** — synthetic fallback remains non-link or safe empty project state.
- [ ] **No internal** implementation language in UI.
- [ ] **Waiting for approval** visible when drafts require review.
- [ ] **Next action** is obvious and matches deterministic rules.
- [ ] **Content generation**, Review, and Publish flows **unchanged**.
- [ ] Feature flag **off** restores prior Projects-only UX.
- [ ] Performance and recommendations **do not show invented numbers**.

---

## Audit deliverable checklist (for implementers)

1. **Only this file created** in this audit task — confirm at commit time.  
2. **Current canonical route:** `/team/[peerId]/work` (list), `/team/[peerId]/projects/[projectId]` (detail).  
3. **Navigation recommendation:** **D (phased), implementing A first.**  
4. **Sprint 15 Action 1:** Read-only Campaign detail sections on project detail + compact cards (flag-gated).  
5. **Files Action 1 would modify:** `ProjectDetailTab.tsx`, new detail section component(s), `marketing-campaign-card-presenter.ts`, possibly `buildMarketingCampaignViewModelSourceFromDomainInput` / detail builder wiring, tests in `features/marketing-workspace/__tests__/`.  
6. **Blocker:** **Campaign IDs ≠ Project IDs** in most real data — must align in 15.1/15.2 or cards stay non-link until then; **`buildMarketingCampaignDetailViewModel` not yet mounted in UI**.

---

*End of audit.*
