/**
 * Company Brain Executor — assembles organizational truth and returns BrainResult.
 * Implements ProjectBrainContract. Never campaigns, validates, executes, or learns.
 */

import type {
  BrainEvent,
  BrainInput,
  BrainOutput,
  BrainResult,
  ProjectBrainContract,
} from "../../project-engine/brain-contract";
import type { CompanyBrainInput, CompanyBrainOutput, CompanyBrainPayload } from "./types";
import { CompanyLayer } from "./company-layer";
import { validateCompanyGraph } from "./company-validator";

function confidenceValue(label: "low" | "medium" | "high"): number {
  return label === "high" ? 0.9 : label === "medium" ? 0.65 : 0.4;
}

function domainEvents(output: CompanyBrainOutput, nl: boolean): BrainEvent[] {
  return output.graph.nodes.slice(0, 8).map((node, i) => ({
    id: `evt-co-${node.domain}-${i}`,
    at: output.graph.updatedAt,
    type: `company_${node.domain}`,
    title: node.label,
    subtitle: nl
      ? `${node.factIds.length} feiten vastgelegd`
      : `${node.factIds.length} facts recorded`,
    whyItMatters: nl
      ? "Organisatiekennis is de basis voor elke Brain."
      : "Organizational knowledge is the foundation for every Brain.",
  }));
}

export class CompanyBrainExecutor {
  constructor(private readonly layer = new CompanyLayer()) {}

  execute(input: CompanyBrainInput): CompanyBrainOutput {
    return this.layer.produceAndStore(input);
  }

  async executeFromContract(
    brainInput: BrainInput<CompanyBrainPayload>
  ): Promise<BrainResult<BrainOutput>> {
    const started = Date.now();
    const nl = brainInput.context.locale === "nl";
    const payload = brainInput.payload ?? ({} as CompanyBrainPayload);

    if (!payload.companySnapshot) {
      return {
        brainId: "company",
        status: "failed",
        output: null,
        events: [],
        confidence: null,
        durationMs: Date.now() - started,
        errorCode: "missing_company_snapshot",
        requiresApproval: false,
        approvalKind: null,
      };
    }

    const companyInput: CompanyBrainInput = {
      ...payload,
      companySnapshot: payload.companySnapshot,
      organizationId: brainInput.context.organizationId,
      projectId: brainInput.context.projectId,
      episodeId: brainInput.context.episodeId,
      locale: brainInput.context.locale,
    };

    const output = this.execute(companyInput);
    const meta = validateCompanyGraph(output.graph);

    if (!meta.valid) {
      return {
        brainId: "company",
        status: "failed",
        output: null,
        events: domainEvents(output, nl),
        confidence: { value: 0.3, label: "low" },
        durationMs: Date.now() - started,
        errorCode: "company_meta_failed",
        requiresApproval: false,
        approvalKind: null,
      };
    }

    const brainOutput: BrainOutput = {
      outputRef: output.outputRef,
      capabilityIds: ["company_understanding"],
      decisionIds: [],
      generatedAt: output.graph.createdAt,
    };

    return {
      brainId: "company",
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
  }
}

export function createCompanyBrainExecutor(): CompanyBrainExecutor {
  return new CompanyBrainExecutor();
}

/** ProjectBrainContract — Project Engine schedules; Company Brain owns organizational truth. */
export const companyBrainContract: ProjectBrainContract<CompanyBrainPayload, BrainOutput> = {
  id: "company",
  capabilityIds: ["company_understanding"],
  requiredContextSlices: ["business"],
  async execute(input) {
    return createCompanyBrainExecutor().executeFromContract(input);
  },
};

export function createFromBrainInputs(input: CompanyBrainInput): CompanyBrainOutput {
  return createCompanyBrainExecutor().execute(input);
}
