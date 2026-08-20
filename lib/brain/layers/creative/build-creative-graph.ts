/**
 * Creative Brain graph builder — seven thinking phases, structured output only.
 */

import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { DecisionCollection } from "../../decision/decision-types";
import type { StrategyGraph, StrategySection } from "../../strategy/strategy-graph";
import type { BrandGraph } from "../brand/types";
import type { MarketingIntelligenceGraph } from "../marketing-intelligence/types";
import type { PlanningGraph } from "../planning/types";
import type { ResearchGraph } from "../research/types";
import type { ReasoningGraph } from "../reasoning/types";
import {
  normalizeCreativeChannelId,
  type CreativeChannelId,
  type CreativeDeliverableType,
} from "../../llm/creative-generation-contract";
import type {
  CreativeBrainInput,
  CreativeCampaign,
  CreativeChannelPlan,
  CreativeDecision,
  CreativeDeliverable,
  CreativeDirection,
  CreativeDiscardedIdea,
  CreativeGraph,
  CreativeMessaging,
  CreativePhaseRecord,
  CreativeReasoningStep,
  CreativeThinkingPhase,
} from "./types";
import { CREATIVE_LAYER_VERSION } from "./types";
import { materializeCreativeContentArtifacts } from "./materialize-creative-content-artifacts";

function sectionText(section?: StrategySection | null): string {
  return section?.description?.trim() ?? "";
}

function phaseRecord(
  phase: CreativeThinkingPhase,
  summary: string,
  insightCount: number,
  at: string,
  confidence: CreativePhaseRecord["confidence"] = "medium"
): CreativePhaseRecord {
  return { phase, completedAt: at, summary, confidence, insightCount };
}

function reasoning(step: string, insight: string, phase: CreativeThinkingPhase): CreativeReasoningStep {
  return { step, insight, phase };
}

function buildBusinessPhase(input: CreativeBrainInput, at: string) {
  const nl = input.locale === "nl";
  const strategy = input.strategyGraph;
  const mi = input.marketingIntelligence;
  const company =
    input.companySummary ??
    sectionText(strategy?.businessSummary) ??
    mi?.businessReality?.narrative ??
    "";
  const valueProp = sectionText(strategy?.valueProposition);
  const differentiators = sectionText(strategy?.differentiators);

  const reasoningSteps = [
    reasoning(
      nl ? "Bedrijfscontext" : "Business context",
      company || (nl ? "Bedrijfscontext ontbreekt — infereren uit campagne." : "Business context missing — infer from campaign."),
      "understand_business"
    ),
    reasoning(
      nl ? "Waardepropositie" : "Value proposition",
      valueProp || (nl ? "Waarde nog te bepalen uit strategie." : "Value to be determined from strategy."),
      "understand_business"
    ),
  ];

  if (differentiators) {
    reasoningSteps.push(
      reasoning(
        nl ? "Differentiatie" : "Differentiation",
        differentiators,
        "understand_business"
      )
    );
  }

  return {
    phase: phaseRecord(
      "understand_business",
      nl
        ? "Bedrijfsrealiteit en waardepropositie begrepen voordat creatief werk start."
        : "Business reality and value proposition understood before creative work begins.",
      reasoningSteps.length,
      at,
      company ? "high" : "medium"
    ),
    reasoningSteps,
    companySummary: company,
  };
}

function buildAudiencePhase(input: CreativeBrainInput, at: string) {
  const nl = input.locale === "nl";
  const strategy = input.strategyGraph;
  const mi = input.marketingIntelligence;
  const audience =
    input.audienceSummary ??
    sectionText(strategy?.primaryAudience) ??
    mi?.buyingMotivation?.narrative ??
    "";
  const pain = sectionText(strategy?.customerProblems) || mi?.primaryPain?.narrative || "";
  const motivations = sectionText(strategy?.customerMotivations) || mi?.emotionalDrivers?.narrative || "";
  const objections = sectionText(strategy?.objections) || mi?.objections?.narrative || "";

  const reasoningSteps = [
    reasoning(
      nl ? "Primaire doelgroep" : "Primary audience",
      audience,
      "understand_audience"
    ),
    reasoning(
      nl ? "Pijn en motivatie" : "Pain and motivation",
      [pain, motivations].filter(Boolean).join(" — "),
      "understand_audience"
    ),
  ];

  if (objections) {
    reasoningSteps.push(
      reasoning(
        nl ? "Bezwaren" : "Objections",
        objections,
        "understand_audience"
      )
    );
  }

  return {
    phase: phaseRecord(
      "understand_audience",
      nl
        ? "Doelgroep, motivatie en bezwaren in kaart gebracht."
        : "Audience, motivation, and objections mapped.",
      reasoningSteps.length,
      at,
      audience ? "high" : "medium"
    ),
    reasoningSteps,
    audienceSummary: audience,
    objectionsText: objections,
  };
}

