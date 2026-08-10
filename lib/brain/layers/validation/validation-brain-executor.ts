/**
 * Validation Brain Executor — evaluates Creative Brain output and returns BrainResult.
 * Implements ProjectBrainContract. Never creates or rewrites — only evaluates.
 */

import type {
  BrainEvent,
  BrainInput,
  BrainOutput,
  BrainResult,
  ProjectBrainContract,
} from "../../project-engine/brain-contract";
import type { ValidationBrainInput, ValidationBrainOutput, ValidationBrainPayload } from "./types";
import { ValidationLayer } from "./validation-layer";
import { validateValidationGraph } from "./validation-validator";
import type { PublicationReadiness } from "./types";

const DOMAIN_EVENT_TYPES = [
  "validation_business_fit",
  "validation_brand_consistency",
  "validation_tone_of_voice",
  "validation_audience_fit",
  "validation_positioning",
  "validation_differentiation",
  "validation_creative_quality",
  "validation_message_clarity",
  "validation_trust",
  "validation_objections",
  "validation_channel_linkedin",
  "validation_channel_google_ads",
  "validation_channel_email",
  "validation_channel_landing_page",
  "validation_channel_blog",
  "validation_cta_quality",
  "validation_conversion_potential",
  "validation_consistency",
  "validation_legal_claims",
] as const;

function confidenceValue(label: "low" | "medium" | "high"): number {
  return label === "high" ? 0.85 : label === "medium" ? 0.65 : 0.45;
}

function readinessRequiresApproval(readiness: PublicationReadiness): boolean {
  return readiness === "READY" || readiness === "READY_WITH_SUGGESTIONS";
}

function phaseEvents(output: ValidationBrainOutput, nl: boolean): BrainEvent[] {
  return output.graph.phases.map((phase, i) => ({
    id: `evt-val-${phase.domain}-${i}`,
    at: phase.completedAt,
    type: DOMAIN_EVENT_TYPES[i] ?? "validation_domain_completed",
    title: phase.summary,
    subtitle: phase.domain.replace(/_/g, " "),
    whyItMatters: nl
      ? "Emma beoordeelt kwaliteit voordat iets live gaat."
      : "Emma evaluates quality before anything goes live.",
  }));
}

/** Executes Validation Brain from assembled brain input. */
export class ValidationBrainExecutor {
  constructor(private readonly layer = new ValidationLayer()) {}

  execute(input: ValidationBrainInput): ValidationBrainOutput {
    const result = this.layer.produceAndStore(input);
    return {
      graph: result.graph,
      structuredOutput: result.structuredOutput,
      outputRef: result.outputRef,
    };
  }

  executeFromContract(brainInput: BrainInput<ValidationBrainPayload>): BrainResult<BrainOutput> {
    const started = Date.now();
    const nl = brainInput.context.locale === "nl";
    const payload = brainInput.payload ?? ({} as ValidationBrainPayload);

    if (!payload.creativeGraph) {
      return {
        brainId: "validation",
        status: "failed",
        output: null,
        events: [],
        confidence: null,
        durationMs: Date.now() - started,
        errorCode: "missing_creative_graph",
        requiresApproval: false,
        approvalKind: null,
      };
    }

    const validationInput: ValidationBrainInput = {
      ...payload,
      creativeGraph: payload.creativeGraph,
      organizationId: brainInput.context.organizationId,
      projectId: brainInput.context.projectId,
      episodeId: brainInput.context.episodeId,
      locale: brainInput.context.locale,
      priorDecisionIds: brainInput.context.priorDecisionIds,
      memoryRefs: brainInput.context.memoryRefs,
    };

    const output = this.execute(validationInput);
    const metaValidation = validateValidationGraph(output.graph);

    if (!metaValidation.valid) {
      return {
        brainId: "validation",
        status: "failed",
        output: null,
        events: phaseEvents(output, nl),
        confidence: { value: 0.3, label: "low" },
        durationMs: Date.now() - started,
        errorCode: "validation_meta_failed",
        requiresApproval: false,
        approvalKind: null,
      };
    }

    const readiness = output.graph.report.publicationReadiness;
    const blocked = readiness === "BLOCKED" || readiness === "CHANGES_REQUIRED";

    const brainOutput: BrainOutput = {
      outputRef: output.outputRef,
      capabilityIds: ["validation"],
      decisionIds: output.graph.report.approvedDeliverables.map((d) => d.id),
      generatedAt: output.graph.createdAt,
    };

    return {
      brainId: "validation",
      status: blocked ? "completed" : "completed",
      output: brainOutput,
      events: phaseEvents(output, nl),
      confidence: {
        value: confidenceValue(output.graph.confidence),
        label: output.graph.confidence,
      },
      durationMs: Date.now() - started,
      errorCode: blocked ? "validation_changes_required" : null,
      requiresApproval: readinessRequiresApproval(readiness),
      approvalKind: readinessRequiresApproval(readiness) ? "campaign_approval" : null,
    };
  }
}

export function createValidationBrainExecutor(): ValidationBrainExecutor {
  return new ValidationBrainExecutor();
}

/** ProjectBrainContract implementation — Project Engine schedules; Validation Brain evaluates. */
export const validationBrainContract: ProjectBrainContract<ValidationBrainPayload, BrainOutput> = {
  id: "validation",
  capabilityIds: ["validation"],
  requiredContextSlices: ["brand", "campaign"],
  async execute(input) {
    return createValidationBrainExecutor().executeFromContract(input);
  },
};

export function createFromBrainInputs(input: ValidationBrainInput): ValidationBrainOutput {
  return createValidationBrainExecutor().execute(input);
}
