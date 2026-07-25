# Brain Registry — Architecture Audit

**Status:** Audit only (no implementation).  
**Date:** 2026-07-25  
**Scope:** Whether Peergent needs a “Brain Registry” before integrating Brand Brain (and future org intelligence domains) into the Context Engine.

**Related:** `docs/architecture/BRAND_BRAIN_IMPLEMENTATION_AUDIT.md`, `lib/context-engine/`, `lib/intelligence/`, `lib/brand-brain/`.

---

## Executive summary

Peergent **already has a composable Context Engine** with dependency injection, a **`LoaderRegistry`**, intelligence **adapters**, typed **context slices**, lazy/eager loading, org-scoped **scope resolution**, and **role-aware** behavior (peer-type modules, Marketing Understanding gate, Business Brain query planning). Intelligence sources are **partially hardcoded** in `BUILD_CONTEXT_LAZY_LAYERS`, `assembleContextPackage`, and `ContextPackage.slices` — not in a product-level “Brain Registry.”

**Recommendation:** **Option A** — add Brand Brain using the **existing loader + adapter pattern** first. **Option C** is largely **already present** (`LoaderRegistry` + layer lists + `ContextEngineOptions`); extend it incrementally if needed. **Option B** (a branded “Brain Registry”) is **premature** until multiple independent brain loaders exist with shared selection rules worth centralizing.

**Safest next action:** Intelligence adapter + Context Engine loader for Brand Brain, wired **additively** (parallel slice), without changing Marketing Understanding composition yet.

---

## 1. How the Context Engine gathers context

```text
API / dev playground
    │
    ▼
ContextEngine.buildContext(request, { supabase })
    │
    ├─ ScopeResolver.resolve(supabase, request)
    │     • Validates user ∈ organization, peer ∈ organization
    │     • Builds ContextScope (org, peer, actor, sessionId)
    │
    ├─ build() — eager layers (parallel loadLayer)
    │     • Default: identity, organization, objective, policy, telemetry
    │     • COMMUNICATION_ROLES (Sales, Marketing, Support): also push company-dna eager
    │
    ├─ buildLazy() for each BUILD_CONTEXT_LAZY_LAYERS entry not yet loaded
    │     • company-dna, business-brain, marketing-understanding, peer-type
    │     • (knowledge, memory, tools registered but excluded from this plan)
    │
    ├─ loadLayer(layerKey)
    │     • Memory cache (org + peer + layerKey)
    │     • LoaderRegistry.get(layerKey) → loader.load(LoaderContext)
    │
    └─ assembleContextPackage(bundle) → ContextPackage v2
          • Fixed slices object + meta.warnings + sources
```

**Entry points:** `defaultContextEngine.buildContext()` from `/api/ai/execute`, marketing-intelligence routes (strategy/plan/content-draft), dev `PromptPlayground`.

**DI:** `ContextEngineOptions` accepts custom `loaderRegistry`, `peerTypeRegistry`, `builder`, `cache`, `scopeResolver`.

---

## 2. Loaders, adapters, and context slices (inventory)

### Context Engine loaders (`lib/context-engine/loaders/`)

| Layer key | Load mode | Data source | Adapter / notes |
|-----------|-----------|-------------|-----------------|
| `identity`, `organization`, `objective` | eager | Supabase peers/org via `data/queries` | Inline loaders |
| `policy`, `preferences` | eager | Preferences | Stub/partial |
| `telemetry` | eager | Session trace id | Inline |
| `company-dna` | lazy | `loadCompanyDnaContext` | `lib/intelligence/adapters/company-dna-adapter.ts` |
| `business-brain` | lazy | `loadBusinessBrainContext` | `business-brain-query-service.ts` (task/role query plan) |
| `marketing-understanding` | lazy | `loadMarketingUnderstandingContext` | Composes DNA + Business Brain aggregate + marketing profile |
| `peer-type` | lazy | PeerTypeModule per role | `peer-types/registry.ts` |
| `knowledge`, `memory`, `tools` | lazy | **Stubs** (empty slices) | Not in `BUILD_CONTEXT_LAZY_LAYERS` |

