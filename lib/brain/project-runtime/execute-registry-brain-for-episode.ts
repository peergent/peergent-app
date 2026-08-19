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
import type { ResolvedBrainOutputs } from "./brain-output-resolver";
import { ensureCompanyGraphFromHandoff } from "./ensure-company-graph-from-handoff";
import { emitIntelligencePipelineDiagnostic } from "./intelligence-pipeline-diagnostics";
import { getDefaultResearchBrainRepository } from "../layers/research/research-brain-repository";
import { getDefaultReasoningBrainRepository } from "../layers/reasoning/reasoning-brain-repository";
import { getDefaultMarketingIntelligenceBrainRepository } from "../layers/marketing-intelligence/marketing-intelligence-brain-repository";
import { proposalsFromLearningGraph, learningProposalIds } from "./learning-memory-handoff";

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
  const started = Date.now();
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
    peerId: input.episode.snapshot.peerId,
  };

  if (["research", "reasoning", "marketing_intelligence", "strategy"].includes(input.brainId)) {
    const companyGraph = ensureCompanyGraphFromHandoff(handoff);
    resolved = { ...resolved, companyGraph };
  }

  if (input.brainId === "research") {
    const existing =
      resolved.researchBrainGraph ??
      getDefaultResearchBrainRepository().getLatestSnapshot({
        organizationId: input.episode.snapshot.organizationId,
        projectId: input.episode.snapshot.projectId,
      })?.graph ??
      null;
    if (existing) {
      emitIntelligencePipelineDiagnostic({
        event: "research_completed",
        organizationId: input.episode.snapshot.organizationId,
        projectId: input.episode.snapshot.projectId,
        episodeId: input.episode.snapshot.episodeId,
        brainId: "research",
        evidenceCount: existing.evidence.length,
        graphRef: `research:${input.episode.snapshot.organizationId}:${existing.updatedAt}`,
        fallbackUsed: existing.summary.fallbackUsed,
        durationMs: Date.now() - started,
      });
      return {
        brainId: "research",
        status: "completed",
        output: {
          outputRef: `research:${input.episode.snapshot.organizationId}:${existing.updatedAt}`,
          capabilityIds: ["competitor_understanding"],
          decisionIds: [],
          generatedAt: existing.updatedAt,
        },
        events: [],
        confidence: { value: 0.65, label: "medium" },
        durationMs: Date.now() - started,
        errorCode: null,
        requiresApproval: false,
        approvalKind: null,
      };
    }
    emitIntelligencePipelineDiagnostic({
      event: "research_started",
      organizationId: input.episode.snapshot.organizationId,
      projectId: input.episode.snapshot.projectId,
      episodeId: input.episode.snapshot.episodeId,
      brainId: "research",
    });
  }

  if (input.brainId === "reasoning") {
    const existing =
      resolved.reasoningBrainGraph ??
      getDefaultReasoningBrainRepository().getLatestSnapshot({
        organizationId: input.episode.snapshot.organizationId,
        projectId: input.episode.snapshot.projectId,
      })?.graph ??
      null;
    if (existing) {
      emitIntelligencePipelineDiagnostic({
        event: "intelligence_graph_reused",
        organizationId: input.episode.snapshot.organizationId,
        projectId: input.episode.snapshot.projectId,
        episodeId: input.episode.snapshot.episodeId,
        brainId: "reasoning",
        graphReused: true,
        providerMode: existing.providerMeta?.providerMode,
        graphRef: `reasoning:${input.episode.snapshot.organizationId}:${existing.updatedAt}`,
      });
      emitIntelligencePipelineDiagnostic({
        event: "reasoning_completed",
        organizationId: input.episode.snapshot.organizationId,
        projectId: input.episode.snapshot.projectId,
        episodeId: input.episode.snapshot.episodeId,
        brainId: "reasoning",
        evidenceCount: existing.evidence.length,
        durationMs: Date.now() - started,
      });
      return {
        brainId: "reasoning",
        status: "completed",
        output: {
          outputRef: `reasoning:${input.episode.snapshot.organizationId}:${existing.updatedAt}`,
          capabilityIds: ["market_understanding"],
          decisionIds: [],
          generatedAt: existing.updatedAt,
        },
        events: [],
        confidence: { value: 0.6, label: "medium" },
        durationMs: Date.now() - started,
        errorCode: null,
        requiresApproval: false,
        approvalKind: null,
      };
    }
    emitIntelligencePipelineDiagnostic({
      event: "reasoning_started",
      organizationId: input.episode.snapshot.organizationId,
      projectId: input.episode.snapshot.projectId,
      episodeId: input.episode.snapshot.episodeId,
      brainId: "reasoning",
    });
  }

  if (input.brainId === "marketing_intelligence") {
    const existing =
      resolved.marketingIntelligenceBrainGraph ??
      getDefaultMarketingIntelligenceBrainRepository().getLatestSnapshot({
        organizationId: input.episode.snapshot.organizationId,
        projectId: input.episode.snapshot.projectId,
      })?.graph ??
      null;
    if (existing) {
      emitIntelligencePipelineDiagnostic({
        event: "intelligence_graph_reused",
        organizationId: input.episode.snapshot.organizationId,
        projectId: input.episode.snapshot.projectId,
        episodeId: input.episode.snapshot.episodeId,
        brainId: "marketing_intelligence",
        graphReused: true,
        providerMode: existing.providerMeta?.providerMode,
        graphRef: `mi:${input.episode.snapshot.organizationId}:${existing.updatedAt}`,
      });
      emitIntelligencePipelineDiagnostic({
        event: "marketing_intelligence_completed",
        organizationId: input.episode.snapshot.organizationId,
        projectId: input.episode.snapshot.projectId,
        episodeId: input.episode.snapshot.episodeId,
        brainId: "marketing_intelligence",
        evidenceCount: existing.evidence.length,
        durationMs: Date.now() - started,
      });
      return {
        brainId: "marketing_intelligence",
        status: "completed",
        output: {
          outputRef: `mi:${input.episode.snapshot.organizationId}:${existing.updatedAt}`,
          capabilityIds: ["market_understanding"],
          decisionIds: [],
          generatedAt: existing.updatedAt,
        },
        events: [],
        confidence: { value: 0.6, label: "medium" },
        durationMs: Date.now() - started,
        errorCode: null,
        requiresApproval: false,
        approvalKind: null,
      };
    }
    emitIntelligencePipelineDiagnostic({
      event: "marketing_intelligence_started",
      organizationId: input.episode.snapshot.organizationId,
      projectId: input.episode.snapshot.projectId,
      episodeId: input.episode.snapshot.episodeId,
      brainId: "marketing_intelligence",
    });
  }

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

  const result = await contract.execute({
    brainId: input.brainId,
    context,
    payload,
    idempotencyKey: input.idempotencyKey,
    retryAttempt: input.episode.snapshot.retryCount[input.brainId] ?? 0,
  });

  const key = {
    organizationId: input.episode.snapshot.organizationId,
    projectId: input.episode.snapshot.projectId,
  };

  if (input.brainId === "research") {
    const graph = getDefaultResearchBrainRepository().getLatestSnapshot(key)?.graph ?? null;
    if (result.status === "completed" && graph) {
      emitIntelligencePipelineDiagnostic({
        event: "research_completed",
        organizationId: key.organizationId,
        projectId: key.projectId,
        episodeId: input.episode.snapshot.episodeId,
        brainId: "research",
        provider: graph.summary.providerId,
        sourceCount: graph.sources.length,
        evidenceCount: graph.evidence.length,
        graphRef: result.output?.outputRef,
        fallbackUsed: graph.summary.fallbackUsed,
        fetchFailures: graph.summary.fetchFailures,
        durationMs: Date.now() - started,
      });
      if (graph.summary.fallbackUsed) {
        emitIntelligencePipelineDiagnostic({
          event: "research_fallback_used",
          organizationId: key.organizationId,
          projectId: key.projectId,
          episodeId: input.episode.snapshot.episodeId,
          brainId: "research",
          fallbackUsed: true,
          fetchFailures: graph.summary.fetchFailures,
          reason: "external_fetch_unavailable_or_empty",
        });
      }
    }
  }

  if (input.brainId === "reasoning") {
    const graph = getDefaultReasoningBrainRepository().getLatestSnapshot(key)?.graph ?? null;
    if (result.status === "completed" && graph) {
      emitIntelligencePipelineDiagnostic({
        event: "reasoning_completed",
        organizationId: key.organizationId,
        projectId: key.projectId,
        episodeId: input.episode.snapshot.episodeId,
        brainId: "reasoning",
        evidenceCount: graph.evidence.length,
        graphRef: result.output?.outputRef,
        durationMs: Date.now() - started,
      });
    } else if (result.status === "failed") {
      emitIntelligencePipelineDiagnostic({
        event: "reasoning_fallback_used",
        organizationId: key.organizationId,
        projectId: key.projectId,
        episodeId: input.episode.snapshot.episodeId,
        brainId: "reasoning",
        fallbackUsed: true,
        reason: result.errorCode ?? "reasoning_failed",
      });
    }
  }

  if (input.brainId === "marketing_intelligence") {
    const graph =
      getDefaultMarketingIntelligenceBrainRepository().getLatestSnapshot(key)?.graph ?? null;
    if (result.status === "completed" && graph) {
      emitIntelligencePipelineDiagnostic({
        event: "marketing_intelligence_completed",
        organizationId: key.organizationId,
        projectId: key.projectId,
        episodeId: input.episode.snapshot.episodeId,
        brainId: "marketing_intelligence",
        evidenceCount: graph.evidence.length,
        graphRef: result.output?.outputRef,
        durationMs: Date.now() - started,
      });
    } else if (result.status === "failed") {
      emitIntelligencePipelineDiagnostic({
        event: "marketing_intelligence_fallback_used",
        organizationId: key.organizationId,
        projectId: key.projectId,
        episodeId: input.episode.snapshot.episodeId,
        brainId: "marketing_intelligence",
        fallbackUsed: true,
        reason: result.errorCode ?? "marketing_intelligence_failed",
      });
    }
  }

  return result;
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
