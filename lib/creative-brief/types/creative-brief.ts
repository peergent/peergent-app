/**
 * Canonical Creative Brief — deterministic creative input for downstream LLM consumption.
 * Read-only domain types only; assembly and persistence are separate actions.
 */

export type CreativeBriefStatus = "draft" | "ready" | "locked";

export type CreativeBriefChannel =
  | "linkedin"
  | "instagram"
  | "facebook"
  | "x"
  | "email"
  | "web"
  | "print"
  | "paid_social"
  | "other";

export type CreativeBriefContentType =
  | "social_post"
  | "carousel"
  | "story"
  | "video_script"
  | "email"
  | "landing_section"
  | "ad_creative"
  | "blog_outline"
  | "other";

export type CreativeBriefCampaignGoal = {
  readonly summary: string;
  readonly objective?: string;
  readonly successMetric?: string;
  readonly deadline?: string;
};

export type CreativeBriefAudience = {
  readonly segmentLabel: string;
  readonly description?: string;
  readonly painPoints?: readonly string[];
  readonly buyingTriggers?: readonly string[];
};

export type CreativeBriefChannelSpec = {
  readonly channel: CreativeBriefChannel;
  readonly placement?: string;
  readonly formatNotes?: string;
};

export type CreativeBriefTone = {
  readonly directive: string;
  readonly traits?: readonly string[];
  readonly avoid?: readonly string[];
};

export type CreativeBriefCta = {
  readonly primary: string;
  readonly secondary?: string;
  readonly url?: string;
};

export type CreativeBriefMessagingPriorities = {
  readonly primaryMessage: string;
  readonly supportingMessages?: readonly string[];
  readonly proofPoints?: readonly string[];
  readonly rankOrder?: readonly string[];
};

export type CreativeBriefVisualPriorities = {
  readonly summary: string;
  readonly mustInclude?: readonly string[];
  readonly mustAvoid?: readonly string[];
  readonly referenceAssetIds?: readonly string[];
};

export type CreativeBriefRequiredAssetRole =
  | "logo"
  | "product_image"
  | "lifestyle"
  | "icon"
  | "template"
  | "other";

export type CreativeBriefRequiredAsset = {
  readonly id: string;
  readonly role: CreativeBriefRequiredAssetRole;
  readonly assetId?: string;
  readonly description?: string;
  readonly required: boolean;
};

export type CreativeBriefDisclaimer = {
  readonly id: string;
  readonly text: string;
  readonly placement?: "footer" | "caption" | "overlay" | "body";
};

export type CreativeBriefPlatformConstraints = {
  readonly maxCharacters?: number;
  readonly maxHashtags?: number;
  readonly aspectRatio?: string;
  readonly safeZoneNotes?: string;
  readonly linkRules?: readonly string[];
  readonly mediaRules?: readonly string[];
};

export type CreativeBriefOutputRequirements = {
  readonly deliverableSummary: string;
  readonly variants?: readonly string[];
  readonly fileFormats?: readonly string[];
  readonly dimensions?: readonly string[];
  readonly accessibilityNotes?: string;
};

export type CreativeBriefApprovalRequirements = {
  readonly requiredReviewers?: readonly string[];
  readonly legalReviewRequired: boolean;
  readonly brandReviewRequired: boolean;
  readonly notes?: string;
};

/** Required creative sections owned by the Creative Brief Engine (not dependencies). */
export type CreativeBriefOwnedSections = {
  readonly campaignGoal: CreativeBriefCampaignGoal;
  readonly audience: CreativeBriefAudience;
  readonly channel: CreativeBriefChannelSpec;
  readonly contentType: CreativeBriefContentType;
  readonly tone: CreativeBriefTone;
  readonly cta: CreativeBriefCta;
  readonly messagingPriorities: CreativeBriefMessagingPriorities;
  readonly visualPriorities: CreativeBriefVisualPriorities;
  readonly requiredAssets: readonly CreativeBriefRequiredAsset[];
  readonly forbiddenClaims: readonly string[];
  readonly forbiddenWords: readonly string[];
  readonly requiredDisclaimers: readonly CreativeBriefDisclaimer[];
  readonly platformConstraints: CreativeBriefPlatformConstraints;
  readonly outputRequirements: CreativeBriefOutputRequirements;
  readonly approvalRequirements: CreativeBriefApprovalRequirements;
};

export type CreativeBrief = {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly status: CreativeBriefStatus;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
} & CreativeBriefOwnedSections;

/** Keys for completeness and validation (content sections only). */
export type CreativeBriefSectionKey = keyof CreativeBriefOwnedSections;

export type CreativeBriefGap = CreativeBriefSectionKey;

/** Engine-facing envelope for context assembly (future actions). */
export type CreativeBriefContextSlice = {
  readonly available: boolean;
  readonly completeness: number;
  readonly gaps: readonly CreativeBriefGap[];
  readonly brief: Partial<CreativeBrief>;
  readonly assembledAt: string;
};
