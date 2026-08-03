# Website Intelligence

Sprint 2 defines website intelligence **contracts only** — no crawler, no fetch.

## Website Snapshot

Location: `lib/brain/website/types.ts`

Includes:

- `WebsitePage`, `WebsiteSection`, `WebsiteMetadata`
- `WebsiteFinding`, `WebsiteIssue`, `WebsiteOpportunity`
- `WebsiteNavigation`, `WebsiteSEO`, `WebsiteCTA`
- `WebsiteTechnology`, `WebsiteAsset`, `WebsiteFreshness`, `WebsiteSource`

Organization-level — campaigns reference snapshots.

## Website states

`no_website` | `waiting` | `queued` | `scanning` | `scanned` | `failed` | `needs_refresh` | `customer_corrected` | `demo_simulated`

## Scan pipeline (future)

```
Website URL → Fetch → Extract pages → Normalize → Build Snapshot
  → Generate Findings → Store → Update Company Profile → Brain
```

Contracts in `lib/brain/website/pipeline.ts` — no implementation.

## Simulated snapshots

`buildSimulatedWebsiteSnapshot()` produces deterministic findings for demo and "Website toevoegen" flow:

- Strong hero
- Single primary CTA
- No FAQ
- Three services
- Limited testimonials
- Clear navigation

## website_understanding capability

Deterministic implementation maps `WebsiteFinding` → `BrainStructuredOutput`.

## Marketing integration

"Website toevoegen" (`addDemoWebsiteUrl`) stores a simulated snapshot via `buildAndStoreDemoWebsiteSnapshot()`.

Campaign evidence for `website_analyzed` flows through Brain → `presentBrainOutputForCampaign()`.

## Change detection (future)

Contracts in `lib/brain/change-detection/contracts.ts` — website changes invalidate `website_understanding`, `company_understanding`, `strategy`, `creative_generation` caches.
