import type { WebsiteSnapshot } from "./types";
import { buildDemoWebsiteSnapshotSync } from "./providers/demo-website-provider";
import type {
  WebsiteExtractionResult,
  WebsiteFetchRequest,
  WebsiteFetchResult,
  WebsiteNormalizationResult,
  WebsiteScanExecutor,
  WebsiteSnapshotResult,
} from "./execution-types";

/**
 * Demo pipeline — deterministic, no HTTP fetch.
 * Adapters only; real providers plug in later.
 */
export class DemoWebsiteScanExecutor implements WebsiteScanExecutor {
  async fetch(request: WebsiteFetchRequest): Promise<WebsiteFetchResult> {
    return {
      request,
      success: true,
      statusCode: 200,
      rawHtmlRef: `demo-html:${request.url}`,
      fetchedAt: new Date().toISOString(),
    };
  }

  async extract(result: WebsiteFetchResult): Promise<WebsiteExtractionResult> {
    return {
      fetchResult: result,
      pageCount: 4,
      extractedRefIds: ["page-home", "page-about", "page-services", "page-contact"],
      extractedAt: new Date().toISOString(),
    };
  }

  async normalize(extraction: WebsiteExtractionResult): Promise<WebsiteNormalizationResult> {
    return {
      extraction,
      normalizedPageIds: [...extraction.extractedRefIds],
      normalizedAt: new Date().toISOString(),
    };
  }

  async buildSnapshot(normalization: WebsiteNormalizationResult): Promise<WebsiteSnapshotResult> {
    const url = normalization.extraction.fetchResult.request.url;
    const orgId = normalization.extraction.fetchResult.request.organizationId;
    const demoSnapshot = buildDemoWebsiteSnapshotSync({ organizationId: orgId, url });
    return {
      normalization,
      snapshotId: `snap-${orgId}-${demoSnapshot.assembledAt}`,
      organizationId: orgId,
      url,
      completedAt: new Date().toISOString(),
    };
  }

  /** Convenience — runs full pipeline and returns WebsiteSnapshot. */
  async runToSnapshot(request: WebsiteFetchRequest): Promise<WebsiteSnapshot> {
    const fetchResult = await this.fetch(request);
    const extraction = await this.extract(fetchResult);
    const normalization = await this.normalize(extraction);
    await this.buildSnapshot(normalization);
    return buildDemoWebsiteSnapshotSync({
      organizationId: request.organizationId,
      url: request.url,
    });
  }
}

export function createDemoWebsiteScanExecutor(): DemoWebsiteScanExecutor {
  return new DemoWebsiteScanExecutor();
}
