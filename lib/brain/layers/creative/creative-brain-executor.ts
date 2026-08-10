/**
 * Creative Brain Executor — runs seven thinking phases and returns BrainResult.
 * First production Brain implementing ProjectBrainContract.
 */

import type {
  BrainEvent,
  BrainInput,
  BrainOutput,
  BrainResult,
  ProjectBrainContract,
} from "../../project-engine/brain-contract";
import type { CreativeBrainInput, CreativeBrainOutput } from "./types";
import { CreativeLayer } from "./creative-layer";
import { validateCreativeGraph } from "./creative-validator";

export type CreativeBrainPayload = CreativeBrainInput;

const PHASE_EVENT_TYPES = [
  "creative_business_understood",
  "creative_audience_understood",
  "creative_positioning_found",
  "creative_concepts_generated",
  "creative_messaging_generated",
  "creative_channels_planned",
  "creative_deliverables_specified",
] as const;

function confidenceValue(label: "low" | "medium" | "high"): number {
  return label === "high" ? 0.85 : label === "medium" ? 0.65 : 0.45;
}

function phaseEvents(output: CreativeBrainOutput, nl: boolean): BrainEvent[] {
  return output.graph.phases.map((phase, i) => ({
    id: `evt-${phase.phase}-${i}`,
    at: phase.completedAt,
    type: PHASE_EVENT_TYPES[i] ?? "creative_phase_completed",
    title: phase.summary,
    subtitle: phase.phase.replace(/_/g, " "),
    whyItMatters: nl
      ? "Creative Brain denkt stap voor stap — geen losse copy."
      : "Creative Brain thinks step by step — not disconnected copy.",
  }));
}

/** Executes Creative Brain from assembled brain input. */
export class CreativeBrainExecutor {
  constructor(private readonly layer = new CreativeLayer()) {}

  execute(input: CreativeBrainInput): CreativeBrainOutput {
    const result = this.layer.produceAndStore(input);
    return {
      graph: result.graph,
      structuredOutput: result.structuredOutput,
      outputRef: result.outputRef,
    };
  }

  executeFromContract(brainInput: BrainInput<CreativeBrainPayload>): BrainResult<BrainOutput> {
    const started = Date.now();
    const nl = brainInput.context.locale === "nl";
    const payload = brainInput.payload ?? ({} as CreativeBrainPayload);

    const creativeInput: CreativeBrainInput = {
      ...payload,
      organizationId: brainInput.context.organizationId,
      projectId: brainInput.context.projectId,
      episodeId: brainInput.context.episodeId,
      locale: brainInput.context.locale,
    };

    if (!creativeInput.strategyGraph && !creativeInput.campaignContext) {
      return {
        brainId: "creative",
        status: "failed",
        output: null,
        events: [],
        confidence: null,
        durationMs: Date.now() - started,
        errorCode: "missing_upstream_context",
        requiresApproval: false,
        approvalKind: null,
      };
    }

    const output = this.execute(creativeInput);
    const validation = validateCreativeGraph(output.graph);

    if (!validation.valid) {
      return {
        brainId: "creative",
        status: "failed",
        output: null,
        events: phaseEvents(output, nl),
        confidence: { value: 0.3, label: "low" },
        durationMs: Date.now() - started,
        errorCode: "creative_validation_failed",
        requiresApproval: false,
        approvalKind: null,
      };
    }

    const brainOutput: BrainOutput = {
      outputRef: output.outputRef,
      capabilityIds: ["creative_generation"],
      decisionIds: output.graph.decisions.map((d) => d.id),
      generatedAt: output.graph.createdAt,
    };

    return {
      brainId: "creative",
      status: "completed",
      output: brainOutput,
      events: phaseEvents(output, nl),
      confidence: {
        value: confidenceValue(output.graph.confidence),
        label: output.graph.confidence,
      },
      durationMs: Date.now() - started,
      errorCode: null,
      requiresApproval: true,
      approvalKind: "deliverable_review",
    };
  }
}

export function createCreativeBrainExecutor(): CreativeBrainExecutor {
  return new CreativeBrainExecutor();
}

/** ProjectBrainContract implementation — Project Engine schedules; Creative Brain executes. */
export const creativeBrainContract: ProjectBrainContract<CreativeBrainPayload, BrainOutput> = {
  id: "creative",
  capabilityIds: ["creative_generation"],
  requiredContextSlices: ["brand", "campaign"],
  async execute(input) {
    return createCreativeBrainExecutor().executeFromContract(input);
  },
};

export function createFromBrainInputs(input: CreativeBrainInput): CreativeBrainOutput {
  return createCreativeBrainExecutor().execute(input);
}
