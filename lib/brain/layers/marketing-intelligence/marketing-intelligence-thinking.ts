/**
 * Internal Marketing Intelligence thinking — Sprint 10.1.
 * Emma answers senior strategist questions before Strategy starts.
 * These records are internal; customers never see them directly.
 */

import type { ReasoningGraph, ReasoningNode } from "../reasoning/types";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";

export type MarketingIntelligenceThinkingId =
  | "who_is_this_company"
  | "why_customers_choose"
  | "emotional_problems"
  | "what_makes_different"
  | "where_trust_won"
  | "where_trust_lost"
  | "buyer_objections"
  | "buying_triggers"
  | "message_resonance"
  | "opportunities_that_matter"
  | "opportunities_distraction"
  | "dangerous_assumptions"
  | "missing_evidence"
  | "strategist_challenge";

export type MarketingIntelligenceThinkingRecord = {
  readonly id: MarketingIntelligenceThinkingId;
  readonly question: string;
  readonly answer: string;
  readonly confidence: number;
  readonly reasoningReferences: readonly string[];
  readonly supportingEvidence: readonly string[];
};

export const MARKETING_INTELLIGENCE_THINKING_QUESTIONS: readonly {
  id: MarketingIntelligenceThinkingId;
  en: string;
  nl: string;
}[] = [
  { id: "who_is_this_company", en: "Who is this company really?", nl: "Wie is dit bedrijf echt?" },
  {
    id: "why_customers_choose",
    en: "Why would customers choose them?",
    nl: "Waarom zouden klanten voor hen kiezen?",
  },
  {
    id: "emotional_problems",
    en: "What emotional problems are customers trying to solve?",
    nl: "Welke emotionele problemen proberen klanten op te lossen?",
  },
  {
    id: "what_makes_different",
    en: "What makes this company different?",
    nl: "Wat maakt dit bedrijf anders?",
  },
  { id: "where_trust_won", en: "Where is trust won?", nl: "Waar wordt vertrouwen gewonnen?" },
  { id: "where_trust_lost", en: "Where is trust lost?", nl: "Waar gaat vertrouwen verloren?" },
  { id: "buyer_objections", en: "What objections will buyers have?", nl: "Welke bezwaren krijgen kopers?" },
  { id: "buying_triggers", en: "What buying triggers exist?", nl: "Welke aankooptriggers bestaan?" },
  {
    id: "message_resonance",
    en: "What message will resonate most?",
    nl: "Welke boodschap resoneert het meest?",
  },
  {
    id: "opportunities_that_matter",
    en: "Which opportunities matter?",
    nl: "Welke kansen zijn echt relevant?",
  },
  {
    id: "opportunities_distraction",
    en: "Which opportunities are distractions?",
    nl: "Welke kansen zijn afleiding?",
  },
  {
    id: "dangerous_assumptions",
    en: "Which assumptions are dangerous?",
    nl: "Welke aannames zijn gevaarlijk?",
  },
  { id: "missing_evidence", en: "What evidence is still missing?", nl: "Welk bewijs ontbreekt nog?" },
  {
    id: "strategist_challenge",
    en: "What would a senior strategist challenge?",
    nl: "Wat zou een senior strategist uitdagen?",
  },
];

function findNode(graph: ReasoningGraph, id: string): ReasoningNode | undefined {
  const pools = [
    ...graph.businessModel,
    ...graph.marketPosition,
    ...graph.customerModel,
    ...graph.competitiveLandscape,
    ...graph.strengths,
    ...graph.weaknesses,
    ...graph.opportunities,
    ...graph.risks,
    ...graph.priorityInsights,
    ...graph.strategicThemes,
  ];
  return pools.find((n) => n.id === id);
}

function companyName(ctx: CampaignContext | null | undefined, graph: ReasoningGraph): string {
  return ctx?.companyName?.trim() || ctx?.brandName?.trim() || "this business";
}

function record(
  id: MarketingIntelligenceThinkingId,
  question: string,
  answer: string,
  confidence: number,
  refs: { reasoningReferences?: readonly string[]; supportingEvidence?: readonly string[] }
): MarketingIntelligenceThinkingRecord {
  return {
    id,
    question,
    answer,
    confidence,
    reasoningReferences: [...(refs.reasoningReferences ?? [])],
    supportingEvidence: [...(refs.supportingEvidence ?? [])],
  };
}

