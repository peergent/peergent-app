import type { WebsiteSnapshot } from "../types";

export type WebsiteProviderScanInput = {
  organizationId: string;
  url: string;
  companyName?: string;
};

/** Provider contract — demo only in Sprint 3. */
export interface WebsiteProvider {
  readonly id: string;
  scan(input: WebsiteProviderScanInput): Promise<WebsiteSnapshot>;
}

/** Stub contracts for future providers — no implementation. */
export interface FutureHttpWebsiteProvider extends WebsiteProvider {
  readonly id: "http";
}

export interface FutureFirecrawlProvider extends WebsiteProvider {
  readonly id: "firecrawl";
}

export interface FutureBrowserProvider extends WebsiteProvider {
  readonly id: "browser";
}

export interface FuturePlaywrightProvider extends WebsiteProvider {
  readonly id: "playwright";
}

export type WebsiteProviderKind =
  | "demo"
  | "http"
  | "firecrawl"
  | "browser"
  | "playwright";
