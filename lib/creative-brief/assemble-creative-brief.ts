import type { BrandBrainContextSlice } from "@/lib/brand-brain/types";
import type {
  MarketingDecisionChannelRecommendation,
  MarketingDecisionContentTypeRecommendation,
  MarketingDecisionRecord,
  MarketingDecisionRecommendationStatus,
} from "@/lib/marketing-decision";
import type { CreativeBriefSource } from "./creative-brief-source";
import {
  CreativeBriefBlockedDecisionError,
  CreativeBriefGenerationNotAllowedError,
  CreativeBriefManualOnlyDecisionError,
  CreativeBriefNoSelectableChannelError,
  CreativeBriefNoSelectableContentTypeError,
  CreativeBriefRequestedSelectionBlockedError,
} from "./errors";
import type {
  CreativeBrief,
  CreativeBriefApprovalRequirements,
  CreativeBriefCampaignGoal,
  CreativeBriefChannel,
  CreativeBriefContentType,
  CreativeBriefDisclaimer,
  CreativeBriefOutputRequirements,
  CreativeBriefPlatformConstraints,
  CreativeBriefRequiredAsset,
  CreativeBriefRequiredAssetRole,
  CreativeBriefStatus,
  CreativeBriefTone,
} from "./types";

const CHANNEL_MAP: Record<string, CreativeBriefChannel> = {
  linkedin: "linkedin",
  instagram: "instagram",
  facebook: "facebook",
  x: "x",
  twitter: "x",
  email: "email",
  newsletter: "email",
  web: "web",
  blog: "web",
  website: "web",
  print: "print",
  google_ads: "paid_social",
  meta_ads: "paid_social",
  paid_social: "paid_social",
  content_marketing: "other",
};

const CONTENT_TYPE_MAP: Record<string, CreativeBriefContentType> = {
  linkedin_post: "social_post",
  social_media_post: "social_post",
  blog_article: "blog_outline",
  website_article: "landing_section",
  newsletter: "email",
  google_ads_copy: "ad_creative",
  meta_ads_copy: "ad_creative",
};

const BRAND_ASSET_ROLE_MAP: Record<string, CreativeBriefRequiredAssetRole> = {
  logo_primary: "logo",
  logo_mark: "logo",
  logo_inverse: "logo",
  icon: "icon",
  photography: "lifestyle",
  template: "template",
  other: "other",
};

function assertDecisionAllowsBrief(decision: MarketingDecisionRecord): void {
  if (decision.approvalPolicy.mode === "blocked_manual_only") {
    throw new CreativeBriefManualOnlyDecisionError();
  }
  if (decision.status === "blocked" || !decision.eligibility.canExecute) {
    throw new CreativeBriefBlockedDecisionError(decision.eligibility.blockedReasons);
  }
  if (!decision.eligibility.canGenerateCreative) {
    throw new CreativeBriefGenerationNotAllowedError();
  }
}

function isSelectable(status: MarketingDecisionRecommendationStatus): boolean {
  return status === "RECOMMENDED" || status === "ALLOWED";
}

function selectRecommendation<
  T extends { id: string; rank: number; status: MarketingDecisionRecommendationStatus },
>(
  items: readonly T[],
  requestedId: string | undefined,
  field: "channel" | "contentType"
): { selected: T; trace: string } {
  if (requestedId) {
    const match = items.find((item) => item.id === requestedId);
    if (!match) {
      throw field === "channel"
        ? new CreativeBriefNoSelectableChannelError()
        : new CreativeBriefNoSelectableContentTypeError();
    }
    if (match.status === "BLOCKED") {
      throw new CreativeBriefRequestedSelectionBlockedError(field, requestedId);
    }
    if (!isSelectable(match.status)) {
      throw new CreativeBriefRequestedSelectionBlockedError(field, requestedId);
    }
    return {
      selected: match,
      trace: `Selected requested ${field} "${match.id}" (${match.status}, rank ${match.rank}).`,
    };
  }

  const recommended = items
    .filter((item) => item.status === "RECOMMENDED")
    .sort((a, b) => a.rank - b.rank);
  if (recommended[0]) {
    return {
      selected: recommended[0],
      trace: `Selected ${field} "${recommended[0].id}" (RECOMMENDED, rank ${recommended[0].rank}).`,
    };
  }

  const allowed = items
    .filter((item) => item.status === "ALLOWED")
    .sort((a, b) => a.rank - b.rank);
  if (allowed[0]) {
    return {
      selected: allowed[0],
      trace: `Selected ${field} "${allowed[0].id}" (ALLOWED, rank ${allowed[0].rank}).`,
    };
  }

  throw field === "channel"
    ? new CreativeBriefNoSelectableChannelError()
    : new CreativeBriefNoSelectableContentTypeError();
}

function mapChannelId(id: string): CreativeBriefChannel {
  return CHANNEL_MAP[id] ?? "other";
}