### Intelligence adapters (`lib/intelligence/adapters/`)

| Adapter | Returns | Persistence |
|---------|---------|-------------|
| `company-dna-adapter` | `CompanyDnaContextSlice` | `company_dna` |
| `business-brain-query-service` | `BusinessBrainContextSlice` + query plan | `business_brain_*` (selective) |
| `marketing-understanding-adapter` | `MarketingUnderstandingContextSlice` | Derived from DNA + brain + `marketing_profiles` |

### Brand Brain (not yet in Context Engine)

| Module | Status |
|--------|--------|
| `lib/brand-brain/` | Domain types, assembler, **read service**, `ExistingPeergentBrandRepository` |
| Context loader | **Missing** |

### Context slice contract (`ContextPackage.slices`)

Fixed keys today: `companyDna`, `businessBrain`, `marketingUnderstanding`, plus session/peer stubs. **No** `brandBrain` slot yet.

---

## 3. Hardcoded intelligence sources?

**Yes — at three layers:**

1. **Load plan:** `BUILD_CONTEXT_LAZY_LAYERS` in `lib/context-engine/loaders/index.ts` — explicit list for `buildContext()`.
2. **Package assembly:** `assembleContextPackage` maps known layer keys to named slice fields and **hardcoded warnings** for DNA / Business Brain / Marketing Understanding.
3. **Prompt builder:** Section builders know DNA, Business Brain, Marketing Understanding by name (peer strategies select Business Brain sections).

**Not hardcoded:** Individual loader registration uses `LoaderRegistry.registerMany(defaultLoaders)` — new loaders *can* be registered via custom `ContextEngine` construction, but **`defaultContextEngine` and `buildContext()` won’t load them** until the lazy-layer list and `ContextPackage` type are extended.

**Marketing Understanding** is a **composite intelligence slice**, not a storage brain — it **re-merges** brand fields that Brand Brain will eventually own canonically.

---

## 4. Can Brand Brain integrate without a new registry?

**Yes.** The established pattern is:

1. `lib/intelligence/adapters/brand-brain-adapter.ts` — calls `BrandBrainService` + `ExistingPeergentBrandRepository`, maps to `BrandBrainContextSlice`.
2. `lib/context-engine/loaders/brand-brain-loader.ts` — `ContextLoader` with `layerKey: "brand-brain"`.
3. Extend `ContextLayerKey`, `BUILD_CONTEXT_LAZY_LAYERS` (or role-specific lazy plan), `ContextPackage.slices.brandBrain`, optional prompt section.

This reuses **existing** `LoaderRegistry` and adapter boundary — no new “Brain Registry” type required.

---

## 5. Is a Brain Registry justified now?

| Criterion | Assessment |
|-----------|------------|
| Multiple independent brain **loaders** in production | **Two** org domains (+ composite Marketing Understanding). Brand Brain loader **pending**. Asset/Market/Performance **absent**. |
| Shared selection logic across brains | Only Business Brain has `planBusinessBrainQuery(role, taskHint)`. Others are full-load or role-gated. |
| Duplicate registration / DI pain | Low — `LoaderRegistry` + `defaultLoaders` already centralize loaders. |
| Product vision (Business, Brand, Asset, Market, Performance) | **Future**; constitution favors shared capabilities but warns against abstraction for hypotheticals. |

**Verdict:** A **named “Brain Registry”** (Option B) would mostly **duplicate** `LoaderRegistry` + adapter index unless it also owns **cross-brain policy** (role matrix, task hints, failure semantics). That policy is **not yet uniform** enough to extract.

**Option C** (“generic context-slice loader registry”) — **already exists** as `LoaderRegistry` + compose/merge + optional custom engine. What’s missing is **declarative load plans per role/task**, not another registry name.

