# Competitor Understanding

**Capability id:** `competitor_understanding`  
**Version:** 1.0.0

## Owns

- Competitors explicitly supplied in campaign context, company profile, or business brain
- Differentiation opportunities (deterministic, source-bound)
- Skipped/missing competitor states

## Does not own

- Inventing competitor names
- Web scraping or market research
- Live competitive intelligence feeds

## Dependencies

- `company_understanding`

## Readiness

- Waits for input when no competitors and not skipped
- Partial when `competitorsSkipped` is true

## Fallback

Office simulation in `build-campaign-workflow-evidence.ts` when brain returns `needs-info` or context missing.
