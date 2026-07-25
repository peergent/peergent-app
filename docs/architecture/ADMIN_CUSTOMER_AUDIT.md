# Peergent — Admin vs Customer Architecture Audit

**Status:** Audit and proposal only (no implementation in this document).  
**Date:** 2026-07-25  
**Scope:** Full repository inspection for route/API/feature classification, auth model, duplication, and migration planning toward a multi–digital-colleague AI workforce platform.

---

## 1. Executive summary

Peergent’s codebase already implements a **multi-layer AI workforce platform**: Supabase-backed organizations and peers, a 2.0 customer shell (`PgAppShell` / `PgNav`), Command Center (`/home`), HQ landing (`/hq`), inbox, team peer studios (`/team/[peerId]/*`), marketing intelligence APIs, context engine, AI runtime, business brain / company DNA, and extensive marketing workspace logic. However, **customer product, onboarding, legacy surfaces, dev tooling, and future platform-admin needs are not separated at the routing or authorization layer**.

Key findings:

- **Two navigation paradigms coexist:** legacy `Sidebar` (`/peers`, `/knowledge` redirect) vs 2.0 `PgNav` (`/home`, `/inbox`, `/team`, `/company`). Post-login default is **`/hq`**, not Command Center.
- **`/peers/[id]`** remains a **legacy peer detail** surface (mock-enriched UI) while Marketing peers **redirect to `/team/[peerId]`** (canonical Peer Studio).
- **No `platform_admin` role** exists in the database or middleware. Org roles are `owner | admin | manager | member | viewer` on `organization_members`.
- **API routes** consistently use `getAuthenticatedOrgContext()` (user + primary org) for business-brain, company-dna, marketing-intelligence, and `/api/ai/execute` — org scoping is application-level; RLS is assumed but not audited here.
- **Marketing workspace persistence** is largely **`sessionStorage` per browser** (drafts, work units, responsibilities), mixed with Supabase for peers, understanding, and intelligence APIs — creating **multi-user and cross-device isolation gaps** within an org.
- **Dev / design preview** routes are gated by `NODE_ENV === "development"` in middleware and page guards; they must never ship as customer entry points.
- **Internal AI artifacts** (prompt packages, context packages, trace IDs, validation payloads) are exposed to **authenticated org users** via dev playground and partially via `/api/ai/execute` error responses — not suitable for customers without redaction and a separate admin surface.

Recommended direction: introduce a **route manifest + role model**, then migrate URLs into `(auth) / (customer) / admin` groups **without breaking redirects**, extract platform-admin APIs and UI, and consolidate navigation on `PgNav` while retiring legacy `Sidebar` paths.

---

## 2. Current route inventory

Classification legend: **C** CUSTOMER · **A** PLATFORM_ADMIN · **S** SHARED_PLATFORM · **U** AUTH · **D** DEVELOPMENT_ONLY · **P** DESIGN_PREVIEW · **L** LEGACY_OR_DUPLICATE · **?** UNCLEAR

