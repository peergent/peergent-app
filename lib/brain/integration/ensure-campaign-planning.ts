import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { BrandGraph } from "../layers/brand/types";
import { planFromBrainInputs } from "../layers/planning/planning-layer";
import { validatePlanningGraph, scorePlanningQuality } from "../layers/planning/planning-validator";
import { strategyGraphFromBrainOutput } from "../strategy/build-strategy-graph";
import { buildDecisionsFromStrategyGraph } from "../decision/decision-builder";
import { DECISION_ENGINE_VERSION } from "../decision/decision-types";
import type { DecisionCollection } from "../decision/decision-types";
import { mapPlanningGraphToBrainOutput } from "../planning/map-planning-graph-to-output";
import {
  computePlanningCacheIdentity,
  isStoredCampaignPlanningCompatible,
  readStoredCampaignPlanning,
  storedPlanningLayerVersionMatches,
} from "../planning/planning-cache-identity";
import type { PlanningBuildResult } from "../planning/campaign-planning-types";
import type { PlanningGraph } from "../layers/planning/types";

export type EnsureCampaignPlanningInput = {
  project: MarketingProject;
  campaignContext: CampaignContext;
  strategyOutput: BrainStructuredOutput;
  organizationId: string;
  brandGraph?: BrandGraph | null;
  locale?: "nl" | "en";
  forceRebuild?: boolean;
};

function decisionCollectionFromStrategy(
  strategyOutput: BrainStructuredOutput,
  strategyGraph: NonNullable<ReturnType<typeof strategyGraphFromBrainOutput>>,
  campaignContext: CampaignContext,
  locale: "nl" | "en"
): DecisionCollection {
  if (strategyOutput.decisionRecords?.length) {
    return {
      version: DECISION_ENGINE_VERSION,
      organizationId: strategyGraph.organizationId,
      campaignId: strategyGraph.campaignId,
      createdAt: strategyOutput.generatedAt,
      decisions: strategyOutput.decisionRecords,
    };
  }
  return buildDecisionsFromStrategyGraph({
    graph: strategyGraph,
    campaignContext,
    locale,
  });
}

function strategyReady(strategyOutput: BrainStructuredOutput | undefined): boolean {
  if (!strategyOutput) return false;
  if (strategyOutput.capabilityId !== "strategy") return false;
  if (strategyOutput.errors.length > 0) return false;
  const hasFindings = strategyOutput.findings.length > 0;
  const hasDecisions =
    (strategyOutput.decisionRecords?.length ?? 0) > 0 || strategyOutput.decisions.length > 0;
  return hasFindings && hasDecisions;
}

/**
 * Build or reuse campaign PlanningGraph — deterministic, no LLM, idempotent per cache identity.
 * Does not rerun Strategy or Decision generation.
 */
export function ensureCampaignPlanning(input: EnsureCampaignPlanningInput): PlanningBuildResult {
  const locale = input.locale === "nl" ? "nl" : "en";

  if (!strategyReady(input.strategyOutput)) {
    return {
      status: "waiting_for_input",
      reused: false,
      failureMessageSafe:
        locale === "nl"
          ? "Emma wacht op een voltooide strategie voordat ze het executieplan kan opstellen."
          : "Emma is waiting for a completed strategy before she can prepare the execution plan.",
      waitingFor: [
        locale === "nl" ? "Strategie-output" : "Strategy output",
      ],
    };
  }

  const stored = readStoredCampaignPlanning(input.project);
  if (
    !input.forceRebuild &&
    stored &&
    storedPlanningLayerVersionMatches(stored) &&
    isStoredCampaignPlanningCompatible(input.project, input.strategyOutput)
  ) {
    const graph = stored.planningGraph!;
    return {
      status: "completed",
      output: {
        ...stored,
        planningMetadata: {
          ...(stored.planningMetadata ?? computePlanningCacheIdentity({
            project: input.project,
            strategyOutput: input.strategyOutput,
            brandLayerVersion: input.brandGraph?.version,
          })),
          planningSource: "stored",
          cacheReused: true,
        },
      },
      graph,
      reused: true,
    };
  }

  const strategyGraph = strategyGraphFromBrainOutput(input.strategyOutput, {
    organizationId: input.organizationId,
    campaignId: input.campaignContext.projectId,
  });

  if (!strategyGraph) {
    return {
      status: "failed",
      reused: false,
      failureMessageSafe:
        locale === "nl"
          ? "Emma kon het executieplan niet opstellen — strategiecontext ontbreekt."
          : "Emma could not prepare the execution plan — strategy context is missing.",
    };
  }

  const decisionCollection = decisionCollectionFromStrategy(
    input.strategyOutput,
    strategyGraph,
    input.campaignContext,
    locale
  );

  if (decisionCollection.decisions.length === 0) {
    return {
      status: "waiting_for_input",
      reused: false,
      failureMessageSafe:
        locale === "nl"
          ? "Emma wacht op strategische beslissingen voordat ze het executieplan kan finaliseren."
          : "Emma is waiting for strategic decisions before finalizing the execution plan.",
      waitingFor: [locale === "nl" ? "Strategische beslissingen" : "Strategic decisions"],
    };
  }

  const graph: PlanningGraph = planFromBrainInputs({
    organizationId: input.organizationId,
    campaignContext: input.campaignContext,
    strategyGraph,
    decisionCollection,
    brandGraph: input.brandGraph ?? null,
    locale,
  });

  const validation = validatePlanningGraph(graph);
  const quality = scorePlanningQuality(graph);

  if (!validation.valid || !quality.valid) {
    return {
      status: "failed",
      reused: false,
      failureMessageSafe:
        locale === "nl"
          ? "Emma kon geen betrouwbaar executieplan opstellen. Probeer opnieuw wanneer strategie is bijgewerkt."
          : "Emma could not prepare a reliable execution plan. Retry when strategy is updated.",
    };
  }

  const metadata = computePlanningCacheIdentity({
    project: input.project,
    strategyOutput: input.strategyOutput,
    brandLayerVersion: input.brandGraph?.version,
  });

  const output = mapPlanningGraphToBrainOutput({
    graph,
    campaignContext: input.campaignContext,
    validation,
    metadata,
    locale,
  });

  return {
    status: "completed",
    output,
    graph,
    reused: false,
  };
}

export function readPlanningGraphFromProject(project: MarketingProject): PlanningGraph | null {
  return readStoredCampaignPlanning(project)?.planningGraph ?? null;
}

export function readPlanningGraphFromOutputs(
  outputs: Partial<Record<string, BrainStructuredOutput>>
): PlanningGraph | null {
  const planning = outputs.campaign_planning;
  return planning?.planningGraph ?? null;
}
