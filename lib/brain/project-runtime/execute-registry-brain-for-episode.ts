/**
 * Execute a Project Engine brain via the canonical registry contract —
 * resolves upstream graphs from durable artifacts and layer repositories.
 */

import { createDefaultProjectBrainRegistry } from "../integration/creative-brain-registry";
import { assembleBrainContext } from "../project-engine";
import type { BrainResult, ProjectBrainContract, ProjectBrainRegistry } from "../project-engine/brain-contract";
import type { BrainOutput } from "../project-engine/brain-contract";
import type { ProjectBrainId } from "../project-engine/types";
import { buildBrainPayload, buildPriorOutputs } from "./brain-context-handoff";
import { resolveBrainOutputs } from "./brain-output-resolver";
import { getDefaultProjectEpisodeRepository } from "./project-episode-repository";
import type { BrainHandoffContext, ProjectEpisodeRecord } from "./types";
import { proposalsFromLearningGraph } from "./learning-memory-handoff";
import { learningProposalIds } from "./learning-memory-handoff";
import type { ResolvedBrainOutputs } from "./brain-output-resolver";

export type ExecuteRegistryBrainForEpisodeInput = {
  brainId: ProjectBrainId;
  episode: ProjectEpisodeRecord;
  contextHandoff: {
    companySnapshot: import("../company/snapshot").CompanySnapshot;
    brandGraph: import("../layers/brand/types").BrandGraph | null;
    campaignContext: import("@/lib/office/campaign/campaign-context").CampaignContext;
    priorMemories: readonly import("../layers/memory/types").MemoryRecord[];
  };
  locale: "nl" | "en";
  idempotencyKey: string;
  registry?: ProjectBrainRegistry;
};

function mergeResolvedGraphs(
  cached: Partial<ResolvedBrainOutputs>,
  fresh: ResolvedBrainOutputs
): ResolvedBrainOutputs {
  return {
    companyGraph: fresh.companyGraph ?? cached.companyGraph ?? null,
    researchBrainGraph: fresh.researchBrainGraph ?? cached.researchBrainGraph ?? null,
    reasoningBrainGraph: fresh.reasoningBrainGraph ?? cached.reasoningBrainGraph ?? null,
    marketingIntelligenceBrainGraph:
      fresh.marketingIntelligenceBrainGraph ?? cached.marketingIntelligenceBrainGraph ?? null,
    strategyBrainGraph: fresh.strategyBrainGraph ?? cached.strategyBrainGraph ?? null,
    planningBrainGraph: fresh.planningBrainGraph ?? cached.planningBrainGraph ?? null,
    creativeGraph: fresh.creativeGraph ?? cached.creativeGraph ?? null,
    validationGraph: fresh.validationGraph ?? cached.validationGraph ?? null,
    memoryGraph: fresh.memoryGraph ?? cached.memoryGraph ?? null,
    executionHistory: fresh.executionHistory ?? cached.executionHistory ?? null,
    learningBrainGraph: fresh.learningBrainGraph ?? cached.learningBrainGraph ?? null,
    priorMemories: fresh.priorMemories.length > 0 ? fresh.priorMemories : cached.priorMemories ?? [],
  };
}

function resolveMergedGraphs(episode: ProjectEpisodeRecord): ResolvedBrainOutputs {
  return mergeResolvedGraphs(
    episode.resolvedGraphs,
    resolveBrainOutputs({
      organizationId: episode.snapshot.organizationId,
      projectId: episode.snapshot.projectId,
      artifacts: episode.artifacts,
      episodeResolvedGraphs: episode.resolvedGraphs,
    })
  );
}

/** Materialize CreativeGraph when capability path completed creative without layer storage. */
async function ensureCreativeGraphForValidation(input: {
  episode: ProjectEpisodeRecord;
  resolved: ResolvedBrainOutputs;
  handoff: BrainHandoffContext;
  locale: "nl" | "en";
  idempotencyKey: string;
  registry: ProjectBrainRegistry;
}): Promise<ResolvedBrainOutputs> {
  if (input.resolved.creativeGraph) return input.resolved;

  const fromEpisodeCache = input.episode.resolvedGraphs?.creativeGraph ?? null;
  if (fromEpisodeCache) {
    return { ...input.resolved, creativeGraph: fromEpisodeCache };
  }

  if (!input.episode.snapshot.completedBrains.includes("creative")) return input.resolved;

  const contract = input.registry.creative as ProjectBrainContract | undefined;
  if (!contract) return input.resolved;

  const context = assembleBrainContext({
    snapshot: input.episode.snapshot,
    locale: input.locale,
    sliceAvailability: input.episode.sliceAvailability,
    priorOutputs: buildPriorOutputs(input.episode.artifacts),
  });

  const payload = buildBrainPayload("creative", input.resolved, input.handoff);
  const materialized = await contract.execute({
    brainId: "creative",
    context,
    payload,
    idempotencyKey: `${input.idempotencyKey}:materialize-creative`,
    retryAttempt: input.episode.snapshot.retryCount.creative ?? 0,
  });

  if (materialized.status !== "completed") return input.resolved;

  return resolveMergedGraphs({
    ...input.episode,
    artifacts: input.episode.artifacts,
  });
}

