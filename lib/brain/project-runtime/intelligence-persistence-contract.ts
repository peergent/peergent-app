/**
 * PX-63D — canonical persistence contract for production intelligence brains.
 */

import type { ProjectBrainId } from "../project-engine/types";
import type { IntelligenceProviderMetadata } from "../llm/intelligence-provider-metadata";
import type { ReasoningBrainGraph } from "../layers/reasoning/brain-types";
import type { MarketingIntelligenceBrainGraph } from "../layers/marketing-intelligence/brain-types";
import type { StrategyBrainGraph } from "../layers/strategy/brain-types";
import type { ResearchBrainGraph } from "../layers/research/brain-types";
import { resolveBrainEnvironment, resolveIntelligenceLlmPolicy } from "../llm/intelligence-provider-policy";

export const INTELLIGENCE_PERSISTENCE_BRAIN_IDS = [
  "research",
  "reasoning",
  "marketing_intelligence",
  "strategy",
] as const satisfies readonly ProjectBrainId[];

export type IntelligencePersistenceBrainId = (typeof INTELLIGENCE_PERSISTENCE_BRAIN_IDS)[number];

export type IntelligenceGraphByBrainId = {
  research: ResearchBrainGraph;
  reasoning: ReasoningBrainGraph;
  marketing_intelligence: MarketingIntelligenceBrainGraph;
  strategy: StrategyBrainGraph;
};

export type IntelligencePersistenceViolation = {
  readonly code:
    | "missing_graph"
    | "missing_provider_meta"
    | "missing_output_ref"
    | "invalid_provider_mode"
    | "fallback_used_in_production"
    | "missing_graph_ref";
  readonly message: string;
  readonly brainId: IntelligencePersistenceBrainId;
};

export type IntelligenceLayerDocumentKind =
  | "research_snapshot"
  | "reasoning_snapshot"
  | "mi_snapshot"
  | "strategy_snapshot";

export const INTELLIGENCE_LAYER_DOCUMENT_KIND: Record<
  IntelligencePersistenceBrainId,
  IntelligenceLayerDocumentKind
> = {
  research: "research_snapshot",
  reasoning: "reasoning_snapshot",
  marketing_intelligence: "mi_snapshot",
  strategy: "strategy_snapshot",
};

export function intelligenceProviderMetaFromGraph(
  brainId: IntelligencePersistenceBrainId,
  graph: IntelligenceGraphByBrainId[IntelligencePersistenceBrainId]
): IntelligenceProviderMetadata | null {
  if (brainId === "research") {
    const research = graph as ResearchBrainGraph;
    const providerId = research.summary.providerId ?? "external_web_fetch";
    const fallbackUsed = research.summary.fallbackUsed ?? false;
    return {
      providerMode: fallbackUsed ? "deterministic_fallback" : "live_llm",
      fallbackUsed,
      providerId,
      modelId: undefined,
      generatedAt: research.updatedAt,
      inputEvidenceCount: research.evidence.length,
    };
  }

  const withMeta = graph as
    | ReasoningBrainGraph
    | MarketingIntelligenceBrainGraph
    | StrategyBrainGraph;
  return withMeta.providerMeta ?? null;
}

export function validateIntelligencePersistenceContract(input: {
  brainId: IntelligencePersistenceBrainId;
  graph: IntelligenceGraphByBrainId[IntelligencePersistenceBrainId] | null;
  outputRef: string | null;
  peerId?: string;
  environment?: "live" | "demo" | "test";
}): IntelligencePersistenceViolation[] {
  const violations: IntelligencePersistenceViolation[] = [];
  const env = resolveBrainEnvironment({ peerId: input.peerId, environment: input.environment });

  if (!input.graph) {
    violations.push({
      code: "missing_graph",
      message: `${input.brainId} completed without a canonical graph.`,
      brainId: input.brainId,
    });
    return violations;
  }

  if (!input.outputRef?.trim()) {
    violations.push({
      code: "missing_output_ref",
      message: `${input.brainId} completed without an output ref.`,
      brainId: input.brainId,
    });
  }

  if (input.brainId === "research") {
    return violations;
  }

  const meta = intelligenceProviderMetaFromGraph(input.brainId, input.graph);
  if (!meta) {
    violations.push({
      code: "missing_provider_meta",
      message: `${input.brainId} graph missing providerMeta.`,
      brainId: input.brainId,
    });
    return violations;
  }

  if (env === "live") {
    const policy = resolveIntelligenceLlmPolicy({ peerId: input.peerId, environment: env });
    if (policy.mode === "live_llm") {
      if (meta.providerMode !== "live_llm") {
        violations.push({
          code: "invalid_provider_mode",
          message: `${input.brainId} expected live_llm in production, got ${meta.providerMode}.`,
          brainId: input.brainId,
        });
      }
      if (meta.fallbackUsed) {
        violations.push({
          code: "fallback_used_in_production",
          message: `${input.brainId} used deterministic fallback in production.`,
          brainId: input.brainId,
        });
      }
    }
  }

  return violations;
}

export function assertIntelligencePersistenceContract(input: {
  brainId: IntelligencePersistenceBrainId;
  graph: IntelligenceGraphByBrainId[IntelligencePersistenceBrainId] | null;
  outputRef: string | null;
  peerId?: string;
  environment?: "live" | "demo" | "test";
}): void {
  const violations = validateIntelligencePersistenceContract(input);
  if (violations.length > 0) {
    throw new IntelligencePersistenceContractError(violations);
  }
}

export class IntelligencePersistenceContractError extends Error {
  readonly code = "intelligence_persistence_contract_violation";

  constructor(readonly violations: readonly IntelligencePersistenceViolation[]) {
    super(
      violations.map((v) => `${v.brainId}:${v.code}`).join("; ") ||
        "intelligence_persistence_contract_violation"
    );
    this.name = "IntelligencePersistenceContractError";
  }
}

export function attachIntelligenceGraphToResolvedGraphs(
  resolved: import("./types").ProjectEpisodeRecord["resolvedGraphs"],
  brainId: IntelligencePersistenceBrainId,
  graph: IntelligenceGraphByBrainId[IntelligencePersistenceBrainId]
): import("./types").ProjectEpisodeRecord["resolvedGraphs"] {
  switch (brainId) {
    case "research":
      return { ...resolved, researchBrainGraph: graph as ResearchBrainGraph };
    case "reasoning":
      return { ...resolved, reasoningBrainGraph: graph as ReasoningBrainGraph };
    case "marketing_intelligence":
      return {
        ...resolved,
        marketingIntelligenceBrainGraph: graph as MarketingIntelligenceBrainGraph,
      };
    case "strategy":
      return { ...resolved, strategyBrainGraph: graph as StrategyBrainGraph };
    default:
      return resolved;
  }
}