| Path | File | Classification | Data source | `organization_id` | Auth / protection | Customer access today | Internal/sensitive UI | Move dependencies | Future location |
|------|------|----------------|-------------|-------------------|-------------------|----------------------|------------------------|-------------------|-----------------|
| `/` | `app/page.tsx` | **C** (marketing site) | Static | No | Public; authed → `/auth/post-login` | Yes | No | Marketing nav | `(public)/` or marketing app |
| `/login` | `app/login/page.tsx` | **U** | Supabase Auth | On login | Public auth route | Yes | No | auth callbacks | `(auth)/login` |
| `/signup` | `app/signup/page.tsx` | **U** | Supabase Auth | Provision on signup | Public auth route | Yes | No | `ensureUserOrganization` | `(auth)/signup` |
| `/forgot-password` | `app/forgot-password/page.tsx` | **U** | Supabase | No | Public | Yes | No | — | `(auth)/forgot-password` |
| `/reset-password` | `app/reset-password/page.tsx` | **U** | Supabase | No | Public | Yes | No | — | `(auth)/reset-password` |
| `/auth/callback` | `app/auth/callback/route.ts` | **U** | Supabase | — | Public | Yes | No | OAuth | `app/auth/*` |
| `/auth/post-login` | `app/auth/post-login/route.ts` | **U** | Supabase peers count | Yes | Authed | Yes | No | routing logic | `(auth)/post-login` |
| `/hq` | `app/hq/page.tsx` | **C** | Supabase peers + marketing understanding + local snapshots | Yes | Protected prefix | Yes | No | HQ VM, home snapshots | `(customer)/hq` or post-login hub |
| `/home` | `app/home/page.tsx` | **C** | Supabase peers, understanding, marketing snapshots, optional demo query | Yes | Protected | Yes | Demo via `?handoff=` | `useHandoffHome`, CC | `(customer)/home` Command Center |
| `/dashboard` | `app/dashboard/page.tsx` | **L** | Redirect only | — | Protected | Yes (redirect) | No | — | Remove alias after nav unified |
| `/inbox` | `app/inbox/page.tsx` | **C** | Peers + understanding + marketing snapshots | Yes | Protected | Yes | No | `lib/inbox` | `(customer)/inbox` |
| `/team` | `app/team/page.tsx` | **C** | Supabase peers (`PeersPageClient`) | Yes | Protected | Yes | No | peers queries | `(customer)/team` |
| `/team/[peerId]` | `app/team/[peerId]/page.tsx` | **C** | Supabase peer + `sessionStorage` workspace | Yes | Protected | Yes | No | `useMarketingWorkspace` | `(customer)/team/[peerId]` studio |
| `/team/[peerId]/review` … `/settings` | `app/team/[peerId]/*/page.tsx` | **C** | Domain VMs + session workspace | Yes | Protected | Yes | No | marketing-workspace tabs | Same tree under `(customer)` |
| `/team/[peerId]/projects/[projectId]` | `app/team/.../projects/[projectId]/page.tsx` | **C** | Project/detail VMs | Yes | Protected | Yes | No | peer-experience | `(customer)/team/.../projects/...` |
| `/team/[peerId]/content/[contentId]` | `app/team/.../content/[contentId]/page.tsx` | **C** | Content + approval | Yes | Protected | Yes | Approval UI | emma-workspace approval | Same |
| `/team/[peerId]/responsibilities/[id]` | `app/team/.../responsibilities/[id]/page.tsx` | **C** | Responsibility VM | Yes | Protected | Yes | No | responsibilities domain | Same |
| `/team/[peerId]/automations` | `app/team/.../automations/page.tsx` | **L** | Redirect → responsibilities | — | Protected | Yes | No | — | Delete redirect later |
| `/peers` | `app/peers/page.tsx` | **L** | Redirect → `/team` | — | Protected | Yes | No | middleware also redirects workforce | Retire alias |
| `/peers/workforce` | `app/peers/workforce/page.tsx` | **L** | — | — | Middleware 308 → `/peers` | Rare | No | — | Remove |
| `/peers/[id]` | `app/peers/[id]/page.tsx` | **L** | Supabase peer + **mock sections** + session prefs | Yes | Protected | Yes (non-Marketing) | Mock narrative data | `lib/peer-detail` | Replace with role studios or redirect all to `/team/[id]` |
| `/peers/[id]/marketing` | `app/peers/[id]/marketing/page.tsx` | **L** | Redirect → `/team/[id]` | — | Protected | Yes | No | `peerStudioHref` | Retire |
| `/company` | `app/company/page.tsx` | **C** | Business brain / knowledge UI | Yes | Protected | Yes | No | `KnowledgeManagementView` | `(customer)/company` |
| `/knowledge` | `app/knowledge/page.tsx` | **L** | Redirect → `/company` | — | Protected | Yes | No | — | Retire alias |
| `/integrations` | `app/integrations/page.tsx` | **C** | Placeholder + legacy Sidebar | Yes | Protected | Yes | No | connection-store local | `(customer)/integrations` |
| `/settings` | `app/settings/page.tsx` | **C** | Theme localStorage only | Yes | Protected | Yes | No | theme provider | `(customer)/settings` |
| `/website-intelligence` | `app/website-intelligence/page.tsx` | **C** | Supabase assessment + client scan pipeline | Yes | Protected | Yes | Hire-team flow | website-intelligence lib | `(customer)/onboarding/website` or company |
| `/studio-shell-preview` | `app/studio-shell-preview/page.tsx` | **P** / **D** | Preview components | — | Dev guard + middleware | Prod: 404/redirect | No | studio preview | Remove from prod builds |
| `/design-preview/hq` … `hq-d` | `app/design-preview/**` | **P** | Static concept data | No | Dev middleware redirect in prod | Prod: redirected `/` | No | design-preview features | Keep out of customer bundle |
| `/dev/prompt` | `app/dev/prompt/page.tsx` | **D** | Context engine + **full prompts** + AI response | Yes | Dev only | Prod: notFound | **Yes — prompts, context** | PromptPlayground | `admin/` or local-only |
| `/dev/context` | `app/dev/context/page.tsx` | **D** | Context inspection | Yes | Dev only | Prod: blocked | **Yes** | dev tools | Admin diagnostics |

