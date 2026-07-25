import type { BrandBrainContextSlice } from "@/lib/brand-brain/types";
import { emptyBrandBrainContextSlice } from "@/lib/intelligence/types/brand-brain-context-slice";
import { assembleCreativeBrief } from "@/lib/creative-brief";
import type { CreativeBrief } from "@/lib/creative-brief";
import { CreativeBriefAssemblyError } from "@/lib/creative-brief/errors";
import type { MarketingDecisionRecord } from "@/lib/marketing-decision";
import type { DevMarketingDecisionControls } from "./marketing-decision-inspector-view";
import { sanitizeDevAssemblyError } from "./marketing-decision-inspector-view";
import { sanitizeDevDisplayList, sanitizeDevDisplayText } from "./brand-brain-inspector-view";

export type CreativeBriefInspectorFailure = {
  readonly code: string;
  readonly message: string;
};

export type CreativeBriefInspectorView = {
  readonly available: boolean;
  readonly failure?: CreativeBriefInspectorFailure;
  readonly status: string;
  readonly title: string;
  readonly campaignGoal: string;
  readonly audience: {
    segmentLabel: string;
    description: string;
    painPoints: string[];
    buyingTriggers: string[];
  };
  readonly channel: string;
  readonly contentType: string;
  readonly tone: {
    directive: string;
    traits: string[];
    avoid: string[];
  };
  readonly cta: {
    primary: string;
    secondary: string;
  };
  readonly messagingPriorities: {
    primaryMessage: string;
    supportingMessages: string[];
    proofPoints: string[];
  };
  readonly visualPriorities: {
    summary: string;
    mustInclude: string[];
    mustAvoid: string[];
    referenceAssetIds: string[];
  };
  readonly requiredAssets: readonly unknown[];
  readonly forbiddenClaims: string[];
  readonly forbiddenWords: string[];
  readonly disclaimers: string[];
  readonly platformConstraints: string;
  readonly outputRequirements: string;
  readonly approvalRequirements: {
    legalReviewRequired: boolean;
    brandReviewRequired: boolean;
    notes: string;
  };
  readonly assemblyTrace: string[];
  readonly reviewWarnings: string[];
  readonly rawJson: string;
};

function resolveBrandSlice(brand?: BrandBrainContextSlice): BrandBrainContextSlice {
  if (brand) {
    return brand;
  }
  return emptyBrandBrainContextSlice(new Date(0).toISOString());
}

export function tryAssembleDevCreativeBrief(input: {
  decision: MarketingDecisionRecord;
  brand?: BrandBrainContextSlice;
  controls: DevMarketingDecisionControls;
  assembledAt: string;
}):
  | { success: true; brief: CreativeBrief }
  | { success: false; failure: CreativeBriefInspectorFailure } {
  try {
    const brief = assembleCreativeBrief({
      decision: input.decision,
      brand: resolveBrandSlice(input.brand),
      assembledAt: input.assembledAt,
      requestedChannelId: input.controls.requestedChannelId?.trim() || undefined,
      requestedContentTypeId: input.controls.requestedContentTypeId?.trim() || undefined,
      briefTitle: `Dev brief — ${input.controls.objective.trim().slice(0, 48) || "validation"}`,
    });
    return { success: true, brief };
  } catch (error) {
    if (error instanceof CreativeBriefAssemblyError) {
      return { success: false, failure: sanitizeDevAssemblyError(error) };
    }
    return { success: false, failure: sanitizeDevAssemblyError(error) };
  }
}