function mapContentTypeId(id: string): CreativeBriefContentType {
  return CONTENT_TYPE_MAP[id] ?? "other";
}

function buildBriefId(source: CreativeBriefSource): string {
  const suffix = source.campaignId ?? source.projectId ?? "execution";
  return `creative-brief:${source.decision.organizationId}:${source.decision.peerId}:${suffix}:${source.assembledAt}`;
}

function mergeForbiddenWords(
  decision: MarketingDecisionRecord,
  brand: BrandBrainContextSlice
): string[] {
  const fromBrand = brand.snapshot.voice?.forbiddenPhrases ?? [];
  return [...new Set([...decision.forbiddenWords, ...fromBrand])];
}

function mapRequiredAssets(brand: BrandBrainContextSlice): CreativeBriefRequiredAsset[] {
  const assets = brand.snapshot.assetReferences ?? [];
  return assets.map((ref) => ({
    id: ref.id,
    role: BRAND_ASSET_ROLE_MAP[ref.role] ?? "other",
    assetId: ref.assetId,
    description: ref.notes,
    required: ref.role.startsWith("logo"),
  }));
}

function mapDisclaimers(
  decision: MarketingDecisionRecord
): CreativeBriefDisclaimer[] {
  return decision.requiredDisclaimers.map((item) => ({
    id: item.id,
    text: item.text,
    placement: "caption",
  }));
}

function buildPlatformConstraints(
  brand: BrandBrainContextSlice,
  channel: MarketingDecisionChannelRecommendation
): CreativeBriefPlatformConstraints {
  const layouts =
    brand.snapshot.creativeRules?.layoutConstraints?.filter(
      (layout) => layout.channel === mapChannelId(channel.id) || layout.channel === "other"
    ) ?? [];

  const linkRules = channel.constraints ? [...channel.constraints] : [];
  const safeZoneNotes = layouts
    .map((layout) => layout.notes)
    .filter(Boolean)
    .join(" ");

  return {
    linkRules: linkRules.length > 0 ? linkRules : undefined,
    safeZoneNotes: safeZoneNotes || undefined,
    aspectRatio:
      layouts[0]?.widthPx && layouts[0]?.heightPx
        ? `${layouts[0].widthPx}:${layouts[0].heightPx}`
        : undefined,
  };
}

function buildTone(brand: BrandBrainContextSlice): CreativeBriefTone {
  const voice = brand.snapshot.voice;
  return {
    directive: voice?.summary?.trim() || "Follow brand voice constraints supplied in this brief.",
    traits: voice?.personalityTraits?.length ? [...voice.personalityTraits] : undefined,
    avoid: voice?.donts?.length ? [...voice.donts] : undefined,
  };
}

function buildMessaging(
  source: CreativeBriefSource,
  brand: BrandBrainContextSlice
): CreativeBrief["messagingPriorities"] {
  const identity = brand.snapshot.identity;
  const keyMessages = identity?.keyMessages?.length ? [...identity.keyMessages] : [];
  const primaryMessage =
    keyMessages[0] ??
    identity?.valueProposition?.trim() ??
    source.decision.objective;

  return {
    primaryMessage,
    supportingMessages: keyMessages.slice(1),
    proofPoints: source.business?.proofPoints?.length
      ? [...source.business.proofPoints]
      : undefined,
    rankOrder: keyMessages.length > 0 ? ["primaryMessage", "supportingMessages"] : ["primaryMessage"],
  };
}

function buildVisualPriorities(brand: BrandBrainContextSlice): CreativeBrief["visualPriorities"] {
  const visual = brand.snapshot.visualIdentity;
  const mustInclude: string[] = [];
  if (visual?.colors?.length) {
    mustInclude.push(`Use brand color tokens (${visual.colors.length} defined).`);
  }
  if (visual?.logoRules?.length) {
    mustInclude.push("Apply logo usage rules from Brand Brain.");
  }

  return {
    summary: visual?.colors?.length
      ? "Honor Brand Brain color, typography, and logo rules."
      : "Visual brand rules incomplete — use conservative layout.",
    mustInclude: mustInclude.length > 0 ? mustInclude : undefined,
    referenceAssetIds: brand.snapshot.assetReferences?.map((ref) => ref.assetId),
  };
}

function buildApprovalRequirements(
  decision: MarketingDecisionRecord,
  brand: BrandBrainContextSlice
): CreativeBriefApprovalRequirements {
  const brandUnavailable = !brand.available;
  const notes: string[] = [...decision.approvalPolicy.reasons];

  if (decision.approvalPolicy.mode === "approval_before_generation") {
    notes.push("Human approval required before creative generation.");
  }
  if (decision.approvalPolicy.mode === "approval_before_publication") {
    notes.push("Human approval required before publication.");
  }
  if (brandUnavailable) {
    notes.push("Brand Brain unavailable — brand review required before use.");
  }
  if (brand.gaps.length > 0) {
    notes.push(`Brand Brain gaps: ${brand.gaps.join(", ")}`);
  }

  return {
    legalReviewRequired: decision.approvalPolicy.legalReviewRequired,
    brandReviewRequired: decision.approvalPolicy.brandReviewRequired || brandUnavailable,
    notes: notes.length > 0 ? notes.join(" ") : undefined,
  };
}