**Layouts:** `app/layout.tsx` (root), `app/hq/layout.tsx` (font only), `app/dev/layout.tsx` (dev banner).

**Note:** `PROTECTED_ROUTE_PREFIXES` in `lib/auth/routes.ts` does not list `/dev`, `/design-preview`, or `/studio-shell-preview`; production behavior relies on `isDevRoute()` + `isDevPlaygroundEnabled()`.

---

## 3. API inventory

| Route | Classification | Auth | Org scope | Data | Customer callable | Sensitive response fields | Future location |
|-------|----------------|------|-----------|------|-------------------|---------------------------|-----------------|
| `GET/PATCH /api/company-dna` | **C** / **S** | `getAuthenticatedOrgContext` | Yes | Supabase | Yes | No | `(customer)/api/company-dna` |
| `GET/PATCH /api/business-brain` | **C** / **S** | Same | Yes | Supabase | Yes | Domain facts only | customer API |
| `/api/business-brain/*` (facts, products, services, segments, sources, competitors, processes) | **C** / **S** | Same | Yes | Supabase | Yes | No | customer API |
| `/api/marketing-intelligence` (+ understanding, strategy, plan, content, goals) | **C** / **S** | Same | Yes | Supabase + services | Yes | Strategy/content payloads | customer API |
| `POST /api/ai/execute` | **S** | Same | Yes | Context engine + AI runtime | Yes | **traceId, warnings, validation response on 422** | customer API with redaction |
| `POST /api/dev/generate-ai-response` | **D** | None (dev NODE check) | N/A | Raw prompt package | Prod: 404 | **Full AI response object** | **admin** or remove |
| `GET/POST /auth/*` | **U** | Session | — | Supabase | Yes | No | auth group |

All inspected business APIs use **`getPrimaryOrganizationForUser`** — there is no multi-org switcher in the app layer today.

---

## 4. Major subsystem inventory

| Path | Classification | Maturity | Primary data | Notes |
|------|----------------|----------|--------------|-------|
| `features/marketing-workspace/` | **C** | Production UI (mw-*) | sessionStorage + domain VMs | Canonical Marketing Peer Studio presentation |
| `features/studio/` | **C** / **L** | Frame + legacy mp-* components | Mixed | `MarketingPeerPageFrame`; orphaned project mp-* components |
| `features/home/` | **C** | Production | Supabase + snapshots + demo query params | Command Center / handoff |
| `features/hq/` | **C** | Production | Supabase peers + HQ aggregation | Default post-login destination |
| `features/inbox/` | **C** | Production | Derived from peers + marketing snapshots | Unified attention model partial |
| `features/design-preview/` | **P** | Static concepts | Fixtures | Not product |
| `hooks/useMarketingWorkspace.ts` | **C** / **S** | Core orchestration | sessionStorage persist | Central mutation spine for Marketing |
| `lib/marketing-intelligence/` | **S** | Production services | Supabase | Generation, understanding |
| `lib/marketing-workspace/` | **S** | Production | sessionStorage + API | Workflow, publication, activity |
| `lib/peer-experience/marketing/` | **S** | Production | Composed VMs | Domain + navigation |
| `lib/peer-workflow/` | **S** | Production | WorkUnit model | Cross-peer workflow |
| `lib/context-engine/` | **S** | Production | Supabase loaders + cache | Partial peer-type modules (marketing richest) |
| `lib/ai-runtime/` | **S** | Production | External LLM | Used by APIs and dev tools |
| `lib/prompt-builder/` | **S** | Internal | Builds PromptPackage | Should not ship to customer UI raw |
| `lib/company-dna/` | **S** | Production | Supabase | Org-scoped |
| `lib/intelligence/` + business-brain repos | **S** | Production | Supabase | Org-scoped |
| `lib/website-intelligence/` | **S** | Production | Supabase + client jobs | Onboarding / company brain |
| `lib/home/`, `lib/hq/`, `lib/inbox/` | **S** | Production | Mixed Supabase + snapshots | Command surfaces |
| `lib/peer-detail/` | **L** | **Mock-augmented** | Supabase peer + mock-data | Legacy peer profile |
| `lib/integrations/connection-store.ts` | **C** / **S** | Partial | **localStorage** per org | Not server-authoritative |
| `lib/dev/` | **D** | Dev guards | — | |
| `components/Sidebar.tsx` | **L** | Legacy nav | — | Competes with PgNav |
| `components/design-system/` | **S** | Production | — | Pg* primitives |
| `components/knowledge/` | **C** | Production | API-backed | Company page |
| `components/dev/PromptPlayground.tsx` | **D** | Dev | **Exposes context + prompts** | Platform-admin only |

