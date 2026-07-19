# Org Intelligence Foundation (Supabase)

Sprint 7 foundation split into two domains:

- **Company DNA** — how the company thinks and communicates
- **Business Brain** — what the company knows about its business

## Apply the migration

```bash
supabase db push
```

Migration file: `supabase/migrations/20250719100000_business_brain.sql`

---

## Company DNA

One record per organization (`company_dna.organization_id` is unique).

| Field | Description |
|-------|-------------|
| `mission` | Company mission statement |
| `values` | Core values (jsonb array) |
| `tone_of_voice` | Communication guidelines |
| `risk_profile` | Risk tolerance and constraints |
| `decision_principles` | How decisions are made |

**Module:** `lib/company-dna/`

| Method | Route |
|--------|-------|
| GET | `/api/company-dna` |
| PATCH | `/api/company-dna` |

---

## Business Brain

One record per organization. Root table holds only identity; all knowledge lives in child tables.

| Section | Table |
|---------|-------|
| Products | `business_brain_products` |
| Services | `business_brain_services` |
| Customer segments | `business_brain_customer_segments` |
| Competitors | `business_brain_competitors` |
| Internal processes | `business_brain_internal_processes` |
| Knowledge sources | `business_brain_knowledge_sources` |
| Business facts | `business_brain_facts` |

**Module:** `lib/business-brain/`

### Knowledge source types

`pdf`, `website`, `notion`, `google_drive`, `confluence`, `email`, `manual_note`

No ingestion pipeline yet — sources are registered as metadata only.

### Business facts (triplet model)

Each fact stores: `subject`, `predicate`, `value`, `source`, `confidence`, `verified`, `importance`, `lastUpdated` (from `updated_at`), `metadata`.

The `source` field references a knowledge source ID or free-text origin.

### API routes

| Method | Route |
|--------|-------|
| GET | `/api/business-brain` |
| GET/POST | `/api/business-brain/products` |
| PATCH/DELETE | `/api/business-brain/products/[id]` |
| GET/POST | `/api/business-brain/services` |
| PATCH/DELETE | `/api/business-brain/services/[id]` |
| GET/POST | `/api/business-brain/customer-segments` |
| PATCH/DELETE | `/api/business-brain/customer-segments/[id]` |
| GET/POST | `/api/business-brain/competitors` |
| PATCH/DELETE | `/api/business-brain/competitors/[id]` |
| GET/POST | `/api/business-brain/internal-processes` |
| PATCH/DELETE | `/api/business-brain/internal-processes/[id]` |
| GET/POST | `/api/business-brain/knowledge-sources` |
| PATCH/DELETE | `/api/business-brain/knowledge-sources/[id]` |
| GET/POST | `/api/business-brain/facts` |
| PATCH/DELETE | `/api/business-brain/facts/[id]` |

---

## Future module consumption

Import from `lib/intelligence/` for combined types:

```typescript
import type { OrgIntelligenceSnapshot } from "@/lib/intelligence";
import { createBusinessBrainService } from "@/lib/business-brain";
import { createCompanyDnaService } from "@/lib/company-dna";
```

Shared auth helpers live in `lib/intelligence/api/org-context.ts`.
