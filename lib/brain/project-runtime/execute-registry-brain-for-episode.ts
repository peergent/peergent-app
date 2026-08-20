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
import { emitCreativePipelineDiagnostic } from "./creative-pipeline-diagnostics";
import { getDefaultCreativeRepository } from "../layers/creative/creative-repository";
import { appendCreativeLlmAuditEvent } from "./creative-persistence-audit";
import { getDefaultResearchBrainRepository } from "../layers/research/research-brain-repository";
import { getDefaultReasoningBrainRepository } from "../layers/reasoning/reasoning-brain-repository";
import { getDefaultMarketingIntelligenceBrainRepository } from "../layers/marketing-intelligence/marketing-intelligence-brain-repository";
import { getDefaultStrategyBrainRepository } from "../layers/strategy/strategy-brain-repository";
import { proposalsFromLearningGraph, learningProposalIds } from "./learning-memory-handoff";
import {
  completeIntelligenceGraphReuse,
  finalizeIntelligenceBrainExecution,
  isIntelligencePersistenceBrain,
} from "./finalize-intelligence-brain-execution";

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
      const snapshot = getDefaultResearchBrainRepository().getLatestSnapshot({
        organizationId: input.episode.snapshot.organizationId,
        projectId: input.episode.snapshot.projectId,
      });
      emitIntelligencePipelineDiagnostic({
        event: "intelligence_graph_reused",
        organizationId: input.episode.snapshot.organizationId,
        projectId: input.episode.snapshot.projectId,
        episodeId: input.episode.snapshot.episodeId,
        brainId: "research",
        graphReused: true,
        graphRef: snapshot?.outputRef ?? existing.updatedAt,
      });
      return completeIntelligenceGraphReuse({
        brainId: "research",
        episode: input.episode,
        graph: existing,
        outputRef:
          snapshot?.outputRef ??
          `research:${input.episode.snapshot.organizationId}:${existing.updatedAt}`,
        startedMs: started,
        capabilityIds: ["competitor_understanding"],
        confidence: { value: 0.65, label: "medium" },
      });
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
      const snapshot = getDefaultReasoningBrainRepository().getLatestSnapshot({
        organizationId: input.episode.snapshot.organizationId,
        projectId: input.episode.snapshot.projectId,
      });
      emitIntelligencePipelineDiagnostic({
        event: "intelligence_graph_reused",
        organizationId: input.episode.snapshot.organizationId,
        projectId: input.episode.snapshot.projectId,
        episodeId: input.episode.snapshot.episodeId,
        brainId: "reasoning",
        graphReused: true,
        providerMode: existing.providerMeta?.providerMode,
        graphRef: snapshot?.outputRef ?? existing.updatedAt,
      });
      return completeIntelligenceGraphReuse({
        brainId: "reasoning",
        episode: input.episode,
        graph: existing,
        outputRef:
          snapshot?.outputRef ??
          `reasoning:${input.episode.snapshot.organizationId}:${existing.updatedAt}`,
        startedMs: started,
        capabilityIds: ["market_understanding"],
      });
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
      const snapshot = getDefaultMarketingIntelligenceBrainRepository().getLatestSnapshot({
        organizationId: input.episode.snapshot.organizationId,
        projectId: input.episode.snapshot.projectId,
      });
      emitIntelligencePipelineDiagnostic({
        event: "intelligence_graph_reused",
        organizationId: input.episode.snapshot.organizationId,
        projectId: input.episode.snapshot.projectId,
        episodeId: input.episode.snapshot.episodeId,
        brainId: "marketing_intelligence",
        graphReused: true,
        providerMode: existing.providerMeta?.providerMode,
        graphRef: snapshot?.outputRef ?? existing.updatedAt,
      });
      return completeIntelligenceGraphReuse({
        brainId: "marketing_intelligence",
        episode: input.episode,
        graph: existing,
        outputRef:
          snapshot?.outputRef ??
          `mi:${input.episode.snapshot.organizationId}:${existing.updatedAt}`,
        startedMs: started,
        capabilityIds: ["market_understanding"],
      });
    }
    emitIntelligencePipelineDiagnostic({
      event: "marketing_intelligence_started",
      organizationId: input.episode.snapshot.organizationId,
      projectId: input.episode.snapshot.projectId,
      episodeId: input.episode.snapshot.episodeId,
      brainId: "marketing_intelligence",
    });
  }

  if (input.brainId === "strategy") {
    const existing =
      resolved.strategyBrainGraph ??
      getDefaultStrategyBrainRepository().getLatestSnapshot({
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
        brainId: "strategy",
        graphReused: true,
        providerMode: existing.providerMeta?.providerMode,
        graphRef: `strategy:${input.episode.snapshot.organizationId}:${existing.updatedAt}`,
      });
      const snapshot = getDefaultStrategyBrainRepository().getLatestSnapshot({
        organizationId: input.episode.snapshot.organizationId,
        projectId: input.episode.snapshot.projectId,
      });
      return completeIntelligenceGraphReuse({
        brainId: "strategy",
        episode: input.episode,
        graph: existing,
        outputRef:
          snapshot?.outputRef ??
          `strategy:${input.episode.snapshot.organizationId}:${existing.updatedAt}`,
        startedMs: started,
        capabilityIds: ["strategy"],
        requiresApproval: existing.approval.requiresApproval,
        approvalKind: existing.approval.approvalKind,
      });
    }
    emitIntelligencePipelineDiagnostic({
      event: "strategy_llm_started",
      organizationId: input.episode.snapshot.organizationId,
      projectId: input.episode.snapshot.projectId,
      episodeId: input.episode.snapshot.episodeId,
      brainId: "strategy",
    });
  }

  if (input.brainId === "creative") {
    const existing =
      resolved.creativeGraph ??
      getDefaultCreativeRepository().getLatest({
        organizationId: input.episode.snapshot.organizationId,
        campaignId: input.episode.snapshot.projectId,
      })?.graph ??
      null;
    if (existing) {
      const record = getDefaultCreativeRepository().getLatest({
        organizationId: input.episode.snapshot.organizationId,
        campaignId: input.episode.snapshot.projectId,
      });
      emitCreativePipelineDiagnostic({
        event: "creative_graph_reused",
        organizationId: input.episode.snapshot.organizationId,
        projectId: input.episode.snapshot.projectId,
        episodeId: input.episode.snapshot.episodeId,
        brainId: "creative",
        graphReused: true,
        providerMode: existing.providerMeta?.providerMode,
        graphRef: record?.outputRef ?? existing.createdAt,
      });
      await appendCreativeLlmAuditEvent({
        correlationId: input.episode.correlationId,
        payload: {
          organizationId: input.episode.snapshot.organizationId,
          projectId: input.episode.snapshot.projectId,
          episodeId: input.episode.snapshot.episodeId,
          graphRef: record?.outputRef ?? `creative:${input.episode.snapshot.organizationId}:${existing.createdAt}`,
          providerMeta: existing.providerMeta ?? null,
          graphReused: true,
        },
      });
      input.episode.resolvedGraphs = {
        ...input.episode.resolvedGraphs,
        creativeGraph: existing,
      };
      return {
        brainId: "creative",
        status: "completed",
        output: {
          outputRef:
            record?.outputRef ??
            `creative:${input.episode.snapshot.organizationId}:${input.episode.snapshot.projectId}:${existing.createdAt}`,
          capabilityIds: ["creative_generation"],
          decisionIds: existing.decisions.map((d) => d.id),
          generatedAt: existing.createdAt,
        },
        events: [],
        confidence: {
          value: existing.confidence === "high" ? 0.85 : existing.confidence === "medium" ? 0.65 : 0.45,
          label: existing.confidence,
        },
        durationMs: Date.now() - started,
        errorCode: null,
        requiresApproval: true,
        approvalKind: "deliverable_review",
      };
    }
    emitCreativePipelineDiagnostic({
      event: "creative_llm_started",
      organizationId: input.episode.snapshot.organizationId,
      projectId: input.episode.snapshot.projectId,
      episodeId: input.episode.snapshot.episodeId,
      brainId: "creative",
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

  if (isIntelligencePersistenceBrain(input.brainId)) {
    return finalizeIntelligenceBrainExecution({
      brainId: input.brainId,
      episode: input.episode,
      result,
      startedMs: started,
    });
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