---

## 6. What a Brain Registry *should* own (when justified)

When ≥3 org-scoped intelligence loaders share rules, a registry module could own:

- **Catalog** of intelligence domains (id, layerKey, owner module, storage vs derived).
- **Load plan resolution:** which layers to eager/lazy load for `(peerRole, taskHint, capabilities)`.
- **Applicability flags:** e.g. Marketing Understanding only for Marketing; Brand Brain for creative/content tasks across roles (future).
- **Failure class:** required vs optional slice; degrade vs abort.
- **Observability hooks:** trace attributes per brain (loaded, sparse, gaps, cache hit).
- **Versioning** of slice shapes exposed to Prompt Builder.

It should **delegate execution** to existing loaders/adapters/services — not fetch Supabase itself.

---

## 7. What a Brain Registry must *not* own

- **Domain persistence** (tables, RLS, repositories) — stay in `lib/company-dna`, `lib/business-brain`, `lib/brand-brain`, etc.
- **Prompt text or model calls** — Prompt Builder / AI Runtime.
- **Authorization** — `ScopeResolver`, `getAuthenticatedOrgContext`, Supabase RLS.
- **Marketing Understanding composition** — until explicitly replaced, remains Marketing Intelligence’s derived view.
- **UI routing** (`/company`, peer studio tabs).
- **Hypothetical brains** without loaders (Market, Performance) — no catalog entries without code.

---

## 8. Organization scoping and permissions

**Today (correct pattern to preserve):**

| Layer | Enforcement |
|-------|-------------|
| API | `getAuthenticatedOrgContext()` → single primary org |
| Scope | `ScopeResolver` verifies membership + peer belongs to org |
| Repositories | Queries filtered by `organization_id`; RLS `is_org_member` |
| Brand Brain service | Validates org id; rejects mismatch in assembler |
| Context cache key | Includes `organizationId` + `peerId` + `layerKey` |

**Permissions:** Org roles exist (`owner|admin|manager|member|viewer`) but **are not used** to gate context loading — any member gets the same slices. Future brain **writes** may need role gates; **reads** for AI context likely remain member-scoped with redaction later.

**Brain Registry must not** accept cross-org IDs from slice payloads without matching `ContextScope.organization.organizationId`.

---

## 9. Loader failure behavior (current vs desired)

### Current behavior (observed)

| Scenario | Behavior |
|----------|----------|
| No Supabase in loader | Empty/stub slice, `available: false`, stub source; **no throw** (DNA, Business Brain, Marketing) |
| Business Brain query error | **Caught** in `loadBusinessBrainContext` → empty slice + error source |
| Marketing Understanding load error | **Throws** from adapter (loader **does not catch**) → can **fail entire `buildContext`** |
| Missing DNA row | `getOrCreate` in adapter path — **may create row** on DNA service (write side effect in intelligence path) |
| Unavailable intelligence slice | `available: false` → **not cached** (engine.ts) |
| Partial data | Slices expose `sparse`, `gaps`, `completeness` (Marketing); Business Brain `truncated` |
| Observability | `ContextPackage.meta.warnings`, `sources`, `traceId`; cache hits array underused |

### Recommended semantics (for future registry / loaders)

| Class | Example | Behavior |
|-------|---------|----------|
| **Required** | Scope, peer identity | Fail request (existing) |
| **Core org intelligence** | DNA, Business Brain for comms roles | Degrade to empty slice + warning; do not abort |
| **Role-specific** | Marketing Understanding | Skip or empty when role ≠ Marketing (already) |
| **Optional / future** | Asset Brain, Performance | Omit from load plan unless task/role match |
| **Brand Brain (proposed)** | Creative/content tasks | Lazy load; empty + gaps OK; never throw on missing profile |

**Observability:** Standardize per-slice `{ available, sparse, gaps?, errorCode? }` in meta; log server-side on catch; never expose raw Supabase to clients.

