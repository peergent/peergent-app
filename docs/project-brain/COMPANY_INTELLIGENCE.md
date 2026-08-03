# Company Intelligence

Sprint 2 introduces the canonical **Company Profile** — organization-level, not campaign-specific.

## Company Profile

Location: `lib/brain/company/profile.ts`

Every field supports:

- `value`
- `source` (see source priority)
- `confidence`
- `lastUpdatedAt`
- `freshness`
- `customerConfirmed`

Campaigns **reference** company intelligence; they do not own it.

## Company Snapshot

`CompanySnapshotBuilder` assembles:

- Company Profile
- Business Brain slice
- Brand Brain slice
- CampaignContext (customer-entered campaign fields only)
- Website Snapshot
- Customer corrections
- Known facts, unknowns, sources

Returns immutable `CompanySnapshot` with readiness: `ready` | `partial` | `unknown`.

## Source priority

1. Customer confirmed
2. Customer entered
3. Website extracted
4. Integration
5. Brain inference
6. Unknown

Higher rank wins on conflict. Never silently invent facts.

## Customer corrections

`CustomerCorrection` contracts allow customers to override lower-priority sources (e.g. "We don't serve healthcare"). Corrections map to `customer_confirmed` priority.

## company_understanding capability

Deterministic implementation in `lib/brain/capabilities/company-understanding.ts`:

- Inputs: Company Snapshot
- Outputs: `BrainFinding`, `BrainDecision`, `BrainRecommendation`
- No LLM
- Returns honest "I don't know yet" when readiness is unknown

## Demo

Peergent demo profile: `lib/brain/demo/peergent-company-profile.ts`

Used by demo provider and demo workspace — no Veldwerk/installer narrative.
