import type { BrandResearchGraph } from "./types";
import type {
  BrandConceptId,
  BrandFact,
  BrandGraph,
  BrandKnowledgeStatus,
  BrandModel,
} from "./types";
import { BRAND_LAYER_VERSION, emptyBrandGraph } from "./types";
import { ALL_BRAND_CONCEPT_IDS, getBrandConceptDefinition } from "./brand-concepts";
import { clampBrandConfidence } from "./evidence";

export type BuildBrandGraphInput = {
  readonly researchGraph: BrandResearchGraph;
  readonly collectedAt?: string;
};

let factCounter = 0;

export function resetBrandFactCounter(): void {
  factCounter = 0;
}

function createBrandFact(input: {
  concept: BrandConceptId;
  label: string;
  value: string;
  knowledgeStatus: BrandKnowledgeStatus;
  confidence: number;
  supportingObservationIds: readonly string[];
  collectedAt: string;
}): BrandFact {
  factCounter += 1;
  return {
    id: `brand-fact-${factCounter}`,
    concept: input.concept,
    label: input.label,
    value: input.value,
    knowledgeStatus: input.knowledgeStatus,
    confidence: clampBrandConfidence(input.confidence),
    supportingObservationIds: input.supportingObservationIds,
    collectedAt: input.collectedAt,
    version: BRAND_LAYER_VERSION,
  };
}

function buildFactsForConcept(
  concept: BrandConceptId,
  research: BrandResearchGraph,
  collectedAt: string
): BrandFact {
  const definition = getBrandConceptDefinition(concept);
  const observations = research.observations.filter((o) => o.concept === concept);
  const unknown = research.unknowns.find((u) => u.concept === concept);

  if (observations.length === 0) {
    return createBrandFact({
      concept,
      label: definition.label,
      value: unknown?.reason ?? "Unknown",
      knowledgeStatus: "unknown",
      confidence: 0,
      supportingObservationIds: [],
      collectedAt,
    });
  }

  const primary = observations.reduce((best, current) =>
    current.confidence > best.confidence ? current : best
  );

  return createBrandFact({
    concept,
    label: definition.label,
    value: observations.map((o) => o.evidence).join(" · "),
    knowledgeStatus: "observed",
    confidence: averageConfidence(observations.map((o) => o.confidence)),
    supportingObservationIds: observations.map((o) => o.id),
    collectedAt,
  });
}

function averageConfidence(scores: readonly number[]): number {
  if (scores.length === 0) return 0;
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

/**
 * Build Brand Model from research evidence.
 * Maps observations to structured facts — distinguishes observed vs unknown.
 * Does not invent brand truth; inferred/validated/assumed reserved for future layers.
 */
export function buildBrandModel(research: BrandResearchGraph, collectedAt?: string): BrandModel {
  const at = collectedAt ?? research.collectedAt;
  const facts = ALL_BRAND_CONCEPT_IDS.map((concept) =>
    buildFactsForConcept(concept, research, at)
  );
  return {
    version: BRAND_LAYER_VERSION,
    facts,
  };
}

/**
 * Build complete Brand Graph — research + model.
 */
export function buildBrandGraph(input: BuildBrandGraphInput): BrandGraph {
  const collectedAt = input.collectedAt ?? input.researchGraph.collectedAt;
  const model = buildBrandModel(input.researchGraph, collectedAt);

  return {
    version: BRAND_LAYER_VERSION,
    organizationId: input.researchGraph.organizationId,
    campaignId: input.researchGraph.campaignId,
    collectedAt,
    research: input.researchGraph,
    model,
  };
}

export function brandGraphFromParts(input: {
  researchGraph: BrandResearchGraph;
  model?: BrandModel;
  collectedAt?: string;
}): BrandGraph {
  const base = emptyBrandGraph({
    organizationId: input.researchGraph.organizationId,
    campaignId: input.researchGraph.campaignId,
    collectedAt: input.collectedAt ?? input.researchGraph.collectedAt,
  });
  const model = input.model ?? buildBrandModel(input.researchGraph, base.collectedAt);
  return {
    ...base,
    research: input.researchGraph,
    model,
  };
}

export function brandModelHasConfidence(graph: BrandGraph): boolean {
  return graph.model.facts.every((fact) => fact.knowledgeStatus === "unknown" || fact.confidence >= 0);
}

export function queryBrandFactsByConcept(
  graph: BrandGraph,
  concept: BrandConceptId
): readonly BrandFact[] {
  return graph.model.facts.filter((f) => f.concept === concept);
}

export function queryBrandFactsByStatus(
  graph: BrandGraph,
  status: BrandKnowledgeStatus
): readonly BrandFact[] {
  return graph.model.facts.filter((f) => f.knowledgeStatus === status);
}