function buildPositioningPhase(input: CreativeBrainInput, at: string) {
  const nl = input.locale === "nl";
  const strategy = input.strategyGraph;
  const mi = input.marketingIntelligence;
  const positioning =
    sectionText(strategy?.strategicPositioning) || mi?.strongestPositioning?.narrative || "";
  const dominant = mi?.dominantMessaging?.narrative || sectionText(strategy?.recommendedDirection);
  const antiPatterns = mi?.antiPatterns?.map((a) => a.narrative).slice(0, 2) ?? [];

  const discarded: CreativeDiscardedIdea[] = antiPatterns.map((idea, i) => ({
    idea: idea.slice(0, 120),
    reason: nl ? "Anti-pattern — vermijden in creatieve richting." : "Anti-pattern — avoid in creative direction.",
    phase: "find_positioning",
  }));

  const direction: CreativeDirection = {
    id: "dir-primary",
    name: nl ? "Primaire creatieve richting" : "Primary creative direction",
    angle: positioning || dominant || (nl ? "Waarde-gedreven campagne" : "Value-led campaign"),
    emotion: mi?.emotionalDrivers?.title ?? (nl ? "Vertrouwen en urgentie" : "Trust and urgency"),
    rationale:
      dominant ||
      (nl
        ? "Sterkste positionering gekozen op basis van strategie en marketing intelligence."
        : "Strongest positioning selected from strategy and marketing intelligence."),
    selected: true,
  };

  const reasoningSteps = [
    reasoning(
      nl ? "Positionering" : "Positioning",
      direction.angle,
      "find_positioning"
    ),
    reasoning(
      nl ? "Emotionele trigger" : "Emotional trigger",
      direction.emotion,
      "find_positioning"
    ),
  ];

  return {
    phase: phaseRecord(
      "find_positioning",
      nl ? "Creatieve richting gekozen — geen copy gegenereerd." : "Creative direction selected — no copy generated yet.",
      reasoningSteps.length + discarded.length,
      at,
      positioning ? "high" : "medium"
    ),
    reasoningSteps,
    direction,
    discarded,
  };
}

function buildCampaignConcepts(
  input: CreativeBrainInput,
  direction: CreativeDirection,
  audienceSummary: string,
  at: string
): { phase: CreativePhaseRecord; campaigns: CreativeCampaign[]; reasoningSteps: CreativeReasoningStep[]; discarded: CreativeDiscardedIdea[] } {
  const nl = input.locale === "nl";
  const mi = input.marketingIntelligence;
  const strategy = input.strategyGraph;
  const campaign = input.campaignContext;

  const fromMi: CreativeCampaign[] = (mi?.highestProbabilityCampaigns ?? []).slice(0, 3).map((insight, i) => ({
    id: `camp-mi-${i + 1}`,
    name: insight.title,
    objective: sectionText(strategy?.recommendedDirection) || campaign?.goals[0] || insight.title,
    targetAudience: audienceSummary || sectionText(strategy?.primaryAudience),
    keyMessage: direction.angle,
    emotionalTrigger: direction.emotion,
    businessValue: insight.narrative.slice(0, 200),
    estimatedImpact: nl ? "Verwachte lift in gekwalificeerde leads" : "Expected lift in qualified leads",
    confidence: insight.confidence >= 0.7 ? "high" : "medium",
    selected: i === 0,
  }));

  const fallback: CreativeCampaign = {
    id: "camp-primary",
    name: campaign?.campaignName ?? (nl ? "Hoofdcampagne" : "Primary campaign"),
    objective: campaign?.goals[0] ?? sectionText(strategy?.recommendedDirection),
    targetAudience: audienceSummary,
    keyMessage: direction.angle,
    emotionalTrigger: direction.emotion,
    businessValue: sectionText(strategy?.valueProposition) || direction.rationale,
    estimatedImpact: nl ? "Meetbare pipeline-groei binnen 30 dagen" : "Measurable pipeline growth within 30 days",
    confidence: "medium",
    selected: true,
  };

  const campaigns = fromMi.length ? fromMi : [fallback];
  if (fromMi.length > 1) {
    campaigns.forEach((c, i) => {
      (c as { selected: boolean }).selected = i === 0;
    });
  }

  const discarded: CreativeDiscardedIdea[] =
    fromMi.length > 1
      ? fromMi.slice(1).map((c) => ({
          idea: c.name,
          reason: nl ? "Alternatief concept — niet primair gekozen." : "Alternative concept — not selected as primary.",
          phase: "generate_campaign_concepts",
        }))
      : [];

  const reasoningSteps = [
    reasoning(
      nl ? "Campagneconcepten" : "Campaign concepts",
      campaigns
        .filter((c) => c.selected)
        .map((c) => c.name)
        .join(", "),
      "generate_campaign_concepts"
    ),
  ];

  return {
    phase: phaseRecord(
      "generate_campaign_concepts",
      nl ? `${campaigns.length} campagneconcept(en) gegenereerd.` : `${campaigns.length} campaign concept(s) generated.`,
      campaigns.length,
      at
    ),
    campaigns,
    reasoningSteps,
    discarded,
  };
}

