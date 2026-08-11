/**
 * Strategy Brain Executor — decision layer.
 * Implements ProjectBrainContract. Never plans, creates, researches, or mutates Company.
 */

import type {
  BrainEvent,
  BrainInput,
  BrainOutput,
  BrainResult,
  ProjectBrainContract,
} from "../../project-engine/brain-contract";
import type { StrategyBrainInput, StrategyBrainOutput, StrategyBrainPayload } from "./brain-types";
import { StrategyBrainLayer } from "./strategy-brain-layer";

function confidenceValue(label: "low" | "medium" | "high"): number {
  return label === "high" ? 0.82 : label === "medium" ? 0.62 : 0.38;
}

function domainEvents(output: StrategyBrainOutput, nl: boolean): BrainEvent[] {
  return output.graph.strategicDecisions.slice(0, 6).map((d, i) => ({
    id: `evt-strat-${i}`,
    at: output.graph.updatedAt,
    type: "strategic_decision",
    title: d.title,
    subtitle: nl
      ? `${d.decisionType} · ${d.confidence} vertrouwen`
      : `${d.decisionType} · ${d.confidence} confidence`,
    whyItMatters: nl
      ? "Strategie kiest richting — Planning voert uit."
      : "Strategy chooses direction — Planning executes.",
  }));
}

function fail(started: number, code: string): BrainResult<BrainOutput> {
  return {
    brainId: "strategy",
    status: "failed",
    output: null,
    events: [],
    confidence: null,
    durationMs: Date.now() - started,
    errorCode: code,
    requiresApproval: false,
    approvalKind: null,
  };
}

export class StrategyBrainExecutor {
  constructor(private readonly layer = new StrategyBrainLayer()) {}

  execute(input: StrategyBrainInput): StrategyBrainOutput {
    return this.layer.produce(input);
  }

  async executeFromContract(
    brainInput: BrainInput<StrategyBrainPayload>
  ): Promise<BrainResult<BrainOutput>> {
    const started = Date.now();
    const nl = brainInput.context.locale === "nl";
    const payload = brainInput.payload ?? ({} as StrategyBrainPayload);

    if (!payload.companyGraph) return fail(started, "missing_company_graph");
    if (!payload.researchBrainGraph) return fail(started, "missing_research_graph");
    if (!payload.reasoningBrainGraph) return fail(started, "missing_reasoning_graph");
    if (!payload.marketingIntelligenceBrainGraph) return fail(started, "missing_marketing_intelligence_graph");

    const companyVersionBefore = payload.companyGraph.version ?? "unknown";

    const stratInput: StrategyBrainInput = {
      organizationId: brainInput.context.organizationId,
      projectId: brainInput.context.projectId,
      episodeId: brainInput.context.episodeId,
      locale: brainInput.context.locale,
      companyGraph: payload.companyGraph,
      researchGraph: payload.researchBrainGraph,
      reasoningGraph: payload.reasoningBrainGraph,
      marketingIntelligenceGraph: payload.marketingIntelligenceBrainGraph,
      marketingStrategyInput: payload.marketingStrategyInput ?? undefined,
      memoryGraph: payload.memoryGraph,
      projectObjective: payload.projectObjective,
      businessGoals: payload.businessGoals,
      marketingObjectives: payload.marketingObjectives,
      availableBudget: payload.availableBudget,
      timeHorizon: payload.timeHorizon,
      constraints: payload.constraints,
      customerPriorities: payload.customerPriorities,
      approvalPolicy: payload.approvalPolicy,
    };

    try {
      const output = this.layer.produce(stratInput);

      const companyVersionAfter = payload.companyGraph.version ?? "unknown";
      if (companyVersionBefore !== companyVersionAfter) {
        return fail(started, "company_graph_mutation_detected");
      }

      const brainOutput: BrainOutput = {
        outputRef: output.outputRef,
        capabilityIds: ["strategy"],
        decisionIds: output.graph.strategicDecisions.map((d) => d.id),
        generatedAt: output.graph.updatedAt,
      };

      return {
        brainId: "strategy",
        status: output.graph.approval.requiresApproval ? "waiting_approval" : "completed",
        output: brainOutput,
        events: domainEvents(output, nl),
        confidence: {
          value: confidenceValue(output.graph.confidence),
          label: output.graph.confidence,
        },
        durationMs: Date.now() - started,
        errorCode: null,
        requiresApproval: output.graph.approval.requiresApproval,
        approvalKind: output.graph.approval.approvalKind,
      };
    } catch (error) {
      return {
        brainId: "strategy",
        status: "failed",
        output: null,
        events: [],
        confidence: null,
        durationMs: Date.now() - started,
        errorCode: error instanceof Error ? error.message : "strategy_failed",
        requiresApproval: false,
        approvalKind: null,
      };
    }
  }
}

export function createStrategyBrainExecutor(): StrategyBrainExecutor {
  return new StrategyBrainExecutor();
}

/** ProjectBrainContract — Project Engine schedules; Strategy decides direction. */
export const strategyBrainContract: ProjectBrainContract<StrategyBrainPayload, BrainOutput> = {
  id: "strategy",
  capabilityIds: ["strategy"],
  requiredContextSlices: ["business", "goals", "campaign"],
  execute(input) {
    return createStrategyBrainExecutor().executeFromContract(input);
  },
};
