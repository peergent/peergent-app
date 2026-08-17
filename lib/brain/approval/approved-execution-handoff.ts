/**
 * PX-59 — freeze CampaignApprovalPackage for Execution (no post-approval regeneration).
 */

import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type {
  ApprovedExecutionHandoff,
  ProjectEpisodeRecord,
} from "../project-runtime/types";
import { materializeCampaignApprovalPackage } from "./materialize-campaign-approval-package";
import type { CreativeGraph } from "../layers/creative/types";
import type { ValidationGraph } from "../layers/validation/types";
import type { ExecutionHistory } from "../layers/execution/types";

export type ApprovedPackageHandoffDiagnostic = {
  projectId: string;
  episodeId: string;
  organizationId: string;
  packageId: string;
  packageVersion: string;
  integrationReady: boolean;
  reason?: string;
};

export function freezeApprovedExecutionHandoff(input: {
  episode: ProjectEpisodeRecord;
  approvalId: string;
  campaignName: string;
  campaignContext?: CampaignContext | null;
  locale?: "nl" | "en";
}): ProjectEpisodeRecord {
  const resolved = input.episode.resolvedGraphs ?? {};
  const creativeGraph = resolved.creativeGraph ?? null;
  const validationGraph = resolved.validationGraph ?? null;

  const pkg = materializeCampaignApprovalPackage({
    organizationId: input.episode.snapshot.organizationId,
    projectId: input.episode.snapshot.projectId,
    campaignName: input.campaignName,
    campaignContext: input.campaignContext ?? null,
    creativeGraph,
    validationGraph,
    planningGraph: resolved.planningBrainGraph ?? null,
    strategyGraph: resolved.strategyBrainGraph ?? null,
    approvalMode: input.episode.campaignApprovalMode,
    locale: input.locale,
  });

  if (!pkg) {
    return input.episode;
  }

  const handoff: ApprovedExecutionHandoff = {
    packageId: pkg.version.packageId,
    packageVersion: pkg.version.materializedAt,
    creativeGraphRef: pkg.version.creativeGraphRef,
    validationGraphRef: pkg.version.validationGraphRef,
    planningGraphRef: pkg.version.planningGraphRef,
    strategyGraphRef: pkg.version.strategyGraphRef,
    approvedAt: new Date().toISOString(),
    approvalId: input.approvalId,
    deliverableIds: pkg.deliverables.map((d) => d.id),
    channels: pkg.campaign.channels,
    executionPhase: "approved",
  };

  return {
    ...input.episode,
    approvedExecutionHandoff: handoff,
    updatedAt: new Date().toISOString(),
  };
}

/** Resolve graphs for execution — always from episode cache, never regenerate. */
export function resolveApprovedExecutionGraphs(episode: ProjectEpisodeRecord): {
  creativeGraph: CreativeGraph | null;
  validationGraph: ValidationGraph | null;
  handoff: ApprovedExecutionHandoff | null;
} {
  const handoff = episode.approvedExecutionHandoff ?? null;
  const creativeGraph = episode.resolvedGraphs?.creativeGraph ?? null;
  const validationGraph = episode.resolvedGraphs?.validationGraph ?? null;

  if (handoff && creativeGraph && validationGraph) {
    assertApprovedGraphRefsMatch(handoff, creativeGraph, validationGraph);
  }

  return { creativeGraph, validationGraph, handoff };
}

export function assertApprovedGraphRefsMatch(
  handoff: ApprovedExecutionHandoff,
  creativeGraph: CreativeGraph,
  validationGraph: ValidationGraph
): void {
  if (!handoff.creativeGraphRef.includes(creativeGraph.createdAt)) {
    throw new Error("approved_creative_graph_mismatch");
  }
  if (
    !handoff.validationGraphRef.includes(validationGraph.createdAt) &&
    handoff.validationGraphRef !== `validation:${validationGraph.campaignId}:missing`
  ) {
    throw new Error("approved_validation_graph_mismatch");
  }
}

export function needsPostApprovalExecution(episode: ProjectEpisodeRecord): boolean {
  if (!episode.approvalGrantedForExecution) return false;
  if (episode.snapshot.completedBrains.includes("execution")) return false;
  if (!episode.snapshot.pendingBrains.includes("execution")) return false;

  const checkpointSatisfied =
    episode.snapshot.approvalCheckpoint?.satisfied === true ||
    episode.approvedExecutionHandoff?.executionPhase === "approved";

  if (!checkpointSatisfied) return false;

  return (
    episode.snapshot.state === "ready_to_publish" ||
    episode.snapshot.state === "publishing" ||
    episode.approvedExecutionHandoff?.executionPhase === "approved" ||
    episode.approvedExecutionHandoff?.executionPhase === "prepared" ||
    episode.approvedExecutionHandoff?.executionPhase === "blocked_integration"
  );
}

const INTEGRATION_BLOCK_CODES = new Set([
  "AUTHENTICATION",
  "PROVIDER_UNAVAILABLE",
  "integration_not_connected",
  "approval_missing",
]);

export function classifyExecutionIntegrationOutcome(history: ExecutionHistory): {
  integrationReady: boolean;
  blockedChannels: string[];
  reason: string | null;
  preparedOnly: boolean;
} {
  const blockedChannels: string[] = [];
  let authBlocked = 0;
  let succeeded = 0;

  for (const entry of history.entries) {
    const channel = entry.instruction.target.channel;
    if (entry.status === "SUCCEEDED") {
      succeeded += 1;
      continue;
    }
    const failureClass = entry.failures[0]?.failureClass;
    if (failureClass && INTEGRATION_BLOCK_CODES.has(failureClass) && entry.status === "FAILED") {
      authBlocked += 1;
      blockedChannels.push(channel);
    }
  }

  if (succeeded > 0 && authBlocked > 0) {
    return {
      integrationReady: true,
      blockedChannels,
      reason: "partial_integration_blocked",
      preparedOnly: false,
    };
  }

  if (succeeded === 0 && authBlocked > 0) {
    return {
      integrationReady: false,
      blockedChannels,
      reason: "integration_not_connected",
      preparedOnly: true,
    };
  }

  if (history.overallStatus === "FAILED" || history.overallStatus === "CANCELLED") {
    return {
      integrationReady: false,
      blockedChannels,
      reason: "execution_failed",
      preparedOnly: false,
    };
  }

  return {
    integrationReady: true,
    blockedChannels: [],
    reason: null,
    preparedOnly: false,
  };
}

export function markExecutionHandoffPhase(
  episode: ProjectEpisodeRecord,
  phase: NonNullable<ApprovedExecutionHandoff["executionPhase"]>,
  patch?: Partial<Pick<ApprovedExecutionHandoff, "blockedChannels" | "blockedReason">>
): ProjectEpisodeRecord {
  if (!episode.approvedExecutionHandoff) return episode;
  return {
    ...episode,
    approvedExecutionHandoff: {
      ...episode.approvedExecutionHandoff,
      executionPhase: phase,
      blockedChannels: patch?.blockedChannels ?? episode.approvedExecutionHandoff.blockedChannels,
      blockedReason: patch?.blockedReason ?? episode.approvedExecutionHandoff.blockedReason,
    },
    updatedAt: new Date().toISOString(),
  };
}
