/**
 * Learning Brain Executor — feedback layer.
 * Implements ProjectBrainContract. Never mutates upstream graphs or Memory.
 */

import type {
  BrainEvent,
  BrainInput,
  BrainOutput,
  BrainResult,
  ProjectBrainContract,
} from "../../project-engine/brain-contract";
import type { LearningBrainInput, LearningBrainOutput, LearningBrainPayload } from "./brain-types";
import { LearningBrainLayer, InsufficientOutcomeDataError } from "./learning-brain-layer";

function confidenceValue(label: "low" | "medium" | "high"): number {
  return label === "high" ? 0.82 : label === "medium" ? 0.62 : 0.38;
}

function domainEvents(output: LearningBrainOutput, nl: boolean): BrainEvent[] {
  return output.graph.insights.slice(0, 6).map((i, idx) => ({
    id: `evt-learn-${idx}`,
    at: output.graph.updatedAt,
    type: "learning_insight",
    title: i.observation,
    subtitle: nl ? `${i.confidence} vertrouwen` : `${i.confidence} confidence`,
    whyItMatters: nl
      ? "Learning voedt Memory — geen directe systeemwijziging."
      : "Learning feeds Memory — no direct system mutation.",
  }));
}

function fail(started: number, code: string, status: "failed" | "skipped" = "failed"): BrainResult<BrainOutput> {
  return {
    brainId: "learning",
    status,
    output: null,
    events: [],
    confidence: null,
    durationMs: Date.now() - started,
    errorCode: code,
    requiresApproval: false,
    approvalKind: null,
  };
}

function snapshotVersions(input: {
  companyGraph?: { version?: string } | null;
  strategyGraph?: { version?: string } | null;
  planningGraph?: { version?: string } | null;
}) {
  return {
    company: input.companyGraph?.version ?? null,
    strategy: input.strategyGraph?.version ?? null,
    planning: input.planningGraph?.version ?? null,
  };
}

export class LearningBrainExecutor {
  constructor(private readonly layer = new LearningBrainLayer()) {}

  execute(input: LearningBrainInput): LearningBrainOutput {
    return this.layer.produce(input);
  }

  async executeFromContract(
    brainInput: BrainInput<LearningBrainPayload>
  ): Promise<BrainResult<BrainOutput>> {
    const started = Date.now();
    const nl = brainInput.context.locale === "nl";
    const payload = brainInput.payload ?? ({} as LearningBrainPayload);

    const versionsBefore = snapshotVersions({
      companyGraph: payload.companyGraph,
      strategyGraph: payload.strategyBrainGraph,
      planningGraph: payload.planningBrainGraph,
    });

    const learnInput: LearningBrainInput = {
      organizationId: brainInput.context.organizationId,
      projectId: brainInput.context.projectId,
      episodeId: brainInput.context.episodeId,
      campaignId: payload.performanceObservations?.[0]?.campaignId,
      locale: brainInput.context.locale,
      performanceObservations: payload.performanceObservations ?? [],
      customerFeedback: payload.customerFeedback,
      experiments: payload.experiments,
      approvalSignals: payload.approvalSignals,
      measurementContext: payload.measurementContext,
      companyGraph: payload.companyGraph,
      researchGraph: payload.researchBrainGraph,
      reasoningGraph: payload.reasoningBrainGraph,
      marketingIntelligenceGraph: payload.marketingIntelligenceBrainGraph,
      strategyGraph: payload.strategyBrainGraph,
      planningGraph: payload.planningBrainGraph,
      creativeGraph: payload.creativeGraph,
      validationGraph: payload.validationGraph,
      executionHistory: payload.executionHistory,
      memoryGraph: payload.memoryGraph,
      changeReason: payload.changeReason,
      supersedesSnapshotId: payload.supersedesSnapshotId,
      priorHypotheses: payload.priorHypotheses,
      priorPatterns: payload.priorPatterns,
    };

    try {
      const output = this.layer.produce(learnInput);

      const versionsAfter = snapshotVersions({
        companyGraph: payload.companyGraph,
        strategyGraph: payload.strategyBrainGraph,
        planningGraph: payload.planningBrainGraph,
      });

      if (versionsBefore.company !== versionsAfter.company && versionsBefore.company != null) {
        return fail(started, "company_graph_mutation_detected");
      }
      if (versionsBefore.strategy !== versionsAfter.strategy && versionsBefore.strategy != null) {
        return fail(started, "strategy_graph_mutation_detected");
      }
      if (versionsBefore.planning !== versionsAfter.planning && versionsBefore.planning != null) {
        return fail(started, "planning_graph_mutation_detected");
      }

      const brainOutput: BrainOutput = {
        outputRef: output.outputRef,
        capabilityIds: ["performance_interpretation"],
        decisionIds: output.graph.memoryWriteProposals.map((p) => p.id),
        generatedAt: output.graph.updatedAt,
      };

      return {
        brainId: "learning",
        status: "completed",
        output: brainOutput,
        events: domainEvents(output, nl),
        confidence: {
          value: confidenceValue(output.graph.confidence),
          label: output.graph.confidence,
        },
        durationMs: Date.now() - started,
        errorCode: null,
        requiresApproval: output.graph.memoryWriteProposals.some((p) => p.durability === "durable_candidate"),
        approvalKind: null,
      };
    } catch (error) {
      if (error instanceof InsufficientOutcomeDataError) {
        return fail(started, "insufficient_outcome_data", "skipped");
      }
      return {
        brainId: "learning",
        status: "failed",
        output: null,
        events: [],
        confidence: null,
        durationMs: Date.now() - started,
        errorCode: error instanceof Error ? error.message : "learning_failed",
        requiresApproval: false,
        approvalKind: null,
      };
    }
  }
}

export function createLearningBrainExecutor(): LearningBrainExecutor {
  return new LearningBrainExecutor();
}

/** ProjectBrainContract — Project Engine schedules; Learning observes outcomes. */
export const learningBrainContract: ProjectBrainContract<LearningBrainPayload, BrainOutput> = {
  id: "learning",
  capabilityIds: ["performance_interpretation", "optimization"],
  requiredContextSlices: ["campaign"],
  execute(input) {
    return createLearningBrainExecutor().executeFromContract(input);
  },
};
