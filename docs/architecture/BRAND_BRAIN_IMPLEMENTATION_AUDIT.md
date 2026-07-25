# Brand Brain — Implementation Audit

**Status:** Audit and implementation plan only (no code or schema changes in this document).  
**Date:** 2026-07-25  
**Authority:** Aligns with `docs/constitution/*`, `docs/blueprints/brand-brain.md`, and existing Peergent platform layers.

---

## Executive summary

Peergent already stores **partial brand-related data** across **Company DNA**, **Marketing Intelligence (`marketing_profiles.brand_positioning`)**, and **Marketing Understanding** (a composed view for the Marketing Peer). There is **no dedicated Brand Brain module**, **no visual identity system** (colors, typography, logos, layout rules), **no Asset Brain**, and **no renderer**. Business Brain and Knowledge UI at `/company` remain the canonical customer surface for org context today.

Brand Brain MVP must **extend** the platform—one org-scoped brand profile, structured rules, Context Engine exposure—without duplicating Business Brain or rebuilding `/company`. The smallest first step is **domain types and ownership boundaries only** (no DB, no UI).

---

## 1. Brand-related data that already exists

| Data | Fields / concepts | Purpose today |
|------|-------------------|---------------|
| **Company DNA** | `mission`, `values[]`, `toneOfVoice` (summary, personality, dos, donts, examplePhrases), `riskProfile`, `decisionPrinciples[]` | “How the company thinks and communicates” for AI and org culture |
| **Marketing profile** | `brand_positioning` JSON: positioningStatement, tagline, valueProposition, keyMessages[], marketCategory | Marketing positioning; edited in Company → “Brand positioning” |
| **Marketing Understanding `brand` slice** | Merges DNA mission/values/tone + marketing positioning fields | Single object for Marketing Peer context completeness |
| **Business Brain entities** | Products, services, customer segments, competitors, processes, facts, knowledge sources | Business knowledge—not visual brand, but **audience/positioning inputs** |
| **Organizations** | `name`, `slug` | Org identity label only (no brand profile) |
| **Website intelligence assessments** | Saved scan results → Business Brain ingestion path | Onboarding signal; not a brand rule store |
| **Peergent design system (`--pg-*`)** | App chrome tokens | **Product UI**, not customer org brand |
| **Marketing workspace copy** | References to “brand” in settings/autonomy copy | UX language only; no structured brand rules |
| **Session/local stores** | Marketing workspace, integrations, theme | **Not** org brand data |

**Not present today:** logo files/rules, palette tokens per org, typography rules, forbidden words lists, CTA style rules, layout/safe-area constraints, channel-specific creative rules, asset IDs, brand versioning, Performance Brain feedback into brand.

---

## 2. Where data lives (storage class)

| Concern | Location | Storage |
|---------|----------|---------|
| Mission, values, tone (partial UI), risk, principles | `public.company_dna` | **Supabase** (RLS via `is_org_member`) |
| Brand positioning (marketing) | `public.marketing_profiles.brand_positioning` | **Supabase** (RLS) |
| Products, segments, competitors, sources, facts | `public.business_brain_*` | **Supabase** (RLS) |
| Marketing goals & content catalog | `public.marketing_goals`, `marketing_content_items` | **Supabase** (RLS) |
| Org + membership | `public.organizations`, `organization_members` | **Supabase** (RLS) |
| Peers | `public.peers.organization_id` | **Supabase** (RLS) |
| Website assessments | `website_intelligence_assessments` | **Supabase** (migration `20250718100000`) |
| Marketing workspace drafts | `sessionStorage` (`peergent-marketing-workspace:{peerId}`) | **Browser** (not brand) |
| Integrations | `localStorage` per org | **Browser** |
| Theme | `localStorage` | **Browser** |
| Legacy peer narrative | `lib/peer-detail` mock enrichment | **Code / mock** (legacy route) |
| Context slices | Built at request time in `lib/intelligence/adapters/*` | **Derived** (not persisted) |

---

## 3. Models and tables reusable for Brand Brain

