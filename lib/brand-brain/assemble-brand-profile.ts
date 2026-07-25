/**
 * Compatibility read-model: maps existing Company DNA and marketing positioning
 * into canonical Brand Brain types without writing or changing storage ownership.
 *
 * - Company DNA and marketing_profiles remain the write stores.
 * - Brand Brain types are the canonical consumption shape for future Context Engine work.
 * - No Supabase, network, or AI calls.
 */

import type { BrandProfileSource } from "./brand-profile-source";
import { BrandProfileOrganizationMismatchError } from "./errors";
import type {
  BrandBrainGap,
  BrandCreativeRules,
  BrandIdentityModule,
  BrandProfile,
  BrandProfileSnapshot,
  BrandVisualIdentity,
  BrandVoiceRules,
} from "./types";

export { BrandProfileOrganizationMismatchError } from "./errors";

export type AssembledBrandProfile = {
  readonly profile: BrandProfile;
  readonly identity: BrandIdentityModule;
  readonly visualIdentity: BrandVisualIdentity;
  readonly voice: BrandVoiceRules;
  readonly creativeRules: BrandCreativeRules;
  readonly assetReferences: BrandProfileSnapshot["assetReferences"];
  readonly gaps: readonly BrandBrainGap[];
};

const EMPTY_VISUAL: BrandVisualIdentity = {
  colors: [],
  typography: [],
  logoRules: [],
};

const EMPTY_CREATIVE: BrandCreativeRules = {
  layoutConstraints: [],
};

function assertBrandProfileSourceOrganizationScope(
  source: BrandProfileSource
): void {
  const expected = source.organizationId;

  if (source.companyDna && source.companyDna.organizationId !== expected) {
    throw new BrandProfileOrganizationMismatchError(
      `Company DNA organization_id ${source.companyDna.organizationId} does not match source organizationId ${expected}.`
    );
  }

  if (
    source.marketingProfile &&
    source.marketingProfile.organizationId !== expected
  ) {
    throw new BrandProfileOrganizationMismatchError(
      `Marketing profile organization_id ${source.marketingProfile.organizationId} does not match source organizationId ${expected}.`
    );
  }
}

function trimOrUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function nonEmptyStrings(values: readonly string[] | undefined): readonly string[] {
  if (!values?.length) {
    return [];
  }
  return values.map((v) => v.trim()).filter(Boolean);
}

function pickString(
  primary: string | undefined,
  fallback: string | undefined
): string | undefined {
  return trimOrUndefined(primary) ?? trimOrUndefined(fallback);
}

function pickStringArray(
  primary: readonly string[] | undefined,
  fallback: readonly string[] | undefined
): readonly string[] {
  const primaryList = nonEmptyStrings(primary);
  if (primaryList.length > 0) {
    return primaryList;
  }
  return nonEmptyStrings(fallback);
}

function resolveMarketingPositioning(source: BrandProfileSource) {
  return (
    source.marketingProfile?.brandPositioning ??
    source.marketingBrandPositioning ??
    null
  );
}

function mapIdentity(source: BrandProfileSource): BrandIdentityModule {
  const positioning = resolveMarketingPositioning(source);
  const derived = source.derivedMarketingBrand;

  return {
    positioningStatement: pickString(
      positioning?.positioningStatement,
      derived?.positioningStatement
    ),
    tagline: pickString(positioning?.tagline, derived?.tagline),
    valueProposition: pickString(
      positioning?.valueProposition,
      derived?.valueProposition
    ),
    keyMessages: pickStringArray(
      positioning?.keyMessages,
      derived?.keyMessages
    ),
    marketCategory: pickString(
      positioning?.marketCategory,
      derived?.marketCategory
    ),
    story: trimOrUndefined(source.companyDna?.mission),
  };
}

function mapVoiceFromTone(
  tone: {
    summary?: string;
    personality?: string[];
    dos?: string[];
    donts?: string[];
    examplePhrases?: string[];
  } | undefined
): Partial<BrandVoiceRules> {
  if (!tone) {
    return {};
  }

  return {
    summary: trimOrUndefined(tone.summary),
    personalityTraits: nonEmptyStrings(tone.personality),
    dos: nonEmptyStrings(tone.dos),
    donts: nonEmptyStrings(tone.donts),
    preferredCtaPatterns: nonEmptyStrings(tone.examplePhrases),
  };
}

function mergeVoice(
  primary: Partial<BrandVoiceRules>,
  fallback: Partial<BrandVoiceRules>
): BrandVoiceRules {
  return {
    summary: pickString(primary.summary, fallback.summary),
    personalityTraits:
      primary.personalityTraits && primary.personalityTraits.length > 0
        ? primary.personalityTraits
        : (fallback.personalityTraits ?? []),
    dos:
      primary.dos && primary.dos.length > 0
        ? primary.dos
        : (fallback.dos ?? []),
    donts:
      primary.donts && primary.donts.length > 0
        ? primary.donts
        : (fallback.donts ?? []),
    forbiddenPhrases: [],
    preferredCtaPatterns:
      primary.preferredCtaPatterns && primary.preferredCtaPatterns.length > 0
        ? primary.preferredCtaPatterns
        : (fallback.preferredCtaPatterns ?? []),
    emojiPolicy: "none",
  };
}

