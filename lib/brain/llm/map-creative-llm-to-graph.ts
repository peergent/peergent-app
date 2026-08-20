/**
 * PX-64 — map validated Creative Brain LLM payload → CreativeGraph with publication artifacts.
 */

import type { CreativeBrainInput } from "../layers/creative/build-creative-graph";
import type { CreativeContentArtifact } from "../layers/creative/materialize-creative-content-artifacts";
import type {
  CreativeCampaign,
  CreativeChannelPlan,
  CreativeDeliverable,
  CreativeDirection,
  CreativeGraph,
  CreativeMessaging,
  CreativePhaseRecord,
  CreativeReasoningStep,
} from "../layers/creative/types";
import { CREATIVE_LAYER_VERSION } from "../layers/creative/types";
import type { CreativeBrainLlmPayload } from "./creative-brain-llm-schema";
import type { IntelligenceProviderMetadata } from "./intelligence-provider-metadata";
import {
  normalizeCreativeChannelId,
  type CreativeChannelId,
  type CreativeDeliverableType,
} from "./creative-generation-contract";

function formatLabel(type: CreativeDeliverableType, nl: boolean): string {
  const map: Record<string, { en: string; nl: string }> = {
    linkedin_post: { en: "LinkedIn post", nl: "LinkedIn-post" },
    linkedin_carousel: { en: "LinkedIn carousel", nl: "LinkedIn-carousel" },
    acquisition_email: { en: "Email", nl: "E-mail" },
    newsletter: { en: "Newsletter", nl: "Nieuwsbrief" },
    google_ads_campaign: { en: "Google Search ad", nl: "Google Search-ad" },
    landing_page: { en: "Landing page", nl: "Landingspagina" },
    blog: { en: "Blog article", nl: "Blogartikel" },
    instagram_post: { en: "Instagram post", nl: "Instagram-post" },
    campaign_concept: { en: "Campaign concept", nl: "Campagneconcept" },
  };
  return map[type]?.[nl ? "nl" : "en"] ?? type.replace(/_/g, " ");
}

function phase(
  phaseName: CreativePhaseRecord["phase"],
  summary: string,
  at: string,
  insightCount: number
): CreativePhaseRecord {
  return {
    phase: phaseName,
    completedAt: at,
    summary,
    confidence: "high",
    insightCount,
  };
}

function toContentArtifact(input: {
  graph: { createdAt: string };
  deliverable: CreativeDeliverable;
  audience: string;
  nl: boolean;
  llm: CreativeBrainLlmPayload["deliverables"][number];
}): CreativeContentArtifact {
  const { deliverable, audience, nl, llm } = input;
  const format = formatLabel(deliverable.type, nl);

  let body = llm.body;
  let slides: readonly { title: string; body: string }[] = [];
  if (llm.landingSections?.length) {
    slides = llm.landingSections;
    body = slides.map((s) => `${s.title}\n${s.body}`).join("\n\n");
  } else if (deliverable.type === "google_ads_campaign" && llm.descriptionVariations?.length) {
    body = [
      llm.headline,
      ...llm.headlineVariations ?? [],
      "",
      ...llm.descriptionVariations,
      "",
      llm.cta,
    ].join("\n");
  }

  return {
    id: `content-${deliverable.id}`,
    sourceDeliverableId: deliverable.id,
    channel: deliverable.channel,
    format,
    deliverableType: deliverable.type,
    headline: deliverable.headline,
    hook: deliverable.hook,
    body,
    cta: deliverable.cta,
    targetAudience: audience,
    intendedTiming: null,
    subject: llm.subject ?? null,
    previewText: llm.previewText ?? null,
    slides,
    hashtags: llm.hashtags ?? [],
    mediaNotes: llm.visualConcept ?? null,
    artifactVersion: `${input.graph.createdAt}:${deliverable.id}`,
    reviewStatus: "ready_for_review",
  };
}

