import type { BrainCapabilityId } from "../capabilities/registry";

/** Change detection contracts — no implementation in Sprint 2. */
export type WebsiteChangeKind =
  | "content_changed"
  | "structure_changed"
  | "metadata_changed"
  | "cta_changed"
  | "navigation_changed";

export type WebsiteChangeEvent = {
  id: string;
  organizationId: string;
  url: string;
  kind: WebsiteChangeKind;
  detectedAt: string;
  summary: string;
  affectedPageIds: readonly string[];
};

export type CacheInvalidationTrigger = {
  organizationId: string;
  capabilityIds: readonly BrainCapabilityId[];
  reason: string;
  triggeredAt: string;
};

export type WebsiteChangeDetectionResult = {
  changes: readonly WebsiteChangeEvent[];
  invalidations: readonly CacheInvalidationTrigger[];
};

export interface WebsiteChangeDetector {
  compare(input: {
    organizationId: string;
    previousSnapshotId: string;
    currentSnapshotId: string;
  }): Promise<WebsiteChangeDetectionResult>;
}

/** Capabilities typically affected when website content changes. */
export const WEBSITE_CHANGE_AFFECTED_CAPABILITIES: readonly BrainCapabilityId[] = [
  "website_understanding",
  "company_understanding",
  "strategy",
  "creative_generation",
];
