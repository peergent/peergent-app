export {
  BRAND_BRAIN_EXCLUDED_CONCERNS,
  BRAND_BRAIN_GAPS,
  BRAND_BRAIN_MODULE_DESCRIPTIONS,
  BRAND_BRAIN_OWNED_MODULES,
} from "./ownership";
export type {
  BrandBrainExcludedConcern,
  BrandBrainOwnedModule,
} from "./ownership";

export type { BrandProfileSource } from "./brand-profile-source";
export type {
  BrandProfileSourceCompanyDna,
  BrandProfileSourceDerivedBrand,
  BrandProfileSourceMarketingProfile,
} from "./brand-profile-source";

export {
  assembleBrandProfile,
  assembleBrandProfileSnapshot,
  BrandProfileOrganizationMismatchError,
} from "./assemble-brand-profile";
export type { AssembledBrandProfile } from "./assemble-brand-profile";

export type {
  BrandAssetReference,
  BrandAssetReferenceRole,
  BrandBrainContextSlice,
  BrandBrainGap,
  BrandColorRole,
  BrandColorToken,
  BrandCreativeChannel,
  BrandCreativeRules,
  BrandEmojiPolicy,
  BrandIdentityModule,
  BrandLayoutConstraint,
  BrandLogoRule,
  BrandLogoVariant,
  BrandProfile,
  BrandProfileSnapshot,
  BrandProfileStatus,
  BrandSafeAreaInsets,
  BrandTypographyRole,
  BrandTypographyToken,
  BrandVisualIdentity,
  BrandVoiceRules,
} from "./types";
