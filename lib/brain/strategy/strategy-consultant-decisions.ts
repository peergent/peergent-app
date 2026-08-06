import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { MarketingIntelligenceGraph } from "../layers/marketing-intelligence/types";
import type { RejectedAlternative, StrategyDecisionRecord, StrategySection } from "./strategy-graph";

/** Build consultant-grade decision record — every recommendation explains why. Sprint 10.1. */
export function buildConsultantDecisionRationale(input: {
  recommendedDirection: StrategySection;
  rejectedAlternatives: readonly RejectedAlternative[];
  strategicRisks: readonly StrategySection[];
  unknowns: readonly StrategySection[];
  successCriteria: StrategySection;
  buyingTriggers: StrategySection;
  differentiators: StrategySection;
  campaignContext: CampaignContext;
  marketingIntelligence?: MarketingIntelligenceGraph | null;
  locale: "nl" | "en";
}): StrategyDecisionRecord {
  const nl = input.locale === "nl";
  const name = input.campaignContext.companyName;
  const mi = input.marketingIntelligence;
  const primary = input.recommendedDirection;

  const why = nl
    ? `Waarom: ${mi?.buyingMotivation.narrative ?? primary.description}`
    : `Why: ${mi?.buyingMotivation.narrative ?? primary.description}`;

  const whyNow = nl
    ? `Waarom nu: ${mi?.emotionalDrivers.narrative ?? input.buyingTriggers.description}`
    : `Why now: ${mi?.emotionalDrivers.narrative ?? input.buyingTriggers.description}`;

  const whyCompany = nl
    ? `Waarom ${name}: ${mi?.competitiveAdvantage.narrative ?? input.differentiators.description}`
    : `Why ${name}: ${mi?.competitiveAdvantage.narrative ?? input.differentiators.description}`;

  const whyNot = nl
    ? `Waarom niet anders: ${input.rejectedAlternatives[0]?.reason ?? mi?.antiPatterns[0]?.narrative ?? "Generieke awareness afgewezen."}`
    : `Why not another approach: ${input.rejectedAlternatives[0]?.reason ?? mi?.antiPatterns[0]?.narrative ?? "Generic awareness rejected."}`;

  const businessImpact = nl
    ? `Business impact: ${input.successCriteria.description}`
    : `Business impact: ${input.successCriteria.description}`;

  return {
    decision: primary.description,
    reason: [why, whyNow, whyCompany, whyNot, businessImpact].join(" "),
    evidence: primary.supportingEvidence,
    alternativesConsidered: input.rejectedAlternatives.map((a) => a.alternative),
    alternativesRejected: [...input.rejectedAlternatives],
    confidence: primary.confidence,
    risks: input.strategicRisks.map((r) => r.title),
    unknowns: input.unknowns.map((u) => u.title),
    futureValidation: nl
      ? "Valideer na eerste campagneresultaten en klantfeedback — geen herschrijving zonder nieuw bewijs."
      : "Validate after first campaign results and customer feedback — no rewrite without new evidence.",
  };
}

export function enrichRecommendedDirection(input: {
  section: StrategySection;
  companyName: string;
  audience: string;
  goal: string;
  mi?: MarketingIntelligenceGraph | null;
  locale: "nl" | "en";
}): StrategySection {
  const nl = input.locale === "nl";
  const { mi, companyName, audience, goal } = input;

  const description = nl
    ? [
        `${companyName} richt zich op ${audience} met als businessdoel: ${goal}.`,
        mi ? `Waarom dit werkt voor ${companyName}: ${mi.competitiveAdvantage.narrative}` : "",
        mi ? `Waarom nu: ${mi.emotionalDrivers.narrative}` : "",
        mi ? `Waarom niet brede awareness: ${mi.antiPatterns[0]?.narrative ?? ""}` : "",
      ]
        .filter(Boolean)
        .join(" ")
    : [
        `${companyName} focuses on ${audience} with business objective: ${goal}.`,
        mi ? `Why this works for ${companyName}: ${mi.competitiveAdvantage.narrative}` : "",
        mi ? `Why now: ${mi.emotionalDrivers.narrative}` : "",
        mi ? `Why not broad awareness: ${mi.antiPatterns[0]?.narrative ?? ""}` : "",
      ]
        .filter(Boolean)
        .join(" ");

  return {
    ...input.section,
    description: description || input.section.description,
  };
}

export function mergeRejectedAlternatives(
  fromReasoning: RejectedAlternative[],
  fromMi: RejectedAlternative[]
): RejectedAlternative[] {
  const seen = new Set<string>();
  const merged: RejectedAlternative[] = [];
  for (const item of [...fromReasoning, ...fromMi]) {
    const key = item.alternative.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged.slice(0, 5);
}
