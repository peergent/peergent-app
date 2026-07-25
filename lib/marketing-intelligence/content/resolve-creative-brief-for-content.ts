import type { BrandBrainContextSlice } from "@/lib/brand-brain/types";
import { assembleCreativeBrief } from "@/lib/creative-brief";
import type { CreativeBrief } from "@/lib/creative-brief";
import { CreativeBriefAssemblyError } from "@/lib/creative-brief/errors";
import { emptyBrandBrainContextSlice } from "@/lib/intelligence/types/brand-brain-context-slice";
import type { ContextPackage } from "@/lib/intelligence";
import type { BusinessBrainContextSlice } from "@/lib/intelligence/types/business-brain-context-slice";
import type { CompanyDnaContextSlice } from "@/lib/intelligence/types/company-dna-context-slice";
import type { MarketingUnderstandingContextSlice } from "@/lib/intelligence/types/marketing-understanding-context-slice";
import { assembleMarketingDecision } from "@/lib/marketing-decision";
import type { MarketingDecisionSource } from "@/lib/marketing-decision";
import type { ContentCalendarEntry, MarketingPlan } from "../types/plan";
import type { MarketingDraftContentType } from "../types/content-draft";

export type CreativeBriefContentIntegrationStatus = "used" | "legacy_fallback";

export type ResolveCreativeBriefForContentResult = {
  readonly status: CreativeBriefContentIntegrationStatus;
  readonly brief?: CreativeBrief;
  readonly fallbackReason?: string;
  readonly warnings: readonly string[];
};

function resolveBrandSlice(contextPackage: ContextPackage): BrandBrainContextSlice {
  const slice = contextPackage.slices.brandBrain as BrandBrainContextSlice | undefined;
  if (slice) {
    return slice;
  }
  return emptyBrandBrainContextSlice(contextPackage.scope.requestedAt);
}

/** Maps content-generation context into MarketingDecisionSource (no DB). */
export function buildMarketingDecisionSourceForContent(input: {
  contextPackage: ContextPackage;
  plan: MarketingPlan;
  activity: ContentCalendarEntry;
  normalizedContentType: MarketingDraftContentType;
}): MarketingDecisionSource {
  const { contextPackage, plan, activity, normalizedContentType } = input;
  const companyDna = contextPackage.slices.companyDna as CompanyDnaContextSlice | undefined;
  const businessBrain = contextPackage.slices.businessBrain as
    | BusinessBrainContextSlice
    | undefined;
  const marketingUnderstanding = contextPackage.slices
    .marketingUnderstanding as MarketingUnderstandingContextSlice | undefined;
  const brandBrain = contextPackage.slices.brandBrain as BrandBrainContextSlice | undefined;

  const campaignChannels = plan.campaigns.flatMap((campaign) => campaign.channels);

  const objective =
    contextPackage.scope.peer.objective?.trim() ||
    `Content for plan activity "${activity.title}"`;

  return {
    organizationId: contextPackage.scope.organization.organizationId,
    peerId: contextPackage.scope.peer.peerId,
    peerRole: contextPackage.scope.peer.role,
    objective,
    assembledAt: contextPackage.scope.requestedAt,
    context: {
      companyDnaAvailable: companyDna?.available,
      businessBrainAvailable: businessBrain?.available,
      businessBrainSparse: businessBrain?.sparse,
      marketingUnderstandingAvailable: marketingUnderstanding?.available,
      marketingUnderstandingCompleteness: marketingUnderstanding?.completeness,
      marketingUnderstandingSparse: marketingUnderstanding?.sparse,
      marketingUnderstandingGaps: marketingUnderstanding?.gaps,
      brandBrainAvailable: brandBrain?.available,
      brandForbiddenPhrases: brandBrain?.snapshot.voice?.forbiddenPhrases,
      brandPreferredCtaPatterns: brandBrain?.snapshot.voice?.preferredCtaPatterns,
      customerSegmentCount: marketingUnderstanding?.customerSegments?.length ?? 0,
    },
    strategy: {
      summary: plan.basedOnStrategySummary,
      confidence: plan.confidence,
      channelLabels: campaignChannels,
    },
    plan: {
      summary: plan.summary,
      confidence: plan.confidence,
      contentCalendarCount: plan.contentCalendar.length,
      campaignChannelLabels: campaignChannels,
    },
    planActivity: {
      title: activity.title,
      contentType: activity.contentType,
      channel: activity.channel,
    },
    responsibilityPolicy: {
      responsibilities: [
        {
          category: "linkedin",
          enabled: true,
          approvalPolicy: "approval_required",
          autonomyLevel: "semi_autonomous",
        },
        {
          category: "content_marketing",
          enabled: true,
          approvalPolicy: "approval_required",
          autonomyLevel: "semi_autonomous",
        },
      ],
    },
    requestedChannel: activity.channel,
    requestedContentType: normalizedContentType,
  };
}

