import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { StrategyGraph, StrategySection } from "../strategy/strategy-graph";
import { calculateDecisionConfidence } from "./decision-confidence";
import type {
  Decision,
  DecisionCategory,
  DecisionCollection,
  DecisionCustomerChallenge,
  DecisionReviewTrigger,
  RejectedDecisionAlternative,
} from "./decision-types";
import { DECISION_ENGINE_VERSION } from "./decision-types";

const CHANNEL_ALTERNATIVES: Record<string, { reject: string[]; challenges: DecisionCustomerChallenge[] }> = {
  linkedin: {
    reject: ["Meta", "Instagram", "Google Ads", "SEO"],
    challenges: [
      {
        question: "Why not Instagram?",
        answer:
          "Instagram rewards visual lifestyle content. Your positioning and available proof points are stronger for professional B2B conversations than visual discovery.",
      },
      {
        question: "Why not Google first?",
        answer:
          "Search captures existing demand. You still need sharper positioning and proof before paid search becomes efficient — LinkedIn builds that demand first.",
      },
    ],
  },
  meta: {
    reject: ["LinkedIn", "SEO"],
    challenges: [
      {
        question: "Why not LinkedIn?",
        answer:
          "LinkedIn fits when the buyer is a professional decision-maker. Meta can work for broader awareness, but only when visual assets and audience proof support it.",
      },
    ],
  },
  email: {
    reject: ["Cold outreach without list"],
    challenges: [
      {
        question: "Why not start with paid ads?",
        answer:
          "Email converts existing interest. Without a qualified list or warm traffic, ads spend budget before trust is established.",
      },
    ],
  },
  seo: {
    reject: ["Immediate paid scale"],
    challenges: [
      {
        question: "Why are you delaying SEO?",
        answer:
          "SEO compounds over months. Your campaign goal needs near-term conversations — paid and direct channels deliver that while SEO builds in parallel.",
      },
    ],
  },
};

function emmaRecommend(nl: boolean, recommendation: string, because: string): string {
  return nl
    ? `Ik adviseer ${recommendation} omdat ${because}`
    : `I recommend ${recommendation} because ${because}`;
}

function emmaReject(nl: boolean, alternative: string, because: string): string {
  return nl
    ? `Ik stel ${alternative} nu niet voor omdat ${because}`
    : `I'm not recommending ${alternative} at this stage because ${because}`;
}