**Missing / partial (not invented):** dedicated Sales/Support/Finance peer studios (context-engine modules exist; UI largely absent). Platform-admin app surface **missing**. Brand Brain / ad rendering **not present** (per scope). Central server-side marketing workspace persistence **partial** (local session dominates).

---

## 5. Existing data and authentication model

### Authentication flow

1. Supabase session via `@/lib/supabase/middleware` (`updateSession`) on all matched routes.
2. Unauthenticated users: protected prefixes → `/login?next=…`; other non-public routes also forced to login.
3. Authenticated `/` → `/auth/post-login` → `resolvePostLoginPath()`:
   - Ensures org via `ensureUserOrganization` if missing.
   - Zero peers → `/website-intelligence`.
   - Else → **`/hq`**.

### Organization model

- Tables: `organizations`, `organization_members`, `peers`, profiles (see `lib/supabase/database.types.ts`).
- **`organization_members.role`:** `owner | admin | manager | member | viewer` — not mapped to UI permissions yet.
- App uses **`getPrimaryOrganizationForUser`** — single org per user session; no org picker.

### Route protection

- Declared in `lib/auth/routes.ts` (`PROTECTED_ROUTE_PREFIXES`).
- **No route-level RBAC** (no check for org admin vs member).
- **No platform_admin** gate anywhere.

### API authorization

- Pattern: `getAuthenticatedOrgContext()` → 401/403 JSON.
- Peer-scoped operations typically pass `peerId` in body; **server must validate peer belongs to org** (verify per route — audit finding: rely on repo layer + RLS).

### RLS assumptions

- Repositories use Supabase client with user cookie; **correct isolation depends on Supabase RLS policies** (not verified in this audit). Application code assumes org filters on queries like `fetchOrganizationPeers`.

### Client-side persistence (isolation implications)

| Store | Key | Scoped by |
|-------|-----|-----------|
| `sessionStorage` | `peergent-marketing-workspace:{peerId}` | Browser tab |
| `sessionStorage` | peer workspace prefs | peerId |
| `localStorage` | integrations `{orgId}` | org (client only) |
| `localStorage` | theme, home last visit | user browser |
| `localStorage` | peer settings | peerId |

**Risk:** Two users in same org on different machines see different marketing workspace state until server persistence exists.

---

## 6. Customer-facing functionality

- **Onboarding / company:** `/website-intelligence`, `/company` (knowledge & business brain UI).
- **Command surfaces:** `/hq` (executive landing), `/home` (Command Center / handoff), `/inbox` (attention queue).
- **Workforce:** `/team`, `/team/[peerId]/*` (Marketing Peer Studio — full tab + detail routes).
- **Legacy peer profile:** `/peers/[id]` for non-Marketing roles until studios exist.
- **Org settings (minimal):** `/settings` (appearance only).
- **Integrations (placeholder):** `/integrations` + team Connections tab + local connection store.
- **APIs:** company-dna, business-brain, marketing-intelligence, ai/execute (org-scoped).

Customers **should** see: their org, peers, campaigns/content, approvals, performance, brand/knowledge, integrations status, team membership (when built), subscription (when built).

---

## 7. Platform-admin functionality

**Currently absent as a dedicated product surface.** The following are **platform-operator capabilities embedded in dev/customer paths** (should migrate to admin):

| Capability | Current location | Classification |
|------------|------------------|----------------|
| Prompt / context inspection | `/dev/prompt`, `/dev/context` | **D** → future **A** |
| Raw prompt execution | `/api/dev/generate-ai-response` | **D** → **A** |
| Full AI validation payloads | `/api/ai/execute` 422 responses | **S** — redact for **C** |
| Model/provider configuration | `lib/ai-runtime` env | **S** — admin config UI missing |
| Cross-org metrics | Not implemented | **A** (missing) |
| Template / intelligence ingestion ops | Partially in libs | **A** (missing UI) |