export async function executeRegistryBrainForEpisode(
  input: ExecuteRegistryBrainForEpisodeInput
): Promise<BrainResult<BrainOutput>> {
  const registry = input.registry ?? createDefaultProjectBrainRegistry();
  const contract = registry[input.brainId] as ProjectBrainContract | undefined;

  if (!contract) {
    return {
      brainId: input.brainId,
      status: "failed",
      output: null,
      events: [],
      confidence: null,
      durationMs: 0,
      errorCode: "brain_not_registered",
      requiresApproval: false,
      approvalKind: null,
    };
  }

  let resolved = resolveMergedGraphs(input.episode);
  const priorOutputs = buildPriorOutputs(input.episode.artifacts);

  const memoryCheckpointPhase =
    input.brainId === "memory" && input.episode.snapshot.state === "learning"
      ? "checkpoint_2"
      : input.brainId === "memory" && input.episode.snapshot.state === "validating"
        ? "checkpoint_1"
        : null;

  const handoff: BrainHandoffContext = {
    organizationId: input.episode.snapshot.organizationId,
    projectId: input.episode.snapshot.projectId,
    episodeId: input.episode.snapshot.episodeId,
    locale: input.locale,
    correlationId: input.episode.correlationId,
    artifacts: input.episode.artifacts,
    priorOutputs,
    priorMemories:
      input.contextHandoff.priorMemories.length > 0
        ? input.contextHandoff.priorMemories
        : resolved.priorMemories,
    campaignContext: input.contextHandoff.campaignContext,
    companySnapshot: input.contextHandoff.companySnapshot,
    brandGraph: input.contextHandoff.brandGraph,
    approvalGrantedForExecution: input.episode.approvalGrantedForExecution,
    approvedExecutionHandoff: input.episode.approvedExecutionHandoff ?? null,
    performanceObservations: [
      ...getDefaultProjectEpisodeRepository().getObservations(input.episode.snapshot.projectId),
    ],
    memoryCheckpointPhase,
    learningProposalIds: input.episode.artifacts.learningProposalIds,
    learningProposals: input.episode.cachedLearningProposals ?? [],
  };

  if (input.brainId === "validation") {
    resolved = await ensureCreativeGraphForValidation({
      episode: input.episode,
      resolved,
      handoff,
      locale: input.locale,
      idempotencyKey: input.idempotencyKey,
      registry,
    });
  }

  if (input.brainId === "creative" && !resolved.strategyBrainGraph) {
    const { materializePipelineGraphsAfterCapabilityBrain } = await import(
      "./materialize-pipeline-graphs"
    );
    materializePipelineGraphsAfterCapabilityBrain({
      brainId: "strategy",
      organizationId: input.episode.snapshot.organizationId,
      projectId: input.episode.snapshot.projectId,
      episodeId: input.episode.snapshot.episodeId,
      artifacts: input.episode.artifacts,
      resolvedGraphs: resolved,
    });
    resolved = resolveMergedGraphs(input.episode);
  }

  const context = assembleBrainContext({
    snapshot: input.episode.snapshot,
    locale: input.locale,
    sliceAvailability: input.episode.sliceAvailability,
    priorOutputs,
  });

  const payload = buildBrainPayload(input.brainId, resolved, handoff);

  return contract.execute({
    brainId: input.brainId,
    context,
    payload,
    idempotencyKey: input.idempotencyKey,
    retryAttempt: input.episode.snapshot.retryCount[input.brainId] ?? 0,
  });
}

/** @internal test helper — expose creative materialization entry */
export function __testEnsureCreativeGraphMaterialized(input: {
  episode: ProjectEpisodeRecord;
  handoff: BrainHandoffContext;
  locale: "nl" | "en";
  idempotencyKey: string;
}): Promise<ResolvedBrainOutputs> {
  const resolved = resolveMergedGraphs(input.episode);
  return ensureCreativeGraphForValidation({
    episode: input.episode,
    resolved,
    handoff: input.handoff,
    locale: input.locale,
    idempotencyKey: input.idempotencyKey,
    registry: createDefaultProjectBrainRegistry(),
  });
}
