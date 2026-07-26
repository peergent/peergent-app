import type { CreativeBrief } from "@/lib/creative-brief";
import type { MarketingDecisionRecord } from "@/lib/marketing-decision";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";

import type { ParsedMarketingCreativeDirection } from "./parse-marketing-creative-brief-response";

export function mapParsedDirectionToCreativeBrief(input: {
  direction: ParsedMarketingCreativeDirection;
  decision: MarketingDecisionRecord;
  project: MarketingProject;
  assembledAt: string;
}): CreativeBrief {
  const { direction, decision, project, assembledAt } = input;
  const channelRec =
    decision.channelRecommendations.find((c) => c.status === "RECOMMENDED") ??
    decision.channelRecommendations.find((c) => c.status === "ALLOWED");
  const contentRec =
    decision.contentTypeRecommendations.find((c) => c.status === "RECOMMENDED") ??
    decision.contentTypeRecommendations.find((c) => c.status === "ALLOWED");

  const id = `creative-brief:${decision.organizationId}:${decision.peerId}:${project.id}:${assembledAt}`;

  const rankOrder = [
    direction.messagingHierarchy.primaryMessage,
    ...direction.messagingHierarchy.supportingMessages,
  ].filter(Boolean);

  return {
    id,
    organizationId: decision.organizationId,
    title: `Creative direction — ${project.title}`,
    status: "ready",
    version: 1,
    createdAt: assembledAt,
    updatedAt: assembledAt,
    assemblyTrace: [
      "ai_creative_direction",
      `concept:${direction.campaignConcept.slice(0, 48)}`,
      `angle:${direction.campaignAngle.slice(0, 48)}`,
    ],
    campaignGoal: {
      summary: direction.campaignConcept,
      objective: decision.objective,
      successMetric: direction.campaignAngle,
    },
    audience: {
      segmentLabel: project.title,
      description: project.goal?.trim() || decision.objective,
    },
    channel: {
      channel: mapChannel(channelRec?.id ?? "other"),
      formatNotes: channelRec?.label,
    },
    contentType: mapContentType(contentRec?.id ?? "other"),
    tone: {
      directive: direction.toneOfVoice.directive,
      traits: [...direction.toneOfVoice.traits],
      avoid: [...direction.toneOfVoice.avoid],
    },
    cta: {
      primary: direction.ctaDirection.primary,
      ...(direction.ctaDirection.secondary ? { secondary: direction.ctaDirection.secondary } : {}),
    },
    messagingPriorities: {
      primaryMessage: direction.messagingHierarchy.primaryMessage,
      supportingMessages: [...direction.messagingHierarchy.supportingMessages],
      proofPoints: [...direction.messagingHierarchy.proofPoints],
      rankOrder,
    },
    visualPriorities: {
      summary: direction.visualDirection.summary,
      mustInclude: [...direction.visualDirection.mustInclude],
      mustAvoid: [...direction.visualDirection.mustAvoid],
    },
    requiredAssets: [],
    forbiddenClaims: [
      ...new Set([
        ...direction.mandatoryBrandConstraints.forbiddenClaims,
        ...decision.forbiddenClaims,
      ]),
    ],
    forbiddenWords: [
      ...new Set([
        ...direction.mandatoryBrandConstraints.forbiddenWords,
        ...decision.forbiddenWords,
      ]),
    ],
    requiredDisclaimers: direction.mandatoryBrandConstraints.requiredDisclaimers.map(
      (text, index) => ({
        id: `disc-${index + 1}`,
        text,
        placement: "footer" as const,
      })
    ),
    platformConstraints: {},
    outputRequirements: {
      deliverableSummary:
        direction.creativeRecommendations[0] ??
        "Follow messaging hierarchy and visual direction for campaign deliverables.",
      variants: direction.creativeRecommendations.slice(1, 4),
    },
    approvalRequirements: {
      legalReviewRequired: decision.approvalPolicy.legalReviewRequired,
      brandReviewRequired: decision.approvalPolicy.brandReviewRequired,
      notes: "Creative direction prepared for customer review.",
    },
  };
}

function mapChannel(id: string): CreativeBrief["channel"]["channel"] {
  const key = id.toLowerCase();
  if (key.includes("linkedin")) return "linkedin";
  if (key.includes("instagram")) return "instagram";
  if (key.includes("email") || key.includes("newsletter")) return "email";
  if (key.includes("google") || key.includes("meta") || key.includes("paid")) return "paid_social";
  if (key.includes("web") || key.includes("blog")) return "web";
  return "other";
}

function mapContentType(id: string): CreativeBrief["contentType"] {
  const key = id.toLowerCase();
  if (key.includes("linkedin") || key.includes("social")) return "social_post";
  if (key.includes("blog")) return "blog_outline";
  if (key.includes("email") || key.includes("newsletter")) return "email";
  if (key.includes("ads")) return "ad_creative";
  return "other";
}