**Nothing today prevents a customer org member from calling `/api/ai/execute`** (by design for product); admin-only operations must be split by role and route namespace.

---

## 8. Shared platform functionality

- **Context engine** (`lib/context-engine/`): loaders for org, peer, company DNA, business brain, marketing understanding, knowledge; assembles `ContextPackage` for AI tasks.
- **AI runtime** (`lib/ai-runtime/`): provider abstraction, validation, execution.
- **Prompt builder** (`lib/prompt-builder/`): task prompts from context — internal.
- **Peer workflow** (`lib/peer-workflow/`): WorkUnit lifecycle shared across peer types.
- **Peer experience** (`lib/peer-experience/`): role-specific VMs (marketing most complete).
- **Design system** (`components/design-system/`): PgAppShell, PgNav, review patterns.
- **Metrics / publishing** (partial): `lib/metrics/`, publication packages in marketing-workspace.

These should remain **`lib/`** or `packages/` shared by `(customer)` and `(admin)` apps, not duplicated.

---

## 9. Development-only and preview functionality

| Item | Gate | Production behavior |
|------|------|---------------------|
| `/dev/*` | `isDevPlaygroundEnabled()` + layout | `notFound` / middleware redirect |
| `/studio-shell-preview` | Same + page guard | `notFound` |
| `/design-preview/hq*` | `isDevRoute` in middleware | Redirect to `/` when not dev |
| `/api/dev/generate-ai-response` | `NODE_ENV === "development"` | 404 |
| Home `?handoff=` / `?visual=reference` | Query params on **C** route | Demo fixtures on `/home` — **customers can append in prod** |

**Risk:** `/home?handoff=…` demo mode is available to any authenticated user in production (isolated fixtures, but confusing and not admin-gated).

---

## 10. Duplicate or competing product concepts

| Concept A | Concept B | Relationship | Recommendation |
|-----------|-----------|--------------|----------------|
| `/home` Command Center | `/hq` HQ landing | Both aggregate peers/services; **post-login → HQ** | Product decision: single executive entry (likely HQ **or** home, not both) |
| `/dashboard` | `/home` | Alias redirect | Remove dashboard from docs/nav |
| `/peers` | `/team` | Alias redirect | Standardize on **Team** |
| `/knowledge` | `/company` | Alias redirect | Standardize on **Company** |
| `Sidebar` nav | `PgNav` nav | Different links (peers vs team) | One shell |
| `/peers/[id]` | `/team/[peerId]` | Marketing redirects; other roles stay on peers | Role-based studio routing for all peers |
| `MarketingStudioPage` | `marketing-workspace` tabs | Same frame; overview wrapper | Already converged on `/team/[peerId]` |
| Customer `/settings` | Org admin settings (future) | Placeholder vs needed RBAC | Split `(customer)/settings` vs `admin` |
| Integrations page | Team Connections tab | Duplicate entry points | Single integrations IA |
| Inbox vs Review tab | Both attention | Overlapping decision queues | Unified inbox model (partially built) |

---

## 11. Security and data-isolation risks

1. **No platform_admin separation** — any org member can hit org-scoped APIs and see AI trace metadata.
2. **Dev prompt playground** exposes **system prompts and context packages** when dev mode is on — must never ship enabled in staging/production without auth.
3. **`/home?handoff=` demo fixtures** in production — low data leak but breaks trust; should be env-gated.
4. **Marketing workspace in sessionStorage** — not org-durable; tampering/local state; no audit trail on server.
5. **Integrations in localStorage** — connection status not authoritative; unsuitable for compliance story.
6. **`/api/ai/execute` 422** may return full `response` object to client — may include internal validation detail.
7. **Legacy peer detail mock data** (`lib/peer-detail/peer-detail-mock-data.ts`) — customers may perceive mock metrics/decisions as real.
8. **Primary org only** — users in multiple orgs (future) not supported; wrong org data if membership expands without UI.
9. **RLS not verified in this audit** — application filters must be backed by policies.
10. **Protected route list incomplete** — reliance on dev guards for preview routes; any new preview path could leak if not added to `isDevRoute`.

