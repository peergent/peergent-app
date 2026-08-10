/**
 * Memory Brain Executor — commits organizational memory and returns BrainResult.
 * Implements ProjectBrainContract. Never generates, validates, or optimizes.
 */

import type {
  BrainEvent,
  BrainInput,
  BrainOutput,
  BrainResult,
  ProjectBrainContract,
} from "../../project-engine/brain-contract";
import type { MemoryBrainInput, MemoryBrainOutput, MemoryBrainPayload } from "./types";
import { MemoryLayer } from "./memory-layer";
import { validateMemoryGraph } from "./memory-validator";

const DOMAIN_EVENT_TYPES = [
  "memory_business",
  "memory_brand",
  "memory_audience",
  "memory_competitive",
  "memory_creative",
  "memory_validation",
  "memory_execution",
  "memory_performance",
  "memory_learning",
] as const;

function confidenceValue(label: "low" | "medium" | "high"): number {
  return label === "high" ? 0.85 : label === "medium" ? 0.65 : 0.45;
}

function nodeEvents(output: MemoryBrainOutput, nl: boolean): BrainEvent[] {
  return output.graph.nodes.map((node, i) => ({
    id: `evt-mem-${node.domain}-${i}`,
    at: output.graph.createdAt,
    type: DOMAIN_EVENT_TYPES[i] ?? "memory_domain_completed",
    title: node.label,
    subtitle: nl
      ? `${node.memoryIds.length} herinneringen opgeslagen`
      : `${node.memoryIds.length} memories stored`,
    whyItMatters: nl
      ? "Organisatiekennis groeit — toekomstige campagnes worden slimmer."
      : "Organizational knowledge grows — future campaigns get smarter.",
  }));
}

/** Executes Memory Brain from assembled brain input. */
export class MemoryBrainExecutor {
  constructor(private readonly layer = new MemoryLayer()) {}

  execute(input: MemoryBrainInput): MemoryBrainOutput {
    const result = this.layer.produceAndStore(input);
    return {
      graph: result.graph,
      structuredOutput: result.structuredOutput,
      outputRef: result.outputRef,
    };
  }

  executeFromContract(brainInput: BrainInput<MemoryBrainPayload>): BrainResult<BrainOutput> {
    const started = Date.now();
    const nl = brainInput.context.locale === "nl";
    const payload = brainInput.payload ?? ({} as MemoryBrainPayload);

    const hasSource =
      payload.creativeGraph ||
      payload.validationGraph ||
      payload.strategyGraph ||
      payload.approvalGranted;

    if (!hasSource) {
      return {
        brainId: "memory",
        status: "failed",
        output: null,
        events: [],
        confidence: null,
        durationMs: Date.now() - started,
        errorCode: "missing_memory_source",
        requiresApproval: false,
        approvalKind: null,
      };
    }

    const memoryInput: MemoryBrainInput = {
      ...payload,
      organizationId: brainInput.context.organizationId,
      projectId: brainInput.context.projectId,
      episodeId: brainInput.context.episodeId,
      locale: brainInput.context.locale,
      approvalDecisionIds: brainInput.context.priorDecisionIds,
    };

    const output = this.execute(memoryInput);
    const metaValidation = validateMemoryGraph(output.graph);

    if (!metaValidation.valid) {
      return {
        brainId: "memory",
        status: "failed",
        output: null,
        events: nodeEvents(output, nl),
        confidence: { value: 0.3, label: "low" },
        durationMs: Date.now() - started,
        errorCode: "memory_meta_failed",
        requiresApproval: false,
        approvalKind: null,
      };
    }

    const brainOutput: BrainOutput = {
      outputRef: output.outputRef,
      capabilityIds: ["memory"],
      decisionIds: output.graph.decisions.map((d) => d.id),
      generatedAt: output.graph.createdAt,
    };

    return {
      brainId: "memory",
      status: "completed",
      output: brainOutput,
      events: nodeEvents(output, nl),
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

export function createMemoryBrainExecutor(): MemoryBrainExecutor {
  return new MemoryBrainExecutor();
}

/** ProjectBrainContract implementation — Project Engine schedules; Memory Brain remembers. */
export const memoryBrainContract: ProjectBrainContract<MemoryBrainPayload, BrainOutput> = {
  id: "memory",
  capabilityIds: ["memory"],
  requiredContextSlices: ["business"],
  async execute(input) {
    return createMemoryBrainExecutor().executeFromContract(input);
  },
};

export function createFromBrainInputs(input: MemoryBrainInput): MemoryBrainOutput {
  return createMemoryBrainExecutor().execute(input);
}