| Asset | Reuse for Brand Brain | Notes |
|-------|----------------------|-------|
| `organizations.id` | Foreign key anchor | One active brand profile per org (MVP) |
| `company_dna` | **Read** for migration period; long-term **split tone overlap** | Do not delete; deprecate duplicate fields gradually |
| `marketing_profiles` | **Read** `brand_positioning`; migrate write path to Brand Brain | Keep row for marketing goals/content children |
| `business_brain_customer_segments` | **Read** for audience context in brand identity | Owned by Business Brain |
| `business_brain_knowledge_sources` | **Read** for provenance (“brand sourced from PDF”) | Owned by Knowledge / Business Brain |
| Context Engine loader pattern | **Add** `brand-brain` loader + intelligence adapter | Same pattern as `company-dna-loader`, `marketing-understanding-loader` |
| `getAuthenticatedOrgContext()` | All APIs | Org scoping at app layer |
| `/company` + `KNOWLEDGE_SECTIONS` | **UI shell** for future “Brand” section | No new top-level route required for MVP |

**Do not reuse as Brand Brain storage:** `metadata` jsonb on brain products as a dumping ground for colors/logos—keeps ownership unclear.

---

## 4. Overlap with Brand Brain (today)

| Brand Brain module (blueprint) | Current Peergent overlap | Conflict risk |
|-------------------------------|---------------------------|---------------|
| **Identity** (story, mission, vision, values, positioning, audience) | `company_dna.mission/values`; `brand_positioning`; segments in Business Brain | **High** — three stores for “who we are” |
| **Visual system** | None (org-scoped) | None |
| **Tone of voice** | `company_dna.tone_of_voice` (incl. dos/donts not all exposed in UI) | **Medium** — DNA vs brand voice |
| **Creative / layout rules** | None | None |
| **Asset references** | None (Asset Brain missing) | None |
| **Learning** | Marketing performance partial; no Performance Brain | Out of MVP scope |

**Marketing Understanding** intentionally **merges** DNA + positioning into `understanding.brand` (`build-marketing-understanding.ts`). That composite is convenient for the Marketing Peer but is **not** a canonical Brand Brain model.

---

## 5. Must remain owned by Business Brain

- Products, services, pricing/delivery metadata  
- Customer segments (structured pain points, buying triggers)  
- Competitors and differentiators  
- Internal processes  
- Business facts (subject–predicate–value)  
- Knowledge sources (documents, URLs, ingestion content)  
- Graph/external IDs on brain entities  
- Website intelligence **business** extraction outputs that land as brain entities/facts  

Business Brain answers: **what the business is, sells, knows, and competes on.**

---

## 6. Must become owned by Brand Brain

- **Brand profile** (one active profile per org in MVP)  
- **Visual identity rules:** colors, typography, logo usage, spacing/grid, design tokens (org-scoped, not `--pg-*`)  
- **Brand voice for customer-facing creative:** vocabulary, emoji policy, sentence length, forbidden phrases, CTA patterns  
- **Creative constraints:** layouts, hierarchy, safe areas, channel dimensions (structured, deterministic)  
- **References to approved assets** (asset IDs only; binaries in Asset Brain)  
- **Brand compliance snapshot** for renderer/validator (future Creative Engine)—MVP types only  

Brand Brain answers: **how the organization must look and sound in governed outputs.**

---

## 7. Must later belong to Asset Brain

- Binary media: logos, icons, photography, video, templates  
- Variants (dark/light logo), MIME, dimensions, storage refs  
- Approval state per asset  
- Thumbnails and CDN/storage paths  

Brand Brain holds **rules + references**; Asset Brain holds **bytes + lifecycle**.

---

## 8. Context Engine exposure (target)

Follow existing v2 pattern (`docs/context-engine-v2-architecture.md`):

```text
Supabase brand_* tables (future)
        ↓
lib/brand-brain/services (domain)
        ↓
lib/intelligence/adapters/brand-brain-adapter.ts
        ↓
lib/context-engine/loaders/brand-brain-loader.ts  (layer key: brand-brain)
        ↓
ContextPackage slice: BrandBrainContextSlice
        ↓
Prompt Builder sections (peer-agnostic base + Marketing peer-type enrichment)
```

**Principles:**

- Brand Brain domain **never** imports Context Engine or Prompt Builder.  
- Loader TTL and lazy load similar to Company DNA (~30m) unless brand edits need invalidation hooks.  
- Slice must be **safe for customer-facing AI** (no internal template source, no cross-org data).  
- Marketing Understanding **should consume** Brand Brain slice instead of re-merging raw DNA + `brand_positioning` long term; during migration, adapter can **compose** Brand Brain + Business Brain audience fields.

