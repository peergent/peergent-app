/**
 * Creative Brain Executor — runs seven thinking phases and returns BrainResult.
 * PX-64 — production path uses OpenAI via produceCreativeBrainGraph.
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
import { IntelligenceLlmUnavailableError } from "../../llm/intelligence-llm-errors";
import { appendCreativeLlmAuditEvent } from "../../project-runtime/creative-persistence-audit";

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

function fail(started: number, code: string): BrainResult<BrainOutput> {
  return {
    brainId: "creative",
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

/** Executes Creative Brain from assembled brain input. */
export class CreativeBrainExecutor {
  constructor(private readonly layer = new CreativeLayer()) {}

  execute(input: CreativeBrainInput): Promise<CreativeBrainOutput> {
    return this.layer.produceAndStore(input);
  }

  async executeFromContract(brainInput: BrainInput<CreativeBrainPayload>): Promise<BrainResult<BrainOutput>> {
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

    const hasUpstream =
      creativeInput.strategyGraph ||
      creativeInput.strategyBrainGraph ||
      creativeInput.campaignContext;

    if (!hasUpstream) {
      return fail(started, "missing_upstream_context");
    }

    try {
      const output = await this.execute(creativeInput);
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

      await appendCreativeLlmAuditEvent({
        correlationId: brainInput.context.episodeId ?? brainInput.context.projectId,
        payload: {
          organizationId: brainInput.context.organizationId,
          projectId: brainInput.context.projectId,
          episodeId: brainInput.context.episodeId,
          graphRef: output.outputRef,
          providerMeta: output.graph.providerMeta ?? null,
          durationMs: Date.now() - started,
        },
      });

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
    } catch (error) {
      if (error instanceof IntelligenceLlmUnavailableError) {
        return fail(started, error.code);
      }
      return fail(started, error instanceof Error ? error.message : "creative_failed");
    }
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

export function createFromBrainInputs(input: CreativeBrainInput): Promise<CreativeBrainOutput> {
  return createCreativeBrainExecutor().execute(input);
}
