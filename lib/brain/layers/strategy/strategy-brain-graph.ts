/**
 * Strategy Brain — graph builder orchestrator.
 */

import type {
  PlanningStrategyInput,
  StrategicDecision,
  StrategicEvidenceRef,
  StrategicPriority,
  StrategyBrainGraph,
  StrategyBrainInput,
  StrategyRationale,
} from "./brain-types";
import { STRATEGY_BRAIN_VERSION, emptyStrategyBrainGraph } from "./brain-types";
import { buildStrategicProblems } from "./strategy-problems";
import { selectOpportunities } from "./strategy-opportunity-selection";
import { buildAudienceStrategy } from "./strategy-audience";
import { buildPositioningStrategy } from "./strategy-positioning";
import { buildChannelStrategy } from "./strategy-channels";
import { buildBudgetStrategy } from "./strategy-budget";
import { buildFunnelStrategy } from "./strategy-funnel";
import { buildOfferStrategyDirection } from "./strategy-offer";
import { buildMessagingStrategyDirection } from "./strategy-messaging";
import { buildKpiFramework } from "./strategy-kpis";
import { buildCampaignObjectives } from "./strategy-campaign-objectives";
import { buildStrategicTradeoffs } from "./strategy-tradeoffs";
import { buildStrategicAssumptions, buildStrategicRisks } from "./strategy-risks";
import { buildStrategyEscalations } from "./strategy-escalations";
import { confidenceFromUpstream, enforceStrategyConfidenceCeiling } from "./strategy-confidence";

function collectEvidence(input: StrategyBrainInput): StrategicEvidenceRef[] {
  const refs: StrategicEvidenceRef[] = [];
  for (const e of input.marketingIntelligenceGraph.evidence.slice(0, 20)) {
    refs.push({
      id: `strat-ev-${e.id}`,
      source: e.source === "memory" ? "memory" : e.source,
      refId: e.refId,
      summary: e.summary,
      confidence: enforceStrategyConfidenceCeiling(e.confidence, [
        input.reasoningGraph.confidence,
        input.marketingIntelligenceGraph.confidence,
      ]),
    });
  }
  return refs;
}

function buildDecisions(input: {
  graph: StrategyBrainGraph;
  createdAt: string;
}): StrategicDecision[] {
  const { graph, createdAt } = input;
  const decisions: StrategicDecision[] = [];

  const primaryAudience = graph.audienceStrategy.find((a) => a.priority === "primary");
  if (primaryAudience) {
    decisions.push({
      id: "dec-audience-primary",
      decisionType: "audience",
      title: "Primary audience selection",
      decision: `Prioritize ${primaryAudience.segment} as primary audience`,
      reason: primaryAudience.whySelected,
      supportingEvidence: primaryAudience.evidenceIds,
      alternativesConsidered: graph.audienceStrategy.filter((a) => a.priority !== "primary").map((a) => a.segment),
      tradeoffs: ["Narrower focus improves message-market fit"],
      expectedImpact: primaryAudience.businessValue,
      confidence: primaryAudience.confidence,
      dependencies: [],
      reversible: true,
      reviewTrigger: "Quarterly or on performance threshold breach",
      createdAt,
    });
  }

  if (graph.positioningStrategy.strategicAngle) {
    decisions.push({
      id: "dec-positioning",
      decisionType: "positioning",
      title: "Positioning direction",
      decision: graph.positioningStrategy.positioningStatement,
      reason: graph.positioningStrategy.whyThisAngle,
      supportingEvidence: graph.positioningStrategy.evidenceIds,
      alternativesConsidered: graph.positioningStrategy.rejectedAngles,
      tradeoffs: graph.positioningStrategy.risks,
      expectedImpact: "Differentiated market perception",
      confidence: graph.positioningStrategy.confidence,
      dependencies: [],
      reversible: false,
      reviewTrigger: "Major brand or market shift",
      createdAt,
    });
  }

  for (const ch of graph.channelStrategy.filter((c) => c.selected)) {
    decisions.push({
      id: `dec-channel-${ch.channel.toLowerCase().replace(/\s+/g, "-")}`,
      decisionType: "channel",
      title: `${ch.channel} channel role`,
      decision: `${ch.channel}: ${ch.role}`,
      reason: ch.reason,
      supportingEvidence: ch.evidenceIds,
      alternativesConsidered: graph.channelStrategy.filter((c) => !c.selected).map((c) => c.channel),
      tradeoffs: ch.risks,
      expectedImpact: ch.objective,
      confidence: ch.confidence,
      dependencies: ch.dependencies,
      reversible: true,
      reviewTrigger: "Monthly channel performance review",
      createdAt,
    });
  }

  if (graph.budgetStrategy.budgetRequired) {
    decisions.push({
      id: "dec-budget-pending",
      decisionType: "budget",
      title: "Budget allocation pending",
      decision: "Relative allocation ranges only — budget confirmation required",
      reason: "Customer budget unknown; strategy avoids fabricated spend figures.",
      supportingEvidence: [],
      alternativesConsidered: [],
      tradeoffs: ["Cannot finalize channel spend without budget"],
      expectedImpact: "Enables planning once budget confirmed",
      confidence: "low",
      dependencies: ["budget_confirmation"],
      reversible: true,
      reviewTrigger: "Upon budget confirmation",
      createdAt,
    });
  }

  return decisions;
}

