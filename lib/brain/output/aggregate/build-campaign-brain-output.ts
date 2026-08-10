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
import { resolveCreativeGraph } from "../publish/creative-source";
import { publishCampaignBriefSections } from "../publish/creative-brief";
import {
  publishCreativeStrategyAssets,
  publishExecutiveApprovalActions,
  publishLiveCampaignIntelligence,
} from "../publish/creative-assets";
import {
  mergeActivityEvents,
  publishCreativeActivityEvents,
} from "../publish/creative-activity";
import { resolveValidationGraph, isPublicationBlocked } from "../publish/validation-source";
import { publishValidationQualitySummary } from "../publish/validation-quality-summary";
import {
  publishValidationApprovalReason,
  publishValidationExecutiveApprovals,
  publishValidationRequiredFixes,
} from "../publish/validation-approvals";
import {
  mergeValidationActivityEvents,
  publishValidationActivityEvents,
} from "../publish/validation-activity";
import { publishValidationBusinessRisks } from "../publish/validation-risks";
import {
  enrichAssetsWithValidation,
  publishValidationRecommendations,
} from "../publish/validation-assets";
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

function publishExpectedImpact(
  decisions: readonly Decision[],
  creativeImpact?: string | null
): ExpectedBusinessImpact {
  const primary = decisions.find((d) => d.category === "strategy_direction");
  return {
    summary: creativeImpact ?? primary?.businessImpact ?? primary?.expectedOutcome ?? "",
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
  const creative = resolveCreativeGraph(input.outputs.creative_generation);
  const validation = resolveValidationGraph(input.outputs.validation);
  const decisions = resolveDecisions(strategy);
  const planningGraph = strategy?.planningGraph ?? input.outputs.campaign_planning?.planningGraph;
  const deliverableCount =
    input.deliverableCount ?? creative?.deliverables.length ?? undefined;

  const executiveSummary = publishExecutiveSummary({
    briefing: input.briefing,
    strategy,
    creative,
    validation,
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
    creative,
  });

  const businessIntelligence = publishBusinessIntelligence({
    strategy,
    creative,
    validation,
    channels: input.outputs.channel_planning,
    planningGraph,
    decisions,
    nl,
  });

  const progress = publishProgressNarrative({
    workflowSteps: input.workflowSteps,
    strategy,
    creative,
    validation,
    decisions,
    deliverableCount,
    nl,
  });

  const upstreamActivity = publishActivityEvents({
    outputs: input.outputs,
    decisions,
    nl,
    now: input.ctx.now,
  });

  const creativeActivity = publishCreativeActivityEvents({
    creative,
    nl,
    now: input.ctx.now,
  });

  const validationActivity = publishValidationActivityEvents({
    validation,
    nl,
    now: input.ctx.now,
  });

  const activity = mergeValidationActivityEvents(
    mergeActivityEvents(upstreamActivity, creativeActivity),
    validationActivity
  );

  const validationApprovalReason = publishValidationApprovalReason({ validation, nl });
  const legacyApprovalReason = publishApprovalReason({ briefing: input.briefing, decisions, nl });
  const approvalReason = validationApprovalReason ?? legacyApprovalReason;

  const validationRecs = publishValidationRecommendations({
    validation,
    nl,
    href: input.recommendationHref ?? null,
  });

  const recommendations = [
    ...validationRecs.required,
    ...publishRecommendations({
      strategy,
      creative,
      decisions,
      nl,
      href: input.recommendationHref ?? null,
    }),
    ...validationRecs.optional,
  ].slice(0, 4);

  const qualitySummary = publishValidationQualitySummary({ validation, nl });
  const requiredFixes = publishValidationRequiredFixes({ validation, nl });
  const publicationBlocked = validation
    ? isPublicationBlocked(validation.report.publicationReadiness)
    : false;

  const strategyRisks = publishBusinessRisks(decisions, planningGraph);
  const validationRisks = publishValidationBusinessRisks({ validation });

  const validationApprovals = publishValidationExecutiveApprovals({
    validation,
    nl,
    href: input.recommendationHref ?? null,
  });
  const creativeApprovals = publishExecutiveApprovalActions({
    creative,
    approvalReason: legacyApprovalReason,
    nl,
    href: input.recommendationHref ?? null,
  });
  const executiveApprovals = publicationBlocked
    ? []
    : validationApprovals.length > 0
      ? validationApprovals
      : creativeApprovals;

  const creativeAssets = publishCreativeStrategyAssets({ creative, nl });
  const creativeStrategyAssets = enrichAssetsWithValidation({
    assets: creativeAssets,
    validation,
    nl,
  });

  const briefSections = publishCampaignBriefSections({
    creative,
    strategy,
    decisions,
    briefing: input.briefing,
    executiveSummary,
    nl,
  });

  const confidenceScores = [
    ...decisions.map((d) => confidenceFromBrain(d.confidence, nl)),
    ...(creative
      ? [confidenceFromBrain(creative.confidence === "high" ? "high" : creative.confidence === "medium" ? "medium" : "low", nl)]
      : []),
    ...(validation
      ? [confidenceFromBrain(validation.confidence === "high" ? "high" : validation.confidence === "medium" ? "medium" : "low", nl)]
      : []),
  ];

  return {
    campaignId: input.ctx.project.id,
    peerId: input.ctx.peerId,
    generatedAt: validation?.createdAt ?? creative?.createdAt ?? strategy?.generatedAt ?? input.ctx.now.toISOString(),
    executiveSummary,
    campaignNarrative,
    businessIntelligence,
    recommendations,
    contextGaps: publishContextGaps(strategy, nl),
    businessRisks: [...strategyRisks, ...validationRisks].slice(0, 5),
    businessOpportunities: publishBusinessOpportunities(decisions),
    recentDiscoveries: publishRecentDiscoveries({ strategy }),
    recentDecisions: publishRecentDecisions({ decisions }),
    recentLearnings: publishRecentLearnings({ strategy }),
    suggestedActions: publishSuggestedActions({ strategy, creative, nl }),
    activity,
    progress,
    approvalReason,
    expectedBusinessImpact: publishExpectedImpact(
      decisions,
      creative?.estimatedBusinessImpact ?? null
    ),
    confidenceScore: aggregateConfidence(confidenceScores),
    missingContext: { items: publishContextGaps(strategy, nl) },
    sources: publishSources(input.outputs),
    briefSections,
    creativeStrategyAssets,
    liveCampaignIntelligence: publishLiveCampaignIntelligence({
      creative,
      campaignId: input.ctx.project.id,
      nl,
    }),
    executiveApprovals,
    qualitySummary,
    requiredFixes,
    publicationBlocked,
  };
}
