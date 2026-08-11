/**
 * Planning Brain Executor — operational planning layer.
 * Implements ProjectBrainContract. Never re-decides strategy, creates, or executes.
 */

import type {
  BrainEvent,
  BrainInput,
  BrainOutput,
  BrainResult,
  ProjectBrainContract,
} from "../../project-engine/brain-contract";
import type { PlanningBrainInput, PlanningBrainOutput, PlanningBrainPayload } from "./brain-types";
import { PlanningBrainLayer } from "./planning-brain-layer";

function confidenceValue(label: "low" | "medium" | "high"): number {
  return label === "high" ? 0.82 : label === "medium" ? 0.62 : 0.38;
}

function domainEvents(output: PlanningBrainOutput, nl: boolean): BrainEvent[] {
  return output.graph.milestones.slice(0, 6).map((m, i) => ({
    id: `evt-plan-${i}`,
    at: output.graph.updatedAt,
    type: "planning_milestone",
    title: m.title,
    subtitle: nl ? `${m.status} · planning` : `${m.status} · planning`,
    whyItMatters: nl
      ? "Planning operationaliseert strategie — Creative voert creatief uit."
      : "Planning operationalizes strategy — Creative executes creative work.",
  }));
}

function fail(started: number, code: string): BrainResult<BrainOutput> {
  return {
    brainId: "planning",
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

export class PlanningBrainExecutor {
  constructor(private readonly layer = new PlanningBrainLayer()) {}

  execute(input: PlanningBrainInput): PlanningBrainOutput {
    return this.layer.produce(input);
  }

  async executeFromContract(
    brainInput: BrainInput<PlanningBrainPayload>
  ): Promise<BrainResult<BrainOutput>> {
    const started = Date.now();
    const nl = brainInput.context.locale === "nl";
    const payload = brainInput.payload ?? ({} as PlanningBrainPayload);

    if (!payload.companyGraph) return fail(started, "missing_company_graph");
    if (!payload.strategyBrainGraph) return fail(started, "missing_strategy_graph");

    const companyVersionBefore = payload.companyGraph.version ?? "unknown";

    const planInput: PlanningBrainInput = {
      organizationId: brainInput.context.organizationId,
      projectId: brainInput.context.projectId,
      episodeId: brainInput.context.episodeId,
      locale: brainInput.context.locale,
      companyGraph: payload.companyGraph,
      strategyGraph: payload.strategyBrainGraph,
      memoryGraph: payload.memoryGraph,
      projectObjective: payload.projectObjective,
      customerDeadline: payload.customerDeadline,
      resourceConstraints: payload.resourceConstraints,
      approvalPolicy: payload.approvalPolicy,
      changeReason: payload.changeReason,
      supersedesSnapshotId: payload.supersedesSnapshotId,
      invalidationTrigger: payload.invalidationTrigger,
    };

    try {
      const output = this.layer.produce(planInput);

      if ((payload.companyGraph.version ?? "unknown") !== companyVersionBefore) {
        return fail(started, "company_graph_mutation_detected");
      }

      const brainOutput: BrainOutput = {
        outputRef: output.outputRef,
        capabilityIds: ["campaign_planning"],
        decisionIds: output.graph.planningDecisions.map((d) => d.id),
        generatedAt: output.graph.updatedAt,
      };

      const needsApproval = output.graph.approvalGates.some((g) => g.blocking && g.status === "NOT_STARTED");

      return {
        brainId: "planning",
        status: needsApproval ? "waiting_approval" : "completed",
        output: brainOutput,
        events: domainEvents(output, nl),
        confidence: {
          value: confidenceValue(output.graph.confidence),
          label: output.graph.confidence,
        },
        durationMs: Date.now() - started,
        errorCode: null,
        requiresApproval: needsApproval,
        approvalKind: needsApproval ? "planning_review" : null,
      };
    } catch (error) {
      return {
        brainId: "planning",
        status: "failed",
        output: null,
        events: [],
        confidence: null,
        durationMs: Date.now() - started,
        errorCode: error instanceof Error ? error.message : "planning_failed",
        requiresApproval: false,
        approvalKind: null,
      };
    }
  }
}

export function createPlanningBrainExecutor(): PlanningBrainExecutor {
  return new PlanningBrainExecutor();
}

/** ProjectBrainContract — Project Engine schedules; Planning operationalizes strategy. */
export const planningBrainContract: ProjectBrainContract<PlanningBrainPayload, BrainOutput> = {
  id: "planning",
  capabilityIds: ["campaign_planning"],
  requiredContextSlices: ["campaign", "goals"],
  execute(input) {
    return createPlanningBrainExecutor().executeFromContract(input);
  },
};
