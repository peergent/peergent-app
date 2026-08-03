# Readiness & Missing Information

Emma must know when she knows enough. Sprint 3 adds honest readiness scoring — never fabricated.

## Readiness dimensions

Each dimension scores **0–100**:

| Dimension | Source |
|-----------|--------|
| `company_profile` | Confirmed vs inferred profile fields |
| `website` | Pages and findings in website snapshot |
| `brand` | Brand brain availability + tone/positioning |
| `business` | Business brain availability + products/services/competitors |
| `corrections` | Customer corrections applied |

## Overall state

| Score range | State |
|-------------|-------|
| ≥ 70 | `ready` |
| 35–69 | `partial` |
| 1–34 | `needs_information` |
| 0 | `unknown` |

Critical missing items can force `needs_information` even when the score is higher.

## Missing information

`detectMissingInformation()` returns structured items:

- `priority` — critical, high, medium, low
- `reason` — why the gap matters
- `recommendedAction` — what the customer should do
- `customerImpact` — effect on Emma's work

Examples: website missing, industry unknown, USP unknown, target audience unknown, competitors missing, brand tone unknown, mission missing, goals missing.

## Customer-facing message

`formatMissingInformationMessage()` produces:

> I still need: target audience, website, goals.

Dutch locale uses **"Ik heb nog nodig:"**.

## API

```typescript
import { buildReadinessReport, detectMissingInformation } from "@/lib/brain";

const readiness = buildReadinessReport({ profile, website, brandAvailable, businessAvailable, correctionsApplied });
const gaps = detectMissingInformation({ profile, website });
```

See `lib/brain/context/readiness.ts` and `lib/brain/context/missing-information.ts`.
