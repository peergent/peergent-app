# Context Assembly

Sprint 3 introduces **CompanyContextAssembler** — the only place where `CompanySnapshot` and `BrainSnapshot` are assembled.

## Pipeline

```
Organization
  ↓
Company Profile
  ↓
Business Brain (MarketingUnderstanding)
  ↓
Brand Brain (MarketingUnderstanding.brand)
  ↓
Website Snapshot
  ↓
Customer Corrections
  ↓
Known Facts / Unknowns
  ↓
Freshness
  ↓
Company Snapshot
  ↓
Brain Snapshot
```

Everything is immutable at assembly time. Downstream capabilities consume snapshots; they do not rebuild company knowledge.

## Entry points

| Function | When to use |
|----------|-------------|
| `assembleCompanyContextSync()` | Website snapshot already in store |
| `assembleCompanyContext()` | URL supplied; provider resolves snapshot async |
| `resolveCompanyIntelligence()` | Campaign workspace integration (sync) |
| `resolveCompanyIntelligenceAsync()` | After website dialog adds URL |

## Result shape

`ContextAssemblyResult` includes:

- `companySnapshot` — canonical company knowledge
- `brainSnapshot` — capability-facing projection
- `readiness` — dimension scores (see [READINESS.md](./READINESS.md))
- `missingInformation` — structured gaps (see [READINESS.md](./READINESS.md))
- `state` — `ready | partial | needs_information | unknown`
- `version` — source/context hashes for cache invalidation
- `audit` — assembly trace (sources, unknowns, corrections)

## Campaign integration

Campaigns **never own** company knowledge. `CampaignContext` + `CompanySnapshot` → `BrainSnapshot`.

The Marketing Workspace website dialog:

1. Stores `WebsiteSnapshot` via demo provider
2. Runs `CompanyContextAssembler`
3. Updates company snapshot
4. Refreshes brain evidence

When readiness is incomplete, Emma says **"I still need…"** instead of guessing.

## Package location

```
lib/brain/context/
  company-context-assembler.ts   ← single assembly point
  assembly-types.ts
  readiness.ts
  missing-information.ts
  brain-snapshot-builder.ts
  snapshot-versioning.ts
  assembly-audit.ts
  freshness-resolver.ts
```
