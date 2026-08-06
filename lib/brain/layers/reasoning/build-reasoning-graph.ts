import type { ResearchEvidence, ResearchGraph, ResearchUnknown } from "../research/types";
import { RESEARCH_CONFIDENCE } from "../research/types";
import { deriveReasoningConfidence, confidenceFromSingleEvidence } from "./confidence-engine";
import { createReasoningNode } from "./reasoning-node";
import type {
  ReasoningAssumption,
  ReasoningConstraint,
  ReasoningContradiction,
  ReasoningGraph,
  ReasoningHypothesis,
  ReasoningNode,
  ReasoningOpportunity,
  ReasoningPattern,
  ReasoningPriorityInsight,
  ReasoningRisk,
  ReasoningTheme,
  ReasoningUnknown,
} from "./types";
import { emptyReasoningGraph } from "./types";

export type BuildReasoningGraphInput = {
  researchGraph: ResearchGraph;
  createdAt?: string;
};

function evidenceIds(items: readonly ResearchEvidence[]): string[] {
  return items.map((e) => e.id);
}

function findEvidence(
  graph: ResearchGraph,
  predicate: (e: ResearchEvidence) => boolean
): ResearchEvidence | undefined {
  const all = [
    ...graph.company,
    ...graph.website,
    ...graph.products,
    ...graph.services,
    ...graph.audience,
    ...graph.brand,
    ...graph.competitors,
  ];
  return all.find(predicate);
}

function allEvidence(graph: ResearchGraph): ResearchEvidence[] {
  return [
    ...graph.company,
    ...graph.website,
    ...graph.products,
    ...graph.services,
    ...graph.audience,
    ...graph.brand,
    ...graph.competitors,
    ...graph.seo,
    ...graph.market,
    ...graph.offer,
    ...graph.strengths.flatMap((s) => s.evidence),
    ...graph.weaknesses.flatMap((s) => s.evidence),
    ...graph.opportunities.flatMap((s) => s.evidence),
    ...graph.risks.flatMap((s) => s.evidence),
  ];
}

function buildBusinessModel(graph: ResearchGraph, createdAt: string): ReasoningNode[] {
  const nodes: ReasoningNode[] = [];
  const positioning = findEvidence(graph, (e) => /position/i.test(e.title));
  const products = graph.products;
  const services = graph.services;
  const companyName = findEvidence(graph, (e) => /company name/i.test(e.title));

  const sellEvidence = [...products, ...services];
  if (sellEvidence.length > 0) {
    nodes.push(
      createReasoningNode({
        id: "business:what-is-sold",
        title: "What the company sells",
        description: sellEvidence.map((e) => e.description).join("; "),
        confidence: deriveReasoningConfidence({ evidence: sellEvidence }),
        supportingEvidence: evidenceIds(sellEvidence),
        createdAt,
      })
    );
  }

  if (graph.audience.length > 0) {
    nodes.push(
      createReasoningNode({
        id: "business:who-buys",
        title: "Who buys",
        description: graph.audience.map((e) => e.description).join("; "),
        confidence: deriveReasoningConfidence({ evidence: graph.audience }),
        supportingEvidence: evidenceIds(graph.audience),
        createdAt,
      })
    );
  } else {
    nodes.push(
      createReasoningNode({
        id: "business:who-buys-unknown",
        title: "Who buys",
        description: "Unknown — no confirmed target audience in research.",
        confidence: RESEARCH_CONFIDENCE.missing,
        relatedResearch: graph.unknowns.filter((u) => /audience/i.test(u.title)).map((u) => u.id),
        createdAt,
      })
    );
  }

  if (positioning) {
    nodes.push(
      createReasoningNode({
        id: "business:differentiation",
        title: "Differentiation",
        description: positioning.description,
        confidence: confidenceFromSingleEvidence(positioning),
        supportingEvidence: [positioning.id],
        createdAt,
      })
    );
  }

  if (companyName) {
    nodes.push(
      createReasoningNode({
        id: "business:identity",
        title: "Company identity",
        description: companyName.description,
        confidence: confidenceFromSingleEvidence(companyName),
        supportingEvidence: [companyName.id],
        createdAt,
      })
    );
  }

  return nodes;
}

