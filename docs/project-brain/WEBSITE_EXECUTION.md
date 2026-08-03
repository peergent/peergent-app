# Website Execution

Sprint 3 adds the website **execution pipeline** as contracts and demo adapters. No HTTP fetch, Firecrawl, or Playwright in this sprint.

## Pipeline phases

```
WebsiteFetchRequest
  ↓ fetch
WebsiteFetchResult
  ↓ extract
WebsiteExtractionResult
  ↓ normalize
WebsiteNormalizationResult
  ↓ build_snapshot
WebsiteSnapshotResult
```

Contracts live in `lib/brain/website/execution-types.ts`.

## Executor

`WebsiteScanExecutor` defines the four-phase interface. `DemoWebsiteScanExecutor` runs a deterministic demo pipeline with no network access.

```typescript
import { createDemoWebsiteScanExecutor } from "@/lib/brain";

const executor = createDemoWebsiteScanExecutor();
const snapshot = await executor.runToSnapshot({
  organizationId: "org-1",
  url: "https://example.com",
  requestedBy: "user-1",
});
```

## Providers

| Provider | Status |
|----------|--------|
| `DemoWebsiteProvider` | Implemented — deterministic multi-page snapshot |
| `FutureHttpWebsiteProvider` | Contract stub |
| `FutureFirecrawlProvider` | Contract stub |
| `FutureBrowserProvider` | Contract stub |
| `FuturePlaywrightProvider` | Contract stub |

`DemoWebsiteProvider` generates:

- Pages: Homepage, About, Services, Contact
- Metadata, navigation, CTAs, SEO, headings, images, technology
- Structured findings with evidence

Sync helper: `buildDemoWebsiteSnapshotSync()`.

## Marketing Workspace flow

1. Customer adds website URL in dialog
2. `buildAndStoreDemoWebsiteSnapshotSync()` stores snapshot
3. `assembleCompanyContext()` or `resolveCompanyIntelligenceAsync()` re-assembles
4. Brain evidence refreshes from new snapshot

## Package location

```
lib/brain/website/
  execution-types.ts
  website-scan-executor.ts
  providers/
    website-provider.ts
    demo-website-provider.ts
```
