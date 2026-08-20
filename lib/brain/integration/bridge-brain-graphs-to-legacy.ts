/**
 * PX-63 — bridge canonical brain graphs to legacy layer graphs for strategy capability path.
 */

import type { ResearchBrainGraph, ResearchBrainEvidence } from "../layers/research/brain-types";
import { emptyResearchGraph, RESEARCH_CONFIDENCE } from "../layers/research/types";
import type { ResearchEvidence, ResearchGraph } from "../layers/research/types";
import type { ReasoningBrainGraph } from "../layers/reasoning/brain-types";
import { emptyReasoningGraph } from "../layers/reasoning/types";
import type { ReasoningGraph, ReasoningNode } from "../layers/reasoning/types";
import type { MarketingIntelligenceBrainGraph } from "../layers/marketing-intelligence/brain-types";
import {
  emptyMarketingIntelligenceGraph,
  MARKETING_INTELLIGENCE_LAYER_VERSION,
} from "../layers/marketing-intelligence/types";
import type { MarketingIntelligenceGraph } from "../layers/marketing-intelligence/types";
import type { StrategyBrainGraph } from "../layers/strategy/brain-types";
import type { StrategyGraph, StrategySection } from "../strategy/strategy-graph";
import type { PlanningBrainGraph } from "../layers/planning/brain-types";
import type { PlanningGraph, PlanningNode } from "../layers/planning/types";
import { PLANNING_LAYER_VERSION } from "../layers/planning/types";

function brainEvidenceToLegacy(
  ev: ResearchBrainEvidence,
  title: string,
  version: string
): ResearchEvidence {
  return {
    id: ev.id,
    title,
    description: ev.normalizedSummary || ev.rawExcerpt,
    source: {
      kind: ev.sourceType === "competitor_website" ? "competitor" : "website",
      refId: ev.url ?? ev.sourceId,
      label: title,
      capturedAt: ev.capturedAt,
    },
    confidence:
      ev.confidence === "high"
        ? RESEARCH_CONFIDENCE.websiteStatement
        : RESEARCH_CONFIDENCE.homepageInference,
    collectedAt: ev.capturedAt,
    version,
    validationStatus: "validated",
  };
}

export function bridgeResearchBrainGraphToLegacy(graph: ResearchBrainGraph): ResearchGraph {
  const base = emptyResearchGraph({
    organizationId: graph.organizationId,
    campaignId: graph.campaignId ?? graph.projectId,
    collectedAt: graph.updatedAt,
  });

  const company: ResearchEvidence[] = [];
  const website: ResearchEvidence[] = [];
  const competitors: ResearchEvidence[] = [];
  const market: ResearchEvidence[] = [];

  for (const ev of graph.evidence) {
    const finding = graph.findings.find((f) => f.evidenceIds.includes(ev.id));
    const title = finding?.title ?? ev.normalizedSummary.slice(0, 80);
    const legacy = brainEvidenceToLegacy(ev, title, graph.version);
    if (ev.sourceType === "competitor_website") competitors.push(legacy);
    else if (ev.sourceType === "company_website") website.push(legacy);
    else if (ev.sourceType === "company_graph") company.push(legacy);
    else market.push(legacy);
  }

  return {
    ...base,
    company,
    website,
    competitors,
    market,
    unknowns: graph.unresolvedQuestions.map((q) => ({
      id: q.id,
      title: q.question,
      confidence: RESEARCH_CONFIDENCE.missing,
      reason: q.reason,
      collectedAt: graph.updatedAt,
      version: graph.version,
    })),
  };
}

