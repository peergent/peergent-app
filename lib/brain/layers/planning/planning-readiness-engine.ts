import type { BrandGraph } from "../brand/types";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { DecisionCollection } from "../../decision/decision-types";
import type { MarketingIntelligenceGraph } from "../marketing-intelligence/types";
import type { ReasoningGraph } from "../reasoning/types";
import type { ResearchGraph } from "../research/types";
import type { StrategyGraph } from "../../strategy/strategy-graph";
import type { PlanningReadinessAssessment, PlanningReadinessLevel } from "./types";

export type ReadinessEngineInput = {
  strategyGraph: StrategyGraph;
  decisionCollection: DecisionCollection;
  campaignContext: CampaignContext;
  brandGraph?: BrandGraph | null;
  marketingIntelligence?: MarketingIntelligenceGraph | null;
  reasoningGraph?: ReasoningGraph | null;
  researchGraph?: ResearchGraph | null;
  locale: "nl" | "en";
  missingRequirements: readonly string[];
};

function levelFromScore(score: number): PlanningReadinessLevel {
  if (score >= 0.85) return "ready";
  if (score >= 0.65) return "mostly_ready";
  if (score >= 0.4) return "waiting";
  return "blocked";
}

/** Evaluate execution readiness — never fabricate, always explain. */
export function assessPlanningReadiness(input: ReadinessEngineInput): PlanningReadinessAssessment {
  const nl = input.locale === "nl";
  const checks: {
    id: string;
    question: string;
    passed: boolean;
    explanation: string;
  }[] = [];

  const businessUnderstood =
    input.strategyGraph.businessSummary.description.length > 20 &&
    !/unknown|onbekend/i.test(input.strategyGraph.businessSummary.description);
  checks.push({
    id: "business_understanding",
    question: nl ? "Begrijp ik het bedrijf?" : "Do I understand the business?",
    passed: businessUnderstood,
    explanation: businessUnderstood
      ? input.strategyGraph.businessSummary.description
      : nl
        ? "Bedrijfscontext is nog te dun voor zelfverzekerde executie."
        : "Business context is still too thin for confident execution.",
  });

  const audienceUnderstood =
    input.strategyGraph.primaryAudience.confidence !== "low" &&
    input.strategyGraph.primaryAudience.description.length > 10;
  checks.push({
    id: "audience_understanding",
    question: nl ? "Begrijp ik de doelgroep?" : "Do I understand the audience?",
    passed: audienceUnderstood,
    explanation: audienceUnderstood
      ? input.strategyGraph.primaryAudience.description
      : nl
        ? "Doelgroep is nog niet scherp genoeg."
        : "Audience is not yet sharp enough.",
  });

  const brandComplete = input.brandGraph
    ? input.brandGraph.model.facts.some((f) => f.knowledgeStatus === "validated" || f.confidence >= 0.65)
    : input.strategyGraph.strategicPositioning.confidence !== "low";
  checks.push({
    id: "brand_completeness",
    question: nl ? "Is Brand Brain voldoende compleet?" : "Is Brand Brain sufficiently complete?",
    passed: brandComplete,
    explanation: brandComplete
      ? nl
        ? "Positionering en merkcontext zijn bruikbaar voor executie."
        : "Positioning and brand context are usable for execution."
      : nl
        ? "Merkcontext mist bevestigde feiten — creative en ads riskeren inconsistentie."
        : "Brand context lacks confirmed facts — creative and ads risk inconsistency.",
  });

  const hasApproval = input.decisionCollection.decisions.some((d) => d.approvalRequired);
  const strategyApproved = input.decisionCollection.decisions.some(
    (d) => d.category === "strategy_direction" && d.confidence !== "low"
  );
  checks.push({
    id: "customer_approval",
    question: nl ? "Heb ik klantgoedkeuring?" : "Do I have customer approval?",
    passed: !hasApproval || strategyApproved,
    explanation: hasApproval
      ? nl
        ? "Strategiebeslissing wacht op klantbevestiging vóór publicatie."
        : "Strategy decision awaits customer confirmation before publication."
      : nl
        ? "Geen goedkeuringsgate vereist voor deze campagne."
        : "No approval gate required for this campaign.",
  });

  const hasObjectives =
    input.campaignContext.goals.filter((g) => g.trim().length > 3).length > 0 ||
    input.campaignContext.description.trim().length > 5;
  checks.push({
    id: "campaign_objectives",
    question: nl ? "Heb ik campagnedoelen?" : "Do I have campaign objectives?",
    passed: hasObjectives,
    explanation: hasObjectives
      ? input.campaignContext.goals.join(" · ") || input.campaignContext.description
      : nl
        ? "Campagnedoel ontbreekt."
        : "Campaign goal missing.",
  });

  const hasDestination = Boolean(
    input.campaignContext.websiteUrl?.trim() ||
      (input.researchGraph?.website.length ?? 0) > 0
  );
  checks.push({
    id: "destination_pages",
    question: nl ? "Heb ik bestemmingspagina's?" : "Do I have destination pages?",
    passed: hasDestination,
    explanation: hasDestination
      ? nl
        ? "Website/landing context beschikbaar — optimalisatie kan nog nodig zijn."
        : "Website/landing context available — optimization may still be needed."
      : nl
        ? "Geen bevestigde landing page — paid traffic riskeert conversieverlies."
        : "No confirmed landing page — paid traffic risks conversion loss.",
  });

  const hasTracking = input.missingRequirements.every((r) => !/tracking|pixel/i.test(r));
  checks.push({
    id: "tracking",
    question: nl ? "Heb ik tracking?" : "Do I have tracking?",
    passed: hasTracking,
    explanation: hasTracking
      ? nl
        ? "Tracking vereist voor performance review — nog te bevestigen bij launch."
        : "Tracking required for performance review — still to confirm at launch."
      : nl
        ? "Tracking ontbreekt — performance review wordt onbetrouwbaar."
        : "Tracking missing — performance review will be unreliable.",
  });

  const hasIntegrations = input.campaignContext.selectedChannels.length > 0;
  checks.push({
    id: "integrations",
    question: nl ? "Heb ik integraties?" : "Do I have integrations?",
    passed: hasIntegrations,
    explanation: hasIntegrations
      ? input.campaignContext.selectedChannels.join(", ")
      : nl
        ? "Kanalen nog te bevestigen — integraties niet gevalideerd."
        : "Channels still to confirm — integrations not validated.",
  });

  const confidenceOk = input.decisionCollection.decisions.every((d) => d.confidence !== "low");
  checks.push({
    id: "confidence",
    question: nl ? "Heb ik voldoende vertrouwen?" : "Do I have enough confidence?",
    passed: confidenceOk,
    explanation: confidenceOk
      ? nl
        ? "Beslissingen hebben voldoende confidence voor executie."
        : "Decisions have sufficient confidence for execution."
      : nl
        ? "Eén of meer beslissingen hebben lage confidence — extra review aanbevolen."
        : "One or more decisions have low confidence — extra review recommended.",
  });

  const passed = checks.filter((c) => c.passed).length;
  const score = passed / checks.length;
  const level = levelFromScore(score);

  const blockers = checks.filter((c) => !c.passed).map((c) => c.explanation);
  const waitingFor = input.missingRequirements.slice(0, 5);

  const summary =
    level === "ready"
      ? nl
        ? "Emma kan executie starten zodra jij de campagne bevestigt."
        : "Emma can begin execution once you confirm the campaign."
      : level === "mostly_ready"
        ? nl
          ? "Executie kan starten met enkele open punten — Emma legt ze uit vóór launch."
          : "Execution can start with a few open items — Emma explains them before launch."
        : level === "waiting"
          ? nl
            ? "Emma wacht op input of assets vóór launch."
            : "Emma is waiting on input or assets before launch."
          : nl
            ? "Executie is geblokkeerd tot kritieke vereisten zijn opgelost."
            : "Execution is blocked until critical requirements are resolved.";

  return {
    level,
    score,
    summary,
    blockers,
    waitingFor,
    checks,
  };
}
