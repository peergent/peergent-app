import type { BrainSnapshot } from "./snapshot";
import type { CompanySnapshot } from "../company/snapshot";
import type { ContextAssemblyAuditTrace } from "./assembly-audit";
import type { ContextReadinessReport } from "./readiness";
import type { MissingInformationItem } from "./missing-information";
import type { SnapshotVersionMetadata } from "./snapshot-versioning";

/** Where assembled context came from — for audit only. */
export type ContextAssemblySource =
  | "organization"
  | "company_profile"
  | "business_brain"
  | "brand_brain"
  | "website_snapshot"
  | "customer_correction"
  | "campaign_context";

export type ContextAssemblyState =
  | "ready"
  | "partial"
  | "needs_information"
  | "unknown";

export type ContextAssemblyWarning = {
  id: string;
  code: string;
  message: string;
  source: ContextAssemblySource;
};

export type ContextAssemblyIssue = {
  id: string;
  code: string;
  message: string;
  source: ContextAssemblySource;
  blocking: boolean;
};

/** Result of CompanyContextAssembler — the ONLY assembly output. */
export type ContextAssemblyResult = {
  organizationId: string;
  state: ContextAssemblyState;
  companySnapshot: CompanySnapshot;
  brainSnapshot: BrainSnapshot;
  readiness: ContextReadinessReport;
  missingInformation: readonly MissingInformationItem[];
  warnings: readonly ContextAssemblyWarning[];
  issues: readonly ContextAssemblyIssue[];
  version: SnapshotVersionMetadata;
  audit: ContextAssemblyAuditTrace;
  assembledAt: string;
};