function baseConfidenceInput(
  graph: StrategyGraph,
  section: StrategySection,
  extra?: { contradictions?: number; dependencies?: number }
) {
  return calculateDecisionConfidence({
    researchEvidenceCount: section.supportingEvidence.length,
    reasoningConfidence: section.reasoningReferences.length > 0 ? 0.7 : 0.4,
    brandConfirmed: graph.strategicPositioning.confidence === "high",
    missingInformationCount: graph.unknowns.length,
    contradictionCount: extra?.contradictions ?? 0,
    assumptionCount: graph.assumptions.length,
    dependencyQuality: extra?.dependencies ? clamp01(extra.dependencies / 3) : 0.5,
    sectionConfidence: section.confidence,
  });
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function reviewTriggers(nl: boolean, goal: string): DecisionReviewTrigger[] {
  return [
    {
      id: "first-results",
      description: nl ? "Eerste campagneresultaten" : "First campaign results",
      condition: nl
        ? `Herzie als ${goal} niet binnen 4 weken zichtbaar wordt.`
        : `Review if ${goal} is not visible within 4 weeks.`,
    },
    {
      id: "new-evidence",
      description: nl ? "Nieuw klantbewijs" : "New customer evidence",
      condition: nl
        ? "Herzie wanneer klantfeedback de doelgroep of positionering tegenspreekt."
        : "Review when customer feedback contradicts audience or positioning.",
    },
  ];
}

function buildStrategyDirectionDecision(input: {
  graph: StrategyGraph;
  campaignContext: CampaignContext;
  locale: "nl" | "en";
  createdAt: string;
}): Decision {
  const { graph, campaignContext, locale, createdAt } = input;
  const nl = locale === "nl";
  const name = campaignContext.companyName;
  const primary = graph.recommendedDirection;
  const rationale = graph.decisionRationales[0];
  const { level, score } = baseConfidenceInput(graph, primary);

  const rejected: RejectedDecisionAlternative[] = graph.rejectedAlternatives.map((a) => ({
    alternative: a.alternative,
    reason: a.reason,
  }));

  const recommendation = emmaRecommend(
    nl,
    nl ? "deze campagnerichting" : "this campaign direction",
    nl
      ? `${name} het sterkst helpt ${graph.primaryAudience.description} te bereiken met ${graph.strategicPositioning.description.toLowerCase()}`
      : `${name} has the strongest path to reach ${graph.primaryAudience.description} with ${graph.strategicPositioning.description.toLowerCase()}`
  );

  return {
    id: "dec-strategy-direction",
    title: nl ? "Campagnerichting" : "Campaign direction",
    summary: primary.description,
    recommendation,
    confidence: level,
    confidenceScore: score,
    businessImpact: graph.successCriteria.description,
    expectedOutcome: graph.successCriteria.description,
    reasoning: rationale?.reason ?? primary.description,
    supportingEvidence: primary.supportingEvidence,
    assumptions: graph.assumptions.map((a) => a.description),
    knownRisks: graph.strategicRisks.map((r) => r.description),
    unknowns: graph.unknowns.map((u) => u.description || u.title),
    alternativesConsidered: rationale?.alternativesConsidered ?? rejected.map((r) => r.alternative),
    alternativesRejected: rejected,
    dependencies: [],
    reviewTriggers: reviewTriggers(nl, campaignContext.goals[0] ?? campaignContext.description),
    customerChallenges: [
      {
        question: nl ? "Waarom niet iedereen targeten?" : "Why shouldn't we target everyone?",
        answer: nl
          ? `Omdat ${graph.primaryAudience.description} het meest bewijs heeft — brede targeting verdunt budget en boodschap voor ${name}.`
          : `Because ${graph.primaryAudience.description} has the strongest evidence — broad targeting dilutes budget and message for ${name}.`,
      },
      {
        question: nl ? "Waarom nu?" : "Why now?",
        answer: graph.buyingTriggers.description,
      },
    ],
    approvalRequired: true,
    category: "strategy_direction",
    createdAt,
    brainVersion: DECISION_ENGINE_VERSION,
  };
}

function buildAudienceDecision(input: {
  graph: StrategyGraph;
  campaignContext: CampaignContext;
  locale: "nl" | "en";
  createdAt: string;
  dependsOn: string;
}): Decision {
  const { graph, campaignContext, locale, createdAt, dependsOn } = input;
  const nl = locale === "nl";
  const section = graph.primaryAudience;
  const { level, score } = baseConfidenceInput(graph, section);

  return {
    id: "dec-audience-focus",
    title: nl ? "Doelgroepfocus" : "Audience focus",
    summary: section.description,
    recommendation: emmaRecommend(
      nl,
      nl ? `focus op ${section.description}` : `focusing on ${section.description}`,
      nl
        ? `dit segment de hoogste koopmotivatie toont voor ${campaignContext.companyName}`
        : `this segment shows the highest buying motivation for ${campaignContext.companyName}`
    ),
    confidence: level,
    confidenceScore: score,
    businessImpact: nl
      ? "Scherpere targeting verhoogt conversiekans en verlaagt verspilde impressies."
      : "Sharper targeting increases conversion probability and reduces wasted impressions.",
    expectedOutcome: graph.customerProblems.description,
    reasoning: graph.customerMotivations.description,
    supportingEvidence: section.supportingEvidence,
    assumptions: graph.assumptions.slice(0, 2).map((a) => a.description),
    knownRisks: graph.objections.description ? [graph.objections.description] : [],
    unknowns: graph.unknowns.slice(0, 2).map((u) => u.title),
    alternativesConsidered: [
      nl ? "Breed publiek" : "Broad audience",
      nl ? "Secundaire segmenten" : "Secondary segments",
    ],
    alternativesRejected: [
      {
        alternative: nl ? "Breed publiek" : "Broad audience",
        reason: nl
          ? "Geen bewijs dat brede reach het businessprobleem oplost."
          : "No evidence broad reach solves the business problem.",
      },
    ],
    dependencies: [{ decisionId: dependsOn, relationship: "requires", label: nl ? "Campagnerichting" : "Campaign direction" }],
    reviewTriggers: reviewTriggers(nl, campaignContext.description),
    customerChallenges: [
      {
        question: nl ? "Waarom niet iedereen?" : "Why not everyone?",
        answer: nl
          ? `${section.description} heeft het meest bevestigde pijn-punt — andere segmenten zijn afleiding tot dat bewijs er is.`
          : `${section.description} has the most confirmed pain point — other segments are distractions until that evidence exists.`,
      },
    ],
    approvalRequired: false,
    category: "audience_focus",
    createdAt,
    brainVersion: DECISION_ENGINE_VERSION,
  };
}

function buildPositioningDecision(input: {
  graph: StrategyGraph;
  campaignContext: CampaignContext;
  locale: "nl" | "en";
  createdAt: string;
  dependsOn: string;
}): Decision {
  const { graph, campaignContext, locale, createdAt, dependsOn } = input;
  const nl = locale === "nl";
  const section = graph.strategicPositioning;
  const { level, score } = baseConfidenceInput(graph, section);

  return {
    id: "dec-positioning",
    title: nl ? "Positionering" : "Positioning",
    summary: section.description,
    recommendation: emmaRecommend(
      nl,
      nl ? "autoriteit en differentiatie te benadrukken" : "emphasizing authority and differentiation",
      nl
        ? `${campaignContext.companyName} zich onderscheidt via ${graph.differentiators.description}`
        : `${campaignContext.companyName} differentiates through ${graph.differentiators.description}`
    ),
    confidence: level,
    confidenceScore: score,
    businessImpact: nl
      ? "Sterkere positionering verkort de vertrouwensfase vóór conversie."
      : "Stronger positioning shortens the trust phase before conversion.",
    expectedOutcome: graph.valueProposition.description,
    reasoning: graph.differentiators.description,
    supportingEvidence: [...section.supportingEvidence, ...graph.differentiators.supportingEvidence],
    assumptions: [],
    knownRisks: [],
    unknowns: graph.unknowns.filter((u) => /position|pricing|brand/i.test(u.title)).map((u) => u.title),
    alternativesConsidered: [nl ? "Prijs-leiderschap" : "Price leadership", nl ? "Generieke innovator" : "Generic innovator"],
    alternativesRejected: graph.rejectedAlternatives.filter((a) =>
      /price|prijs|generic|generiek/i.test(a.alternative)
    ),
    dependencies: [{ decisionId: dependsOn, relationship: "informs", label: nl ? "Campagnerichting" : "Campaign direction" }],
    reviewTriggers: reviewTriggers(nl, campaignContext.description),
    customerChallenges: [
      {
        question: nl ? "Waarom niet goedkoper positioneren?" : "Why not position as cheaper?",
        answer: nl
          ? "Er is geen structureel prijsvoordeel in het bewijs — autoriteit wint vertrouwen sneller dan korting."
          : "There is no structural price advantage in the evidence — authority wins trust faster than discounting.",
      },
    ],
    approvalRequired: false,
    category: "positioning",
    createdAt,
    brainVersion: DECISION_ENGINE_VERSION,
  };
}

function normalizeChannel(channel: string): string {
  return channel.toLowerCase().replace(/\s+/g, "_");
}

function buildChannelDecision(input: {
  graph: StrategyGraph;
  campaignContext: CampaignContext;
  locale: "nl" | "en";
  createdAt: string;
  channel: string;
  dependsOn: string;
  index: number;
}): Decision {
  const { graph, campaignContext, locale, createdAt, channel, dependsOn, index } = input;
  const nl = locale === "nl";
  const key = normalizeChannel(channel);
  const altSpec = CHANNEL_ALTERNATIVES[key] ?? {
    reject: ["Other channels without evidence"],
    challenges: [],
  };

  const section: StrategySection = {
    title: channel,
    description: nl
      ? `${channel} past bij ${graph.primaryAudience.description} en ${campaignContext.companyName}'s positionering.`
      : `${channel} fits ${graph.primaryAudience.description} and ${campaignContext.companyName}'s positioning.`,
    confidence: graph.recommendedDirection.confidence,
    supportingEvidence: graph.recommendedDirection.supportingEvidence,
    reasoningReferences: graph.recommendedDirection.reasoningReferences,
  };

  const { level, score } = baseConfidenceInput(graph, section, { dependencies: 1 });

  const rejected: RejectedDecisionAlternative[] = altSpec.reject.map((alt) => ({
    alternative: alt,
    reason: nl
      ? `${alt} is nu zwakker — onvoldoende bewijs dat ${graph.primaryAudience.description} daar koopt.`
      : `${alt} is weaker now — insufficient proof that ${graph.primaryAudience.description} buys there.`,
  }));

  return {
    id: `dec-channel-${key}-${index}`,
    title: nl ? `Start met ${channel}` : `Start with ${channel}`,
    summary: section.description,
    recommendation: emmaRecommend(
      nl,
      nl ? `${channel} als eerste kanaal` : `${channel} as the first channel`,
      nl
        ? `je huidige positionering en doelgroep de hoogste kans geven op gekwalificeerde B2B-gesprekken`
        : `your current positioning and audience suggest the highest chance of qualified B2B conversations`
    ),
    confidence: level,
    confidenceScore: score,
    businessImpact: nl
      ? `${channel} levert de eerste meetbare pipeline voor ${campaignContext.companyName}.`
      : `${channel} delivers the first measurable pipeline for ${campaignContext.companyName}.`,
    expectedOutcome: graph.successCriteria.description,
    reasoning: graph.buyingTriggers.description,
    supportingEvidence: section.supportingEvidence,
    assumptions: graph.assumptions.slice(0, 1).map((a) => a.description),
    knownRisks: graph.strategicRisks.slice(0, 2).map((r) => r.description),
    unknowns: [],
    alternativesConsidered: altSpec.reject,
    alternativesRejected: rejected,
    dependencies: [{ decisionId: dependsOn, relationship: "requires", label: nl ? "Campagnerichting" : "Campaign direction" }],
    reviewTriggers: reviewTriggers(nl, campaignContext.goals[0] ?? campaignContext.description),
    customerChallenges: altSpec.challenges,
    approvalRequired: true,
    category: "channel_choice",
    createdAt,
    brainVersion: DECISION_ENGINE_VERSION,
  };
}

function buildRejectionDecision(input: {
  graph: StrategyGraph;
  locale: "nl" | "en";
  createdAt: string;
  rejected: RejectedDecisionAlternative;
  index: number;
  dependsOn: string;
}): Decision {
  const { graph, locale, createdAt, rejected, index, dependsOn } = input;
  const nl = locale === "nl";
  const { level, score } = calculateDecisionConfidence({
    researchEvidenceCount: 2,
    reasoningConfidence: 0.65,
    brandConfirmed: false,
    missingInformationCount: graph.unknowns.length,
    contradictionCount: 0,
    assumptionCount: 0,
    dependencyQuality: 0.6,
    sectionConfidence: "medium",
  });

  return {
    id: `dec-reject-${index}`,
    title: nl ? `Afwijzen: ${rejected.alternative}` : `Reject: ${rejected.alternative}`,
    summary: rejected.reason,
    recommendation: emmaReject(nl, rejected.alternative, rejected.reason),
    confidence: level,
    confidenceScore: score,
    businessImpact: nl
      ? "Voorkomt budgetverspilling aan een aanpak zonder bewijs."
      : "Prevents budget waste on an approach without evidence.",
    expectedOutcome: nl ? "Focus op bewezen pad" : "Focus on proven path",
    reasoning: rejected.reason,
    supportingEvidence: [],
    assumptions: [],
    knownRisks: [],
    unknowns: [],
    alternativesConsidered: [rejected.alternative],
    alternativesRejected: [rejected],
    dependencies: [{ decisionId: dependsOn, relationship: "informs" }],
    reviewTriggers: [],
    customerChallenges: [],
    approvalRequired: false,
    category: "channel_rejection",
    createdAt,
    brainVersion: DECISION_ENGINE_VERSION,
  };
}

function buildContentDirectionDecision(input: {
  graph: StrategyGraph;
  campaignContext: CampaignContext;
  locale: "nl" | "en";
  createdAt: string;
  channelDecisionId: string;
}): Decision | null {
  const theme = input.graph.strategicThemes[0];
  if (!theme) return null;

  const { graph, campaignContext, locale, createdAt, channelDecisionId } = input;
  const nl = locale === "nl";
  const { level, score } = baseConfidenceInput(graph, theme, { dependencies: 2 });

  return {
    id: "dec-content-direction",
    title: nl ? "Contentrichting" : "Content direction",
    summary: theme.description,
    recommendation: emmaRecommend(
      nl,
      nl ? "content te leiden met bewijs en context" : "leading content with proof and context",
      nl
        ? `${campaignContext.companyName} vertrouwen moet winnen vóór conversie`
        : `${campaignContext.companyName} must earn trust before conversion`
    ),
    confidence: level,
    confidenceScore: score,
    businessImpact: nl ? "Content die vertrouwen opbouwt verhoogt conversiekans." : "Trust-building content increases conversion probability.",
    expectedOutcome: theme.description,
    reasoning: theme.description,
    supportingEvidence: theme.supportingEvidence,
    assumptions: [],
    knownRisks: [],
    unknowns: [],
    alternativesConsidered: [nl ? "Product-push zonder context" : "Product push without context"],
    alternativesRejected: graph.rejectedAlternatives.filter((a) => /push|direct/i.test(a.alternative)),
    dependencies: [
      { decisionId: channelDecisionId, relationship: "requires", label: nl ? "Kanaalkeuze" : "Channel choice" },
    ],
    reviewTriggers: reviewTriggers(nl, campaignContext.description),
    customerChallenges: [],
    approvalRequired: false,
    category: "content_direction",
    createdAt,
    brainVersion: DECISION_ENGINE_VERSION,
  };
}

function buildLeadGenerationDecision(input: {
  graph: StrategyGraph;
  campaignContext: CampaignContext;
  locale: "nl" | "en";
  createdAt: string;
  dependsOn: string;
}): Decision | null {
  const { graph, campaignContext, locale, createdAt, dependsOn } = input;
  const goal = campaignContext.goals[0] ?? campaignContext.description;
  if (!/lead|demo|request|aanvrag|conversie|conversion/i.test(goal)) return null;

  const nl = locale === "nl";
  const { level, score } = baseConfidenceInput(graph, graph.successCriteria);

  return {
    id: "dec-lead-generation",
    title: nl ? "Start met leadgeneratie" : "Start with lead generation",
    summary: graph.successCriteria.description,
    recommendation: emmaRecommend(
      nl,
      nl ? "leadgeneratie als primair resultaat" : "lead generation as the primary outcome",
      nl
      ? `het campagnedoel "${goal}" direct meetbaar is via gekwalificeerde gesprekken`
      : `the campaign goal "${goal}" is directly measurable through qualified conversations`
    ),
    confidence: level,
    confidenceScore: score,
    businessImpact: graph.successCriteria.description,
    expectedOutcome: goal,
    reasoning: graph.buyingTriggers.description,
    supportingEvidence: graph.successCriteria.supportingEvidence,
    assumptions: [],
    knownRisks: graph.strategicRisks.slice(0, 1).map((r) => r.description),
    unknowns: [],
    alternativesConsidered: [nl ? "Alleen merkbekendheid" : "Brand awareness only"],
    alternativesRejected: graph.rejectedAlternatives.filter((a) => /awareness|breed|broad/i.test(a.alternative)),
    dependencies: [{ decisionId: dependsOn, relationship: "requires" }],
    reviewTriggers: reviewTriggers(nl, goal),
    customerChallenges: [
      {
        question: nl ? "Waarom niet eerst awareness?" : "Why not awareness first?",
        answer: nl
          ? "Awareness zonder conversiepad verspilt budget — je doel vraagt om meetbare gesprekken."
          : "Awareness without a conversion path wastes budget — your goal requires measurable conversations.",
      },
    ],
    approvalRequired: false,
    category: "lead_generation",
    createdAt,
    brainVersion: DECISION_ENGINE_VERSION,
  };
}

/** Build Decision collection from StrategyGraph — Sprint 10.2. */
export function buildDecisionsFromStrategyGraph(input: {
  graph: StrategyGraph;
  campaignContext: CampaignContext;
  locale: "nl" | "en";
}): DecisionCollection {
  const createdAt = input.graph.createdAt;
  const decisions: Decision[] = [];

  const strategyDecision = buildStrategyDirectionDecision({
    graph: input.graph,
    campaignContext: input.campaignContext,
    locale: input.locale,
    createdAt,
  });
  decisions.push(strategyDecision);

  decisions.push(
    buildAudienceDecision({
      graph: input.graph,
      campaignContext: input.campaignContext,
      locale: input.locale,
      createdAt,
      dependsOn: strategyDecision.id,
    })
  );

  decisions.push(
    buildPositioningDecision({
      graph: input.graph,
      campaignContext: input.campaignContext,
      locale: input.locale,
      createdAt,
      dependsOn: strategyDecision.id,
    })
  );

  const channels =
    input.campaignContext.selectedChannels.length > 0
      ? input.campaignContext.selectedChannels
      : inferChannelsFromGraph(input.graph, input.locale);

  let primaryChannelId = strategyDecision.id;
  channels.slice(0, 2).forEach((channel, index) => {
    const channelDecision = buildChannelDecision({
      graph: input.graph,
      campaignContext: input.campaignContext,
      locale: input.locale,
      createdAt,
      channel,
      dependsOn: strategyDecision.id,
      index,
    });
    decisions.push(channelDecision);
    if (index === 0) primaryChannelId = channelDecision.id;
  });

  input.graph.rejectedAlternatives.slice(0, 2).forEach((rejected, index) => {
    decisions.push(
      buildRejectionDecision({
        graph: input.graph,
        locale: input.locale,
        createdAt,
        rejected,
        index,
        dependsOn: strategyDecision.id,
      })
    );
  });

  const contentDecision = buildContentDirectionDecision({
    graph: input.graph,
    campaignContext: input.campaignContext,
    locale: input.locale,
    createdAt,
    channelDecisionId: primaryChannelId,
  });
  if (contentDecision) decisions.push(contentDecision);

  const leadDecision = buildLeadGenerationDecision({
    graph: input.graph,
    campaignContext: input.campaignContext,
    locale: input.locale,
    createdAt,
    dependsOn: strategyDecision.id,
  });
  if (leadDecision) decisions.push(leadDecision);

  return {
    version: DECISION_ENGINE_VERSION,
    organizationId: input.graph.organizationId,
    campaignId: input.graph.campaignId,
    createdAt,
    decisions,
  };
}

function inferChannelsFromGraph(graph: StrategyGraph, locale: "nl" | "en"): string[] {
  const text = [
    graph.primaryAudience.description,
    graph.recommendedDirection.description,
    graph.strategicPositioning.description,
  ]
    .join(" ")
    .toLowerCase();

  if (/b2b|smb|professional|business|owner|ondernemer|zakelijk/i.test(text)) {
    return ["LinkedIn"];
  }
  return locale === "nl" ? ["LinkedIn"] : ["LinkedIn"];
}
