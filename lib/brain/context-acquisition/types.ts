/**
 * PX-49 — Canonical context acquisition types (peer-agnostic).
 */

import type { BrainProvenanceRef } from "../domain/provenance";
import type { FreshnessState } from "../domain/freshness";
import type { BrainContextSlices } from "../project-engine/brain-contract";
import type { ProjectBrainId } from "../project-engine/types";
import type { ContextAssemblyResult } from "../context/assembly-types";
import type { ContextGap } from "../project-runtime/types";
import type { CompanySnapshot } from "../company/snapshot";
import type { BrandGraph } from "../layers/brand/types";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { MemoryRecord } from "../layers/memory/types";

/** Canonical context categories — reusable across all Peers. */
export type ContextCategory =
  | "organization"
  | "business_brain"
  | "company_dna"
  | "website_intelligence"
  | "knowledge"
  | "peer"
  | "project"
  | "memory"
  | "task"
  | "intelligence";

export type ContextConfidence = "unknown" | "low" | "medium" | "high";

export type ContextRequirementScope = "organization" | "project" | "peer";

/** What context a run requires — dynamic per Peer/task. */
export type ContextRequirement = {
  id: string;
  category: ContextCategory;
  key: string;
  required: boolean;
  scope: ContextRequirementScope;
  reason: string;
  mapsToSlice?: keyof BrainContextSlices;
};

/** Normalized acquired context item — bounded, provenance-preserving. */
export type AcquiredContextItem = {
  id: string;
  category: ContextCategory;
  key: string;
  label: string;
  /** Bounded summary — never a full database dump. */
  summary: string;
  organizationId: string;
  projectId?: string;
  peerId?: string;
  observedAt: string;
  freshness: FreshnessState;
  confidence: ContextConfidence;
  provenance: BrainProvenanceRef;
  sourceAdapterId: string;
  metadata?: Readonly<Record<string, string | number | boolean>>;
};

export type ContextAcquisitionGap = {
  requirement: ContextRequirement;
  reason: string;
  severity: "blocking" | "warning" | "informational";
  recoverable: boolean;
  suggestedSource?: string;
  sourceFailure?: boolean;
  sourceMisconfigured?: boolean;
  authorizationViolation?: boolean;
};

export type ContextAcquisitionBudget = {
  maxItemsPerAdapter: number;
  maxTotalItems: number;
  maxSummaryChars: number;
};

export const DEFAULT_CONTEXT_ACQUISITION_BUDGET: ContextAcquisitionBudget = {
  maxItemsPerAdapter: 24,
  maxTotalItems: 120,
  maxSummaryChars: 512,
};

export type ContextAcquisitionDiagnostics = {
  startedAt: string;
  completedAt: string;
  durationMs: number;
  adapterOutcomes: Readonly<
    Record<
      string,
      {
        status: "completed" | "partial" | "failed" | "skipped";
        itemCount: number;
        durationMs: number;
        failureCode?: string;
      }
    >
  >;
  totalItems: number;
  gapCount: number;
  blockingGapCount: number;
  truncated: boolean;
};

/** Canonical acquisition result consumed by Project Brain. */
export type BrainContextAcquisitionPackage = {
  organizationId: string;
  projectId?: string;
  peerId?: string;
  acquiredAt: string;
  requirements: readonly ContextRequirement[];
  items: readonly AcquiredContextItem[];
  acquisitionGaps: readonly ContextAcquisitionGap[];
  /** Mapped to project-runtime ContextGap for engine compatibility. */
  contextGaps: readonly ContextGap[];
  sliceAvailability: Partial<BrainContextSlices>;
  contextReady: boolean;
  assembly: ContextAssemblyResult | null;
  handoff: {
    companySnapshot: CompanySnapshot | null;
    brandGraph: BrandGraph | null;
    campaignContext: CampaignContext | null;
    priorMemories: readonly MemoryRecord[];
  };
  diagnostics: ContextAcquisitionDiagnostics;
};

export type ContextAcquisitionTask = {
  peerRole: string;
  phase?: ProjectBrainId | "project_start";
  locale?: "nl" | "en";
};

export type AcquireBrainContextInput = {
  supabase: import("@/lib/intelligence/api/org-context").AppSupabaseClient;
  organizationId: string;
  projectId?: string;
  peerId?: string;
  task: ContextAcquisitionTask;
  campaignContext?: CampaignContext | null;
  budget?: ContextAcquisitionBudget;
};
