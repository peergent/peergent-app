/** Lifecycle of the org's active brand profile (MVP: one profile per organization). */
export type BrandProfileStatus = "draft" | "active";

export type BrandProfile = {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly status: BrandProfileStatus;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type BrandColorRole =
  | "primary"
  | "secondary"
  | "accent"
  | "background"
  | "text"
  | "neutral";

export type BrandColorToken = {
  readonly id: string;
  readonly role: BrandColorRole;
  readonly hex: string;
  readonly usageNote?: string;
};

export type BrandTypographyRole = "heading" | "body" | "caption" | "cta";

export type BrandTypographyToken = {
  readonly id: string;
  readonly role: BrandTypographyRole;
  readonly fontFamily: string;
  readonly fontWeight?: number;
  readonly fontSizePx?: number;
  readonly lineHeight?: number;
};

export type BrandLogoVariant = "primary" | "inverse" | "mark";

export type BrandLogoRule = {
  readonly id: string;
  /** Reference to an approved asset in Asset Brain (no binary stored here). */
  readonly assetId?: string;
  readonly variant: BrandLogoVariant;
  readonly minClearSpacePx?: number;
  readonly allowedBackgrounds?: readonly string[];
  readonly notes?: string;
};

export type BrandVisualIdentity = {
  readonly colors: readonly BrandColorToken[];
  readonly typography: readonly BrandTypographyToken[];
  readonly logoRules: readonly BrandLogoRule[];
};

export type BrandEmojiPolicy = "none" | "sparingly" | "allowed";

export type BrandVoiceRules = {
  readonly summary?: string;
  readonly personalityTraits: readonly string[];
  readonly dos: readonly string[];
  readonly donts: readonly string[];
  readonly forbiddenPhrases: readonly string[];
  readonly preferredCtaPatterns: readonly string[];
  readonly emojiPolicy: BrandEmojiPolicy;
  readonly maxSentenceLength?: number;
};

export type BrandIdentityModule = {
  readonly positioningStatement?: string;
  readonly tagline?: string;
  readonly valueProposition?: string;
  readonly keyMessages: readonly string[];
  readonly marketCategory?: string;
  readonly story?: string;
};

export type BrandCreativeChannel =
  | "instagram"
  | "linkedin"
  | "email"
  | "web"
  | "print"
  | "other";

export type BrandSafeAreaInsets = {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
};

export type BrandLayoutConstraint = {
  readonly id: string;
  readonly channel: BrandCreativeChannel;
  readonly widthPx?: number;
  readonly heightPx?: number;
  readonly safeAreaInsetsPx?: BrandSafeAreaInsets;
  readonly notes?: string;
};

export type BrandCreativeRules = {
  readonly layoutConstraints: readonly BrandLayoutConstraint[];
};

export type BrandAssetReferenceRole =
  | "logo_primary"
  | "logo_mark"
  | "logo_inverse"
  | "icon"
  | "photography"
  | "template"
  | "other";

/** Pointer to approved media in Asset Brain; Brand Brain stores rules and references only. */
export type BrandAssetReference = {
  readonly id: string;
  readonly assetId: string;
  readonly role: BrandAssetReferenceRole;
  readonly sortOrder?: number;
  readonly notes?: string;
};

/** Full org-scoped brand state composed from owned modules. */
export type BrandProfileSnapshot = {
  readonly profile: BrandProfile;
  readonly identity: BrandIdentityModule;
  readonly visualIdentity: BrandVisualIdentity;
  readonly voice: BrandVoiceRules;
  readonly creativeRules: BrandCreativeRules;
  readonly assetReferences: readonly BrandAssetReference[];
};

/** Dimensions used later for completeness scoring and customer guidance. */
export type BrandBrainGap =
  | "identity"
  | "visual-colors"
  | "visual-typography"
  | "logo-rules"
  | "voice"
  | "layout-constraints"
  | "asset-references";

/** Engine-facing projection (persistence and assembly are later actions). */
export type BrandBrainContextSlice = {
  readonly available: boolean;
  readonly completeness: number;
  readonly gaps: readonly BrandBrainGap[];
  readonly snapshot: Partial<BrandProfileSnapshot>;
  readonly assembledAt: string;
};