export function bridgeReasoningBrainGraphToLegacy(graph: ReasoningBrainGraph): ReasoningGraph {
  if (graph.legacyGraph) return graph.legacyGraph;

  const base = emptyReasoningGraph({
    organizationId: graph.organizationId,
    campaignId: graph.campaignId ?? graph.projectId,
    researchVersion: graph.researchGraphVersion,
    createdAt: graph.updatedAt,
  });

  const toNode = (input: {
    id: string;
    title: string;
    description: string;
    confidence: number;
    supportingEvidence: readonly string[];
    createdAt: string;
  }): ReasoningNode => ({
    id: input.id,
    title: input.title,
    description: input.description,
    confidence: input.confidence,
    supportingEvidence: [...input.supportingEvidence],
    relatedResearch: [...input.supportingEvidence],
    reasoningVersion: graph.version,
    createdAt: input.createdAt,
  });

  const interpretations = graph.interpretations.map((interp) =>
    toNode({
      id: interp.id,
      title: interp.title,
      description: interp.summary,
      confidence: interp.confidence === "high" ? 0.85 : interp.confidence === "medium" ? 0.65 : 0.4,
      supportingEvidence: interp.supportedEvidence,
      createdAt: interp.createdAt,
    })
  );

  return {
    ...base,
    businessModel: interpretations.filter((n) => /business|product|sell/i.test(n.title)),
    marketPosition: interpretations.filter((n) => /market|position/i.test(n.title)),
    customerModel: interpretations.filter((n) => /customer|audience|buy/i.test(n.title)),
    competitiveLandscape: interpretations.filter((n) => /compet/i.test(n.title)),
    strengths: [],
    weaknesses: [],
    opportunities: graph.opportunities.map((o) => ({
      ...toNode({
        id: o.id,
        title: o.description.slice(0, 80),
        description: o.reason,
        confidence: o.confidence === "high" ? 0.8 : 0.55,
        supportingEvidence: o.supportingEvidence,
        createdAt: o.createdAt,
      }),
      opportunityType: "market_gap",
    })),
    risks: graph.risks.map((r) => ({
      ...toNode({
        id: r.id,
        title: r.description.slice(0, 80),
        description: r.mitigationSuggestion || r.description,
        confidence: r.confidence === "high" ? 0.75 : 0.5,
        supportingEvidence: r.supportingEvidence,
        createdAt: r.createdAt,
      }),
      severity: r.severity === "critical" ? ("high" as const) : r.severity === "high" ? ("high" as const) : ("medium" as const),
    })),
    hypotheses: graph.hypotheses.map((h) => ({
      ...toNode({
        id: h.id,
        title: h.statement.slice(0, 80),
        description: h.statement,
        confidence: h.confidence === "high" ? 0.75 : 0.5,
        supportingEvidence: h.supportingEvidence,
        createdAt: h.createdAt,
      }),
      validationRequired: true as const,
    })),
    assumptions: graph.assumptions.map((a) => ({
      ...toNode({
        id: a.id,
        title: a.statement.slice(0, 80),
        description: a.whyAssumed,
        confidence: a.confidence === "high" ? 0.7 : 0.45,
        supportingEvidence: [],
        createdAt: a.createdAt,
      }),
      basedOnConfidence: a.confidence === "high" ? 0.7 : 0.45,
    })),
    contradictions: graph.contradictions.map((c) => ({
      ...toNode({
        id: c.id,
        title: "Contradiction",
        description: c.interpretation,
        confidence: c.confidence === "high" ? 0.7 : 0.45,
        supportingEvidence: [],
        createdAt: c.createdAt,
      }),
      evidenceA: c.companyClaim,
      evidenceB: c.researchClaim,
      resolutionStatus: "unresolved" as const,
    })),
    unknowns: graph.unknowns.map((u) => ({
      ...toNode({
        id: u.id,
        title: u.question ?? u.description.slice(0, 80),
        description: u.description,
        confidence: 0.35,
        supportingEvidence: u.relatedEvidence,
        createdAt: u.createdAt,
      }),
      reason: u.description,
    })),
    strategicThemes: [],
    patterns: [],
    priorityInsights: [],
    constraints: [],
  };
}

export function bridgeMarketingIntelligenceBrainGraphToLegacy(
  graph: MarketingIntelligenceBrainGraph
): MarketingIntelligenceGraph {
  const createdAt = graph.updatedAt;
  const version = MARKETING_INTELLIGENCE_LAYER_VERSION;
  const insight = (
    id: string,
    title: string,
    narrative: string,
    evidenceIds: readonly string[] = []
  ) => ({
    id,
    title,
    narrative,
    confidence: 0.65,
    supportingEvidence: evidenceIds,
    reasoningReferences: [],
    marketingIntelligenceVersion: version,
    createdAt,
  });

  const audience = graph.audienceIntelligence[0];
  const messaging = graph.messagingIntelligence;
  const competitive = graph.competitiveMarketing[0];

  return {
    ...emptyMarketingIntelligenceGraph({
      organizationId: graph.organizationId,
      campaignId: graph.campaignId ?? graph.projectId,
      reasoningVersion: graph.reasoningGraphVersion,
      createdAt,
    }),
    businessReality: insight(
      "mi-business",
      "Business reality",
      graph.summary.headline || audience?.coreProblem || "Derived from research evidence.",
      audience?.evidenceIds ?? []
    ),
    buyingMotivation: insight(
      "mi-buying",
      "Buying motivation",
      audience?.primaryMotivation ?? "Inferred from audience intelligence.",
      audience?.evidenceIds ?? []
    ),
    primaryPain: insight(
      "mi-pain",
      "Primary pain",
      audience?.coreProblem ?? "Inferred from research findings.",
      audience?.evidenceIds ?? []
    ),
    emotionalDrivers: insight(
      "mi-emotion",
      "Emotional drivers",
      messaging.emotionalDrivers[0] ?? "",
      messaging.evidenceIds
    ),
    objections: insight(
      "mi-objections",
      "Objections",
      audience?.keyObjections[0] ?? messaging.objectionThemes[0] ?? "",
      messaging.evidenceIds
    ),
    strongestPositioning: insight(
      "mi-position",
      "Strongest positioning",
      messaging.messageDifferentiation[0] ?? competitive?.positioningCluster ?? "",
      competitive?.evidenceIds ?? messaging.evidenceIds
    ),
    competitiveAdvantage: insight(
      "mi-advantage",
      "Competitive advantage",
      competitive?.visibleWhitespace[0] ?? messaging.underusedMessages[0] ?? "",
      competitive?.evidenceIds ?? []
    ),
    dominantMessaging: insight(
      "mi-messaging",
      "Dominant messaging",
      messaging.dominantMarketMessages[0] ?? messaging.trustThemes[0] ?? "",
      messaging.evidenceIds
    ),
    highestProbabilityCampaigns: graph.opportunitySignals.slice(0, 2).map((o, i) =>
      insight(`mi-camp-${i}`, o.title, o.marketingImpact, o.evidenceIds)
    ),
    antiPatterns: [],
    missingInformation: graph.summary.insufficientDataFlags.map((r, i) =>
      insight(`mi-missing-${i}`, "Insufficient evidence", String(r), [])
    ),
    assumptions: [],
  };
}