/** Build internal thinking records — the actual Marketing Intelligence process. */
export function buildMarketingIntelligenceThinking(input: {
  reasoningGraph: ReasoningGraph;
  campaignContext?: CampaignContext | null;
  locale?: "nl" | "en";
}): readonly MarketingIntelligenceThinkingRecord[] {
  const r = input.reasoningGraph;
  const nl = input.locale === "nl";
  const name = companyName(input.campaignContext, r);
  const goals = input.campaignContext?.goals.filter((g) => g.trim().length > 3) ?? [];
  const audience = input.campaignContext?.audience?.trim() ?? "";
  const goal = goals[0] ?? input.campaignContext?.description ?? "";

  const whatIsSold = findNode(r, "business:what-is-sold");
  const whoBuys = findNode(r, "business:who-buys") ?? findNode(r, "customer:icp");
  const differentiation = findNode(r, "business:differentiation");
  const marketPosition = r.marketPosition[0];
  const topOpportunity = r.opportunities[0];
  const topRisk = r.risks[0];

  const q = (id: MarketingIntelligenceThinkingId) => {
    const spec = MARKETING_INTELLIGENCE_THINKING_QUESTIONS.find((item) => item.id === id)!;
    return nl ? spec.nl : spec.en;
  };

  return [
    record(
      "who_is_this_company",
      q("who_is_this_company"),
      nl
        ? `${name} is geen generiek SaaS-bedrijf — het verkoopt ${whatIsSold?.description ?? "een oplossing die scherper moet"}. ${marketPosition ? `In de markt positioneert het zich als: ${marketPosition.description}.` : "Marktpositie is nog niet scherp genoeg om te verdedigen."}`
        : `${name} is not a generic SaaS vendor — it sells ${whatIsSold?.description ?? "a solution that still needs sharper definition"}. ${marketPosition ? `In the market it positions as: ${marketPosition.description}.` : "Market position is not yet sharp enough to defend."}`,
      whatIsSold?.confidence ?? 0.4,
      {
        reasoningReferences: whatIsSold ? [whatIsSold.id] : [],
        supportingEvidence: whatIsSold?.supportingEvidence ?? [],
      }
    ),
    record(
      "why_customers_choose",
      q("why_customers_choose"),
      nl
        ? `Klanten kiezen ${name} wanneer ${differentiation?.description ?? "het risico van de verkeerde keuze wegneemt"} — niet vanwege hype, maar vanwege vertrouwen in uitkomst vóór commitment.`
        : `Customers choose ${name} when ${differentiation?.description ?? "it removes the risk of choosing wrong"} — not because of hype, but because they trust the outcome before committing.`,
      differentiation?.confidence ?? 0.45,
      {
        reasoningReferences: differentiation ? [differentiation.id] : [],
        supportingEvidence: differentiation?.supportingEvidence ?? [],
      }
    ),
    record(
      "emotional_problems",
      q("emotional_problems"),
      nl
        ? `${name} adresseert vooral onzekerheid en controleverlies vóór aankoop. ${whoBuys ? `Voor ${whoBuys.description} voelt het als: "Ik wil zeker weten dat dit werkt voordat ik tijd investeer."` : "Doelgroep nog te vaag om emotionele drijfveren te benoemen."}`
        : `${name} addresses uncertainty and loss of control before purchase. ${whoBuys ? `For ${whoBuys.description} it feels like: "I need to know this works before I invest time."` : "Audience still too vague to name emotional drivers."}`,
      whoBuys?.confidence ?? 0.4,
      {
        reasoningReferences: whoBuys ? [whoBuys.id] : [],
        supportingEvidence: whoBuys?.supportingEvidence ?? [],
      }
    ),
    record(
      "what_makes_different",
      q("what_makes_different"),
      nl
        ? differentiation
          ? `${name} differentieert via ${differentiation.description} — dit is het enige dat niet makkelijk kopieerbaar is zolang het bewijs klopt.`
          : `${name} heeft nog geen scherp, verdedigbaar onderscheid t.o.v. alternatieven.`
        : differentiation
          ? `${name} differentiates through ${differentiation.description} — this is what competitors cannot easily copy if the proof holds.`
          : `${name} has no sharp, defensible difference versus alternatives yet.`,
      differentiation?.confidence ?? 0.35,
      {
        reasoningReferences: differentiation ? [differentiation.id] : [],
        supportingEvidence: differentiation?.supportingEvidence ?? [],
      }
    ),
    record(
      "where_trust_won",
      q("where_trust_won"),
      nl
        ? `Vertrouwen wint ${name} wanneer het bewijs levert vóór de verkoop — concrete context, peer-ervaring, geen beloftes zonder onderbouwing.`
        : `${name} wins trust when it proves value before the sale — concrete context, peer experience, no promises without proof.`,
      0.55,
      { reasoningReferences: r.strengths[0] ? [r.strengths[0].id] : [] }
    ),
    record(
      "where_trust_lost",
      q("where_trust_lost"),
      nl
        ? r.contradictions.length
          ? `Vertrouwen gaat verloren bij: ${r.contradictions.map((c) => c.description).join(" · ")}`
          : `Vertrouwen gaat verloren wanneer ${name} generieke marketingtaal gebruikt of beloftes doet zonder bewijs.`
        : r.contradictions.length
          ? `Trust is lost when: ${r.contradictions.map((c) => c.description).join(" · ")}`
          : `Trust is lost when ${name} uses generic marketing language or promises without proof.`,
      r.contradictions[0]?.confidence ?? 0.45,
      { reasoningReferences: r.contradictions.map((c) => c.id) }
    ),
    record(
      "buyer_objections",
      q("buyer_objections"),
      nl
        ? r.contradictions.length
          ? `Verwachte bezwaren: ${r.contradictions.map((c) => c.description).join(" · ")}`
          : `"Past dit bij ons?", "Is dit het juiste moment?", "Wat als het niet werkt?" — standaard bezwaren voor ${name}.`
        : r.contradictions.length
          ? `Expected objections: ${r.contradictions.map((c) => c.description).join(" · ")}`
          : `"Is this right for us?", "Is now the right time?", "What if it fails?" — standard objections for ${name}.`,
      0.5,
      { reasoningReferences: r.contradictions.map((c) => c.id) }
    ),
    record(
      "buying_triggers",
      q("buying_triggers"),
      nl
        ? `Triggers: ${goal || "concrete business pain"} + urgentie wanneer ${audience || "de doelgroep"} merkt dat huidige aanpak niet schaalt.`
        : `Triggers: ${goal || "concrete business pain"} + urgency when ${audience || "the audience"} realizes the current approach does not scale.`,
      goals.length ? 0.6 : 0.4,
      {}
    ),
    record(
      "message_resonance",
      q("message_resonance"),
      nl
        ? `${name} moet leiden met "${differentiation?.description ?? "concrete waarde"}" voor ${audience || (whoBuys?.description ?? "de doelgroep")} — geen awareness-slogans.`
        : `${name} must lead with "${differentiation?.description ?? "concrete value"}" for ${audience || (whoBuys?.description ?? "the audience")} — no awareness slogans.`,
      differentiation?.confidence ?? 0.5,
      {
        reasoningReferences: differentiation ? [differentiation.id] : [],
        supportingEvidence: differentiation?.supportingEvidence ?? [],
      }
    ),
    record(
      "opportunities_that_matter",
      q("opportunities_that_matter"),
      nl
        ? topOpportunity
          ? `Prioriteit: ${topOpportunity.description} — sluit aan op bevestigde pijn en doel "${goal}".`
          : `Nog geen bevestigde kans — eerst doelgroep en pijn scherper maken voor ${name}.`
        : topOpportunity
          ? `Priority: ${topOpportunity.description} — matches confirmed pain and goal "${goal}".`
          : `No confirmed opportunity yet — sharpen audience and pain for ${name} first.`,
      topOpportunity?.confidence ?? 0.35,
      {
        reasoningReferences: topOpportunity ? [topOpportunity.id] : [],
        supportingEvidence: topOpportunity?.supportingEvidence ?? [],
      }
    ),
    record(
      "opportunities_distraction",
      q("opportunities_distraction"),
      nl
        ? `Afwijzen: brede brand awareness, prijsoorlog, en kanalen zonder bewijs dat ${audience || "de doelgroep"} daar koopt.`
        : `Reject: broad brand awareness, price war, and channels with no proof that ${audience || "the audience"} buys there.`,
      0.7,
      {}
    ),
    record(
      "dangerous_assumptions",
      q("dangerous_assumptions"),
      nl
        ? r.assumptions.length
          ? `Gevaarlijk: ${r.assumptions.slice(0, 2).map((a) => a.description).join(" · ")}`
          : `Gevaarlijk: aannemen dat ${name} al bekend is bij ${audience || "de doelgroep"} zonder bewijs.`
        : r.assumptions.length
          ? `Dangerous: ${r.assumptions.slice(0, 2).map((a) => a.description).join(" · ")}`
          : `Dangerous: assuming ${name} is already known to ${audience || "the audience"} without proof.`,
      0.45,
      { reasoningReferences: r.assumptions.map((a) => a.id) }
    ),
    record(
      "missing_evidence",
      q("missing_evidence"),
      nl
        ? r.unknowns.length
          ? `Ontbreekt: ${r.unknowns.slice(0, 3).map((u) => u.title).join(", ")}`
          : `Ontbreekt: bevestigde conversiedata en expliciete klantbezwaren voor ${name}.`
        : r.unknowns.length
          ? `Missing: ${r.unknowns.slice(0, 3).map((u) => u.title).join(", ")}`
          : `Missing: confirmed conversion data and explicit customer objections for ${name}.`,
      0.35,
      { reasoningReferences: r.unknowns.map((u) => u.id) }
    ),
    record(
      "strategist_challenge",
      q("strategist_challenge"),
      nl
        ? topRisk
          ? `Senior strategist zou uitdagen: "${topRisk.description}" — en vragen of ${name} genoeg bewijs heeft vóór schaal.`
          : `Senior strategist zou vragen: "Waarom nu, waarom dit kanaal, en waarom geloven klanten ${name} boven alternatieven?"`
        : topRisk
          ? `A senior strategist would challenge: "${topRisk.description}" — and ask whether ${name} has enough proof before scaling.`
          : `A senior strategist would ask: "Why now, why this channel, and why should customers believe ${name} over alternatives?"`,
      topRisk?.confidence ?? 0.5,
      { reasoningReferences: topRisk ? [topRisk.id] : [] }
    ),
  ];
}
