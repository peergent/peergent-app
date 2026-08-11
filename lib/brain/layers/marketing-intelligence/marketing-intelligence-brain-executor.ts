/**
 * Marketing Intelligence Brain Executor — marketing-domain interpretation.
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
  MarketingIntelligenceBrainInput,
  MarketingIntelligenceBrainOutput,
  MarketingIntelligenceBrainPayload,
} from "./brain-types";
import { MarketingIntelligenceBrainLayer } from "./marketing-intelligence-brain-layer";
import { validateMarketingIntelligenceBrainGraph } from "./marketing-intelligence-validator";

function confidenceValue(label: "low" | "medium" | "high"): number {
  return label === "high" ? 0.82 : label === "medium" ? 0.62 : 0.38;
}

function domainEvents(output: MarketingIntelligenceBrainOutput, nl: boolean): BrainEvent[] {
  return output.graph.marketingPriorities.slice(0, 6).map((signal, i) => ({
    id: `evt-mi-${i}`,
    at: output.graph.updatedAt,
    type: "marketing_intelligence_priority",
    title: signal.subject,
    subtitle: nl
      ? `${signal.priority} prioriteit · ${signal.confidence} vertrouwen`
      : `${signal.priority} priority · ${signal.confidence} confidence`,
    whyItMatters: nl
      ? "Marketing-intelligentie voedt strategie — geen ruwe evidence herkauwen."
      : "Marketing intelligence feeds strategy — no reprocessing raw evidence.",
  }));
}

export class MarketingIntelligenceBrainExecutor {
  constructor(private readonly layer = new MarketingIntelligenceBrainLayer()) {}

  execute(input: MarketingIntelligenceBrainInput): MarketingIntelligenceBrainOutput {
    return this.layer.produce(input);
  }

  async executeFromContract(
    brainInput: BrainInput<MarketingIntelligenceBrainPayload>
  ): Promise<BrainResult<BrainOutput>> {
    const started = Date.now();
    const nl = brainInput.context.locale === "nl";
    const payload = brainInput.payload ?? ({} as MarketingIntelligenceBrainPayload);

    if (!payload.companyGraph) {
      return fail(started, "missing_company_graph");
    }
    if (!payload.researchBrainGraph) {
      return fail(started, "missing_research_graph");
    }
    if (!payload.reasoningBrainGraph) {
      return fail(started, "missing_reasoning_graph");
    }

    const miInput: MarketingIntelligenceBrainInput = {
      organizationId: brainInput.context.organizationId,
      projectId: brainInput.context.projectId,
      episodeId: brainInput.context.episodeId,
      locale: brainInput.context.locale,
      companyGraph: payload.companyGraph,
      researchGraph: payload.researchBrainGraph,
      reasoningGraph: payload.reasoningBrainGraph,
      memoryGraph: payload.memoryGraph,
      projectObjective: payload.projectObjective,
      businessGoals: payload.businessGoals,
      constraints: payload.constraints,
      budgetContext: payload.budgetContext,
      audienceContext: payload.audienceContext,
      channelData: payload.channelData,
      priorMarketingDecisions: payload.priorMarketingDecisions,
    };

    try {
      const output = this.execute(miInput);
      const meta = validateMarketingIntelligenceBrainGraph(output.graph);

      if (!meta.valid) {
        return {
          brainId: "marketing_intelligence",
          status: "failed",
          output: null,
          events: domainEvents(output, nl),
          confidence: { value: 0.3, label: "low" },
          durationMs: Date.now() - started,
          errorCode: "marketing_intelligence_meta_failed",
          requiresApproval: false,
          approvalKind: null,
        };
      }

      const brainOutput: BrainOutput = {
        outputRef: output.outputRef,
        capabilityIds: ["market_understanding", "competitor_understanding"],
        decisionIds: output.graph.opportunitySignals.map((o) => o.id),
        generatedAt: output.graph.updatedAt,
      };

      return {
        brainId: "marketing_intelligence",
        status: "completed",
        output: brainOutput,
        events: domainEvents(output, nl),
        confidence: {
          value: confidenceValue(output.graph.confidence),
          label: output.graph.confidence,
        },
        durationMs: Date.now() - started,
        errorCode: null,
        requiresApproval: false,
        approvalKind: null,
      };
    } catch (error) {
      return fail(
        started,
        error instanceof Error ? error.message : "marketing_intelligence_failed"
      );
    }
  }
}

function fail(started: number, errorCode: string): BrainResult<BrainOutput> {
  return {
    brainId: "marketing_intelligence",
    status: "failed",
    output: null,
    events: [],
    confidence: null,
    durationMs: Date.now() - started,
    errorCode,
    requiresApproval: false,
    approvalKind: null,
  };
}

export function createMarketingIntelligenceBrainExecutor(): MarketingIntelligenceBrainExecutor {
  return new MarketingIntelligenceBrainExecutor();
}

/** ProjectBrainContract — Project Engine schedules; MI translates to marketing intelligence. */
export const marketingIntelligenceBrainContract: ProjectBrainContract<
  MarketingIntelligenceBrainPayload,
  BrainOutput
> = {
  id: "marketing_intelligence",
  capabilityIds: ["market_understanding", "competitor_understanding"],
  requiredContextSlices: ["business", "competitors"],
  execute(input) {
    return createMarketingIntelligenceBrainExecutor().executeFromContract(input);
  },
};
