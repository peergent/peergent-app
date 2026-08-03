# Project Brain — Live Integration (Sprint 6)

Live organizations consume Project Brain through persistent repositories and live context assembly — never demo fixtures.

## Context assembly

`assembleLiveCompanyContext()` loads:

- Marketing Understanding (Business Brain + Brand Brain via `loadMarketingUnderstandingContext`)
- Stored website snapshots from `BrainSnapshotRepository`
- Active customer corrections from `CustomerCorrectionRepository`
- Campaign context when executing campaign capabilities

Missing data is marked **unknown** — live paths never substitute `buildPeergentCompanyProfile()` or demo website fixtures.

Entry point: `lib/brain/integration/live-company-intelligence.ts`

## Live runtime factory

```typescript
createLiveBrainRuntime({ assembleContext, peerId })
```

Uses `createBrainRepositories({ environment: "live" })` which selects `persistent_in_memory` or `supabase` storage.

## Low-risk capabilities (Sprint 6)

Enabled for live peers when readiness is sufficient:

- `company_understanding`
- `website_understanding`
- `brand_understanding`

Higher-order capabilities (strategy, channels, creative) require upstream outputs and sufficient readiness — enforced by readiness gate and upstream output resolver.

## Marketing Workspace boundary

Brain output flows through existing presentation adapters:

```
BrainStructuredOutput → presentBrainOutputForCampaign → CampaignEvidenceSection
```

Customer-visible states:

| Run status | UI behavior |
|------------|-------------|
| `waiting_for_input` | Show missing information |
| `waiting_for_approval` | Connect to review structure |
| `completed` | Show persisted output |
| `failed` | Honest retry/error state |

Internal IDs, providers, token usage, and cache details are never exposed.

## Compatibility fallbacks

Demo peer workflow evidence retains office simulation fallback when brain path returns needs-info — gated in `build-campaign-workflow-evidence.ts`. Live organizations do not use this fallback.