---

## 10. Task-specific brain selection

**Today:**

- `taskHint` → `planBusinessBrainQuery(role, taskHint)` (entity types + search terms).
- `BUILD_CONTEXT_LAZY_LAYERS` is **fixed** for all tasks (same four intelligence layers every time).
- Marketing Understanding always loaded for Marketing peers on `buildContext` (heavy composite).

**Future (incremental, not registry-first):**

- Extend lazy plan: e.g. include `brand-brain` when `taskHint` matches creative/content patterns **or** peer role is Marketing.
- Optional: peer-type modules declare `intelligenceLayers: ContextLayerKey[]` instead of global constant.

**Avoid:** Loading Asset/Market/Performance brains “because registry says so” without task/role rules.

---

## 11. Should every Peer receive every Brain?

**No** — aligned with constitution and current code:

| Brain / slice | Default for all peers? |
|---------------|------------------------|
| Organization + peer identity | Yes |
| Company DNA | Eager for Sales/Marketing/Support only today |
| Business Brain | Loaded for all `buildContext` calls (query plan varies by role) |
| Marketing Understanding | **Marketing only** (`roleApplicable`) |
| Brand Brain (proposed) | **Org-wide read**, but load for **creative/content** peers/tasks first — Finance may omit until needed |
| Asset / Performance | **No** until implemented and task-gated |

---

## 12. Integrating without breaking Marketing Intelligence

**Risk:** Brand Brain duplicates `MarketingUnderstanding.brand` (DNA + positioning merge).

**Safe path:**

1. Add **`brandBrain` parallel slice** via Brand Brain service (canonical read model).
2. **Do not remove** `marketingUnderstanding.brand` in the same release.
3. Prompt Builder: optionally prefer `brandBrain` when `available`, else fall back to marketing slice (feature flag or ordering).
4. Longer term: Marketing Understanding **references** Brand Brain adapter internally instead of re-merging raw DNA + positioning.

**Do not** change `buildMarketingUnderstanding` until Brand Brain loader is validated in tests and dev playground.

---

## 13. Options comparison

### Option A — Direct Brand Brain loader

| Pros | Cons |
|------|------|
| Matches DNA / Business Brain precedent | Touches `ContextLayerKey`, `ContextPackage`, lazy list, prompt sections |
| Uses existing `BrandBrainService` | Another hardcoded slice field until generalized |
| Smallest diff; easy rollback | Does not solve task-based load plans alone |

### Option B — Generic Brain Registry now

| Pros | Cons |
|------|------|
| Names future Asset/Market/Performance | **Two registries** (`LoaderRegistry` + Brain Registry) overlap |
| Central catalog | No stable selection rules yet — speculative API |
| | Higher refactor risk for Marketing Understanding |

### Option C — Extend loader registry / load plans (not “Brains” branding)

| Pros | Cons |
|------|------|
| **`LoaderRegistry` already exists** | Still need slice slots in `ContextPackage` per domain |
| Add `resolveLazyLayers(scope, taskHint)` | Modest refactor of `BUILD_CONTEXT_LAZY_LAYERS` |
| Avoids premature product taxonomy | Less visible to non-engineers |

### Recommendation (repository-based)

**Ship Option A now.** **Evolve toward Option C** (role/task lazy plan function) when a **second** optional brain (e.g. Asset) needs task gating. **Defer Option B** until ≥3 brains share selection/failure policy.

---

## 14. Smallest safe implementation action

**Action:** Add Brand Brain to Context Engine **additively** (no Marketing Understanding change).