function buildPlanningInputs(graph: StrategyBrainGraph, timeHorizon: string): PlanningStrategyInput {
  return {
    selectedObjectives: graph.campaignObjectives.map((o) => o.objective),
    selectedAudiences: graph.audienceStrategy.filter((a) => a.priority !== "deprioritized").map((a) => a.segment),
    selectedChannels: graph.channelStrategy.filter((c) => c.selected).map((c) => c.channel),
    positioningDirection: graph.positioningStrategy.strategicAngle,
    messagingDirection: graph.messagingStrategyDirection.primaryMessageTerritory,
    funnelStrategy: graph.funnelStrategy.primaryFunnelModel,
    offerDirection: graph.offerStrategyDirection.offerDirection,
    budgetStrategy: graph.budgetStrategy.budgetRequired
      ? "Budget confirmation required — relative ranges provided"
      : `Total ${graph.budgetStrategy.totalBudget} ${graph.budgetStrategy.currency}`,
    kpis: graph.kpiFramework.map((k) => k.name),
    priorities: graph.strategicPriorities.map((p) => p.subject),
    constraints: graph.budgetStrategy.constraints,
    dependencies: graph.campaignObjectives.flatMap((o) => o.dependencies),
    risks: graph.strategicRisks.map((r) => r.description),
    assumptions: graph.strategicAssumptions.map((a) => a.statement),
    approvalRequirements: graph.approval.requiresApproval
      ? [graph.approval.approvalReason ?? "Strategy review required"]
      : [],
    timeHorizon,
    confidence: graph.confidence,
  };
}

function buildRationale(input: {
  reasoningGraph: StrategyBrainInput["reasoningGraph"];
  miGraph: StrategyBrainInput["marketingIntelligenceGraph"];
  selectedStrategy: string;
}): StrategyRationale {
  return {
    headline: input.selectedStrategy,
    evidenceSummary: `${input.miGraph.evidence.length} marketing evidence refs synthesized`,
    reasoningSummary: input.reasoningGraph.summary.headline,
    marketingIntelligenceSummary: input.miGraph.summary.headline,
    decisionSummary: "Explicit strategic choices made for audience, positioning, channels, and measurement",
    evidenceIds: input.miGraph.evidence.slice(0, 10).map((e) => e.id),
  };
}

function resolveApproval(input: {
  decisions: readonly StrategicDecision[];
  approvalPolicy?: StrategyBrainInput["approvalPolicy"];
  budgetRequired: boolean;
  positioningChanged: boolean;
}): StrategyBrainGraph["approval"] {
  const policy = input.approvalPolicy ?? "major_only";
  const majorDecisions = input.decisions.filter(
    (d) => d.decisionType === "positioning" || d.decisionType === "budget" || d.decisionType === "audience"
  );
  const needsApproval =
    policy === "always" ||
    (policy === "major_only" &&
      (input.budgetRequired || input.positioningChanged || majorDecisions.some((d) => !d.reversible)));

  return {
    requiresApproval: needsApproval,
    approvalKind: needsApproval ? "strategy_review" : null,
    approvalReason: needsApproval
      ? input.budgetRequired
        ? "Budget confirmation and strategic direction require customer approval"
        : "Major strategic direction change requires customer approval"
      : null,
    decisionIds: needsApproval ? majorDecisions.map((d) => d.id) : [],
  };
}

