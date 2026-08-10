import type { BrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import type { Decision } from "@/lib/brain/decision/decision-types";
import type { CreativeGraph } from "@/lib/brain/layers/creative/types";
import type { ExecutiveCampaignBriefing } from "@/lib/brain/presentation/executive-briefing";
import { customerTextOrFallback, sanitizeCustomerText } from "../sanitize";
import type { CampaignBriefSections, ExecutiveSummary } from "../types";
import { primaryCreativeMessaging, selectedCreativeCampaign } from "./creative-source";

function findingValue(output: BrainStructuredOutput | undefined, ...labels: string[]): string {
  if (!output) return "";
  for (const label of labels) {
    const match = output.findings.find((f) => f.label.toLowerCase() === label.toLowerCase());
    if (match?.value) return sanitizeCustomerText(match.value) ?? "";
  }
  return "";
}

/** Campaign brief sections — all from Creative Brain when available. */
export function publishCampaignBriefSections(input: {
  creative: CreativeGraph | null;
  strategy?: BrainStructuredOutput;
  decisions: readonly Decision[];
  briefing: ExecutiveCampaignBriefing | null;
  executiveSummary: ExecutiveSummary;
  nl: boolean;
}): CampaignBriefSections {
  const nl = input.nl;
  const creative = input.creative;
  const selected = creative ? selectedCreativeCampaign(creative) : null;
  const messaging = creative ? primaryCreativeMessaging(creative) : null;
  const primaryDecision = input.decisions.find((d) => d.category === "strategy_direction");
  const creativeDecision = creative?.decisions[0];

  const competitors = findingValue(input.strategy, "Competitors", "Concurrenten");
  const pages = findingValue(input.strategy, "Indexed pages", "Geïndexeerde pagina's");
  const usp = findingValue(input.strategy, "Strongest USP", "Sterkste USP");

  const researchFindings = creative
    ? customerTextOrFallback(
        [
          competitors
            ? nl
              ? `${competitors} geanalyseerd tijdens research.`
              : `${competitors} analysed during research.`
            : "",
          creative.reasoning.find((r) => r.phase === "understand_business")?.insight,
          pages
            ? nl
              ? `${pages} pagina's beoordeeld op positionering en contentkansen.`
              : `${pages} pages reviewed for positioning and content opportunities.`
            : "",
        ]
          .filter(Boolean)
          .join(" "),
        nl
          ? "Research bracht marktstructuur, concurrentie en website-inzichten samen."
          : "Research combined market structure, competition, and website insights."
      )
    : customerTextOrFallback(
        competitors && pages
          ? nl
            ? `Research ontdekte ${competitors} en ${pages} geïndexeerde pagina's.`
            : `Research discovered ${competitors} and ${pages} indexed pages.`
          : input.executiveSummary.whatWeDiscovered,
        input.executiveSummary.whatWeDiscovered
      );

  const objection = messaging?.objections[0];
  const audienceInsight = creative
    ? customerTextOrFallback(
        [
          selected?.targetAudience,
          creative.reasoning.find((r) => r.phase === "understand_audience")?.insight,
          objection
            ? nl
              ? `Belangrijk bezwaar: ${objection.objection} — ${objection.response}`
              : `Key objection: ${objection.objection} — ${objection.response}`
            : "",
        ]
          .filter(Boolean)
          .join(" "),
        nl
          ? "Doelgroep en motivatie zijn in kaart gebracht vóór creatieve keuzes."
          : "Audience and motivation were mapped before creative choices."
      )
    : customerTextOrFallback(
        primaryDecision?.summary,
        nl ? "Doelgroep met hoogste koopintentie geselecteerd." : "Audience with highest purchase intent selected."
      );

  const strategicDecision = creative
    ? customerTextOrFallback(
        creativeDecision?.summary ?? primaryDecision?.recommendation,
        nl
          ? "Strategische richting gekozen op basis van research en marketing intelligence."
          : "Strategic direction selected from research and marketing intelligence."
      )
    : customerTextOrFallback(
        primaryDecision?.recommendation,
        nl ? "Strategie vastgelegd." : "Strategy locked."
      );

  const creativeDirection = creative
    ? customerTextOrFallback(
        [
          creative.direction
            ? nl
              ? `Hoek: ${creative.direction.angle}. Emotionele trigger: ${creative.direction.emotion}.`
              : `Angle: ${creative.direction.angle}. Emotional trigger: ${creative.direction.emotion}.`
            : "",
          selected
            ? nl
              ? `Gekozen concept: "${selected.name}" — ${selected.keyMessage}`
              : `Selected concept: "${selected.name}" — ${selected.keyMessage}`
            : "",
          creative.discardedIdeas.length
            ? nl
              ? `${creative.discardedIdeas.length} alternatieven afgewezen om focus te behouden.`
              : `${creative.discardedIdeas.length} alternatives rejected to maintain focus.`
            : "",
        ]
          .filter(Boolean)
          .join(" "),
        nl ? "Creatieve richting vastgelegd." : "Creative direction established."
      )
    : customerTextOrFallback(
        usp ? (nl ? `Positionering rond: ${usp}` : `Positioning around: ${usp}`) : "",
        nl ? "Creatieve richting volgt strategie." : "Creative direction follows strategy."
      );

  const expectedBusinessImpact = creative
    ? customerTextOrFallback(
        selected?.estimatedImpact ?? creative.estimatedBusinessImpact,
        input.executiveSummary.expectedBusinessImpact
      )
    : input.executiveSummary.expectedBusinessImpact;

  const nextRecommendation = creative
    ? customerTextOrFallback(
        input.briefing?.requiredDecisions[0] ??
          (nl
            ? "Keur het campagneconcept goed zodat publicatie kan starten."
            : "Approve the campaign concept so publishing can begin."),
        input.executiveSummary.whatHappensNext
      )
    : input.executiveSummary.whatHappensNext;

  const executiveSummary = creative
    ? customerTextOrFallback(
        [
          input.executiveSummary.whatWeDiscovered,
          creative.direction?.rationale,
          selected ? (nl ? `Concept "${selected.name}" geselecteerd.` : `Concept "${selected.name}" selected.`) : "",
        ]
          .filter(Boolean)
          .join(" "),
        input.executiveSummary.narrative
      )
    : input.executiveSummary.whatWeDiscovered;

  return {
    executiveSummary,
    researchFindings,
    audienceInsight,
    strategicDecision,
    creativeDirection,
    expectedBusinessImpact,
    nextRecommendation,
  };
}
