import type { ReasoningGraph, ReasoningNode } from "../reasoning/types";
import type { ResearchGraph } from "../research/types";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import {
  MARKETING_INTELLIGENCE_LAYER_VERSION,
  type MarketingIntelligenceGraph,
  type MarketingIntelligenceInsight,
} from "./types";
import { buildMarketingIntelligenceThinking } from "./marketing-intelligence-thinking";

export type BuildMarketingIntelligenceInput = {
  reasoningGraph: ReasoningGraph;
  researchGraph?: ResearchGraph | null;
  campaignContext?: CampaignContext | null;
  locale?: "nl" | "en";
  createdAt?: string;
};

function insightFromNode(
  id: string,
  title: string,
  node: ReasoningNode | undefined,
  narrative: string,
  createdAt: string
): MarketingIntelligenceInsight {
  return {
    id,
    title,
    narrative,
    confidence: node?.confidence ?? 0.35,
    supportingEvidence: node ? [...node.supportingEvidence] : [],
    reasoningReferences: node ? [node.id] : [],
    marketingIntelligenceVersion: MARKETING_INTELLIGENCE_LAYER_VERSION,
    createdAt,
  };
}

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

/** Deterministic marketing thinking from ReasoningGraph — no LLM, no ads. */
export function buildMarketingIntelligenceGraph(
  input: BuildMarketingIntelligenceInput
): MarketingIntelligenceGraph {
  const { reasoningGraph: r } = input;
  const nl = input.locale === "nl";
  const createdAt = input.createdAt ?? new Date().toISOString();
  const name = companyName(input.campaignContext, r);
  const goals = input.campaignContext?.goals.filter((g) => g.trim().length > 3) ?? [];
  const campaignGoal = goals[0] ?? input.campaignContext?.description ?? "";

  const whatIsSold = findNode(r, "business:what-is-sold");
  const whoBuys = findNode(r, "business:who-buys") ?? findNode(r, "customer:icp");
  const differentiation = findNode(r, "business:differentiation");
  const marketPosition = r.marketPosition[0];

  const internalThinking = buildMarketingIntelligenceThinking({
    reasoningGraph: r,
    campaignContext: input.campaignContext,
    locale: input.locale,
  });

  const thinkingAnswer = (id: (typeof internalThinking)[number]["id"]) =>
    internalThinking.find((t) => t.id === id)?.answer ?? "";

  const businessReality = insightFromNode(
    "mi:business-reality",
    nl ? "Wie is dit bedrijf echt?" : "Who is this business really?",
    whatIsSold,
    thinkingAnswer("who_is_this_company") ||
      (nl
        ? `${name} verkoopt ${whatIsSold?.description ?? "een oplossing die nog scherper moet worden beschreven"}.`
        : `${name} sells ${whatIsSold?.description ?? "a solution that still needs sharper definition"}.`),
    createdAt
  );

  const primaryPainNarrative =
    thinkingAnswer("emotional_problems") ||
    (nl
      ? whoBuys
        ? `${name} helpt kopers die ${whoBuys.description.toLowerCase()} — het acute probleem is onzekerheid vóór commitment, niet generieke groei.`
        : `Het primaire pijnpunt voor ${name} is nog onbekend — campagne moet eerst probleem scherp krijgen.`
      : whoBuys
        ? `${name} helps buyers who ${whoBuys.description.toLowerCase()} — the acute pain is uncertainty before commitment, not generic growth.`
        : `The primary pain for ${name} is still unknown — the campaign must sharpen the problem first.`);

  const primaryPain = insightFromNode(
    "mi:primary-pain",
    nl ? "Welk probleem doet het meeste pijn?" : "What problem hurts most?",
    whoBuys,
    primaryPainNarrative,
    createdAt
  );

  const buyingMotivation = insightFromNode(
    "mi:buying-motivation",
    nl ? "Waarom zouden klanten kopen?" : "Why would customers buy?",
    r.priorityInsights[0],
    thinkingAnswer("why_customers_choose") ||
      (nl
        ? `${name} wint wanneer het risico van de verkeerde keuze wegneemt: ${differentiation?.description ?? "duidelijk resultaat vóór commitment"}.`
        : `${name} wins when it removes the risk of choosing wrong: ${differentiation?.description ?? "clear outcome before commitment"}.`),
    createdAt
  );

  const emotionalDrivers = insightFromNode(
    "mi:emotional-drivers",
    nl ? "Welke emoties sturen aankoop?" : "What emotions drive buying?",
    r.customerModel[0],
    nl
      ? `Vertrouwen, controle en het gevoel dat ${name} de situatie begrijpt — niet hype. ${r.customerModel[0]?.description ?? ""}`.trim()
      : `Trust, control, and the feeling that ${name} understands their situation — not hype. ${r.customerModel[0]?.description ?? ""}`.trim(),
    createdAt
  );

  const objections = insightFromNode(
    "mi:objections",
    nl ? "Welke bezwaren bestaan?" : "What objections exist?",
    r.contradictions[0],
    nl
      ? r.contradictions.length
        ? `Verwachte weerstand: ${r.contradictions.map((c) => c.description).join(" · ")}`
        : `Geen bevestigde bezwaren — maar onzekerheid over ROI en fit blijft zichtbaar voor ${name}.`
      : r.contradictions.length
        ? `Expected resistance: ${r.contradictions.map((c) => c.description).join(" · ")}`
        : `No confirmed objections — but uncertainty about ROI and fit remains visible for ${name}.`,
    createdAt
  );

  const strongestPositioning = insightFromNode(
    "mi:strongest-positioning",
    nl ? "Welke positionering voelt het sterkst?" : "What positioning feels strongest?",
    marketPosition,
    nl
      ? marketPosition
        ? `Voor ${name} werkt "${marketPosition.title}" het sterkst: ${marketPosition.description} — omdat het aansluit op bevestigde context, niet op generieke innovator-taal.`
        : `Positionering voor ${name} is nog niet sterk genoeg om te verdedigen — meer bewijs nodig.`
      : marketPosition
        ? `For ${name}, "${marketPosition.title}" is strongest: ${marketPosition.description} — because it matches confirmed context, not generic innovator language.`
        : `Positioning for ${name} is not yet strong enough to defend — more evidence needed.`,
    createdAt
  );

  const competitiveAdvantage = insightFromNode(
    "mi:competitive-advantage",
    nl ? "Waar is het concurrentievoordeel?" : "Where is the competitive advantage?",
    differentiation ?? r.strengths[0],
    nl
      ? differentiation
        ? `${name} differentieert via ${differentiation.description}. ${r.competitiveLandscape[0] ? `Concurrentielandschap: ${r.competitiveLandscape[0].description}.` : ""}`
        : `${name} heeft nog geen scherp bevestigd voordeel t.o.v. alternatieven.`
      : differentiation
        ? `${name} differentiates through ${differentiation.description}. ${r.competitiveLandscape[0] ? `Competitive landscape: ${r.competitiveLandscape[0].description}.` : ""}`
        : `${name} has no sharply confirmed advantage versus alternatives yet.`,
    createdAt
  );

  const dominantMessaging = insightFromNode(
    "mi:dominant-messaging",
    nl ? "Welke boodschap moet domineren?" : "Which messaging should dominate?",
    r.strategicThemes[0],
    nl
      ? `${name} moet leiden met bewijs en context voor ${whoBuys?.description ?? input.campaignContext?.audience ?? "de doelgroep"} — kern: ${differentiation?.description ?? campaignGoal ?? "concrete waarde"}.`
      : `${name} must lead with proof and context for ${whoBuys?.description ?? input.campaignContext?.audience ?? "the audience"} — core: ${differentiation?.description ?? campaignGoal ?? "concrete value"}.`,
    createdAt
  );

  const highestProbabilityCampaigns: MarketingIntelligenceInsight[] = r.opportunities
    .slice(0, 3)
    .map((opp, i) =>
      insightFromNode(
        `mi:campaign-probability-${i + 1}`,
        nl ? `Campagnekans ${i + 1}` : `Campaign opportunity ${i + 1}`,
        opp,
        nl
          ? `${name}: ${opp.description} — hogere kans omdat het aansluit op bevestigde pijn en doel "${campaignGoal}".`
          : `${name}: ${opp.description} — higher probability because it matches confirmed pain and goal "${campaignGoal}".`,
        createdAt
      )
    );

  const antiPatterns: MarketingIntelligenceInsight[] = [
    insightFromNode(
      "mi:anti-generic-awareness",
      nl ? "Niet doen: generieke awareness" : "Do not: generic awareness",
      undefined,
      nl
        ? `Geen brede "brand awareness" voor ${name} zonder scherpe doelgroep — geen bewijs dat volume het probleem oplost.`
        : `No broad "brand awareness" for ${name} without a sharp audience — no evidence volume solves the problem.`,
      createdAt
    ),
    insightFromNode(
      "mi:anti-price-war",
      nl ? "Niet doen: prijsoorlog" : "Do not: price war",
      undefined,
      nl
        ? `${name} heeft geen structureel prijsvoordeel in de ReasoningGraph — concurreren op prijs zou positioning ondermijnen.`
        : `${name} has no structural price advantage in the ReasoningGraph — competing on price would undermine positioning.`,
      createdAt
    ),
  ];

  const missingInformation: MarketingIntelligenceInsight[] = r.unknowns.slice(0, 5).map((u) =>
    insightFromNode(
      u.id.replace("reasoning:", "mi:missing:"),
      u.title,
      u,
      nl ? `Nog onbekend voor ${name}: ${u.reason}` : `Still unknown for ${name}: ${u.reason}`,
      createdAt
    )
  );

  const assumptions: MarketingIntelligenceInsight[] = r.assumptions.slice(0, 5).map((a) =>
    insightFromNode(
      a.id.replace("reasoning:", "mi:assume:"),
      a.title,
      a,
      nl
        ? `Aannname voor ${name}: ${a.description} (nog te valideren).`
        : `Assumption for ${name}: ${a.description} (still to validate).`,
      createdAt
    )
  );

  return {
    version: MARKETING_INTELLIGENCE_LAYER_VERSION,
    organizationId: r.organizationId,
    campaignId: r.campaignId,
    reasoningVersion: r.version,
    createdAt,
    internalThinking,
    businessReality,
    buyingMotivation,
    primaryPain,
    emotionalDrivers,
    objections,
    strongestPositioning,
    competitiveAdvantage,
    dominantMessaging,
    highestProbabilityCampaigns,
    antiPatterns,
    missingInformation,
    assumptions,
  };
}
