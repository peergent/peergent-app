# Campaign Strategy

**Capability id:** `strategy` (registry) — product name: campaign strategy  
**Version:** 1.0.0

## Owns

Structured strategy sections: objectives, audience, positioning, messages, funnel, channel hypothesis, KPI framework (non-numeric), risks, assumptions, unknowns, recommendation.

## Does not own

- Channel selection details (`channel_planning`)
- Deliverable/content generation
- Numeric performance targets without assumption label

## Dependencies

Required: `company_understanding`, `brand_understanding`, `website_understanding`  
Optional: `competitor_understanding`

## Readiness

- Requires campaign goal (from `CampaignContext`)
- Readiness gate: score ≥ 70, `targetAudiences` and profile `goals`
- Exposes website/competitor limitations in warnings

## Safeguards

- Semantic deduplication of section labels
- Quality validator rejects duplicate sections and fixture leakage

## Fallback

`buildStructuredStrategyEvidence` when brain returns needs-info (e.g. website not ready).