export function mapCreativeLlmPayloadToGraph(input: {
  creativeInput: CreativeBrainInput;
  payload: CreativeBrainLlmPayload;
  providerMeta: IntelligenceProviderMetadata;
}): CreativeGraph {
  const at = new Date().toISOString();
  const nl = input.creativeInput.locale === "nl";
  const { payload } = input;
  const audience =
    payload.campaign.targetAudience ||
    input.creativeInput.audienceSummary ||
    input.creativeInput.campaignContext?.audience ||
    (nl ? "Doelgroep" : "Target audience");

  const direction: CreativeDirection = {
    id: "dir-llm-primary",
    name: payload.direction.name,
    angle: payload.direction.angle,
    emotion: payload.messaging.headline.slice(0, 80),
    rationale: payload.direction.rationale,
    selected: true,
  };

  const campaign: CreativeCampaign = {
    id: "camp-llm-primary",
    name: payload.campaign.name,
    objective: payload.campaign.objective,
    targetAudience: payload.campaign.targetAudience,
    keyMessage: payload.campaign.keyMessage,
    emotionalTrigger: payload.direction.angle.slice(0, 120),
    businessValue: payload.messaging.supportingMessage.slice(0, 200),
    estimatedImpact: nl ? "Gericht op gekozen strategie en doelgroep." : "Aligned to selected strategy and audience.",
    confidence: "high",
    selected: true,
  };

  const messaging: CreativeMessaging = {
    id: "msg-llm-primary",
    campaignId: campaign.id,
    headline: payload.messaging.headline,
    supportingMessage: payload.messaging.supportingMessage,
    cta: payload.messaging.cta,
    proof: payload.messaging.proof,
    objections: [],
    trustBuilders: payload.messaging.proof.slice(0, 2),
  };

  const deliverables: CreativeDeliverable[] = payload.deliverables.map((item, index) => {
    const channel = (normalizeCreativeChannelId(item.channel) ?? "linkedin") as CreativeChannelId;
    const type = item.deliverableType as CreativeDeliverableType;
    return {
      id: `del-${input.creativeInput.projectId}-llm-${index + 1}`,
      type,
      channel,
      headline: item.headline,
      hook: item.hook,
      bodyOutline: item.body,
      cta: item.cta,
      headlineVariations: item.headlineVariations ?? [item.headline],
      ctaVariations: [item.cta],
      hookVariations: [item.hook],
      rationale: item.rationale ?? payload.direction.rationale,
      reviewStatus: "draft" as const,
    };
  });

  const channelPlans: CreativeChannelPlan[] = deliverables.map((del) => ({
    channel: del.channel,
    why: del.rationale,
    goal: payload.campaign.objective,
    audience,
    priority: "high" as const,
    organic: del.channel === "linkedin" || del.channel === "blog",
    paid: del.channel === "google_ads" || del.channel === "meta_ads",
  }));

  const phases: CreativePhaseRecord[] = [
    phase(
      "understand_business",
      nl ? "Bedrijfscontext uit strategie en research toegepast." : "Business context applied from strategy and research.",
      at,
      2
    ),
    phase(
      "understand_audience",
      nl ? "Doelgroep vertaald naar kanaalspecifieke boodschappen." : "Audience translated into channel-specific messages.",
      at,
      1
    ),
    phase(
      "find_positioning",
      payload.direction.name,
      at,
      1
    ),
    phase(
      "generate_campaign_concepts",
      payload.campaign.name,
      at,
      1
    ),
    phase(
      "generate_messaging",
      payload.messaging.headline,
      at,
      payload.messaging.proof.length
    ),
    phase(
      "generate_channel_strategy",
      nl ? `${channelPlans.length} kanalen — LLM-gegenereerde assets.` : `${channelPlans.length} channels — LLM-generated assets.`,
      at,
      channelPlans.length
    ),
    phase(
      "generate_deliverables",
      nl
        ? `${deliverables.length} publicatieklare deliverables gegenereerd.`
        : `${deliverables.length} publication-ready deliverables generated.`,
      at,
      deliverables.length
    ),
  ];

  const reasoning: CreativeReasoningStep[] = [
    { step: nl ? "Strategie" : "Strategy", insight: payload.direction.rationale, phase: "find_positioning" },
    { step: nl ? "Campagne" : "Campaign", insight: payload.campaign.keyMessage, phase: "generate_campaign_concepts" },
  ];

  const draftGraph: Omit<CreativeGraph, "contentArtifacts"> = {
    version: CREATIVE_LAYER_VERSION,
    organizationId: input.creativeInput.organizationId,
    campaignId: input.creativeInput.projectId,
    episodeId: input.creativeInput.episodeId,
    createdAt: at,
    phases,
    direction,
    campaigns: [campaign],
    messaging: [messaging],
    channelPlans,
    deliverables,
    decisions: [
      {
        id: "cre-dec-llm-direction",
        title: nl ? "Creatieve richting (LLM)" : "Creative direction (LLM)",
        summary: payload.direction.rationale,
        reason: payload.direction.angle,
        whyNow: nl ? "Planning en strategie zijn gereed." : "Planning and strategy are ready.",
        businessImpact: payload.campaign.objective,
        confidence: "high",
        selectedDirection: direction.name,
        discardedAlternatives: [],
      },
    ],
    discardedIdeas: [],
    reasoning,
    confidence: "high",
    estimatedBusinessImpact: payload.campaign.objective,
    providerMeta: input.providerMeta,
  };

  const contentArtifacts = payload.deliverables.map((llmItem, index) =>
    toContentArtifact({
      graph: { createdAt: at },
      deliverable: deliverables[index]!,
      audience,
      nl,
      llm: llmItem,
    })
  );

  return { ...draftGraph, contentArtifacts };
}
