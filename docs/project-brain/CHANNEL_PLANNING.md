# Channel Planning

**Capability id:** `channel_planning`  
**Version:** 1.0.0

## Owns

Per-channel structured plan: selected/rejected, role, audience fit, funnel role, content types, CTA, dependencies, measurement, assumptions, risks, rationale, priority.

Supported channel ids: `linkedin`, `google_ads`, `email`, `newsletter`, `landing_page`, `blog`, `instagram`, `meta_ads`, `seo`.

## Does not own

- Reinterpreting raw campaign without strategy output
- Performance certainty claims
- Silently replacing manual channel selections

## Dependencies

- `strategy` (required)

## Manual mode

Customer-selected channels are constraints. Emma may flag concerns but cannot replace selection silently.
