import type { WebsiteSnapshot } from "./types";

/** Minimal website snapshot when a customer supplies a URL — no crawl, no simulated findings. */
export function buildCustomerSuppliedWebsiteSnapshot(input: {
  organizationId: string;
  url: string;
  companyName?: string | null;
}): WebsiteSnapshot {
  const assembledAt = new Date().toISOString();
  const normalized = input.url.trim().replace(/\/$/, "");

  return {
    organizationId: input.organizationId,
    source: {
      url: normalized,
      capturedAt: assembledAt,
      method: "customer_supplied",
    },
    state: "customer_corrected",
    metadata: {
      title: input.companyName?.trim() || undefined,
      canonicalUrl: normalized,
    },
    pages: [],
    navigation: { primaryLinks: [], footerLinks: [] },
    seo: { h1Count: 0, issues: [] },
    ctas: [],
    technology: { detected: [] },
    assets: [],
    findings: [],
    issues: [],
    opportunities: [],
    freshness: {
      freshness: "fresh",
      lastUpdatedAt: assembledAt,
      state: "customer_corrected",
    },
    assembledAt,
  };
}