1. `lib/intelligence/adapters/brand-brain-adapter.ts` — load slice via `createBrandBrainService(createExistingPeergentBrandRepository(supabase))`.
2. `lib/intelligence/types/brand-brain-context-slice.ts` — map from `AssembledBrandProfile` / `BrandBrainContextSlice` (domain type already exists).
3. `lib/context-engine/loaders/brand-brain-loader.ts` — org-scoped; empty slice when no supabase; **catch errors** → unavailable slice (match Business Brain, not Marketing throw).
4. Register loader in `defaultLoaders`; add `"brand-brain"` to `ContextLayerKey` and **`BUILD_CONTEXT_LAZY_LAYERS`**.
5. Extend `ContextPackage.slices.brandBrain` + `assembleContextPackage` warning when gaps exist (optional, sparse).
6. **Do not** wire Prompt Builder sections in the same PR (or gate behind no-op) to avoid prompt behavior change.

**Rollback:** Remove loader registration + layer key + adapter; delete new files; no DB migration.

---

## 15. Files create/modify (for action above)

| File | Change |
|------|--------|
| `lib/intelligence/adapters/brand-brain-adapter.ts` | **Create** |
| `lib/intelligence/types/brand-brain-context-slice.ts` | **Create** (engine projection) |
| `lib/intelligence/adapters/index.ts` | Export adapter |
| `lib/context-engine/loaders/brand-brain-loader.ts` | **Create** |
| `lib/context-engine/loaders/index.ts` | Register loader; extend `BUILD_CONTEXT_LAZY_LAYERS` |
| `lib/context-engine/types/context.ts` | Add `brand-brain` to `ContextLayerKey` |
| `lib/intelligence/index.ts` | Extend `ContextPackage.slices` |
| `lib/context-engine/assembly/context-package.ts` | Map layer → slice; optional warning |
| `lib/context-engine/__tests__/…` | Loader + package tests |
| `lib/intelligence/adapters/brand-brain-adapter.test.ts` | Unit tests with fake service |

**Not in first PR:** `prompt-builder` sections, Marketing Understanding refactor, `docs` only if needed.

---

## 16. Tests and rollback

**Tests:**

- Adapter: full/partial/missing sources; org mismatch; service errors → unavailable slice.
- Loader: no supabase; Marketing vs Finance peer (brand slice still org-scoped — same data).
- `assembleContextPackage`: brand slice present when layer loaded; warnings when gaps.
- Regression: existing `context-package.test.ts`, marketing intelligence routes unchanged.

**Rollback:**

1. Revert PR.
2. Confirm `defaultContextEngine.buildContext` no longer references `brand-brain`.
3. No data migration to undo.

---

## Appendix A — Architectural blockers

| Blocker | Severity | Mitigation |
|---------|----------|------------|
| `ContextPackage` fixed slice shape | Medium | Add `brandBrain` field; later generic `Record<string, unknown>` only if many brains |
| Marketing Understanding **throws** on load failure | Medium | Fix pattern when touching marketing loader; Brand loader must not throw |
| Brand vs Marketing **duplicate brand narrative** in prompts | Medium | Parallel slice first; prompt precedence later |
| `company_dna.getOrCreate` write on read path | Low | Brand Brain service uses read-only repo; DNA adapter unchanged in Action 4 |
| No task-based lazy plan | Low | Accept fixed lazy list for Brand Brain v1 |

---

## Appendix B — Key code references

| Concern | Path |
|---------|------|
| Engine orchestration | `lib/context-engine/core/engine.ts` |
| Loader registry | `lib/context-engine/core/loader-registry.ts` |
| Lazy load plan | `lib/context-engine/loaders/index.ts` (`BUILD_CONTEXT_LAZY_LAYERS`) |
| Package assembly | `lib/context-engine/assembly/context-package.ts` |
| Scope / auth | `lib/context-engine/scope/scope-resolver.ts` |
| Business Brain task planning | `lib/intelligence/retrieval/query-planner.ts` |
| Marketing composite | `lib/intelligence/adapters/marketing-understanding-adapter.ts` |
| Brand Brain read service | `lib/brand-brain/brand-brain-service.ts` |

---

*End of audit.*
