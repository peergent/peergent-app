/**
 * Canonical Brain payload assembly — upstream output → downstream input.
 */

import type { ProjectBrainId } from "../project-engine/types";
import type { BrainHandoffContext } from "./types";
import type { ResolvedBrainOutputs } from "./brain-output-resolver";
import { proposalsFromLearningGraph } from "./learning-memory-handoff";

export function buildBrainPayload(
  brainId: ProjectBrainId,
  resolved: ResolvedBrainOutputs,
  handoff: BrainHandoffContext
): Record<string, unknown> {
  const {
    companyGraph,
    researchBrainGraph,
    reasoningBrainGraph,
    marketingIntelligenceBrainGraph,
    strategyBrainGraph,
    planningBrainGraph,
    creativeGraph,
    validationGraph,
    executionHistory,
    learningBrainGraph,
    priorMemories,
  } = resolved;

  switch (brainId) {
    case "company":
      return {
        companySnapshot: handoff.companySnapshot,
        brandGraph: handoff.brandGraph,
        locale: handoff.locale,
      };
    case "research":
      return {
        companyGraph,
        memoryRefs: handoff.priorOutputs.filter((o) => o.brainId === "memory").map((o) => o.outputRef),
        projectObjective: handoff.campaignContext.goals[0] ?? handoff.campaignContext.campaignName,
        websiteUrl: handoff.campaignContext.websiteUrl,
        competitors: handoff.campaignContext.competitors.map((c) => ({
          name: c.name,
          url: c.url ?? null,
        })),
      };
    case "reasoning":
      return {
        companyGraph,
        researchBrainGraph,
        memoryGraph: resolved.memoryGraph,
        projectObjective: handoff.campaignContext.goals[0] ?? handoff.campaignContext.campaignName,
        peerId: handoff.peerId,
      };
    case "marketing_intelligence":
      return {
        companyGraph,
        researchBrainGraph,
        reasoningBrainGraph,
        selectedChannels: handoff.campaignContext.selectedChannels,
        channelData: handoff.campaignContext.selectedChannels,
        projectObjective: handoff.campaignContext.goals[0] ?? handoff.campaignContext.campaignName,
        memoryGraph: resolved.memoryGraph,
        peerId: handoff.peerId,
      };
    case "strategy":
      return {
        companyGraph,
        researchBrainGraph,
        reasoningBrainGraph,
        marketingIntelligenceBrainGraph,
        marketingStrategyInput: marketingIntelligenceBrainGraph?.strategyInputs,
        memoryGraph: resolved.memoryGraph,
        availableBudget: { amount: 10000, currency: "EUR" },
        projectObjective: handoff.campaignContext.goals[0] ?? handoff.campaignContext.campaignName,
        peerId: handoff.peerId,
      };
    case "planning":
      return {
        companyGraph,
        strategyBrainGraph,
        memoryGraph: resolved.memoryGraph,
        projectObjective: handoff.campaignContext.goals[0] ?? handoff.campaignContext.campaignName,
      };
    case "creative":
      return {
        campaignContext: handoff.campaignContext,
        strategyGraph: strategyBrainGraph,
        planningGraph: planningBrainGraph,
        marketingIntelligence: marketingIntelligenceBrainGraph,
        researchGraph: researchBrainGraph,
        reasoningGraph: reasoningBrainGraph,
        companySummary: companyGraph?.nodes?.[0]?.label,
        audienceSummary: handoff.campaignContext.audience,
      };
    case "validation":
      return {
        creativeGraph,
        campaignContext: handoff.campaignContext,
        strategyGraph: strategyBrainGraph,
      };
    case "memory":
      if (handoff.memoryCheckpointPhase === "checkpoint_2") {
        return {
          creativeGraph,
          validationGraph,
          strategyGraph: null,
          planningGraph: null,
          approvalGranted: handoff.approvalGrantedForExecution,
          priorMemories,
          learningProposals:
            handoff.learningProposals.length > 0
              ? handoff.learningProposals
              : proposalsFromLearningGraph(learningBrainGraph),
          performanceMetrics: handoff.performanceObservations.map((o) => ({
            channel: o.channel ?? "unknown",
            metric: mapMetric(o.metric),
            value: o.value ?? 0,
            period: o.measurementWindow,
          })),
        };
      }
      return {
        creativeGraph,
        validationGraph,
        strategyGraph: null,
        planningGraph: null,
        approvalGranted: false,
        priorMemories,
      };
    case "execution": {
      const approved = handoff.approvedExecutionHandoff;
      const packageKey = approved?.packageId ?? "unversioned";
      return {
        creativeGraph: resolved.creativeGraph,
        validationGraph: resolved.validationGraph,
        approvalGranted: handoff.approvalGrantedForExecution,
        idempotencyKey: `${handoff.correlationId}:execution:${packageKey}`,
        approvalRef: approved?.approvalId ?? null,
        approvedPackageId: approved?.packageId ?? null,
        approvedPackageVersion: approved?.packageVersion ?? null,
        creativeGraphRef: approved?.creativeGraphRef ?? null,
        validationGraphRef: approved?.validationGraphRef ?? null,
      };
    }
    case "learning":
      return {
        performanceObservations: handoff.performanceObservations,
        companyGraph,
        researchBrainGraph,
        reasoningBrainGraph,
        marketingIntelligenceBrainGraph,
        strategyBrainGraph,
        planningBrainGraph,
        creativeGraph,
        validationGraph,
        executionHistory,
        memoryGraph: resolved.memoryGraph,
      };
    default:
      return {};
  }
}