---

## 12. Recommended target information architecture

**Customer (executive + manager):**

- **HQ** — morning landing, service health, peer network (keep or merge with Home — PO decision).
- **Command Center** — KPIs, needs attention, live activity (current `/home`).
- **Inbox** — unified decisions and messages.
- **Team** — roster + enter Peer Studio.
- **Company** — DNA, brain, knowledge, website intelligence outcomes.
- **Integrations** — org connections (server-backed future).
- **Settings** — org profile, members, billing, appearance.

**Peer Studio (per peer, customer):**

- Role-specific tabs (Marketing template: Overview, Review, Projects, Content, Performance, Connections, Responsibilities, Knowledge, Settings).

**Platform admin (Peergent staff only):**

- Organizations, users, peers (cross-tenant read/support).
- Templates, prompts, model policies.
- Generations log, failures, costs.
- Intelligence ingestion pipelines.
- Feature flags, pilot controls.

---

## 13. Recommended route architecture

Proposed Next.js App Router shape ( illustrative — adopt gradually):

```text
app/
  (public)/              # marketing, legal
  (auth)/                # login, signup, callbacks
  (customer)/
    layout.tsx           # PgAppShell + auth + org context
    hq/
    home/                # Command Center (rename internally if HQ wins)
    inbox/
    team/
      [peerId]/
        layout.tsx       # Peer studio shell
        page.tsx         # overview
        review/ ...
    company/
    integrations/
    settings/
  (admin)/
    layout.tsx           # platform_admin guard
    organizations/
    users/
    peers/
    templates/
    generations/
    intelligence/
    system/
  api/
    (customer)/          # org-scoped, redacted responses
    (admin)/             # cross-org, staff-only
```

**Deviations from naive proposal:**

- Keep **`/auth/post-login`** as a route handler (not a page).
- **`/website-intelligence`** may live under `(customer)/onboarding/` but URL can remain during migration.
- **Do not move `lib/`** — shared kernel stays outside `app/`.
- **Peer Studio** stays URL-stable at `/team/[peerId]` until explicit redirect campaign.

---

## 14. Recommended role model

| Future role | Current support | Proposed mapping |
|-------------|-----------------|------------------|
| `platform_admin` | **Missing** | New table or auth claim; gates `(admin)` routes and admin APIs |
| `organization_admin` | Partial (`owner`, `admin` in DB) | Map `owner|admin` → manage members, billing, autonomy |
| `organization_member` | Partial (`member`, `manager`, `viewer`) | Map to work + approve permissions; `viewer` read-only |

**Peer.role** (`Marketing`, `Sales`, …) is **workforce taxonomy**, not user RBAC — keep separate.

**Middleware evolution:**

1. Session required for `(customer)` and `(admin)`.
2. Org membership required for `(customer)`.
3. Platform admin claim required for `(admin)`.
4. Optional org-role checks for destructive org settings.

---

## 15. Ordered migration plan

| Step | Objective | Behavior change | DB migration | Risk |
|------|-----------|-----------------|--------------|------|
| 1 | Route manifest & classification source of truth | None | No | Low |
| 2 | Gate demo query params on `/home` to non-prod | Demo only in dev/staging | No | Low |
| 3 | Unify navigation on `PgNav`; deprecate `Sidebar` | Links change on legacy pages | No | Medium |
| 4 | Redirect all `/peers/[id]` to studios when ready | Non-Marketing UX change | No | Medium |
| 5 | Introduce `(customer)` route group without URL changes | None if re-export pages | No | Low |
| 6 | Redact `/api/ai/execute` error payloads for customers | Less debug info | No | Medium |
| 7 | Server persistence for marketing workspace (parallel write) | Sync across devices | **Yes** (tables) | High |
| 8 | `(admin)` app shell + platform_admin auth | New surface | **Maybe** | High |
| 9 | Move `/dev/*` tools into admin | Dev URLs removed | No | Medium |
| 10 | Retire legacy aliases (`/dashboard`, `/peers`, `/knowledge`) | 308 redirects remain | No | Low |

Each step should ship with tests, feature flags where needed, and rollback by revert.

---

## 16. First five safest migration actions

### Action 1 — Route manifest (no URL changes)

