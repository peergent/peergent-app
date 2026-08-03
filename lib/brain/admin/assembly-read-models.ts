import type { ContextAssemblyState } from "../context/assembly-types";
import type { ContextReadinessReport } from "../context/readiness";
import type { MissingInformationItem } from "../context/missing-information";
import type { SnapshotVersionMetadata } from "../context/snapshot-versioning";
import type { InvalidationEvent } from "../invalidation/dependency-graph";
import type { FreshnessState } from "../domain/freshness";
import type { ContextAssemblyAuditTrace } from "../context/assembly-audit";

/** Admin contracts — no UI in Sprint 3. */

export type CompanyReadinessReadModel = {
  organizationId: string;
  state: ContextAssemblyState;
  readiness: ContextReadinessReport;
  missingInformation: readonly MissingInformationItem[];
  checkedAt: string;
};

export type WebsiteFreshnessReadModel = {
  organizationId: string;
  url: string | null;
  freshness: FreshnessState;
  snapshotVersion: SnapshotVersionMetadata | null;
  lastScannedAt: string | null;
  checkedAt: string;
};

export type SnapshotVersionReadModel = {
  organizationId: string;
  snapshotKind: "company" | "brain" | "website";
  version: SnapshotVersionMetadata;
  checkedAt: string;
};

export type InvalidationQueueReadModel = {
  organizationId: string;
  pending: readonly InvalidationEvent[];
  lastProcessedAt: string | null;
  checkedAt: string;
};

export type CapabilityReadinessReadModel = {
  organizationId: string;
  capabilityId: string;
  ready: boolean;
  blockers: readonly string[];
  readinessScore: number;
  checkedAt: string;
};

export type AssemblyAuditReadModel = {
  organizationId: string;
  trace: ContextAssemblyAuditTrace;
  checkedAt: string;
};
