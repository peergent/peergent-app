/**
 * Reasoning Brain Executor — judgment layer returns BrainResult.
 * Implements ProjectBrainContract. Never strategy, creative, research, or Company mutation.
 */

import type {
  BrainEvent,
  BrainInput,
  BrainOutput,
  BrainResult,
  ProjectBrainContract,
} from "../../project-engine/brain-contract";
import type {
  ReasoningBrainInput,
  ReasoningBrainOutput,
  ReasoningBrainPayload,
} from "./brain-types";
import { ReasoningBrainLayer } from "./reasoning-brain-layer";
import { validateReasoningBrainGraph } from "./reasoning-validator";

function confidenceValue(label: "low" | "medium" | "high"): number {
  return label === "high" ? 0.8 : label === "medium" ? 0.6 : 0.35;
}

function domainEvents(output: ReasoningBrainOutput, nl: boolean): BrainEvent[] {
  return output.graph.interpretations.slice(0, 6).map((interpretation, i) => ({
    id: `evt-rsn-${i}`,
    at: interpretation.createdAt,
    type: "reasoning_interpretation",
    title: interpretation.title,
    subtitle: nl
      ? `${interpretation.confidence} vertrouwen · ${interpretation.importance} impact`
      : `${interpretation.confidence} confidence · ${interpretation.importance} impact`,
    whyItMatters: nl
      ? "Begrip vóór strategie — geen giswerk."
      : "Understanding before strategy — no guessing.",
  }));
}

export class ReasoningBrainExecutor {
  constructor(private readonly layer = new ReasoningBrainLayer()) {}

  execute(input: ReasoningBrainInput): ReasoningBrainOutput {
    return this.layer.produce(input);
  }

  async executeFromContract(
    brainInput: BrainInput<ReasoningBrainPayload>
  ): Promise<BrainResult<BrainOutput>> {
    const started = Date.now();
    const nl = brainInput.context.locale === "nl";
    const payload = brainInput.payload ?? ({} as ReasoningBrainPayload);

    if (!payload.companyGraph) {
      return {
        brainId: "reasoning",
        status: "failed",
        output: null,
        events: [],
        confidence: null,
        durationMs: Date.now() - started,
        errorCode: "missing_company_graph",
        requiresApproval: false,
        approvalKind: null,
      };
    }

    if (!payload.researchBrainGraph) {
      return {
        brainId: "reasoning",
        status: "failed",
        output: null,
        events: [],
        confidence: null,
        durationMs: Date.now() - started,
        errorCode: "missing_research_graph",
        requiresApproval: false,
        approvalKind: null,
      };
    }

    const reasoningInput: ReasoningBrainInput = {
      organizationId: brainInput.context.organizationId,
      projectId: brainInput.context.projectId,
      episodeId: brainInput.context.episodeId,
      locale: brainInput.context.locale,
      companyGraph: payload.companyGraph,
      researchGraph: payload.researchBrainGraph,
      memoryGraph: payload.memoryGraph,
      projectObjective: payload.projectObjective,
      businessGoals: payload.businessGoals,
      knownConstraints: payload.knownConstraints,
      knownRisks: payload.knownRisks,
      customerPriorities: payload.customerPriorities,
    };

    try {
      const output = this.execute(reasoningInput);
      const meta = validateReasoningBrainGraph(output.graph);

      if (!meta.valid) {
        return {
          brainId: "reasoning",
          status: "failed",
          output: null,
          events: domainEvents(output, nl),
          confidence: { value: 0.3, label: "low" },
          durationMs: Date.now() - started,
          errorCode: "reasoning_meta_failed",
          requiresApproval: false,
          approvalKind: null,
        };
      }

      const brainOutput: BrainOutput = {
        outputRef: output.outputRef,
        capabilityIds: ["market_understanding"],
        decisionIds: output.graph.decisionOptions.map((o) => o.id),
        generatedAt: output.graph.updatedAt,
      };

      return {
        brainId: "reasoning",
        status: "completed",
        output: brainOutput,
        events: domainEvents(output, nl),
        confidence: {
          value: confidenceValue(output.graph.confidence),
          label: output.graph.confidence,
        },
        durationMs: Date.now() - started,
        errorCode: null,
        requiresApproval: output.graph.escalations.some((e) => e.requiresCustomerInput),
        approvalKind: output.graph.escalations.some((e) => e.requiresCustomerInput)
          ? "reasoning_escalation"
          : null,
      };
    } catch (error) {
      return {
        brainId: "reasoning",
        status: "failed",
        output: null,
        events: [],
        confidence: null,
        durationMs: Date.now() - started,
        errorCode: error instanceof Error ? error.message : "reasoning_failed",
        requiresApproval: false,
        approvalKind: null,
      };
    }
  }
}

export function createReasoningBrainExecutor(): ReasoningBrainExecutor {
  return new ReasoningBrainExecutor();
}

/** ProjectBrainContract — Project Engine schedules; Reasoning interprets evidence. */
export const reasoningBrainContract: ProjectBrainContract<ReasoningBrainPayload, BrainOutput> = {
  id: "reasoning",
  capabilityIds: ["market_understanding"],
  requiredContextSlices: ["business", "campaign"],
  execute(input) {
    return createReasoningBrainExecutor().executeFromContract(input);
  },
};