**Task hints:** Content generation, ad/creative tasks load `brand-brain`; pure CRM-style tasks may skip.

---

## 9. Marketing Peer consumption (target)

Today:

- `marketingUnderstandingLoader` → `loadMarketingUnderstandingContext` → `buildMarketingUnderstanding`.  
- Gaps link to `/company?section=*` via `gapToKnowledgeSection` (`brandPositioning` → `brand-positioning`).  
- Peer Studio **Knowledge** tab links to website scan and knowledge gaps—not a brand editor.

Target:

1. **Context:** Marketing tasks include `BrandBrainContextSlice` (voice + visual rules + positioning canonicalized).  
2. **Completeness:** Replace or narrow `brandPositioning` gap to **Brand Brain completeness** dimensions (identity, visual, voice, rules).  
3. **UI:** Deep links from Marketing Peer to `/company?section=brand` (or subsection) for missing rules—**after** Company UI gains a Brand section.  
4. **Validation (post-renderer):** Creative outputs checked against Brand Brain rules deterministically—not in MVP.

Do **not** duplicate brand forms inside Peer Studio Settings (`SettingsTab` already points users to Knowledge/Company).

---

## 10. Smallest possible Brand Brain MVP

**In scope (product):**

- One **BrandProfile** per organization (logical; persisted later).  
- Structured modules: **identity** (minimal), **visual tokens**, **voice**, **creative constraints** (minimal channel rules).  
- Read path for Context Engine (can start with **adapter composing existing** DNA + `brand_positioning` into Brand Brain shape—**no DB** in action 1).  
- Tests proving ownership boundaries and slice shape.

**Out of scope (MVP):**

- Renderer / HTML→PNG  
- Asset Brain uploads  
- Performance-driven learning  
- Multi-brand / sub-brands  
- Competitor brand ingestion  
- Customer-visible redesign of `/company` (until planned section)  
- Moving writes off `marketing_profiles.brand_positioning` (later migration action)

---

## 11. Proposed TypeScript domain model (MVP)

Namespace: `lib/brand-brain/` (new).

```typescript
/** One active profile per org (MVP). */
export type BrandProfile = {
  id: string;
  organizationId: string;
  name: string; // default: organization trade name
  status: "draft" | "active";
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type BrandColorToken = {
  id: string;
  role: "primary" | "secondary" | "accent" | "background" | "text" | "neutral";
  hex: string;
  usageNote?: string;
};

export type BrandTypographyToken = {
  id: string;
  role: "heading" | "body" | "caption" | "cta";
  fontFamily: string;
  fontWeight?: number;
  fontSizePx?: number;
  lineHeight?: number;
};

export type BrandLogoRule = {
  id: string;
  /** Asset Brain reference when available */
  assetId?: string;
  variant: "primary" | "inverse" | "mark";
  minClearSpacePx?: number;
  allowedBackgrounds?: string[];
  notes?: string;
};

export type BrandVoiceRules = {
  summary?: string;
  personalityTraits: string[];
  dos: string[];
  donts: string[];
  forbiddenPhrases: string[];
  preferredCtaPatterns: string[];
  emojiPolicy: "none" | "sparingly" | "allowed";
  maxSentenceLength?: number;
};

export type BrandIdentityModule = {
  positioningStatement?: string;
  tagline?: string;
  valueProposition?: string;
  keyMessages: string[];
  marketCategory?: string;
  /** Narrative only; mission may mirror Company DNA until split is product-approved */
  story?: string;
};

export type BrandLayoutConstraint = {
  id: string;
  channel: "instagram" | "linkedin" | "email" | "web" | "print" | "other";
  widthPx?: number;
  heightPx?: number;
  safeAreaInsetsPx?: { top: number; right: number; bottom: number; left: number };
  notes?: string;
};

export type BrandProfileSnapshot = {
  profile: BrandProfile;
  identity: BrandIdentityModule;
  colors: BrandColorToken[];
  typography: BrandTypographyToken[];
  logoRules: BrandLogoRule[];
  voice: BrandVoiceRules;
  layoutConstraints: BrandLayoutConstraint[];
};

/** Engine-facing projection (no DB ids required in prompts beyond trace). */
export type BrandBrainContextSlice = {
  available: boolean;
  completeness: number;
  gaps: BrandBrainGap[];
  snapshot: Partial<BrandProfileSnapshot>;
  assembledAt: string;
};

export type BrandBrainGap =
  | "identity"
  | "visual-colors"
  | "visual-typography"
  | "logo-rules"
  | "voice"
  | "layout-constraints";
```

