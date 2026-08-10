import type { BrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import type { ExecutiveCampaignBriefing } from "@/lib/brain/presentation/executive-briefing";
import type { Decision } from "@/lib/brain/decision/decision-types";
import type { PlanningGraph } from "@/lib/brain/layers/planning/types";
import type { CreativeGraph } from "@/lib/brain/layers/creative/types";
import type { ValidationGraph } from "@/lib/brain/layers/validation/types";
import { customerTextOrFallback } from "../sanitize";
import type { ExecutiveSummary } from "../types";
import { primaryCreativeMessaging, selectedCreativeCampaign } from "./creative-source";
import { publicationReadinessLabel } from "./validation-source";

function finding(output: BrainStructuredOutput | undefined, label: string): string {
  return output?.findings.find((f) => f.label.toLowerCase() === label.toLowerCase())?.value ?? "";
}

export function publishExecutiveSummary(input: {
  briefing: ExecutiveCampaignBriefing | null;
  strategy?: BrainStructuredOutput;
  creative?: CreativeGraph | null;
  validation?: ValidationGraph | null;
  decisions: readonly Decision[];
  planningGraph?: PlanningGraph | null;
  nl: boolean;
  companyName: string;
  fallbackGoal?: string;
}): ExecutiveSummary {
  const nl = input.nl;
  const creative = input.creative;
  const validation = input.validation;
  const selected = creative ? selectedCreativeCampaign(creative) : null;
  const messaging = creative ? primaryCreativeMessaging(creative) : null;
  const primaryDecision = input.decisions.find((d) => d.category === "strategy_direction");
  const creativeDecision = creative?.decisions[0];
  const execSection = input.briefing?.sections.find((s) => s.id === "executive-summary");
  const impactSection = input.briefing?.sections.find((s) => s.id === "business-impact");

  const competitorCount =
    finding(input.strategy, nl ? "Concurrenten" : "Competitors") ||
    finding(input.strategy, "Competitor count");
  const pagesIndexed =
    finding(input.strategy, nl ? "Geïndexeerde pagina's" : "Indexed pages") ||
    finding(input.strategy, "Website pages");

  const whatWeDiscovered = creative
    ? customerTextOrFallback(
        [
          competitorCount && pagesIndexed
            ? nl
              ? `Research analyseerde ${competitorCount} en ${pagesIndexed} pagina's — Emma vond positioneringsgaten.`
              : `Research analysed ${competitorCount} and ${pagesIndexed} pages — Emma found positioning gaps.`
            : creative.reasoning.find((r) => r.phase === "understand_business")?.insight,
          creative.discardedIdeas.length
            ? nl
              ? `${creative.discardedIdeas.length} zwakke positioneringshoeken afgewezen.`
              : `${creative.discardedIdeas.length} weak positioning angles rejected.`
            : "",
        ]
          .filter(Boolean)
          .join(" "),
        nl
          ? `Emma analyseerde markt en positionering voor ${input.companyName}.`
          : `Emma analysed market and positioning for ${input.companyName}.`
      )
    : customerTextOrFallback(
        competitorCount && pagesIndexed
          ? nl
            ? `Research ontdekte ${competitorCount} en ${pagesIndexed} geïndexeerde pagina's.`
            : `Research discovered ${competitorCount} and ${pagesIndexed} indexed pages.`
          : execSection?.summary,
        nl
          ? `Research analyseerde je markt en concurrentiepositie voor ${input.companyName}.`
          : `Research analysed your market and competitive position for ${input.companyName}.`
      );

  const whyItMatters = creative
    ? customerTextOrFallback(
        creative.direction?.rationale ?? selected?.businessValue,
        nl
          ? "Positionering bepaalt of je opvalt vóór concurrenten op prijs."
          : "Positioning determines whether you stand out before competitors compete on price."
      )
    : customerTextOrFallback(
        primaryDecision?.businessImpact ?? impactSection?.summary,
        nl
          ? "Positionering bepaalt of je opvalt vóór Q4-budgetbeslissingen."
          : "Positioning determines whether you stand out before Q4 budget decisions."
      );

  const decisionMade = creative
    ? customerTextOrFallback(
        selected
          ? nl
            ? `Emma koos "${selected.name}" — ${selected.keyMessage}`
            : `Emma selected "${selected.name}" — ${selected.keyMessage}`
          : creativeDecision?.selectedDirection,
        nl
          ? "Creatieve richting vastgelegd op basis van research en strategie."
          : "Creative direction locked based on research and strategy."
      )
    : customerTextOrFallback(
        primaryDecision?.recommendation ?? input.briefing?.recommendationSummary,
        nl
          ? "Strategie koos de sterkste groeikans op basis van research."
          : "Strategy selected the strongest growth path based on research."
      );

  const whatHappensNext = validation
    ? validation.report.publicationReadiness === "BLOCKED" ||
      validation.report.publicationReadiness === "CHANGES_REQUIRED"
      ? customerTextOrFallback(
          null,
          nl
            ? "Emma moet revisies doorvoeren voordat goedkeuring kan starten."
            : "Emma must apply revisions before approval can begin."
        )
      : customerTextOrFallback(
          validation.report.warnings[0]?.reason
            ? nl
              ? `Goedkeuring resterend — ${validation.report.warnings.length} niet-blokkerende waarschuwing.`
              : `Approval remains — ${validation.report.warnings.length} non-blocking warning.`
            : null,
          nl
            ? "Eén goedkeuring resterend — kwaliteitsreview geslaagd."
            : "One approval remains — quality review passed."
        )
    : creative
    ? customerTextOrFallback(
        messaging?.cta
          ? nl
            ? `Volgende stap: keur het concept goed — daarna start ${messaging.cta.toLowerCase()}.`
            : `Next step: approve the concept — then ${messaging.cta.toLowerCase()}.`
          : "",
        nl
          ? "Eén goedkeuring resterend voordat publicatie kan starten."
          : "One approval remains before publishing can begin."
      )
    : customerTextOrFallback(
        input.briefing?.sections.find((s) => s.id === "customer-needs")?.summary,
        nl
          ? "Eén goedkeuring resterend voordat publicatie kan starten."
          : "One approval remains before publishing can begin."
      );

  const expectedBusinessImpact = creative
    ? customerTextOrFallback(
        selected?.estimatedImpact ?? creative.estimatedBusinessImpact ?? primaryDecision?.expectedOutcome,
        nl ? "Verwachte impact: meetbare groei in gekwalificeerde leads." : "Expected impact: measurable growth in qualified leads."
      )
    : customerTextOrFallback(
        primaryDecision?.expectedOutcome ?? impactSection?.summary,
        nl ? "Verwachte impact: meetbare groei in gekwalificeerde leads." : "Expected impact: measurable growth in qualified leads."
      );

  const biggestOpportunity = creative
    ? customerTextOrFallback(
        selected?.businessValue,
        nl ? "Onderbediende marktsegmenten met hogere koopintentie." : "Underserved market segments with higher purchase intent."
      )
    : "";

  const biggestRisk = creative
    ? customerTextOrFallback(
        creative.discardedIdeas.find((d) => d.phase === "find_positioning")?.reason,
        nl ? "Prijsconcurrentie als positionering te generiek blijft." : "Price competition if positioning stays generic."
      )
    : "";

  const validationNote = validation
    ? nl
      ? `Het campagneconcept doorstond Peergents kwaliteitsreview met ${validation.report.overallScore.value}/100. ${publicationReadinessLabel(validation.report.publicationReadiness, true)}.${
          validation.report.warnings.length
            ? ` ${validation.report.warnings.length} niet-blokkerende waarschuwing resterend.`
            : ""
        }`
      : `The campaign concept passed Peergent's quality review with a ${validation.report.overallScore.value}/100 score. ${publicationReadinessLabel(validation.report.publicationReadiness, false)}.${
          validation.report.warnings.length
            ? ` ${validation.report.warnings.length} non-blocking warning${validation.report.warnings.length === 1 ? "" : "s"} remain before publication.`
            : ""
        }`
    : "";

  const narrativeParts = [
    whatWeDiscovered,
    whyItMatters,
    decisionMade,
    validationNote,
    whatHappensNext,
    expectedBusinessImpact,
    biggestOpportunity ? (nl ? `Grootste kans: ${biggestOpportunity}` : `Biggest opportunity: ${biggestOpportunity}`) : "",
    biggestRisk ? (nl ? `Grootste risico: ${biggestRisk}` : `Biggest risk: ${biggestRisk}`) : "",
  ].filter(Boolean);

  return {
    whatWeDiscovered,
    whyItMatters,
    decisionMade,
    whatHappensNext,
    expectedBusinessImpact,
    narrative: narrativeParts.join(" "),
  };
}

export function publishCampaignNarrative(input: {
  executiveSummary: ExecutiveSummary;
  decisions: readonly Decision[];
  briefing: ExecutiveCampaignBriefing | null;
  statusLabel: string;
  nl: boolean;
  fallbackGoal?: string;
  creative?: CreativeGraph | null;
}): import("../types").CampaignNarrative {
  const nl = input.nl;
  const selected = input.creative ? selectedCreativeCampaign(input.creative) : null;
  const primary = input.decisions.find((d) => d.category === "strategy_direction");

  const businessGoal = customerTextOrFallback(
    selected?.objective ?? primary?.summary ?? input.fallbackGoal,
    nl ? "Groei in gekwalificeerde leads" : "Grow qualified leads"
  );

  const currentStatus = customerTextOrFallback(
    selected
      ? nl
        ? `Concept "${selected.name}" klaar voor goedkeuring. Status: ${input.statusLabel}.`
        : `Concept "${selected.name}" ready for approval. Status: ${input.statusLabel}.`
      : input.briefing?.sections.find((s) => s.id === "executive-summary")?.summary?.split(".")[1],
    nl ? `Status: ${input.statusLabel}.` : `Status: ${input.statusLabel}.`
  );

  const expectedImpact = input.executiveSummary.expectedBusinessImpact;
  const nextDecision = customerTextOrFallback(
    input.briefing?.requiredDecisions[0] ?? primary?.recommendation,
    nl ? "Keur de campagne-aanpak goed om publicatie te starten." : "Approve the campaign approach to begin publishing."
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