function buildMessaging(
  input: CreativeBrainInput,
  selectedCampaign: CreativeCampaign,
  objectionsText: string,
  at: string
): { phase: CreativePhaseRecord; messaging: CreativeMessaging[]; reasoningSteps: CreativeReasoningStep[] } {
  const nl = input.locale === "nl";
  const strategy = input.strategyGraph;
  const mi = input.marketingIntelligence;
  const proofPoints = [
    sectionText(strategy?.differentiators),
    mi?.competitiveAdvantage?.narrative,
    sectionText(strategy?.evidenceSummary),
  ].filter((p): p is string => Boolean(p?.trim()));

  const objectionPairs = objectionsText
    ? [
        {
          objection: nl ? "Te duur / geen budget" : "Too expensive / no budget",
          response: nl
            ? "Focus op ROI en time-to-value — geen feature-lijst."
            : "Focus on ROI and time-to-value — not a feature list.",
        },
        {
          objection: nl ? "We hebben al een oplossing" : "We already have a solution",
          response: nl
            ? "Benadruk differentiatie en risico van status quo."
            : "Emphasize differentiation and cost of status quo.",
        },
      ]
    : [];

  const ctaFromStrategy =
    input.strategyBrainGraph?.offerStrategyDirection.ctaType?.trim() ||
    input.planningBrainGraph?.creativeBriefInputs[0]?.ctaType?.trim() ||
    "";
  const ctaFromMessaging = selectedCampaign.keyMessage.split(".").pop()?.trim() ?? "";
  const cta =
    ctaFromStrategy ||
    (ctaFromMessaging.length >= 5 && ctaFromMessaging.length <= 80 ? ctaFromMessaging : "") ||
    (nl ? "Vraag een demo aan" : "Request a demo");

  const messaging: CreativeMessaging = {
    id: "msg-primary",
    campaignId: selectedCampaign.id,
    headline: selectedCampaign.keyMessage.slice(0, 80) || selectedCampaign.name,
    supportingMessage:
      mi?.dominantMessaging?.narrative ??
      sectionText(strategy?.valueProposition) ??
      selectedCampaign.businessValue,
    cta,
    proof: proofPoints.slice(0, 4),
    objections: objectionPairs,
    trustBuilders: [
      nl ? "Concreet bewijs uit research" : "Concrete evidence from research",
      nl ? "Aansluiting bij merk en positionering" : "Alignment with brand and positioning",
    ],
  };

  return {
    phase: phaseRecord(
      "generate_messaging",
      nl ? "Messaging framework opgebouwd — headline, proof, bezwaren." : "Messaging framework built — headline, proof, objections.",
      1,
      at,
      "high"
    ),
    messaging: [messaging],
    reasoningSteps: [
      reasoning(
        nl ? "Kernboodschap" : "Core message",
        messaging.headline,
        "generate_messaging"
      ),
    ],
  };
}

const CHANNEL_DELIVERABLE_MAP: Partial<Record<CreativeChannelId, CreativeDeliverableType>> = {
  linkedin: "linkedin_post",
  google_ads: "google_ads_campaign",
  email: "acquisition_email",
  newsletter: "newsletter",
  landing_page: "landing_page",
  website_landing: "landing_page",
  blog: "blog",
  instagram: "instagram_post",
  meta_ads: "instagram_post",
};

function resolveChannels(input: CreativeBrainInput): CreativeChannelId[] {
  const fromCampaign = (input.campaignContext?.selectedChannels ?? [])
    .map((ch) => normalizeCreativeChannelId(String(ch)))
    .filter(Boolean) as CreativeChannelId[];

  if (fromCampaign.length) return fromCampaign.slice(0, 6);

  const fromPlanning = (input.planningGraph?.executionStages ?? [])
    .filter((n) => n.ownerBrain === "creative" || /linkedin|email|google|landing|blog|meta/i.test(n.title))
    .flatMap((n) => {
      const match = normalizeCreativeChannelId(n.title);
      return match ? [match] : [];
    });

  if (fromPlanning.length) return [...new Set(fromPlanning)].slice(0, 6);

  return ["linkedin", "google_ads", "landing_page", "email"];
}

