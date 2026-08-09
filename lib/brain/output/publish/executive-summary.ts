import type { BrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import type { ExecutiveCampaignBriefing } from "@/lib/brain/presentation/executive-briefing";
import type { Decision } from "@/lib/brain/decision/decision-types";
import type { PlanningGraph } from "@/lib/brain/layers/planning/types";
import { customerTextOrFallback } from "../sanitize";
import type { ExecutiveSummary } from "../types";

function finding(output: BrainStructuredOutput | undefined, label: string): string {
  return output?.findings.find((f) => f.label.toLowerCase() === label.toLowerCase())?.value ?? "";
}

export function publishExecutiveSummary(input: {
  briefing: ExecutiveCampaignBriefing | null;
  strategy?: BrainStructuredOutput;
  decisions: readonly Decision[];
  planningGraph?: PlanningGraph | null;
  nl: boolean;
  companyName: string;
  fallbackGoal?: string;
}): ExecutiveSummary {
  const nl = input.nl;
  const primaryDecision = input.decisions.find((d) => d.category === "strategy_direction");
  const execSection = input.briefing?.sections.find((s) => s.id === "executive-summary");
  const impactSection = input.briefing?.sections.find((s) => s.id === "business-impact");
  const approvalSection = input.briefing?.sections.find((s) => s.id === "approval-summary");

  const competitorCount =
    finding(input.strategy, nl ? "Concurrenten" : "Competitors") ||
    finding(input.strategy, "Competitor count");
  const pagesIndexed =
    finding(input.strategy, nl ? "Geïndexeerde pagina's" : "Indexed pages") ||
    finding(input.strategy, "Website pages");

  const whatWeDiscovered = customerTextOrFallback(
    competitorCount && pagesIndexed
      ? nl
        ? `Research ontdekte ${competitorCount} concurrenten en ${pagesIndexed} geïndexeerde pagina's.`
        : `Research discovered ${competitorCount} competitors and ${pagesIndexed} indexed pages.`
      : execSection?.summary,
    nl
      ? `Research analyseerde je markt en concurrentiepositie voor ${input.companyName}.`
      : `Research analysed your market and competitive position for ${input.companyName}.`
  );

  const whyItMatters = customerTextOrFallback(
    primaryDecision?.businessImpact ?? impactSection?.summary,
    nl
      ? "Positionering bepaalt of je opvalt vóór Q4-budgetbeslissingen."
      : "Positioning determines whether you stand out before Q4 budget decisions."
  );

  const decisionMade = customerTextOrFallback(
    primaryDecision?.recommendation ?? input.briefing?.recommendationSummary,
    nl
      ? "Strategie koos de sterkste groeikans op basis van research."
      : "Strategy selected the strongest growth path based on research."
  );

  const whatHappensNext = customerTextOrFallback(
    input.briefing?.sections.find((s) => s.id === "customer-needs")?.summary,
    nl
      ? "Eén goedkeuring resterend voordat publicatie kan starten."
      : "One approval remains before publishing can begin."
  );

  const expectedBusinessImpact = customerTextOrFallback(
    primaryDecision?.expectedOutcome ?? impactSection?.summary,
    nl ? "Verwachte impact: meetbare groei in gekwalificeerde leads." : "Expected impact: measurable growth in qualified leads."
  );

  const narrative = [
    whatWeDiscovered,
    whyItMatters,
    decisionMade,
    whatHappensNext,
    expectedBusinessImpact,
  ].join(" ");

  return {
    whatWeDiscovered,
    whyItMatters,
    decisionMade,
    whatHappensNext,
    expectedBusinessImpact,
    narrative,
  };
}

export function publishCampaignNarrative(input: {
  executiveSummary: ExecutiveSummary;
  decisions: readonly Decision[];
  briefing: ExecutiveCampaignBriefing | null;
  statusLabel: string;
  nl: boolean;
  fallbackGoal?: string;
}): import("../types").CampaignNarrative {
  const nl = input.nl;
  const primary = input.decisions.find((d) => d.category === "strategy_direction");
  const businessGoal = customerTextOrFallback(
    primary?.summary ?? input.fallbackGoal,
    nl ? "Groei in gekwalificeerde leads vóór het budgetseizoen" : "Grow qualified leads before budget season"
  );

  const currentStatus = customerTextOrFallback(
    input.briefing?.sections.find((s) => s.id === "executive-summary")?.summary?.split(".")[1],
    nl ? `Status: ${input.statusLabel}.` : `Status: ${input.statusLabel}.`
  );

  const expectedImpact = input.executiveSummary.expectedBusinessImpact;
  const nextDecision = customerTextOrFallback(
    input.briefing?.requiredDecisions[0] ?? primary?.recommendation,
    nl
      ? "Keur de campagne-aanpak goed om publicatie te starten."
      : "Approve the campaign approach to begin publishing."
  );

  return {
    executiveSummary: input.executiveSummary,
    sections: {
      businessGoal,
      currentStatus,
      expectedImpact,
      nextDecision,
    },
  };
}
