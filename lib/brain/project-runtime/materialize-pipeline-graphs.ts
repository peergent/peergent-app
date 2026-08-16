/**
 * PX-53 — materialize layer pipeline graphs after capability-path brain runs.
 */

import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { ProjectBrainId } from "../project-engine/types";
import { getDefaultPlanningBrainRepository } from "../layers/planning/planning-brain-repository";
import { getDefaultStrategyBrainRepository } from "../layers/strategy/strategy-brain-repository";
import { PlanningBrainLayer } from "../layers/planning/planning-brain-layer";
import { StrategyBrainLayer } from "../layers/strategy/strategy-brain-layer";
import type { ResolvedBrainOutputs } from "../project-runtime/brain-output-resolver";
import { resolveBrainOutputs } from "../project-runtime/brain-output-resolver";
import type { ProjectBrainArtifacts } from "../project-runtime/types";

export function materializePipelineGraphsAfterCapabilityBrain(input: {
  brainId: ProjectBrainId;
  organizationId: string;
  projectId: string;
  episodeId?: string;
  capabilityOutput?: BrainStructuredOutput | null;
  artifacts: ProjectBrainArtifacts;
  resolvedGraphs?: Partial<ResolvedBrainOutputs>;
}): void {
  const key = { organizationId: input.organizationId, projectId: input.projectId };
  const resolved = {
    ...(input.resolvedGraphs ?? {}),
    ...resolveBrainOutputs({
      organizationId: input.organizationId,
      projectId: input.projectId,
      artifacts: input.artifacts,
    }),
  };

  if (input.brainId === "strategy") {
    materializeStrategyGraph({
      key,
      episodeId: input.episodeId,
      capabilityOutput: input.capabilityOutput,
      resolved,
    });
  }

  if (input.brainId === "planning") {
    materializePlanningGraph({
      key,
      episodeId: input.episodeId,
      capabilityOutput: input.capabilityOutput,
      resolved,
    });
  }
}

function materializeStrategyGraph(input: {
  key: { organizationId: string; projectId: string };
  episodeId?: string;
  capabilityOutput?: BrainStructuredOutput | null;
  resolved: ResolvedBrainOutputs;
}): void {
  const repo = getDefaultStrategyBrainRepository();
  if (repo.getLatestSnapshot(input.key)?.graph) return;

  if (input.capabilityOutput?.strategyBrainGraph) {
    repo.storeSnapshot({
      id: `strategy-cap-${Date.now()}`,
      organizationId: input.key.organizationId,
      projectId: input.key.projectId,
      campaignId: input.key.projectId,
      graph: input.capabilityOutput.strategyBrainGraph,
      outputRef: `strategy:${input.key.organizationId}:${input.key.projectId}:capability`,
      storedAt: input.capabilityOutput.generatedAt,
    });
    return;
  }

  if (
    !input.resolved.companyGraph ||
    !input.resolved.researchBrainGraph ||
    !input.resolved.reasoningBrainGraph ||
    !input.resolved.marketingIntelligenceBrainGraph
  ) {
    return;
  }

  const layer = new StrategyBrainLayer(repo);
  layer.produce({
    organizationId: input.key.organizationId,
    projectId: input.key.projectId,
    episodeId: input.episodeId,
    campaignId: input.key.projectId,
    locale: "en",
    companyGraph: input.resolved.companyGraph,
    researchGraph: input.resolved.researchBrainGraph,
    reasoningGraph: input.resolved.reasoningBrainGraph,
    marketingIntelligenceGraph: input.resolved.marketingIntelligenceBrainGraph,
    memoryGraph: input.resolved.memoryGraph,
    availableBudget: { amount: 10000, currency: "EUR" },
    projectObjective: "Campaign objective",
  });
}

function materializePlanningGraph(input: {
  key: { organizationId: string; projectId: string };
  episodeId?: string;
  capabilityOutput?: BrainStructuredOutput | null;
  resolved: ResolvedBrainOutputs;
}): void {
  const repo = getDefaultPlanningBrainRepository();
  if (repo.getLatestSnapshot(input.key)?.graph) return;

  if (input.capabilityOutput?.planningBrainGraph) {
    repo.storeSnapshot({
      id: `planning-cap-${Date.now()}`,
      organizationId: input.key.organizationId,
      projectId: input.key.projectId,
      campaignId: input.key.projectId,
      graph: input.capabilityOutput.planningBrainGraph,
      outputRef: `planning:${input.key.organizationId}:${input.key.projectId}:capability`,
      storedAt: input.capabilityOutput.generatedAt,
    });
    return;
  }

  const strategyGraph = input.resolved.strategyBrainGraph;
  const companyGraph = input.resolved.companyGraph;
  if (!strategyGraph || !companyGraph) return;

  const layer = new PlanningBrainLayer(repo);
  layer.produce({
    organizationId: input.key.organizationId,
    projectId: input.key.projectId,
    episodeId: input.episodeId,
    locale: "en",
    companyGraph,
    strategyGraph,
    memoryGraph: input.resolved.memoryGraph,
    projectObjective: "Campaign objective",
  });
}