function buildChannelPlans(
  input: CreativeBrainInput,
  audienceSummary: string,
  selectedCampaign: CreativeCampaign,
  at: string
): { phase: CreativePhaseRecord; channelPlans: CreativeChannelPlan[]; reasoningSteps: CreativeReasoningStep[] } {
  const nl = input.locale === "nl";
  const channels = resolveChannels(input);
  const priorities: CreativeChannelPlan["priority"][] = ["critical", "high", "high", "medium", "medium", "low"];

  const channelPlans: CreativeChannelPlan[] = channels.map((channel, i) => ({
    channel,
    why:
      channel === "linkedin"
        ? nl
          ? "Doelgroep is actief en open voor thought leadership."
          : "Audience is active and open to thought leadership."
        : channel === "google_ads"
          ? nl
            ? "Vang intent wanneer doelgroep zoekt naar oplossingen."
            : "Capture intent when audience searches for solutions."
          : nl
            ? `Past bij campagne '${selectedCampaign.name}' en business value.`
            : `Fits campaign '${selectedCampaign.name}' and business value.`,
    goal: selectedCampaign.objective,
    audience: audienceSummary || selectedCampaign.targetAudience,
    priority: priorities[i] ?? "medium",
    organic: channel === "linkedin" || channel === "blog",
    paid: channel === "google_ads" || channel === "meta_ads",
  }));

  return {
    phase: phaseRecord(
      "generate_channel_strategy",
      nl ? `${channelPlans.length} kanaalstrategieën opgesteld.` : `${channelPlans.length} channel strategies defined.`,
      channelPlans.length,
      at
    ),
    channelPlans,
    reasoningSteps: channelPlans.map((p) =>
      reasoning(
        nl ? `Kanaal: ${p.channel}` : `Channel: ${p.channel}`,
        p.why,
        "generate_channel_strategy"
      )
    ),
  };
}

function buildDeliverables(
  input: CreativeBrainInput,
  channelPlans: CreativeChannelPlan[],
  messaging: CreativeMessaging,
  at: string
): { phase: CreativePhaseRecord; deliverables: CreativeDeliverable[]; reasoningSteps: CreativeReasoningStep[] } {
  const nl = input.locale === "nl";

  const deliverables: CreativeDeliverable[] = channelPlans
    .map((plan, i) => {
      const type = CHANNEL_DELIVERABLE_MAP[plan.channel] ?? "campaign_concept";
      const brief = input.planningBrainGraph?.creativeBriefInputs.find(
        (b) => b.channel === plan.channel || b.deliverableType === type
      );
      const hookFromBrief = brief?.messagingDirection?.trim();
      const hookFromStrategy =
        input.strategyBrainGraph?.messagingStrategyDirection.primaryMessageTerritory?.trim() ||
        input.strategyBrainGraph?.positioningStrategy.strategicAngle?.trim();
      const hook =
        hookFromBrief ||
        hookFromStrategy ||
        messaging.supportingMessage.slice(0, 200) ||
        messaging.headline;
      return {
        id: `del-${input.projectId}-${i + 1}`,
        type,
        channel: plan.channel,
        headline: messaging.headline,
        hook,
        bodyOutline: messaging.supportingMessage.slice(0, 300),
        cta: messaging.cta,
        headlineVariations: [
          messaging.headline,
          nl ? `${messaging.headline} — nu` : `${messaging.headline} — now`,
          nl ? "Waarom nu?" : "Why now?",
        ],
        ctaVariations: [messaging.cta, nl ? "Meer weten" : "Learn more", nl ? "Start vandaag" : "Start today"],
        hookVariations: [
          nl ? "Herken je dit?" : "Sound familiar?",
          nl ? "De meeste teams missen dit." : "Most teams miss this.",
          nl ? "Eén beslissing verandert het tempo." : "One decision changes the pace.",
        ],
        rationale: plan.why,
        reviewStatus: "needs_review" as const,
      };
    })
    .slice(0, 6);

  return {
    phase: phaseRecord(
      "generate_deliverables",
      nl ? `${deliverables.length} deliverable-specificaties — geen publicatie.` : `${deliverables.length} deliverable specs — not published.`,
      deliverables.length,
      at
    ),
    deliverables,
    reasoningSteps: [
      reasoning(
        nl ? "Deliverables" : "Deliverables",
        deliverables.map((d) => d.type).join(", "),
        "generate_deliverables"
      ),
    ],
  };
}