type MarketPositionLabel =
  | "Premium"
  | "Budget"
  | "Specialist"
  | "Generalist"
  | "Innovator"
  | "Local player"
  | "Market leader"
  | "Emerging"
  | "Unknown";

function inferMarketPosition(graph: ResearchGraph, createdAt: string): ReasoningNode[] {
  const positioning = findEvidence(graph, (e) => /position/i.test(e.title));
  const text = [
    positioning?.description ?? "",
    ...graph.website.map((e) => e.description),
    ...graph.brand.map((e) => e.description),
  ]
    .join(" ")
    .toLowerCase();

  const labels: MarketPositionLabel[] = [];
  if (/premium|high-end|luxury|enterprise|professional/i.test(text)) labels.push("Premium");
  if (/affordable|budget|cheap|low-cost|free/i.test(text)) labels.push("Budget");
  if (/specialist|niche|expert|focused/i.test(text)) labels.push("Specialist");
  if (/platform|all-in-one|suite|general/i.test(text)) labels.push("Generalist");
  if (/innovat|ai|cutting-edge|next-gen/i.test(text)) labels.push("Innovator");
  if (/local|regional|community|nearby/i.test(text)) labels.push("Local player");
  if (/leader|leading|#1|market leader/i.test(text)) labels.push("Market leader");
  if (/emerging|startup|new|early-stage/i.test(text)) labels.push("Emerging");

  if (labels.length === 0) {
    return [
      createReasoningNode({
        id: "market-position:unknown",
        title: "Market position",
        description: "Unknown — insufficient evidence to infer market position.",
        confidence: RESEARCH_CONFIDENCE.missing,
        relatedResearch: graph.unknowns.map((u) => u.id),
        createdAt,
      }),
    ];
  }

  const evidence = positioning ? [positioning] : graph.website.slice(0, 3);
  return labels.map((label, i) =>
    createReasoningNode({
      id: `market-position:${label.toLowerCase().replace(/\s+/g, "-")}`,
      title: label,
      description: positioning
        ? `This business reads as ${label.toLowerCase()} in the market: ${positioning.description}`
        : `Website and profile language suggest a ${label.toLowerCase()} role — confirm with customers before scaling spend.`,
      confidence: deriveReasoningConfidence({ evidence, minEvidenceCount: 1 }),
      supportingEvidence: evidenceIds(evidence),
      createdAt,
    })
  );
}

function buildCustomerModel(graph: ResearchGraph, createdAt: string): ReasoningNode[] {
  if (graph.audience.length === 0) {
    return [
      createReasoningNode({
        id: "customer:icp-unknown",
        title: "ICP",
        description: "Unknown — no confirmed ideal customer profile.",
        confidence: RESEARCH_CONFIDENCE.missing,
        relatedResearch: graph.unknowns.filter((u) => /audience/i.test(u.title)).map((u) => u.id),
        createdAt,
      }),
    ];
  }

  return [
    createReasoningNode({
      id: "customer:icp",
      title: "ICP",
      description: graph.audience.map((e) => e.description).join("; "),
      confidence: deriveReasoningConfidence({ evidence: graph.audience }),
      supportingEvidence: evidenceIds(graph.audience),
      createdAt,
    }),
  ];
}

function buildCompetitiveLandscape(graph: ResearchGraph, createdAt: string): ReasoningNode[] {
  if (graph.competitors.length === 0) {
    return [
      createReasoningNode({
        id: "competitive:unknown",
        title: "Competitive landscape",
        description: "Unknown — no competitors supplied in research.",
        confidence: RESEARCH_CONFIDENCE.missing,
        relatedResearch: graph.unknowns.map((u) => u.id),
        createdAt,
      }),
    ];
  }

  return graph.competitors.map((c, i) =>
    createReasoningNode({
      id: `competitive:competitor-${i + 1}`,
      title: "Known competitor",
      description: c.description,
      confidence: confidenceFromSingleEvidence(c),
      supportingEvidence: [c.id],
      createdAt,
    })
  );
}

function swotToNodes(
  items: ResearchGraph["strengths"],
  prefix: string,
  createdAt: string
): ReasoningNode[] {
  return items.map((item, i) => {
    const ids = evidenceIds(item.evidence);
    return createReasoningNode({
      id: `${prefix}:${i + 1}`,
      title: item.label,
      description: item.evidence.map((e) => e.description).join(" "),
      confidence: deriveReasoningConfidence({ evidence: item.evidence }),
      supportingEvidence: ids,
      createdAt,
    });
  });
}

function buildOpportunities(graph: ResearchGraph, createdAt: string): ReasoningOpportunity[] {
  return graph.opportunities.map((opp, i) => ({
    ...createReasoningNode({
      id: `opportunity:${i + 1}`,
      title: opp.label,
      description: `Identified opportunity: ${opp.label}. Not an action recommendation.`,
      confidence: deriveReasoningConfidence({ evidence: opp.evidence }),
      supportingEvidence: evidenceIds(opp.evidence),
      createdAt,
    }),
    opportunityType: "research_derived",
  }));
}

function buildRisks(graph: ResearchGraph, createdAt: string): ReasoningRisk[] {
  const risks: ReasoningRisk[] = graph.risks.map((risk, i) => ({
    ...createReasoningNode({
      id: `risk:research-${i + 1}`,
      title: risk.label,
      description: risk.evidence.map((e) => e.description).join(" "),
      confidence: deriveReasoningConfidence({ evidence: risk.evidence }),
      supportingEvidence: evidenceIds(risk.evidence),
      createdAt,
    }),
    severity: "medium" as const,
  }));

  for (const unknown of graph.unknowns) {
    if (/pricing/i.test(unknown.title)) {
      risks.push({
        ...createReasoningNode({
          id: "risk:no-pricing",
          title: "No pricing visibility",
          description: "Public pricing is not visible — conversion messaging should avoid price-led claims until confirmed.",
          confidence: RESEARCH_CONFIDENCE.missing,
          relatedResearch: [unknown.id],
          createdAt,
        }),
        severity: "medium",
      });
    }
  }

  if (graph.competitors.length >= 3) {
    risks.push({
      ...createReasoningNode({
        id: "risk:competitive-density",
        title: "Strong competitive field",
        description: `${graph.competitors.length} competitors identified — differentiation pressure likely.`,
        confidence: deriveReasoningConfidence({ evidence: graph.competitors }),
        supportingEvidence: evidenceIds(graph.competitors),
        createdAt,
      }),
      severity: "high",
    });
  }

  return risks;
}

function buildUnknowns(graph: ResearchGraph, createdAt: string): ReasoningUnknown[] {
  return graph.unknowns.map((u: ResearchUnknown) => ({
    ...createReasoningNode({
      id: `reasoning-unknown:${u.id}`,
      title: u.title,
      description: u.reason,
      confidence: RESEARCH_CONFIDENCE.missing,
      relatedResearch: [u.id],
      createdAt,
    }),
    reason: u.reason,
  }));
}

function buildConstraints(graph: ResearchGraph, createdAt: string): ReasoningConstraint[] {
  const constraints: ReasoningConstraint[] = [];

  for (const unknown of graph.unknowns) {
    constraints.push({
      ...createReasoningNode({
        id: `constraint:${unknown.id}`,
        title: unknown.title,
        description: `Constraint: ${unknown.title} is unknown — Strategy must not assume a value.`,
        confidence: RESEARCH_CONFIDENCE.missing,
        relatedResearch: [unknown.id],
        createdAt,
      }),
      constraintType: "unknown_field",
    });
  }

  if (graph.products.length <= 1) {
    const productEvidence = graph.products;
    constraints.push({
      ...createReasoningNode({
        id: "constraint:limited-catalog",
        title: "Limited product catalog",
        description: "Few or no products identified — offer scope may be narrow.",
        confidence: productEvidence.length
          ? deriveReasoningConfidence({ evidence: productEvidence })
          : RESEARCH_CONFIDENCE.weakInference,
        supportingEvidence: evidenceIds(productEvidence),
        createdAt,
      }),
      constraintType: "catalog_scope",
    });
  }

  return constraints;
}

function buildAssumptions(graph: ResearchGraph, createdAt: string): ReasoningAssumption[] {
  const weak = allEvidence(graph).filter(
    (e) => e.confidence <= RESEARCH_CONFIDENCE.weakInference && e.confidence > RESEARCH_CONFIDENCE.missing
  );

  return weak.map((e, i) => ({
    ...createReasoningNode({
      id: `assumption:${i + 1}`,
      title: e.title,
      description: `Low-confidence signal treated as assumption, not fact: ${e.description}`,
      confidence: e.confidence,
      supportingEvidence: [e.id],
      createdAt,
    }),
    basedOnConfidence: e.confidence,
  }));
}

function detectContradictions(graph: ResearchGraph, createdAt: string): ReasoningContradiction[] {
  const contradictions: ReasoningContradiction[] = [];
  const evidence = allEvidence(graph);

  const premium = evidence.find((e) => /premium|high-end|luxury/i.test(e.description));
  const budget = evidence.find((e) => /cheap|budget|affordable|low-cost/i.test(e.description));

  if (premium && budget) {
    contradictions.push({
      ...createReasoningNode({
        id: "contradiction:premium-vs-budget",
        title: "Premium vs budget positioning",
        description: `"${premium.description.slice(0, 60)}…" conflicts with "${budget.description.slice(0, 60)}…". Confidence reduced.`,
        confidence: Math.min(premium.confidence, budget.confidence) * 0.5,
        supportingEvidence: [premium.id, budget.id],
        createdAt,
      }),
      evidenceA: premium.id,
      evidenceB: budget.id,
      resolutionStatus: "unresolved",
    });
  }

  return contradictions;
}

function detectPatterns(graph: ResearchGraph, createdAt: string): ReasoningPattern[] {
  const patterns: ReasoningPattern[] = [];
  const text = allEvidence(graph)
    .map((e) => e.description)
    .join(" ")
    .toLowerCase();

  const premiumSignals = allEvidence(graph).filter((e) =>
    /premium|quality|craft|professional|enterprise/i.test(e.description)
  );
  if (premiumSignals.length >= 2) {
    patterns.push({
      ...createReasoningNode({
        id: "pattern:premium-positioning",
        title: "Premium positioning pattern",
        description: "Multiple signals suggest premium or quality-focused positioning.",
        confidence: deriveReasoningConfidence({ evidence: premiumSignals }),
        supportingEvidence: evidenceIds(premiumSignals),
        createdAt,
      }),
      patternType: "positioning",
      signalSummary: premiumSignals.map((e) => e.title).join(", "),
    });
  }

  if (/trust|review|rating|testimonial|certified/i.test(text)) {
    const trustEvidence = allEvidence(graph).filter((e) =>
      /trust|review|rating|testimonial|certified/i.test(e.description)
    );
    if (trustEvidence.length > 0) {
      patterns.push({
        ...createReasoningNode({
          id: "pattern:trust-signals",
          title: "Trust pattern",
          description: "Trust or social proof signals detected across evidence.",
          confidence: deriveReasoningConfidence({ evidence: trustEvidence }),
          supportingEvidence: evidenceIds(trustEvidence),
          createdAt,
        }),
        patternType: "trust",
        signalSummary: "Trust-related language in research evidence",
      });
    }
  }

  return patterns;
}

const THEME_KEYWORDS: Record<string, RegExp> = {
  Trust: /trust|reliable|secure|proven/i,
  Premium: /premium|quality|craft|professional/i,
  "Local authority": /local|community|regional|nearby/i,
  Education: /learn|guide|education|how-to|insight/i,
  Speed: /fast|quick|instant|efficient|speed/i,
  Innovation: /innovat|ai|cutting-edge|future|next-gen/i,
  Sustainability: /sustain|green|eco|environment/i,
};

function buildStrategicThemes(graph: ResearchGraph, createdAt: string): ReasoningTheme[] {
  const text = allEvidence(graph)
    .map((e) => e.description)
    .join(" ");

  return Object.entries(THEME_KEYWORDS)
    .filter(([, re]) => re.test(text))
    .map(([theme]) => {
      const matching = allEvidence(graph).filter((e) => THEME_KEYWORDS[theme]!.test(e.description));
      return {
        ...createReasoningNode({
          id: `theme:${theme.toLowerCase().replace(/\s+/g, "-")}`,
          title: theme,
          description: matching.length
            ? `${theme} appears in customer-facing language: ${matching.map((e) => e.title).join(", ")} — useful as messaging context, not as a standalone strategy.`
            : `${theme} theme noted in evidence — validate with customer before building campaign around it.`,
          confidence: deriveReasoningConfidence({ evidence: matching, minEvidenceCount: 1 }),
          supportingEvidence: evidenceIds(matching),
          createdAt,
        }),
        themeCategory: theme,
      };
    });
}

function buildPriorityInsights(nodes: ReasoningNode[], createdAt: string): ReasoningPriorityInsight[] {
  return [...nodes]
    .filter((n) => n.confidence > RESEARCH_CONFIDENCE.weakInference)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5)
    .map((node, i) => ({
      ...node,
      id: `priority:${node.id}`,
      rank: i + 1,
    }));
}