function toStrategySection(
  title: string,
  description: string,
  evidenceIds: readonly string[] = [],
  confidence: StrategySection["confidence"] = "medium"
): StrategySection {
  return {
    title,
    description: description.trim(),
    confidence: description.trim() ? confidence : "low",
    supportingEvidence: [...evidenceIds],
    reasoningReferences: [],
  };
}

export function bridgeStrategyBrainGraphToLegacy(graph: StrategyBrainGraph): StrategyGraph {
  const audience =
    graph.audienceStrategy.find((a) => a.priority === "primary") ?? graph.audienceStrategy[0];
  const primaryProblem = graph.strategicProblems[0];
  const createdAt = graph.createdAt;

  return {
    version: graph.version,
    organizationId: graph.organizationId,
    campaignId: graph.campaignId ?? graph.projectId,
    createdAt,
    businessSummary: toStrategySection("Business summary", graph.businessObjective),
    strategicPositioning: toStrategySection(
      "Strategic positioning",
      graph.positioningStrategy.positioningStatement,
      graph.positioningStrategy.evidenceIds
    ),
    valueProposition: toStrategySection(
      "Value proposition",
      graph.messagingStrategyDirection.primaryMessageTerritory ||
        graph.positioningStrategy.strategicAngle,
      graph.positioningStrategy.evidenceIds
    ),
    primaryAudience: toStrategySection(
      "Primary audience",
      audience ? `${audience.segment} — ${audience.whySelected}` : "",
      audience?.evidenceIds ?? []
    ),
    secondaryAudience: graph.audienceStrategy[1]
      ? toStrategySection(
          "Secondary audience",
          `${graph.audienceStrategy[1].segment} — ${graph.audienceStrategy[1].whySelected}`,
          graph.audienceStrategy[1].evidenceIds
        )
      : undefined,
    customerProblems: toStrategySection(
      "Customer problems",
      primaryProblem
        ? `${primaryProblem.title}: ${primaryProblem.description}`
        : graph.messagingStrategyDirection.objectionThemes.join("; "),
      primaryProblem?.evidenceIds ?? []
    ),
    customerMotivations: toStrategySection(
      "Customer motivations",
      graph.messagingStrategyDirection.emotionalDirection,
      graph.positioningStrategy.evidenceIds
    ),
    buyingTriggers: toStrategySection(
      "Buying triggers",
      graph.offerStrategyDirection.urgencyApproach,
      graph.positioningStrategy.evidenceIds
    ),
    objections: toStrategySection(
      "Objections",
      graph.messagingStrategyDirection.objectionThemes.join("; "),
      graph.positioningStrategy.evidenceIds
    ),
    differentiators: toStrategySection(
      "Differentiators",
      graph.positioningStrategy.differentiation.join("; "),
      graph.positioningStrategy.evidenceIds
    ),
    strategicThemes: graph.strategicPriorities.slice(0, 4).map((p) =>
      toStrategySection(p.subject, p.rationale, [], p.priority === "high" ? "high" : "medium")
    ),
    priorityOpportunities: graph.opportunitySelections
      .filter((o) => o.status === "selected")
      .slice(0, 4)
      .map((o) => toStrategySection(o.title, o.reason, [], o.confidence)),
    strategicRisks: graph.strategicRisks.slice(0, 4).map((r) =>
      toStrategySection(r.description.slice(0, 80), r.impact, [], r.confidence)
    ),
    constraints: graph.strategicAssumptions.slice(0, 4).map((a) =>
      toStrategySection(a.statement, a.riskIfWrong, a.evidenceIds, a.confidence)
    ),
    assumptions: graph.strategicAssumptions.slice(0, 4).map((a) =>
      toStrategySection(a.statement, a.validationMethod, a.evidenceIds, a.confidence)
    ),
    unknowns: [],
    evidenceSummary: toStrategySection(
      "Evidence summary",
      graph.strategyRationale.decisionSummary || graph.summary.headline,
      graph.evidence.map((e) => e.id)
    ),
    rejectedAlternatives: graph.rejectedAlternatives.map((alt) => ({
      alternative: alt.alternative,
      reason: alt.reason,
      confidence: alt.confidence,
    })),
    decisionRationales: graph.strategicDecisions.slice(0, 6).map((d) => ({
      decision: d.title,
      reason: d.reason,
      evidence: [...d.supportingEvidence],
      alternativesConsidered: [...d.alternativesConsidered],
      alternativesRejected: d.alternativesConsidered.slice(0, 2).map((alt) => ({
        alternative: alt,
        reason: d.tradeoffs[0] ?? "Not selected",
        confidence: d.confidence,
      })),
      confidence: d.confidence,
      risks: [...d.tradeoffs],
      unknowns: [],
    })),
    recommendedDirection: toStrategySection(
      "Recommended direction",
      graph.selectedStrategy,
      graph.positioningStrategy.evidenceIds,
      graph.confidence
    ),
    successCriteria: toStrategySection(
      "Success criteria",
      graph.kpiFramework
        .slice(0, 3)
        .map((k) => k.name)
        .join("; "),
      []
    ),
  };
}