function resolveBriefStatus(
  brand: BrandBrainContextSlice,
  decision: MarketingDecisionRecord
): CreativeBriefStatus {
  if (!brand.available || brand.gaps.length > 0 || decision.status === "restricted") {
    return "draft";
  }
  return "ready";
}

function buildCampaignGoal(decision: MarketingDecisionRecord): CreativeBriefCampaignGoal {
  return {
    summary: decision.objective,
    objective: decision.objective,
  };
}

function buildOutputRequirements(
  decision: MarketingDecisionRecord
): CreativeBriefOutputRequirements {
  const volume = decision.creativeVolume;
  return {
    deliverableSummary: volume.rationale,
    variants:
      volume.maximumCount > 1
        ? Array.from({ length: Math.min(volume.recommendedCount, volume.maximumCount) }, (_, i) =>
            `Variant ${i + 1}`
          )
        : undefined,
    accessibilityNotes: "Provide alt text when output references visual assets.",
  };
}

function buildCta(
  decision: MarketingDecisionRecord,
  brand: BrandBrainContextSlice
): CreativeBrief["cta"] {
  const pattern =
    decision.ctaStrategy.primaryPattern ??
    brand.snapshot.voice?.preferredCtaPatterns?.[0] ??
    "";
  return {
    primary: pattern || "Follow CTA strategy constraints in decision record.",
    secondary: decision.ctaStrategy.secondaryPattern,
  };
}

function evidenceTrace(
  channel: MarketingDecisionChannelRecommendation,
  contentType: MarketingDecisionContentTypeRecommendation
): string[] {
  const lines = [
    ...channel.evidence.map((e) => `channel:${e.kind}:${e.ref}`),
    ...contentType.evidence.map((e) => `contentType:${e.kind}:${e.ref}`),
  ];
  return lines;
}

/** Pure deterministic assembler — no AI, network, or storage. */
export function assembleCreativeBrief(source: CreativeBriefSource): CreativeBrief {
  const { decision, brand } = source;
  assertDecisionAllowsBrief(decision);

  const channelPick = selectRecommendation(
    decision.channelRecommendations,
    source.requestedChannelId,
    "channel"
  );
  const contentPick = selectRecommendation(
    decision.contentTypeRecommendations,
    source.requestedContentTypeId,
    "contentType"
  );

  const trace: string[] = [
    channelPick.trace,
    contentPick.trace,
    ...evidenceTrace(channelPick.selected, contentPick.selected),
  ];

  if (source.campaignId) {
    trace.push(`campaignId:${source.campaignId}`);
  }
  if (source.projectId) {
    trace.push(`projectId:${source.projectId}`);
  }

  const audienceLabel =
    source.audience?.segmentLabel?.trim() ||
    brand.snapshot.profile?.name ||
    "Target audience not specified";

  const timestamp = source.assembledAt;

  return {
    id: buildBriefId(source),
    organizationId: decision.organizationId,
    title:
      source.briefTitle?.trim() ||
      source.decision.objective ||
      `Creative brief — ${channelPick.selected.label}`,
    status: resolveBriefStatus(brand, decision),
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    assemblyTrace: trace,
    campaignGoal: buildCampaignGoal(decision),
    audience: {
      segmentLabel: audienceLabel,
      description: source.audience?.description,
      painPoints: source.audience?.painPoints ? [...source.audience.painPoints] : undefined,
      buyingTriggers: source.audience?.buyingTriggers
        ? [...source.audience.buyingTriggers]
        : undefined,
    },
    channel: {
      channel: mapChannelId(channelPick.selected.id),
      placement: channelPick.selected.label,
      formatNotes: channelPick.selected.constraints?.join(" "),
    },
    contentType: mapContentTypeId(contentPick.selected.id),
    tone: buildTone(brand),
    cta: buildCta(decision, brand),
    messagingPriorities: buildMessaging(source, brand),
    visualPriorities: buildVisualPriorities(brand),
    requiredAssets: mapRequiredAssets(brand),
    forbiddenClaims: [...decision.forbiddenClaims],
    forbiddenWords: mergeForbiddenWords(decision, brand),
    requiredDisclaimers: mapDisclaimers(decision),
    platformConstraints: buildPlatformConstraints(brand, channelPick.selected),
    outputRequirements: buildOutputRequirements(decision),
    approvalRequirements: buildApprovalRequirements(decision, brand),
  };
}
