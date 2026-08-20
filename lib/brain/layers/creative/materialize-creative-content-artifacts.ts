/**
 * PX-57 — transforms creative deliverable specifications into publication-ready content artifacts.
 * Planning decides WHAT; this layer produces THE ACTUAL CONTENT for approval and execution.
 */

import type { CreativeChannelId, CreativeDeliverableType } from "../../llm/creative-generation-contract";
import type { CreativeDeliverable, CreativeGraph, CreativeMessaging } from "./types";

export type CreativeContentArtifact = {
  readonly id: string;
  readonly sourceDeliverableId: string;
  readonly channel: CreativeChannelId;
  readonly format: string;
  readonly deliverableType: CreativeDeliverableType;
  readonly headline: string;
  readonly hook: string;
  readonly body: string;
  readonly cta: string;
  readonly targetAudience: string;
  readonly intendedTiming: string | null;
  readonly subject: string | null;
  readonly previewText: string | null;
  readonly slides: readonly { readonly title: string; readonly body: string }[];
  readonly hashtags: readonly string[];
  readonly mediaNotes: string | null;
  readonly artifactVersion: string;
  readonly reviewStatus: "ready_for_review";
};

const FORMAT_BY_TYPE: Partial<Record<CreativeDeliverableType, string>> = {
  linkedin_post: "LinkedIn post",
  linkedin_carousel: "LinkedIn carousel",
  acquisition_email: "Email",
  newsletter: "Newsletter",
  google_ads_campaign: "Google Search ad",
  landing_page: "Landing page",
  blog: "Blog article",
  instagram_post: "Instagram post",
};

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
  return map[type]?.[nl ? "nl" : "en"] ?? FORMAT_BY_TYPE[type] ?? type.replace(/_/g, " ");
}

function composeLinkedInPostBody(
  messaging: CreativeMessaging,
  deliverable: CreativeDeliverable,
  audience: string,
  nl: boolean
): string {
  const proof = messaging.proof[0];
  return [
    deliverable.hook,
    "",
    messaging.supportingMessage || deliverable.bodyOutline,
    proof ? (nl ? `Bewijs: ${proof}` : `Proof: ${proof}`) : null,
    "",
    deliverable.cta,
  ]
    .filter(Boolean)
    .join("\n");
}

function composeEmailBody(
  messaging: CreativeMessaging,
  deliverable: CreativeDeliverable,
  nl: boolean
): { subject: string; previewText: string; body: string } {
  const subject = messaging.headline.slice(0, 78) || deliverable.headline;
  const previewText = messaging.supportingMessage.slice(0, 120);
  const greeting = nl ? "Beste lezer," : "Hello,";
  const body = [
    greeting,
    "",
    deliverable.hook,
    "",
    messaging.supportingMessage || deliverable.bodyOutline,
    "",
    deliverable.cta,
  ].join("\n");
  return { subject, previewText, body };
}

function composeCarouselSlides(
  messaging: CreativeMessaging,
  deliverable: CreativeDeliverable,
  nl: boolean
): readonly { title: string; body: string }[] {
  return [
    { title: deliverable.headline, body: deliverable.hook },
    {
      title: nl ? "Het probleem" : "The problem",
      body: messaging.supportingMessage.slice(0, 200),
    },
    {
      title: nl ? "De oplossing" : "The solution",
      body: messaging.proof[0] ?? deliverable.bodyOutline.slice(0, 200),
    },
    { title: nl ? "Volgende stap" : "Next step", body: deliverable.cta },
  ];
}

function defaultHashtags(channel: CreativeChannelId, nl: boolean): string[] {
  if (channel === "linkedin") {
    return nl ? ["#marketing", "#groei", "#B2B"] : ["#marketing", "#growth", "#B2B"];
  }
  if (channel === "instagram") {
    return nl ? ["#marketing", "#ondernemen"] : ["#marketing", "#business"];
  }
  return [];
}

function materializeOne(
  graph: CreativeGraph,
  deliverable: CreativeDeliverable,
  messaging: CreativeMessaging,
  audience: string,
  nl: boolean
): CreativeContentArtifact {
  const format = formatLabel(deliverable.type, nl);
  let body = deliverable.bodyOutline;
  let subject: string | null = null;
  let previewText: string | null = null;
  let slides: readonly { title: string; body: string }[] = [];

  if (deliverable.type === "linkedin_post" || deliverable.type === "instagram_post") {
    body = composeLinkedInPostBody(messaging, deliverable, audience, nl);
  } else if (deliverable.type === "linkedin_carousel") {
    slides = composeCarouselSlides(messaging, deliverable, nl);
    body = slides.map((s) => `${s.title}\n${s.body}`).join("\n\n");
  } else if (deliverable.type === "acquisition_email" || deliverable.type === "newsletter") {
    const email = composeEmailBody(messaging, deliverable, nl);
    subject = email.subject;
    previewText = email.previewText;
    body = email.body;
  } else {
    body = [deliverable.hook, "", messaging.supportingMessage || deliverable.bodyOutline, "", deliverable.cta]
      .filter(Boolean)
      .join("\n");
  }

  return {
    id: `content-${deliverable.id}`,
    sourceDeliverableId: deliverable.id,
    channel: deliverable.channel,
    format,
    deliverableType: deliverable.type,
    headline: deliverable.headline || messaging.headline,
    hook: deliverable.hook,
    body,
    cta: deliverable.cta,
    targetAudience: audience,
    intendedTiming: null,
    subject,
    previewText,
    slides,
    hashtags: defaultHashtags(deliverable.channel, nl),
    mediaNotes:
      deliverable.type === "linkedin_carousel"
        ? nl
          ? "Carousel — één visueel per slide."
          : "Carousel — one visual per slide."
        : null,
    artifactVersion: `${graph.createdAt}:${deliverable.id}`,
    reviewStatus: "ready_for_review",
  };
}

/** Materialize publication-ready content artifacts from a completed CreativeGraph. */
export function materializeCreativeContentArtifacts(
  graph: CreativeGraph,
  input: { locale?: "nl" | "en"; audience?: string } = {}
): readonly CreativeContentArtifact[] {
  if (graph.contentArtifacts?.length) {
    return graph.contentArtifacts;
  }

  const nl = input.locale === "nl";
  const messaging = graph.messaging[0];
  if (!messaging || graph.deliverables.length === 0) return [];

  const selected = graph.campaigns.find((c) => c.selected) ?? graph.campaigns[0];
  const audience =
    input.audience?.trim() ||
    selected?.targetAudience?.trim() ||
    graph.channelPlans[0]?.audience?.trim() ||
    (nl ? "Doelgroep" : "Target audience");

  return graph.deliverables.map((deliverable) =>
    materializeOne(graph, deliverable, messaging, audience, nl)
  );
}
