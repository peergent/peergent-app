/**
 * Research Brain Executor — external discovery and returns BrainResult.
 * Implements ProjectBrainContract. Never overwrites Company Brain or writes Memory.
 */

import type {
  BrainEvent,
  BrainInput,
  BrainOutput,
  BrainResult,
  ProjectBrainContract,
} from "../../project-engine/brain-contract";
import type { ResearchBrainInput, ResearchBrainOutput, ResearchBrainPayload } from "./brain-types";
import { ResearchBrainLayer } from "./research-brain-layer";
import { validateResearchBrainGraph } from "./research-validator";
import { rejectUnsupportedCapability } from "./research-provider";
import { getDefaultResearchProviderRegistry } from "./research-provider-registry";

function confidenceValue(label: "low" | "medium" | "high"): number {
  return label === "high" ? 0.85 : label === "medium" ? 0.6 : 0.35;
}

function domainEvents(output: ResearchBrainOutput, nl: boolean): BrainEvent[] {
  return output.graph.findings.slice(0, 6).map((finding, i) => ({
    id: `evt-rsch-${finding.domain}-${i}`,
    at: finding.createdAt,
    type: `research_${finding.domain}`,
    title: finding.title,
    subtitle: nl
      ? `${finding.confidence} vertrouwen · ${finding.evidenceIds.length} bewijs`
      : `${finding.confidence} confidence · ${finding.evidenceIds.length} evidence`,
    whyItMatters: nl
      ? "Extern bewijs voedt Reasoning — geen giswerk."
      : "External evidence feeds Reasoning — no guessing.",
  }));
}

export class ResearchBrainExecutor {
  constructor(private readonly layer = new ResearchBrainLayer()) {}

  async execute(input: ResearchBrainInput): Promise<ResearchBrainOutput> {
    return this.layer.produce(input);
  }

  async executeFromContract(
    brainInput: BrainInput<ResearchBrainPayload>
  ): Promise<BrainResult<BrainOutput>> {
    const started = Date.now();
    const nl = brainInput.context.locale === "nl";
    const payload = brainInput.payload ?? ({} as ResearchBrainPayload);

    if (!payload.companyGraph) {
      return {
        brainId: "research",
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

    const researchInput: ResearchBrainInput = {
      organizationId: brainInput.context.organizationId,
      projectId: brainInput.context.projectId,
      episodeId: brainInput.context.episodeId,
      locale: brainInput.context.locale,
      companyGraph: payload.companyGraph,
      memoryRefs: payload.memoryRefs ?? brainInput.context.memoryRefs,
      researchQuestions: payload.researchQuestions,
      researchScope: payload.researchScope,
      budget: payload.budget,
      projectObjective: payload.projectObjective,
      priorResearchSnapshotId: payload.priorResearchSnapshotId,
    };

    try {
      const output = await this.execute(researchInput);
      const meta = validateResearchBrainGraph(output.graph);

      if (!meta.valid) {
        return {
          brainId: "research",
          status: "failed",
          output: null,
          events: domainEvents(output, nl),
          confidence: { value: 0.3, label: "low" },
          durationMs: Date.now() - started,
          errorCode: "research_meta_failed",
          requiresApproval: false,
          approvalKind: null,
        };
      }

      const brainOutput: BrainOutput = {
        outputRef: output.outputRef,
        capabilityIds: [
          "company_understanding",
          "website_understanding",
          "competitor_understanding",
        ],
        decisionIds: output.graph.proposedUpdates.map((p) => p.id),
        generatedAt: output.graph.updatedAt,
      };

      return {
        brainId: "research",
        status: output.run.status === "budget_exhausted" ? "completed" : "completed",
        output: brainOutput,
        events: domainEvents(output, nl),
        confidence: {
          value: confidenceValue(output.graph.confidence),
          label: output.graph.confidence,
        },
        durationMs: Date.now() - started,
        errorCode: output.run.status === "budget_exhausted" ? "research_budget_exhausted" : null,
        requiresApproval: false,
        approvalKind: null,
      };
    } catch (error) {
      return {
        brainId: "research",
        status: "failed",
        output: null,
        events: [],
        confidence: null,
        durationMs: Date.now() - started,
        errorCode: error instanceof Error ? error.message : "research_failed",
        requiresApproval: false,
        approvalKind: null,
      };
    }
  }
}

/** Expose provider capability rejection for tests. */
export function testProviderCapabilityRejection(providerId: string) {
  return rejectUnsupportedCapability(providerId, "searchWeb");
}

export function createResearchBrainExecutor(): ResearchBrainExecutor {
  return new ResearchBrainExecutor();
}

/** ProjectBrainContract — Project Engine schedules; Research discovers external evidence. */
export const researchBrainContract: ProjectBrainContract<ResearchBrainPayload, BrainOutput> = {
  id: "research",
  capabilityIds: [
    "company_understanding",
    "website_understanding",
    "competitor_understanding",
  ],
  requiredContextSlices: ["business", "campaign"],
  execute(input) {
    return createResearchBrainExecutor().executeFromContract(input);
  },
};

export { getDefaultResearchProviderRegistry };
