import type { BrandConceptDomain, BrandConceptId, BrandFact, BrandGraph, BrandKnowledgeStatus } from "./types";
import { getBrandConceptDefinition, listBrandConceptsByDomain } from "./brand-concepts";
import { queryBrandFactsByConcept, queryBrandFactsByStatus } from "./build-brand-graph";

/** Consumer Brains that may read Brand Brain through the boundary — never internal graphs. */
export type BrandBrainConsumer = "creative" | "validation" | "pixel" | "performance";

/** Safe, read-only brand fact exposed to consumer Brains. */
export type BrandBoundaryFact = {
  readonly concept: BrandConceptId;
  readonly label: string;
  readonly value: string;
  readonly knowledgeStatus: BrandKnowledgeStatus;
  readonly confidence: number;
};

/** Safe Brand Brain snapshot — no internal observation IDs or repository keys. */
export type BrandBrainSnapshot = {
  readonly version: string;
  readonly organizationId: string;
  readonly campaignId?: string;
  readonly collectedAt: string;
  readonly facts: readonly BrandBoundaryFact[];
  readonly knownConceptCount: number;
  readonly unknownConceptCount: number;
};

const CONSUMER_CONCEPT_ACCESS: Readonly<Record<BrandBrainConsumer, readonly BrandConceptDomain[]>> = {
  creative: ["foundation", "voice", "channel_styles"],
  validation: ["foundation", "voice", "visual", "components", "channel_styles", "governance"],
  pixel: ["visual", "components"],
  performance: ["foundation", "voice", "channel_styles", "governance"],
};

function toBoundaryFact(fact: BrandFact): BrandBoundaryFact {
  return {
    concept: fact.concept,
    label: fact.label,
    value: fact.value,
    knowledgeStatus: fact.knowledgeStatus,
    confidence: fact.confidence,
  };
}

function factsForConsumer(graph: BrandGraph, consumer: BrandBrainConsumer): readonly BrandBoundaryFact[] {
  const allowedDomains = new Set(CONSUMER_CONCEPT_ACCESS[consumer]);
  return graph.model.facts
    .filter((fact) => allowedDomains.has(getBrandConceptDefinition(fact.concept).domain))
    .map(toBoundaryFact);
}

/**
 * Brand Boundary — exposes Brand Brain safely to other Brains.
 * Hides internal research observations, repository keys, and module implementation.
 */
export class BrandBoundary {
  constructor(private readonly graph: BrandGraph) {}

  /** Full safe snapshot for diagnostics — still hides internal implementation. */
  toSnapshot(): BrandBrainSnapshot {
    const facts = this.graph.model.facts.map(toBoundaryFact);
    return {
      version: this.graph.version,
      organizationId: this.graph.organizationId,
      campaignId: this.graph.campaignId,
      collectedAt: this.graph.collectedAt,
      facts,
      knownConceptCount: facts.filter((f) => f.knowledgeStatus !== "unknown").length,
      unknownConceptCount: facts.filter((f) => f.knowledgeStatus === "unknown").length,
    };
  }

  /** Consumer-scoped read — Creative, Validation, Pixel, Performance. */
  forConsumer(consumer: BrandBrainConsumer): readonly BrandBoundaryFact[] {
    return factsForConsumer(this.graph, consumer);
  }

  getConcept(concept: BrandConceptId): BrandBoundaryFact | null {
    const fact = queryBrandFactsByConcept(this.graph, concept)[0];
    return fact ? toBoundaryFact(fact) : null;
  }

  listKnownConcepts(): readonly BrandConceptId[] {
    return this.graph.model.facts
      .filter((f) => f.knowledgeStatus !== "unknown")
      .map((f) => f.concept);
  }

  listUnknownConcepts(): readonly BrandConceptId[] {
    return queryBrandFactsByStatus(this.graph, "unknown").map((f) => f.concept);
  }

  listConceptsByDomain(domain: BrandConceptDomain): readonly BrandBoundaryFact[] {
    const conceptIds = new Set(listBrandConceptsByDomain(domain).map((c) => c.id));
    return this.graph.model.facts
      .filter((f) => conceptIds.has(f.concept))
      .map(toBoundaryFact);
  }

  hasSufficientKnowledgeFor(consumer: BrandBrainConsumer): boolean {
    const facts = factsForConsumer(this.graph, consumer);
    const known = facts.filter((f) => f.knowledgeStatus !== "unknown");
    return known.length > 0;
  }
}

export function createBrandBoundary(graph: BrandGraph): BrandBoundary {
  return new BrandBoundary(graph);
}

export function exposeBrandBrainToConsumer(
  graph: BrandGraph,
  consumer: BrandBrainConsumer
): BrandBrainSnapshot {
  const boundary = createBrandBoundary(graph);
  return {
    ...boundary.toSnapshot(),
    facts: boundary.forConsumer(consumer),
  };
}