export function presentCreativeBriefInspectorView(input: {
  brief: CreativeBrief | null;
  failure?: CreativeBriefInspectorFailure;
  brand?: BrandBrainContextSlice;
}): CreativeBriefInspectorView | null {
  if (!input.brief && !input.failure) {
    return null;
  }

  if (!input.brief) {
    return {
      available: false,
      failure: input.failure,
      status: "unavailable",
      title: "Creative brief not assembled",
      campaignGoal: "",
      audience: {
        segmentLabel: "",
        description: "",
        painPoints: [],
        buyingTriggers: [],
      },
      channel: "",
      contentType: "",
      tone: { directive: "", traits: [], avoid: [] },
      cta: { primary: "", secondary: "" },
      messagingPriorities: {
        primaryMessage: "",
        supportingMessages: [],
        proofPoints: [],
      },
      visualPriorities: {
        summary: "",
        mustInclude: [],
        mustAvoid: [],
        referenceAssetIds: [],
      },
      requiredAssets: [],
      forbiddenClaims: [],
      forbiddenWords: [],
      disclaimers: [],
      platformConstraints: "",
      outputRequirements: "",
      approvalRequirements: {
        legalReviewRequired: false,
        brandReviewRequired: true,
        notes: input.failure?.message ?? "",
      },
      assemblyTrace: [],
      reviewWarnings: [
        input.failure?.message ?? "Decision did not permit creative brief assembly.",
      ],
      rawJson: "",
    };
  }

  const brief = input.brief;
  const reviewWarnings: string[] = [];
  if (brief.status === "draft") {
    reviewWarnings.push("Brief status is draft — brand or decision restrictions apply.");
  }
  if (input.brand && !input.brand.available) {
    reviewWarnings.push("Brand Brain unavailable — stricter brand review required.");
  }
  if (input.brand?.gaps.length) {
    reviewWarnings.push(`Brand Brain gaps: ${input.brand.gaps.join(", ")}`);
  }

  return {
    available: true,
    status: brief.status,
    title: sanitizeDevDisplayText(brief.title),
    campaignGoal: sanitizeDevDisplayText(brief.campaignGoal.summary),
    audience: {
      segmentLabel: sanitizeDevDisplayText(brief.audience.segmentLabel),
      description: sanitizeDevDisplayText(brief.audience.description),
      painPoints: sanitizeDevDisplayList(brief.audience.painPoints),
      buyingTriggers: sanitizeDevDisplayList(brief.audience.buyingTriggers),
    },
    channel: `${brief.channel.channel}${brief.channel.placement ? ` · ${brief.channel.placement}` : ""}`,
    contentType: brief.contentType,
    tone: {
      directive: sanitizeDevDisplayText(brief.tone.directive),
      traits: sanitizeDevDisplayList(brief.tone.traits),
      avoid: sanitizeDevDisplayList(brief.tone.avoid),
    },
    cta: {
      primary: sanitizeDevDisplayText(brief.cta.primary),
      secondary: sanitizeDevDisplayText(brief.cta.secondary),
    },
    messagingPriorities: {
      primaryMessage: sanitizeDevDisplayText(brief.messagingPriorities.primaryMessage),
      supportingMessages: sanitizeDevDisplayList(brief.messagingPriorities.supportingMessages),
      proofPoints: sanitizeDevDisplayList(brief.messagingPriorities.proofPoints),
    },
    visualPriorities: {
      summary: sanitizeDevDisplayText(brief.visualPriorities.summary),
      mustInclude: sanitizeDevDisplayList(brief.visualPriorities.mustInclude),
      mustAvoid: sanitizeDevDisplayList(brief.visualPriorities.mustAvoid),
      referenceAssetIds: sanitizeDevDisplayList(brief.visualPriorities.referenceAssetIds),
    },
    requiredAssets: brief.requiredAssets,
    forbiddenClaims: sanitizeDevDisplayList(brief.forbiddenClaims),
    forbiddenWords: sanitizeDevDisplayList(brief.forbiddenWords),
    disclaimers: sanitizeDevDisplayList(
      brief.requiredDisclaimers.map((item) => item.text)
    ),
    platformConstraints: JSON.stringify(brief.platformConstraints, null, 2),
    outputRequirements: JSON.stringify(brief.outputRequirements, null, 2),
    approvalRequirements: {
      legalReviewRequired: brief.approvalRequirements.legalReviewRequired,
      brandReviewRequired: brief.approvalRequirements.brandReviewRequired,
      notes: sanitizeDevDisplayText(brief.approvalRequirements.notes),
    },
    assemblyTrace: sanitizeDevDisplayList(brief.assemblyTrace),
    reviewWarnings,
    rawJson: JSON.stringify(brief, null, 2),
  };
}