export function bridgePlanningBrainGraphToLegacy(graph: PlanningBrainGraph): PlanningGraph {
  const createdAt = graph.createdAt;
  const executionStages: PlanningNode[] = graph.creativeBriefInputs.map((brief) => ({
    id: brief.id,
    title: `${brief.channel} — ${brief.deliverableType}`,
    description: brief.messagingDirection,
    businessPurpose: brief.businessOutcome,
    reason: brief.positioningDirection,
    priority: brief.confidence === "high" ? "high" : brief.confidence === "low" ? "low" : "medium",
    ownerBrain: "creative",
    dependsOn: [...brief.planningRefs],
    blocks: [],
    estimatedEffort: brief.deadlineWindow ?? "medium",
    requiredInputs: [...brief.contentRequirements, ...brief.proofRequirements],
    producedOutputs: [brief.deliverableType],
    approvalRequired: true,
    status: "ready",
    confidence: brief.confidence,
  }));

  const campaign = graph.campaignPlans[0];

  return {
    version: PLANNING_LAYER_VERSION,
    organizationId: graph.organizationId,
    campaignId: graph.campaignId ?? graph.projectId,
    createdAt,
    objectives: graph.planningObjectives.map((o) => ({
      id: o.id,
      title: o.objective,
      description: o.businessOutcome,
      businessValue: o.businessOutcome,
      successCriteria: o.successMetric,
      linkedDecisionIds: [...o.dependencies],
    })),
    milestones: graph.milestones.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      intent: m.description,
      dependsOnNodeIds: [...m.dependencies],
      producesLearning: m.exitCriteria[0] ?? m.description,
    })),
    planningDecisions: [],
    executionStages,
    executionOrder: executionStages.map((n) => n.id),
    dependencies: [],
    blockedActivities: [],
    parallelActivities: [],
    criticalPath: graph.criticalPath.criticalPathWorkPackages,
    requiredAssets: [],
    requiredKnowledge: [],
    requiredCustomerInput: [],
    requiredIntegrations: [],
    reviewMoments: [],
    successCriteria: campaign ? [...campaign.successMetrics] : [],
    readiness: {
      level: "ready",
      score: 85,
      summary: graph.projectPlan.objectiveSummary,
      blockers: [],
      waitingFor: [],
      checks: [],
    },
    risks: [],
    unknowns: [],
    estimatedTimeline: [],
    dependencyAnalysis: {
      dependencies: [],
      criticalPath: graph.criticalPath.criticalPathWorkPackages,
      parallelOpportunities: [],
      missingDependencies: [],
      circularDependencies: [],
      unnecessaryDependencies: [],
    },
  };
}
