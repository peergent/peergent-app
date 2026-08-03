/** Website scan execution contracts — no HTTP fetch in Sprint 3. */

export type WebsiteFetchRequest = {
  organizationId: string;
  url: string;
  requestedBy: string;
  correlationId?: string;
};

export type WebsiteFetchResult = {
  request: WebsiteFetchRequest;
  success: boolean;
  statusCode?: number;
  rawHtmlRef?: string;
  error?: string;
  fetchedAt: string;
};

export type WebsiteExtractionResult = {
  fetchResult: WebsiteFetchResult;
  pageCount: number;
  extractedRefIds: readonly string[];
  extractedAt: string;
};

export type WebsiteNormalizationResult = {
  extraction: WebsiteExtractionResult;
  normalizedPageIds: readonly string[];
  normalizedAt: string;
};

export type WebsiteSnapshotResult = {
  normalization: WebsiteNormalizationResult;
  snapshotId: string;
  organizationId: string;
  url: string;
  completedAt: string;
};

export interface WebsiteScanExecutor {
  fetch(request: WebsiteFetchRequest): Promise<WebsiteFetchResult>;
  extract(result: WebsiteFetchResult): Promise<WebsiteExtractionResult>;
  normalize(extraction: WebsiteExtractionResult): Promise<WebsiteNormalizationResult>;
  buildSnapshot(normalization: WebsiteNormalizationResult): Promise<WebsiteSnapshotResult>;
}

/** Pipeline order for future orchestration. */
export const WEBSITE_EXECUTION_PHASES = [
  "fetch",
  "extract",
  "normalize",
  "build_snapshot",
] as const;

export type WebsiteExecutionPhase = (typeof WEBSITE_EXECUTION_PHASES)[number];