- **Objective:** Single catalog of routes, classification, protection, canonical vs alias.
- **Affected files (new):** `lib/navigation/route-manifest.ts`; tests `lib/navigation/route-manifest.test.ts`.
- **Behavior change:** None.
- **Risks:** None.
- **Verification:** Unit tests; CI compares manifest to glob of `app/**/page.tsx`.
- **Rollback:** Delete manifest files.
- **DB migration:** No.

### Action 2 — Document canonical navigation in code comments + AGENTS link

- **Objective:** Align engineers on PgNav vs Sidebar.
- **Affected files:** `docs/architecture/OVERVIEW.md` cross-link only (optional later); manifest consumes nav definitions.
- **Behavior change:** None.
- **DB migration:** No.

### Action 3 — Production gate for `/home` demo query params

- **Objective:** `?handoff=` and `?visual=reference` only when `isDevPlaygroundEnabled()` or explicit `ALLOW_HOME_DEMO=true`.
- **Affected files:** `hooks/useHandoffHome.ts`, tests.
- **Behavior change:** Demo fixtures disabled in prod.
- **Rollback:** Remove guard.
- **DB migration:** No.

### Action 4 — Add middleware comment + test for dev route list parity

- **Objective:** Ensure new preview routes cannot ship unguarded.
- **Affected files:** `lib/dev/guards.ts`, `middleware.ts` tests.
- **Behavior change:** None until routes added wrongly.
- **DB migration:** No.

### Action 5 — API response redaction plan for `/api/ai/execute` (feature flag)

- **Objective:** Customer responses exclude raw `response` on errors; log server-side only.
- **Affected files:** `app/api/ai/execute/route.ts`, ai-runtime logging.
- **Behavior change:** Less client debug detail.
- **Rollback:** Flag off.
- **DB migration:** No.

---

## 17. Files affected by migration action 1

**New files only (proposed):**

- `lib/navigation/route-manifest.ts` — route entries: path, classification, protected, canonicalPath, deprecatedAliases.
- `lib/navigation/route-manifest.test.ts` — asserts all `app/**/page.tsx` paths registered.

**Read dependencies (not modified in action 1):**

- `lib/auth/routes.ts`
- `middleware.ts`
- `lib/dev/guards.ts`

---

## 18. Open questions requiring product-owner decisions

1. **Post-login home:** Should default remain **`/hq`**, switch to **`/home` (Command Center)**, or merge HQ into Command Center?
2. **HQ vs Home long-term:** One executive surface or two distinct personas (owner vs operator)?
3. **Legacy `/peers/[id]`:** Redirect all roles to `/team/[peerId]` when studios exist, or keep peer profile for non-Marketing indefinitely?
4. **Marketing workspace persistence:** Timeline and schema for **server-authoritative** state vs sessionStorage?
5. **Platform admin:** Supabase custom claims vs separate admin app vs VPN-only internal deployment?
6. **Org roles:** Which actions require `organization_admin` vs any member (approvals, autonomy, integrations)?
7. **Demo modes on `/home`:** Allowed in staging for sales demos? Who can enable?
8. **Integrations source of truth:** When do we move off `localStorage` to Supabase-backed connections?
9. **Inbox vs Review tab:** Is Inbox the canonical decision queue for all peers?
10. **Peergent pilot / multi-peer roadmap:** Priority order for Sales, Support, Finance studios vs admin split?

---

## Appendix A — Navigation overlap diagram

```text
Post-login ──► /hq (HQ landing)
                 │
Sidebar (legacy) │     PgNav (2.0)
    ├─ /home ────┼──── /home  Command Center
    ├─ /peers ───┼──── /team  (peers redirects)
    ├─ /knowledge ──► /company (redirect)
    └─ /settings ┼──── (not in PgNav today)

/team/[peerId] ──► Marketing Peer Studio (sessionStorage + Supabase peer)
/peers/[id]     ──► Legacy detail (mock data); Marketing ──redirect──► /team/[id]
```

---

## Appendix B — Shared platform data flow (as implemented)

```text
Supabase (peers, org, company_dna, business_brain, marketing intelligence)
        │
        ▼
lib/context-engine (loaders) ──► ContextPackage
        │
        ▼
lib/prompt-builder ──► PromptPackage ──► lib/ai-runtime
        │
        ▼
API routes / dev playground

Parallel client path:
hooks/useMarketingWorkspace ◄──► sessionStorage (drafts, work units, responsibilities)
        │
        ▼
features/marketing-workspace (VMs) ◄── lib/peer-experience/marketing
```

---

*End of audit.*