function buildCreativeDecisions(
  input: CreativeBrainInput,
  direction: CreativeDirection,
  selectedCampaign: CreativeCampaign,
  discarded: CreativeDiscardedIdea[]
): CreativeDecision[] {
  const nl = input.locale === "nl";
  const fromCollection = (input.decisionCollection?.decisions ?? [])
    .filter((d) => d.category === "content_direction" || d.category === "channel_choice")
    .slice(0, 2)
    .map(
      (d): CreativeDecision => ({
        id: `cre-dec:${d.id}`,
        title: d.title,
        summary: d.summary,
        reason: d.reasoning,
        whyNow: d.recommendation,
        businessImpact: d.businessImpact,
        confidence: d.confidenceScore >= 0.75 ? "high" : "medium",
        selectedDirection: direction.name,
        discardedAlternatives: d.alternativesRejected.map((a) => ({
          alternative: a.alternative,
          reason: a.reason,
        })),
      })
    );

  if (fromCollection.length) return fromCollection;

  return [
    {
      id: "cre-dec-direction",
      title: nl ? "Creatieve richting gekozen" : "Creative direction selected",
      summary: direction.rationale,
      reason: nl ? "Sterkste hoek na positionering en audience-analyse." : "Strongest angle after positioning and audience analysis.",
      whyNow: nl ? "Planning en strategie zijn gereed — creatief werk kan starten." : "Planning and strategy are ready — creative work can begin.",
      businessImpact: selectedCampaign.estimatedImpact,
      confidence: "high",
      selectedDirection: direction.name,
      discardedAlternatives: discarded.slice(0, 3).map((d) => ({
        alternative: d.idea,
        reason: d.reason,
      })),
    },
  ];
}

function deriveConfidence(phases: CreativePhaseRecord[]): CreativeGraph["confidence"] {
  const highCount = phases.filter((p) => p.confidence === "high").length;
  if (highCount >= 4) return "high";
  if (highCount >= 2) return "medium";
  return "low";
}

/** Build complete CreativeGraph through seven sequential thinking phases. */
export function buildCreativeGraph(input: CreativeBrainInput): CreativeGraph {
  const at = new Date().toISOString();
  const nl = input.locale === "nl";

  const business = buildBusinessPhase(input, at);
  const audience = buildAudiencePhase(input, at);
  const positioning = buildPositioningPhase(input, at);
  const concepts = buildCampaignConcepts(input, positioning.direction, audience.audienceSummary, at);
  const selectedCampaign = concepts.campaigns.find((c) => c.selected) ?? concepts.campaigns[0]!;
  const messagingResult = buildMessaging(input, selectedCampaign, audience.objectionsText, at);
  const channels = buildChannelPlans(input, audience.audienceSummary, selectedCampaign, at);
  const deliverables = buildDeliverables(input, channels.channelPlans, messagingResult.messaging[0]!, at);

  const phases = [
    business.phase,
    audience.phase,
    positioning.phase,
    concepts.phase,
    messagingResult.phase,
    channels.phase,
    deliverables.phase,
  ];

  const reasoning = [
    ...business.reasoningSteps,
    ...audience.reasoningSteps,
    ...positioning.reasoningSteps,
    ...concepts.reasoningSteps,
    ...messagingResult.reasoningSteps,
    ...channels.reasoningSteps,
    ...deliverables.reasoningSteps,
  ];

  const discardedIdeas = [...positioning.discarded, ...concepts.discarded];
  const decisions = buildCreativeDecisions(input, positioning.direction, selectedCampaign, discardedIdeas);

  const draftGraph: CreativeGraph = {
    version: CREATIVE_LAYER_VERSION,
    organizationId: input.organizationId,
    campaignId: input.projectId,
    episodeId: input.episodeId,
    createdAt: at,
    phases,
    direction: positioning.direction,
    campaigns: concepts.campaigns,
    messaging: messagingResult.messaging,
    channelPlans: channels.channelPlans,
    deliverables: deliverables.deliverables,
    decisions,
    discardedIdeas,
    reasoning,
    confidence: deriveConfidence(phases),
    estimatedBusinessImpact: selectedCampaign.estimatedImpact,
  };

  const contentArtifacts = materializeCreativeContentArtifacts(draftGraph, {
    locale: input.locale,
    audience: audience.audienceSummary,
  });

  return {
    ...draftGraph,
    contentArtifacts,
  };
}

export type { CreativeBrainInput };
