import type { WebsiteSnapshot } from "./types";

/** Future website scan pipeline — contracts only, no fetch in Sprint 2. */
export type WebsiteScanPipelinePhase =
  | "fetch"
  | "extract_pages"
  | "normalize"
  | "build_snapshot"
  | "generate_findings"
  | "store_snapshot"
  | "update_company_profile"
  | "available_for_brain";

export type WebsiteScanPipelineInput = {
  organizationId: string;
  url: string;
  triggeredBy: string;
};

export type WebsiteScanPipelineResult = {
  phase: WebsiteScanPipelinePhase;
  snapshot: WebsiteSnapshot | null;
  error?: string;
};

export interface WebsiteScanPipeline {
  run(input: WebsiteScanPipelineInput): Promise<WebsiteScanPipelineResult>;
}

/** Pipeline stages in order — for future orchestration. */
export const WEBSITE_SCAN_PIPELINE: readonly WebsiteScanPipelinePhase[] = [
  "fetch",
  "extract_pages",
  "normalize",
  "build_snapshot",
  "generate_findings",
  "store_snapshot",
  "update_company_profile",
  "available_for_brain",
];