**Mapping helpers (later actions):** `mapCompanyDnaToVoicePartial`, `mapMarketingPositioningToIdentity`, `mergeIntoBrandProfileSnapshot`—with explicit **field ownership** tests so DNA and Brand Brain do not diverge silently.

---

## 12. Proposed Supabase tables (not created in this audit)

**`brand_profiles`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| organization_id | uuid UNIQUE FK → organizations | One active profile MVP |
| name | text | |
| status | text CHECK | draft \| active |
| version | integer | Optimistic concurrency |
| created_at, updated_at | timestamptz | |

**`brand_profile_modules`** (alternative: JSONB columns on `brand_profiles` for MVP simplicity)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| brand_profile_id | uuid FK | |
| module | text CHECK | identity \| visual \| voice \| creative |
| payload | jsonb | Validated against TS schemas at app layer |
| updated_at | timestamptz | |

**Optional normalized (post-MVP):** `brand_color_tokens`, `brand_typography_tokens`, `brand_logo_rules`, `brand_layout_constraints` with `brand_profile_id` FK.

**`brand_asset_references`** (MVP-lite)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| brand_profile_id | uuid FK | |
| asset_id | uuid | FK to future `assets` table |
| role | text | logo_primary, etc. |
| sort_order | int | |

**Do not store** logo bytes in Brand Brain tables.

---

## 13. RLS and organization isolation

Mirror existing patterns (`company_dna`, `marketing_profiles`):

- Enable RLS on all `brand_*` tables.  
- **SELECT/INSERT/UPDATE/DELETE** for members: `public.is_org_member(organization_id)` on root table.  
- Child tables: `SECURITY DEFINER` helper `brand_profile_org_id(profile_id)` → `is_org_member` on policies.  
- APIs: **`getAuthenticatedOrgContext()`** only; never trust client `organizationId` without membership check.  
- No peer-level brand rows in MVP (brand is org-wide); peer-type modules **read** org brand.  
- Future: restrict **write** to `owner|admin|manager` when product maps org roles to permissions (today all members can mutate brain/DNA).  

Platform-admin read across orgs: **separate service role**, not customer JWT—per constitution §13.

---

## 14. Customer-facing location under Company

**Canonical route:** `/company` (`KnowledgeManagementView`).

**Proposed IA (future, no change in action 1):**

| Section id | Title | Owner |
|------------|-------|-------|
| `company-dna` | Company DNA | Company DNA domain (decision/risk culture) |
| `brand` | Brand | Brand Brain (visual + voice + creative rules) |
| `brand-positioning` | *(deprecated tab)* | Redirect/educate → `brand` identity subsection |
| Business brain sections | unchanged | Business Brain |

Align with `customer-navigation`: Company is visible; separate `/knowledge` nav item stays hidden until Knowledge is a real surface.

Peer Studio links: `/company?section=brand` for gaps.

---

## 15. Hidden from customers

- Raw prompt packages and Brand Brain → prompt serialization templates  
- Internal completeness algorithms and gap weights  
- Asset storage paths, template source, renderer AST  
- Cross-org brand benchmarks  
- Performance Brain learning weights  
- Failed validation traces (redact in `/api/ai/execute`)  
- Dev/playground brand fixture overrides unless gated  

Customers **may** see: their brand colors, voice rules, logo usage guidelines, and “complete your brand” guidance.

---

## 16. Migration risks

| Risk | Mitigation |
|------|------------|
| **Dual write** DNA + Brand Brain tone/identity | Single write path per field; migration map; read-time merge only during transition |
| **Marketing Understanding drift** | Brand Brain slice becomes source; shrink merged `brand` object deliberately |
| **`brand_positioning` orphan column** | Backfill `brand_profiles` then read adapter; deprecate column |
| **Completeness gaps UX** | Update `gapToKnowledgeSection` mapping in one PR with Brand gaps |
| **No org role write gates** | Document; add when RBAC lands |
| **Empty visual rules block renderer** | MVP allows sparse profile; renderer action fails closed with actionable gaps |
| **Confusing Company DNA vs Brand** | Product copy + constitution alignment; DNA = operating principles, Brand = market-facing identity |

---