export function buildStrategyBrainGraph(input: StrategyBrainInput): StrategyBrainGraph {
  const createdAt = new Date().toISOString();
  const businessObjective =
    input.projectObjective ??
    input.marketingIntelligenceGraph.businessContext.projectObjective ??
    "Achieve marketing outcomes aligned with business goals";

  const upstreamConfidence = confidenceFromUpstream({
    research: input.researchGraph.confidence,
    reasoning: input.reasoningGraph.confidence,
    marketingIntelligence: input.marketingIntelligenceGraph.confidence,
    budgetKnown: Boolean(input.availableBudget?.amount),
  });

  const strategicProblems = buildStrategicProblems({
    miGraph: input.marketingIntelligenceGraph,
    reasoningGraph: input.reasoningGraph,
    projectObjective: input.projectObjective,
    upstreamConfidence,
  });

  const { selections, rejectedAlternatives: oppRejected } = selectOpportunities({
    miGraph: input.marketingIntelligenceGraph,
    upstreamConfidence,
  });

  const audienceStrategy = buildAudienceStrategy({
    miGraph: input.marketingIntelligenceGraph,
    upstreamConfidence,
  });

  const { positioning: positioningStrategy, rejectedAlternatives: posRejected } = buildPositioningStrategy({
    miGraph: input.marketingIntelligenceGraph,
    reasoningGraph: input.reasoningGraph,
    upstreamConfidence,
  });

  const channelStrategy = buildChannelStrategy({
    miGraph: input.marketingIntelligenceGraph,
    audienceStrategy,
    upstreamConfidence,
  });

  const budgetStrategy = buildBudgetStrategy({
    availableBudget: input.availableBudget,
    channelStrategy,
    constraints: input.constraints ?? input.marketingIntelligenceGraph.businessContext.constraints,
    upstreamConfidence,
  });

  const funnelStrategy = buildFunnelStrategy({
    miGraph: input.marketingIntelligenceGraph,
    channelStrategy,
    upstreamConfidence,
  });

  const offerStrategyDirection = buildOfferStrategyDirection({
    miGraph: input.marketingIntelligenceGraph,
    upstreamConfidence,
  });

  const messagingStrategyDirection = buildMessagingStrategyDirection({
    miGraph: input.marketingIntelligenceGraph,
    positioningAngle: positioningStrategy.strategicAngle,
    upstreamConfidence,
  });

  const kpiFramework = buildKpiFramework({
    projectObjective: input.projectObjective,
    upstreamConfidence,
  });

  const campaignObjectives = buildCampaignObjectives({
    opportunitySelections: selections,
    channelStrategy,
    audienceStrategy,
    timeHorizon: input.timeHorizon,
    upstreamConfidence,
  });

  const strategicTradeoffs = buildStrategicTradeoffs({ channelStrategy });
  const strategicAssumptions = buildStrategicAssumptions({
    reasoningGraph: input.reasoningGraph,
    upstreamConfidence,
  });
  const strategicRisks = buildStrategicRisks({
    miGraph: input.marketingIntelligenceGraph,
    reasoningGraph: input.reasoningGraph,
    upstreamConfidence,
  });

  const escalations = buildStrategyEscalations(input);
  const evidence = collectEvidence(input);

  const selectedStrategy =
    channelStrategy.find((c) => c.selected)?.objective ??
    campaignObjectives[0]?.objective ??
    "Intent-led marketing strategy";

  const base = emptyStrategyBrainGraph({
    organizationId: input.organizationId,
    projectId: input.projectId,
    campaignId: input.campaignId,
    businessObjective,
    companyGraphVersion: input.companyGraph.version ?? "unknown",
    researchGraphVersion: input.researchGraph.version,
    reasoningGraphVersion: input.reasoningGraph.version,
    marketingIntelligenceVersion: input.marketingIntelligenceGraph.version,
    createdAt,
  });

  const strategicDecisions = buildDecisions({
    graph: {
      ...base,
      audienceStrategy,
      positioningStrategy,
      channelStrategy,
      budgetStrategy,
    },
    createdAt,
  });

  const rejectedAlternatives = [...oppRejected, ...posRejected];
  const strategicPriorities: StrategicPriority[] = strategicDecisions.slice(0, 8).map((d, i) => ({
    id: `priority-${d.id}`,
    subject: d.title,
    priority: i === 0 ? "high" : i < 3 ? "medium" : "low",
    rationale: d.reason,
    decisionId: d.id,
  }));

  const approval = resolveApproval({
    decisions: strategicDecisions,
    approvalPolicy: input.approvalPolicy,
    budgetRequired: budgetStrategy.budgetRequired,
    positioningChanged: Boolean(positioningStrategy.strategicAngle),
  });

  const strategyRationale = buildRationale({
    reasoningGraph: input.reasoningGraph,
    miGraph: input.marketingIntelligenceGraph,
    selectedStrategy,
  });

  const graphCore = {
    ...base,
    updatedAt: createdAt,
    strategicContext: [
      ...(input.businessGoals ?? []),
      input.timeHorizon ? `Time horizon: ${input.timeHorizon}` : "",
    ].filter(Boolean),
    evidence,
    strategicProblems,
    opportunitySelections: selections,
    audienceStrategy,
    positioningStrategy,
    channelStrategy,
    funnelStrategy,
    offerStrategyDirection,
    messagingStrategyDirection,
    budgetStrategy,
    kpiFramework,
    campaignObjectives,
    strategicTradeoffs,
    strategicAssumptions,
    strategicRisks,
    strategicDecisions,
    strategicPriorities,
    selectedStrategy,
    rejectedAlternatives,
    strategyRationale,
    escalations,
    approval,
    summary: {
      headline: selectedStrategy,
      decisionCount: strategicDecisions.length,
      selectedOpportunityCount: selections.filter((s) => s.status === "selected").length,
      rejectedAlternativeCount: rejectedAlternatives.length,
      escalationCount: escalations.length,
    },
    confidence: upstreamConfidence,
  };

  const graph: StrategyBrainGraph = {
    ...graphCore,
    planningInputs: buildPlanningInputs(
      { ...graphCore, planningInputs: base.planningInputs },
      input.timeHorizon ?? "90 days"
    ),
  };

  return graph;
}

export type { StrategyBrainInput };