function mapVoice(source: BrandProfileSource): BrandVoiceRules {
  const fromDna = mapVoiceFromTone(source.companyDna?.toneOfVoice);
  const fromDerived = mapVoiceFromTone(source.derivedMarketingBrand?.toneOfVoice);
  return mergeVoice(fromDna, fromDerived);
}

function hasIdentityContent(identity: BrandIdentityModule): boolean {
  return Boolean(
    trimOrUndefined(identity.positioningStatement) ||
      trimOrUndefined(identity.tagline) ||
      trimOrUndefined(identity.valueProposition) ||
      identity.keyMessages.length > 0 ||
      trimOrUndefined(identity.marketCategory) ||
      trimOrUndefined(identity.story)
  );
}

function hasVoiceContent(voice: BrandVoiceRules): boolean {
  return Boolean(
    trimOrUndefined(voice.summary) ||
      voice.personalityTraits.length > 0 ||
      voice.dos.length > 0 ||
      voice.donts.length > 0 ||
      voice.preferredCtaPatterns.length > 0
  );
}

function computeGaps(
  identity: BrandIdentityModule,
  visualIdentity: BrandVisualIdentity,
  voice: BrandVoiceRules,
  creativeRules: BrandCreativeRules,
  assetReferences: BrandProfileSnapshot["assetReferences"]
): readonly BrandBrainGap[] {
  const gaps: BrandBrainGap[] = [];

  if (!hasIdentityContent(identity)) {
    gaps.push("identity");
  }
  if (visualIdentity.colors.length === 0) {
    gaps.push("visual-colors");
  }
  if (visualIdentity.typography.length === 0) {
    gaps.push("visual-typography");
  }
  if (visualIdentity.logoRules.length === 0) {
    gaps.push("logo-rules");
  }
  if (!hasVoiceContent(voice)) {
    gaps.push("voice");
  }
  if (creativeRules.layoutConstraints.length === 0) {
    gaps.push("layout-constraints");
  }
  if (assetReferences.length === 0) {
    gaps.push("asset-references");
  }

  return gaps;
}

function resolveProfileTimestamps(source: BrandProfileSource): {
  createdAt: string;
  updatedAt: string;
} {
  const persistedUpdates = [
    source.companyDna?.updatedAt,
    source.marketingProfile?.updatedAt,
  ].filter((value): value is string => Boolean(value));

  const createdAt =
    source.companyDna?.createdAt ??
    source.marketingProfile?.createdAt ??
    source.assembledAt;
  const updatedAt = persistedUpdates.length
    ? persistedUpdates.reduce((latest, value) => (value > latest ? value : latest))
    : source.assembledAt;

  return { createdAt, updatedAt };
}

function resolveProfileId(source: BrandProfileSource): string {
  return (
    source.companyDna?.id ??
    source.marketingProfile?.id ??
    `compat-brand:${source.organizationId}`
  );
}

function resolveProfileName(source: BrandProfileSource): string {
  return trimOrUndefined(source.organizationName) ?? "";
}

function buildProfileShell(
  source: BrandProfileSource,
  hasAnyModuleContent: boolean
): BrandProfile {
  const { createdAt, updatedAt } = resolveProfileTimestamps(source);

  return {
    id: resolveProfileId(source),
    organizationId: source.organizationId,
    name: resolveProfileName(source),
    status: hasAnyModuleContent ? "active" : "draft",
    version: 1,
    createdAt,
    updatedAt,
  };
}

/**
 * Assembles canonical Brand Brain read state from existing platform sources.
 * Returns the profile shell plus owned modules and completeness gaps.
 */
export function assembleBrandProfile(source: BrandProfileSource): AssembledBrandProfile {
  assertBrandProfileSourceOrganizationScope(source);

  const identity = mapIdentity(source);
  const voice = mapVoice(source);
  const visualIdentity = EMPTY_VISUAL;
  const creativeRules = EMPTY_CREATIVE;
  const assetReferences: BrandProfileSnapshot["assetReferences"] = [];

  const hasAnyModuleContent =
    hasIdentityContent(identity) ||
    hasVoiceContent(voice) ||
    visualIdentity.colors.length > 0 ||
    visualIdentity.typography.length > 0 ||
    visualIdentity.logoRules.length > 0 ||
    creativeRules.layoutConstraints.length > 0 ||
    assetReferences.length > 0;

  const profile = buildProfileShell(source, hasAnyModuleContent);
  const gaps = computeGaps(
    identity,
    visualIdentity,
    voice,
    creativeRules,
    assetReferences
  );

  return {
    profile,
    identity,
    visualIdentity,
    voice,
    creativeRules,
    assetReferences,
    gaps,
  };
}

/** Snapshot view including the assembled profile shell (convenience for callers). */
export function assembleBrandProfileSnapshot(
  source: BrandProfileSource
): BrandProfileSnapshot {
  const assembled = assembleBrandProfile(source);
  return {
    profile: assembled.profile,
    identity: assembled.identity,
    visualIdentity: assembled.visualIdentity,
    voice: assembled.voice,
    creativeRules: assembled.creativeRules,
    assetReferences: assembled.assetReferences,
  };
}
