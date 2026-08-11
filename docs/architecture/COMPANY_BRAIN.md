# Company Brain

**Status:** PX-40 — Architecture implemented  
**Authority:** [BRAIN_ARCHITECTURE_BLUEPRINT.md](./BRAIN_ARCHITECTURE_BLUEPRINT.md), [PROJECT_ENGINE.md](./PROJECT_ENGINE.md)

---

## Purpose

Company Brain is the **single source of truth about an organization**.

It owns organizational identity — who the company is, what it sells, how it communicates, and what is allowed. Every future Brain reads Company Brain before making decisions.

```text
Website metadata + Business profile + Brand graph + Customer configuration
                              ↓
                        Company Brain
                              ↓
     CompanyGraph · CompanyFact · CompanyRelation · CompanyVersion
                              ↓
        Research · Reasoning · Strategy · Creative · Memory · …
```

**Never:** generate campaigns, validate, execute, learn, or crawl the internet.  
**Only:** assemble structured organizational knowledge from supplied sources.

---

## Responsibilities

| Owns | Never owns |
|------|------------|
| Organization identity | Research findings |
| Brand expression (canonical) | Competitor analysis |
| Business facts, products, services | Campaigns |
| Mission, vision, goals | Creative output |
| Policies, brand rules, tone | Validation |
| Knowledge source registry | Execution records |
| Website metadata (not crawl) | Performance metrics |
| Integration registry | Learned patterns (Memory) |

---

## Boundaries

- **Does not crawl** — website input is metadata from existing snapshots; crawling belongs to Research Brain.
- **Does not fabricate** — every fact requires source + evidence; empty fields are omitted.
- **Does not write Memory** — Company Brain is canonical; Memory references Company Brain.
- **Learning may propose updates** — but never writes Company Graph directly (future approval flow).

---

## Company Graph

Twenty-eight domains layered in organizational order:

```text
Organization → Business → Brand → Products → Services → Audience → Ideal Customers
→ Markets → Industry → Mission → Vision → Core Values → Tone → Writing Style
→ Brand Rules → Visual Identity → Goals → USPs → Differentiators → Competitive Position
→ Website → Knowledge Sources → Policies → Legal → Compliance → Integrations
→ Locations → Languages
```

Each domain is a `CompanyNode` referencing `CompanyFact` ids. `CompanyRelation` links facts (`belongs_to`, `supports`, `derived_from`, …).

---

## Ownership model

| Truth | Owner |
|-------|-------|
| Organization, brand, business facts | Company Brain |
| Products, services, goals, policies | Company Brain |
| Website metadata | Company Brain |
| Knowledge source registry | Company Brain |
| Competitor research | Research Brain |
| Campaign memories | Memory Brain |
| Publish records | Execution Brain |

No overlap. Memory never replaces Company Brain.

---

## Persistence

| Component | Role |
|-----------|------|
| `CompanyRepository` | Org-level store + version index |
| `CompanyGraphSnapshot` | Point-in-time versioned snapshot |
| `CompanyHistory` | Version audit trail |
| `CompanyOutput` | Graph + structured output + outputRef |

Output ref: `company:{organizationId}:v{version}:{updatedAt}`

Separate from Memory — Company Brain is canonical organizational store.

---

## Versioning

Every graph carries `CompanyVersion`:

- `version` — monotonic integer
- `createdAt` / `updatedAt`
- `author`, `source`, `changeReason`

Subsequent runs increment version. History entries enable future diff/comparison.

---

## Confidence model

Every `CompanyFact` includes:

| Field | Purpose |
|-------|---------|
| `confidence` | `low` \| `medium` \| `high` |
| `sourceIds` | Linked knowledge sources |
| `evidence` | Traceable proof |
| `freshness` | `fresh` \| `stale` \| `unknown` |
| `lastValidated` | Customer confirmation timestamp |
| `customerConfirmed` | Whether customer validated |

Graph-level confidence derived from fact quality ratio.

---

## Knowledge source model

Registered source kinds:

| Kind | Example |
|------|---------|
| `website` | Website metadata snapshot |
| `brandbook` | Brand graph |
| `uploaded_pdf` | Customer PDF |
| `business_profile` | Company profile |
| `customer_configuration` | Integrations config |
| `manual_entry` | Direct customer input |
| `crm` / `erp` | Future connectors |

Every fact references one or more sources.

---

## Consumers

| Brain | Reads |
|-------|-------|
| Research Brain | Org baseline before enrichment |
| Reasoning Brain | Business + audience context |
| Marketing Intelligence | Brand + business framing |
| Strategy Brain | Goals, positioning, USPs |
| Planning Brain | Products, integrations |
| Creative Brain | Brand rules, tone, audience |
| Validation Brain | Approved claims baseline |
| Execution Brain | Integration registry |
| Memory Brain | References — never replaces |
| Learning Brain | Proposes updates (future) |

---

## Project Engine integration

```typescript
companyBrainContract: ProjectBrainContract
  id: "company"
  capabilityIds: ["company_understanding"]
  requiredContextSlices: ["business"]
```

Registered first in `createDefaultProjectBrainRegistry()`. Project Engine schedules; Company Brain never self-schedules.

---

## Future integrations

**Research Brain** — enriches external findings; Research writes to ResearchGraph, not Company Graph. Customer-approved research may propose Company updates through approval.

**Memory Brain** — stores campaign-learned patterns; references Company facts by id/ref. Never overwrites canonical Company truth.

---

## Cross-peer reuse

Company Brain is **peer-agnostic** and **org-scoped**. Marketing, Sales, Support, Finance, HR, CEO, and Analytics peers all read the same Company Graph for one organization.

---

## File layout

```text
lib/brain/layers/company/
├── types.ts
├── modules/specs.ts
├── company-graph.ts
├── build-company-graph.ts
├── company-relations.ts
├── company-versioning.ts
├── company-validator.ts
├── company-repository.ts
├── company-output.ts
├── company-layer.ts
├── company-brain-executor.ts
├── index.ts
└── __tests__/company-brain.test.ts
```

---

## Constraints (PX-40)

- No UI changes
- No Project Engine orchestration changes (type extension only)
- No Brain Output Layer wiring
- No modifications to Creative, Validation, Memory, Execution Brains
- No changes to BRAIN_ARCHITECTURE_BLUEPRINT.md