## 17. Ordered implementation plan (small, reversible actions)

| # | Action | DB | UI | Reversible |
|---|--------|----|----|------------|
| **1** | **Domain boundary + types + ownership tests** (`lib/brand-brain/`) | No | No | Delete module |
| 2 | Document field migration map (DNA ↔ Brand ↔ marketing_positioning) in `docs/architecture/` | No | No | Doc only |
| 3 | `BrandBrainContextSlice` + empty/stub adapter from existing DNA + positioning (read-only compose) | No | No | Remove loader registration |
| 4 | Register `brand-brain-loader` in Context Engine (lazy); no Prompt Builder change yet | No | No | Unregister loader |
| 5 | Unit tests: Marketing Understanding uses Brand slice when present | No | No | Revert adapter |
| 6 | Supabase migration `brand_profiles` + RLS | **Yes** | No | Drop tables |
| 7 | Repository + service + `GET/PATCH /api/brand-brain` | Yes | No | API behind flag |
| 8 | Backfill script: positioning JSON → brand profile identity | Yes | No | Keep legacy read |
| 9 | Company UI: new **Brand** section (read/write API) | Yes | **Yes** | Hide section flag |
| 10 | Marketing gaps → `section=brand`; deprecate standalone brand-positioning tab | Yes | Yes | Keep redirect |
| 11 | Asset Brain references (logo asset IDs) | Yes | Yes | Optional refs |
| 12 | Creative Engine validator consuming BrandBrainContextSlice | No* | No | Feature flag |

\*Validator may ship before renderer; still no PNG MVP.

---

## 18. Implementation action 1 (first step)

**Objective:** Establish Brand Brain as a named platform domain with explicit types, ownership matrix, and tests—**no database, no UI, no Context Engine wiring**.

**Creates (proposed files only):**

| File | Purpose |
|------|---------|
| `lib/brand-brain/types/brand-profile.ts` | Core types (`BrandProfile`, modules, `BrandBrainContextSlice`, gaps) |
| `lib/brand-brain/types/index.ts` | Re-exports |
| `lib/brand-brain/ownership.ts` | Constants documenting which fields belong to Brand Brain vs Company DNA vs Business Brain vs Marketing Intelligence |
| `lib/brand-brain/index.ts` | Public API surface |
| `lib/brand-brain/__tests__/ownership.test.ts` | Asserts no forbidden overlap (e.g. products not in Brand types), gap enum stability, snapshot validators |
| `lib/brand-brain/__tests__/brand-profile.test.ts` | Schema/shape tests (e.g. hex validation helpers if included) |

**Modifies:** None required (optional: one-line cross-link in `docs/architecture/README` or `IMPLEMENTATION.md`—skip unless product asks).

**Verification:** `npx vitest run lib/brand-brain/__tests__/*.test.ts`; `npm run build`.

**Rollback:** Remove `lib/brand-brain/`.

---

## Appendix A — Current `/company` and `/knowledge` behavior

- **`/company`:** Renders `KnowledgeManagementView` with sidebar sections from `KNOWLEDGE_SECTIONS`; data via `/api/company-dna`, `/api/business-brain/*`, `/api/marketing-intelligence/*`.  
- **`/knowledge`:** Server redirect to `/company` preserving `?section=`.  
- **Company DNA UI:** Mission, values (names only), tone summary, personality traits, risk summary, principles—**not** full `tone_of_voice.dos/donts` JSON.  
- **Brand positioning UI:** Writes **`marketing_profiles.brand_positioning`** only.

---

## Appendix B — Key code references

| Area | Path |
|------|------|
| Company DNA types | `lib/company-dna/types.ts` |
| Company DNA table | `supabase/migrations/20250719100000_business_brain.sql` |
| Marketing positioning | `lib/marketing-intelligence/types/entities.ts`, `marketing-profile-repository.ts` |
| Marketing Understanding merge | `lib/marketing-intelligence/understanding/build-marketing-understanding.ts` |
| Context loaders | `lib/context-engine/loaders/index.ts` |
| Company UI | `components/knowledge/KnowledgeManagementView.tsx`, `BrandPositioningSection.tsx`, `CompanyDnaSection.tsx` |
| Org auth | `lib/intelligence/api/org-context.ts`, `lib/organizations/queries.ts` |
| Blueprint | `docs/blueprints/brand-brain.md` |

---

*End of audit.*
