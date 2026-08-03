# Brand Understanding

**Capability id:** `brand_understanding`  
**Version:** 1.0.0

## Owns

- Brand essence, positioning, value proposition, tone, promises
- Allowed/restricted claims (when present in profile)
- Missing brand information and recommendations
- Proposed memory candidates for customer-confirmed tone

## Does not own

- Inventing brand voice from company name alone
- Visual asset generation
- Content writing

## Dependencies

- `company_understanding`

## Readiness

- Partial execution allowed when brand slice incomplete
- Returns warnings for unknown positioning/tone

## Customer visibility

Mapped via `presentBrainOutputForCampaign` → `CampaignEvidenceSection`.
