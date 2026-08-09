import type { BrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import type { Decision } from "@/lib/brain/decision/decision-types";
import type { PlanningGraph } from "@/lib/brain/layers/planning/types";
import type { CampaignWorkflowStep } from "@/lib/office/campaign/workflow-types";
import type { CampaignBrainPresentationContext } from "../presentation-context";
import type {
  ApprovalReason,
  BrainOutputSource,
  BusinessOpportunity,
  BusinessRisk,
  CampaignBrainOutput,
  ContextGap,
  ExpectedBusinessImpact,
  MissingContext,
} from "../types";
import { capabilityToBrainSource } from "../capability-source";
import { aggregateConfidence, confidenceFromBrain } from "../publish/confidence";
import {
  publishActivityEvents,
  publishRecentDecisions,
  publishRecentDiscoveries,
  publishRecentLearnings,
} from "../publish/activity-events";
import { publishBusinessIntelligence } from "../publish/business-intelligence";
import {
  publishCampaignNarrative,
  publishExecutiveSummary,
} from "../publish/executive-summary";
import { publishProgressNarrative } from "../publish/progress-narrative";
import { publishRecommendations, publishSuggestedActions } from "../publish/recommendations";
import type { ExecutiveCampaignBriefing } from "@/lib/brain/presentation/executive-briefing";

function resolveDecisions(strategy?: BrainStructuredOutput): Decision[] {
  if (strategy?.decisionRecords?.length) return [...strategy.decisionRecords];
  return [];
}

function publishContextGaps(
  strategy: BrainStructuredOutput | undefined,
  nl: boolean
): readonly ContextGap[] {
  const unknowns = strategy?.decisionRecords?.flatMap((d) => d.unknowns) ?? [];
  return [...new Set(unknowns)].slice(0, 4).map((unknown, index) => ({
    id: `gap-${index}`,
    label: unknown,
    whyNeeded: nl
      ? "Emma heeft dit nodig om de strategie te verfijnen."
      : "Emma needs this to refine the strategy.",
    source: "strategy" as const,
  }));
}

function publishBusinessRisks(
  decisions: readonly Decision[],
  planningGraph?: PlanningGraph | null
): readonly BusinessRisk[] {
  const risks: BusinessRisk[] = [];
  for (const decision of decisions) {
    for (const risk of decision.knownRisks.slice(0, 2)) {
      risks.push({
        id: `risk-dec-${decision.id}-${risks.length}`,
        title: decision.title,
        description: risk,
        mitigation: null,
        source: "strategy",
      });
    }
  }
  for (const risk of planningGraph?.risks.slice(0, 2) ?? []) {
    risks.push({
      id: `risk-plan-${risk.id}`,
      title: risk.title,
      description: risk.description,
      mitigation: risk.mitigation,
      source: "planning",
    });
  }
  return risks;
}

function publishBusinessOpportunities(decisions: readonly Decision[]): readonly BusinessOpportunity[] {
  return decisions
    .filter((d) => d.category === "channel_choice" || d.category === "strategy_direction")
    .slice(0, 3)
    .map((d) => ({
      id: `opp-${d.id}`,
      title: d.title,
      description: d.summary,
      expectedImpact: d.expectedOutcome,
      source: "strategy" as const,
    }));
}

function publishApprovalReason(input: {
  briefing: ExecutiveCampaignBriefing | null;
  decisions: readonly Decision[];
  nl: boolean;
}): ApprovalReason | null {
  const approval = input.briefing?.sections.find((s) => s.id === "approval-summary");
  if (!approval) return null;
  const primary = input.decisions.find((d) => d.approvalRequired);
  return {
    summary: approval.summary,
    unblocks: primary?.recommendation ?? approval.summary,
    expectedImpact: primary?.expectedOutcome ?? approval.summary,
  };
}

function publishExpectedImpact(decisions: readonly Decision[]): ExpectedBusinessImpact {
  const primary = decisions.find((d) => d.category === "strategy_direction");
  return {
    summary: primary?.businessImpact ?? primary?.expectedOutcome ?? "",
    metrics: decisions
      .filter((d) => d.expectedOutcome)
      .slice(0, 3)
      .map((d) => ({ label: d.title, value: d.expectedOutcome })),
  };
}

function publishSources(
  outputs: Partial<Record<string, BrainStructuredOutput>>
): readonly BrainOutputSource[] {
  return Object.entries(outputs)
    .filter((entry): entry is [string, BrainStructuredOutput] => Boolean(entry[1]))
    .map(([capabilityId, output]) => ({
      capabilityId,
      source: capabilityToBrainSource(capabilityId),
      generatedAt: output.generatedAt,
    }));
}

/** Aggregate all campaign intelligence from persisted brain outputs. */
export function buildCampaignBrainOutput(input: {
  ctx: CampaignBrainPresentationContext;
  outputs: Partial<Record<string, BrainStructuredOutput>>;
  briefing: ExecutiveCampaignBriefing | null;
  workflowSteps: readonly CampaignWorkflowStep[];
  statusLabel: string;
  deliverableCount?: number;
  recommendationHref?: string | null;
}): CampaignBrainOutput {
  const nl = input.ctx.locale === "nl";
  const strategy = input.outputs.strategy;
  const decisions = resolveDecisions(strategy);
  const planningGraph = strategy?.planningGraph ?? input.outputs.campaign_planning?.planningGraph;

  const executiveSummary = publishExecutiveSummary({
    briefing: input.briefing,
    strategy,
    decisions,
    planningGraph,
    nl,
    companyName: input.ctx.campaignContext.companyName,
    fallbackGoal: input.ctx.project.goal ?? undefined,
  });

  const campaignNarrative = publishCampaignNarrative({
    executiveSummary,
    decisions,
    briefing: input.briefing,
    statusLabel: input.statusLabel,
    nl,
    fallbackGoal: input.ctx.project.goal ?? undefined,
  });

  const businessIntelligence = publishBusinessIntelligence({
    strategy,
    channels: input.outputs.channel_planning,
    planningGraph,
    decisions,
    nl,
  });

  const recommendations = publishRecommendations({
    strategy,
    decisions,
    nl,
    href: input.recommendationHref ?? null,
  });

  const progress = publishProgressNarrative({
    workflowSteps: input.workflowSteps,
    strategy,
    decisions,
    deliverableCount: input.deliverableCount,
    nl,
  });

  const activity = publishActivityEvents({
    outputs: input.outputs,
    decisions,
    nl,
    now: input.ctx.now,
  });

  const confidenceScores = decisions.map((d) => confidenceFromBrain(d.confidence, nl));

  return {
    campaignId: input.ctx.project.id,
    peerId: input.ctx.peerId,
    generatedAt: strategy?.generatedAt ?? input.ctx.now.toISOString(),
    executiveSummary,
    campaignNarrative,
    businessIntelligence,
    recommendations,
    contextGaps: publishContextGaps(strategy, nl),
    businessRisks: publishBusinessRisks(decisions, planningGraph),
    businessOpportunities: publishBusinessOpportunities(decisions),
    recentDiscoveries: publishRecentDiscoveries({ strategy }),
    recentDecisions: publishRecentDecisions({ decisions }),
    recentLearnings: publishRecentLearnings({ strategy }),
    suggestedActions: publishSuggestedActions({ strategy, nl }),
    activity,
    progress,
    approvalReason: publishApprovalReason({ briefing: input.briefing, decisions, nl }),
    expectedBusinessImpact: publishExpectedImpact(decisions),
    confidenceScore: aggregateConfidence(confidenceScores),
    missingContext: { items: publishContextGaps(strategy, nl) } satisfies MissingContext,
    sources: publishSources(input.outputs),
  };
}
