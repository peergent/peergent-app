/**
 * PX-49 — Episode-level context acquisition boundary for ProjectEpisodeRunner.
 */

import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import { acquireBrainContext, type BrainContextAcquisitionPackage } from "../context-acquisition";
import { buildCompanySnapshot } from "../company/snapshot-builder";
import type { CompanySnapshot } from "../company/snapshot";
import type { BrandGraph } from "../layers/brand/types";
import type { MemoryRecord } from "../layers/memory/types";
import type { BrainContextSlices } from "../project-engine/brain-contract";
import { emitOrchestrationDiagnostic } from "./orchestration-diagnostics";
import type { ContextGap } from "./types";

export type EpisodeAcquiredContext = {
  package: BrainContextAcquisitionPackage;
  sliceAvailability: Partial<BrainContextSlices>;
  contextReady: boolean;
  contextGaps: readonly ContextGap[];
  handoff: {
    companySnapshot: CompanySnapshot;
    brandGraph: BrandGraph | null;
    campaignContext: CampaignContext;
    priorMemories: readonly MemoryRecord[];
  };
};

export type AcquireEpisodeContextInput = {
  supabase: AppSupabaseClient;
  organizationId: string;
  projectId: string;
  peerId: string;
  peerRole: string;
  locale?: "nl" | "en";
  campaignContext: CampaignContext;
  phase?: import("../project-engine/types").ProjectBrainId | "project_start";
};

export async function acquireEpisodeContext(
  input: AcquireEpisodeContextInput
): Promise<EpisodeAcquiredContext> {
  const pkg = await acquireBrainContext({
    supabase: input.supabase,
    organizationId: input.organizationId,
    projectId: input.projectId,
    peerId: input.peerId,
    task: {
      peerRole: input.peerRole,
      phase: input.phase ?? "project_start",
      locale: input.locale ?? "en",
    },
    campaignContext: input.campaignContext,
  });

  emitOrchestrationDiagnostic({
    event: "episode_context_brain_package_received",
    organizationId: input.organizationId,
    projectId: input.projectId,
    peerId: input.peerId,
    contextReady: pkg.contextReady,
    contextGapCount: pkg.contextGaps.length,
    blockingContextGapCount: pkg.contextGaps.filter((gap) => gap.blocking).length,
  });

  const companySnapshot =
    pkg.handoff.companySnapshot ??
    buildCompanySnapshot({ organizationId: input.organizationId }).snapshot;

  emitOrchestrationDiagnostic({
    event: "episode_context_snapshot_resolved",
    organizationId: input.organizationId,
    projectId: input.projectId,
    peerId: input.peerId,
    hasCompanySnapshot: companySnapshot != null,
  });

  emitOrchestrationDiagnostic({
    event: "episode_context_returning",
    organizationId: input.organizationId,
    projectId: input.projectId,
    peerId: input.peerId,
    contextReady: pkg.contextReady,
  });

  return {
    package: pkg,
    sliceAvailability: pkg.sliceAvailability,
    contextReady: pkg.contextReady,
    contextGaps: pkg.contextGaps,
    handoff: {
      companySnapshot,
      brandGraph: pkg.handoff.brandGraph,
      campaignContext: input.campaignContext,
      priorMemories: pkg.handoff.priorMemories,
    },
  };
}