/**
 * Assembles Marketing Decision + Creative Brief for content draft prompts.
 * Returns legacy_fallback when decision/brief cannot be used safely.
 */
export function resolveCreativeBriefForContent(input: {
  contextPackage: ContextPackage;
  plan: MarketingPlan;
  activity: ContentCalendarEntry;
  normalizedContentType: MarketingDraftContentType;
}): ResolveCreativeBriefForContentResult {
  const warnings: string[] = [];
  const source = buildMarketingDecisionSourceForContent(input);

  let decision;
  try {
    decision = assembleMarketingDecision(source);
  } catch {
    return {
      status: "legacy_fallback",
      fallbackReason: "Marketing decision assembly failed.",
      warnings: ["Creative Brief unavailable: marketing decision assembly failed."],
    };
  }

  if (
    decision.status === "blocked" ||
    !decision.eligibility.canExecute ||
    !decision.eligibility.canGenerateCreative
  ) {
    return {
      status: "legacy_fallback",
      fallbackReason:
        decision.eligibility.blockedReasons[0] ??
        "Marketing decision blocked creative brief assembly.",
      warnings: [
        "Creative Brief unavailable: marketing decision blocked or restricted.",
      ],
    };
  }

  if (decision.approvalPolicy.mode === "blocked_manual_only") {
    return {
      status: "legacy_fallback",
      fallbackReason: "Manual-only marketing decision policy.",
      warnings: ["Creative Brief unavailable: manual-only decision policy."],
    };
  }

  const brand = resolveBrandSlice(input.contextPackage);
  if (!brand.available) {
    warnings.push("Brand Brain unavailable — brief may require brand review.");
  }

  try {
    const brief = assembleCreativeBrief({
      decision,
      brand,
      assembledAt: input.contextPackage.scope.requestedAt,
      requestedChannelId: source.requestedChannel
        ? normalizeChannelId(source.requestedChannel)
        : undefined,
      requestedContentTypeId: input.normalizedContentType,
      briefTitle: `Content draft — ${input.activity.title}`,
      audience: buildAudienceFromContext(input.contextPackage),
    });
    return {
      status: "used",
      brief,
      warnings,
    };
  } catch (error) {
    const message =
      error instanceof CreativeBriefAssemblyError
        ? error.message
        : "Creative brief assembly failed.";
    return {
      status: "legacy_fallback",
      fallbackReason: message,
      warnings: [`Creative Brief unavailable: ${message}`],
    };
  }
}

function normalizeChannelId(raw: string): string {
  return raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function buildAudienceFromContext(contextPackage: ContextPackage) {
  const understanding = contextPackage.slices
    .marketingUnderstanding as MarketingUnderstandingContextSlice | undefined;
  const primary = understanding?.customerSegments?.[0];
  if (!primary) {
    return undefined;
  }
  return {
    segmentLabel: primary.name,
    painPoints: primary.painPoints,
    buyingTriggers: primary.buyingTriggers,
  };
}