function mapMetric(metric: string): "ctr" | "roas" | "conversion" | "engagement" {
  if (metric.includes("conversion") || metric.includes("qualified_lead")) return "conversion";
  if (metric.includes("roas")) return "roas";
  if (metric.includes("ctr") || metric.includes("click")) return "ctr";
  return "engagement";
}

export function buildPriorOutputs(artifacts: import("./types").ProjectBrainArtifacts): import("../project-engine/brain-contract").BrainPriorOutput[] {
  const entries: import("../project-engine/brain-contract").BrainPriorOutput[] = [];
  const push = (brainId: ProjectBrainId, ref?: string) => {
    if (ref) {
      entries.push({
        brainId,
        capabilityId: brainId,
        outputRef: ref,
        generatedAt: new Date().toISOString(),
      });
    }
  };
  push("company", artifacts.companyOutputRef);
  push("research", artifacts.researchOutputRef);
  push("reasoning", artifacts.reasoningOutputRef);
  push("marketing_intelligence", artifacts.marketingIntelligenceOutputRef);
  push("strategy", artifacts.strategyOutputRef);
  push("planning", artifacts.planningOutputRef);
  push("creative", artifacts.creativeOutputRef);
  push("validation", artifacts.validationOutputRef);
  for (const ref of artifacts.memoryOutputRefs) push("memory", ref);
  push("execution", artifacts.executionOutputRef);
  push("learning", artifacts.learningOutputRef);
  return entries;
}

export function contextGapsFromEvaluation(input: {
  blocked: boolean;
  actionKind: string;
  reason: string;
  brainId: ProjectBrainId | null;
  slices: import("../project-engine/brain-contract").BrainContextSlices;
}): import("./types").ContextGap[] {
  if (!input.blocked || input.actionKind !== "collect_context") return [];
  const gaps: import("./types").ContextGap[] = [];
  if (!input.slices.website) {
    gaps.push({
      kind: "website",
      requiredBy: input.brainId ?? "research",
      reason: "Research requires company website context.",
      blocking: true,
      resolutionType: "customer_input",
    });
  }
  if (!input.slices.business) {
    gaps.push({
      kind: "business",
      requiredBy: input.brainId ?? "research",
      reason: "Business profile is incomplete.",
      blocking: true,
      resolutionType: "customer_input",
    });
  }
  if (gaps.length === 0 && input.reason) {
    gaps.push({
      kind: "integration",
      requiredBy: input.brainId ?? "project_engine",
      reason: input.reason,
      blocking: true,
      resolutionType: "customer_input",
    });
  }
  return gaps;
}