function buildHypotheses(graph: ResearchGraph, createdAt: string): ReasoningHypothesis[] {
  const weak = allEvidence(graph).filter(
    (e) => e.confidence === RESEARCH_CONFIDENCE.homepageInference
  );

  return weak.slice(0, 3).map((e, i) => ({
    ...createReasoningNode({
      id: `hypothesis:${i + 1}`,
      title: e.title,
      description: `Hypothesis requiring validation: ${e.description}`,
      confidence: e.confidence * 0.8,
      supportingEvidence: [e.id],
      createdAt,
    }),
    validationRequired: true as const,
  }));
}

/**
 * Builds ReasoningGraph from ResearchGraph.
 * Strangler: deterministic understanding only — Strategy behaviour unchanged.
 */
export function buildReasoningGraph(input: BuildReasoningGraphInput): ReasoningGraph {
  const { researchGraph } = input;
  const createdAt = input.createdAt ?? new Date().toISOString();

  const base = emptyReasoningGraph({
    organizationId: researchGraph.organizationId,
    campaignId: researchGraph.campaignId,
    researchVersion: researchGraph.version,
    createdAt,
  });

  const businessModel = buildBusinessModel(researchGraph, createdAt);
  const marketPosition = inferMarketPosition(researchGraph, createdAt);
  const customerModel = buildCustomerModel(researchGraph, createdAt);
  const competitiveLandscape = buildCompetitiveLandscape(researchGraph, createdAt);
  const strengths = swotToNodes(researchGraph.strengths, "strength", createdAt);
  const weaknesses = swotToNodes(researchGraph.weaknesses, "weakness", createdAt);
  const opportunities = buildOpportunities(researchGraph, createdAt);
  const risks = buildRisks(researchGraph, createdAt);
  const unknowns = buildUnknowns(researchGraph, createdAt);
  const constraints = buildConstraints(researchGraph, createdAt);
  const assumptions = buildAssumptions(researchGraph, createdAt);
  const contradictions = detectContradictions(researchGraph, createdAt);
  const patterns = detectPatterns(researchGraph, createdAt);
  const strategicThemes = buildStrategicThemes(researchGraph, createdAt);
  const hypotheses = buildHypotheses(researchGraph, createdAt);

  const allNodes = [
    ...businessModel,
    ...marketPosition,
    ...customerModel,
    ...competitiveLandscape,
    ...strengths,
    ...weaknesses,
  ];
  const priorityInsights = buildPriorityInsights(allNodes, createdAt);

  return {
    ...base,
    businessModel,
    marketPosition,
    customerModel,
    competitiveLandscape,
    strengths,
    weaknesses,
    opportunities,
    risks,
    hypotheses,
    constraints,
    assumptions,
    unknowns,
    contradictions,
    priorityInsights,
    strategicThemes,
    patterns,
  };
}

export function reasoningGraphHasEvidenceChain(graph: ReasoningGraph): boolean {
  const nodes = [
    ...graph.businessModel,
    ...graph.marketPosition,
    ...graph.customerModel,
    ...graph.competitiveLandscape,
    ...graph.strengths,
    ...graph.weaknesses,
    ...graph.opportunities,
    ...graph.risks,
    ...graph.hypotheses,
    ...graph.constraints,
    ...graph.assumptions,
    ...graph.unknowns,
    ...graph.contradictions,
    ...graph.priorityInsights,
    ...graph.strategicThemes,
    ...graph.patterns,
  ];

  return nodes.every(
    (n) =>
      n.confidence >= 0 &&
      n.reasoningVersion.length > 0 &&
      n.createdAt.length > 0 &&
      (n.supportingEvidence.length > 0 || n.relatedResearch.length > 0 || n.confidence === 0)
  );
}
