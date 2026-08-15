import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";
import type { MarketingProjectCampaignSetup } from "@/lib/peer-experience/marketing/projects/types";

export type CampaignBrandContextFields = {
  brandName?: string;
  industry?: string;
  mission?: string;
  uniqueSellingPoints?: readonly string[];
  productsAndServices?: readonly string[];
  positioning?: string;
  tone?: string;
  targetAudience?: string;
};

export type OrganizationIdentitySource =
  | "durable_organization"
  | "caller_override"
  | "legacy_marketing_understanding_heuristic"
  | "unknown";

export type ExternalBrandDecisionSource =
  | "seed_campaign"
  | "own_org_default"
  | "explicit_campaign_brand"
  | "explicit_campaign_brand_context";

export type CampaignBrandBoundaryResolution = {
  accountOrganizationName: string | null;
  brandName: string;
  usesExternalBrand: boolean;
  hasExplicitCampaignBrand: boolean;
  organizationIdentitySource: OrganizationIdentitySource;
  externalBrandDecisionSource: ExternalBrandDecisionSource;
};

function normalizeBrandKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Legacy title-based brand inference — display and backward compatibility only.
 * Must not alone determine external-brand isolation (see resolveCampaignBrandBoundary).
 */
export function inferCampaignBrandName(
  campaignTitle: string,
  setup?: MarketingProjectCampaignSetup
): string {
  const explicit = resolveExplicitCampaignBrandName(setup);
  if (explicit) return explicit;

  const trimmed = campaignTitle.trim();
  const withoutSuffix = trimmed.replace(
    /\s+(launch|campagne|campaign|promotie|promotion|introductie|introduction)$/i,
    ""
  );
  return withoutSuffix.trim() || trimmed;
}

/** Explicit customer-declared campaign brand — the only title-adjacent external-brand signal. */
export function resolveExplicitCampaignBrandName(
  setup?: MarketingProjectCampaignSetup
): string | null {
  const fromField = setup?.campaignBrandName?.trim();
  if (fromField) return fromField;
  const fromContext = setup?.campaignBrandContext?.brandName?.trim();
  if (fromContext) return fromContext;
  return null;
}

/**
 * Legacy MarketingUnderstanding heuristics — fallback only when durable org identity is unavailable.
 * @deprecated Prefer organizations.name via resolveDurableOrganizationName().
 */
export function resolveLegacyAccountOrganizationName(
  understanding: MarketingUnderstanding | null | undefined
): string | null {
  const productNames = understanding?.products?.map((p) => p.name) ?? [];
  if (productNames.some((name) => /peergent|marketing peer/i.test(name))) {
    return "Peergent";
  }
  const category = understanding?.brand?.marketCategory?.trim();
  if (category && /peergent|ai.?werkplek|ai workforce/i.test(category)) {
    return "Peergent";
  }
  return null;
}

/** @deprecated Use resolveDurableOrganizationName() — legacy alias for tests and gradual migration. */
export function resolveAccountOrganizationName(
  understanding: MarketingUnderstanding | null | undefined,
  fallback?: string | null
): string | null {
  return (
    fallback?.trim() ??
    resolveLegacyAccountOrganizationName(understanding) ??
    null
  );
}

export function resolveDurableOrganizationName(input: {
  durableOrganizationName?: string | null;
  accountOrganizationNameOverride?: string | null;
  understanding?: MarketingUnderstanding | null;
}): { name: string | null; source: OrganizationIdentitySource } {
  const override = input.accountOrganizationNameOverride?.trim();
  if (override) {
    return { name: override, source: "caller_override" };
  }

  const durable = input.durableOrganizationName?.trim();
  if (durable) {
    return { name: durable, source: "durable_organization" };
  }

  const legacy = resolveLegacyAccountOrganizationName(input.understanding ?? null);
  if (legacy) {
    return { name: legacy, source: "legacy_marketing_understanding_heuristic" };
  }

  return { name: null, source: "unknown" };
}

/**
 * Compares explicit campaign brand against durable organization identity.
 * Campaign title alone must never reach this function.
 */
export function campaignUsesExternalBrand(input: {
  brandName: string;
  accountOrganizationName: string | null;
  isSeedCampaign: boolean;
}): boolean {
  if (input.isSeedCampaign) return false;
  const brand = normalizeBrandKey(input.brandName);
  const org = normalizeBrandKey(input.accountOrganizationName ?? "");
  if (!brand) return false;
  if (!org) return false;
  return brand !== org && !brand.includes(org) && !org.includes(brand);
}

export function resolveCampaignBrandBoundary(input: {
  campaignTitle: string;
  setup?: MarketingProjectCampaignSetup;
  isSeedCampaign: boolean;
  durableOrganizationName?: string | null;
  accountOrganizationNameOverride?: string | null;
  understanding?: MarketingUnderstanding | null;
  seedBrandName?: string;
}): CampaignBrandBoundaryResolution {
  if (input.isSeedCampaign) {
    const seedBrand = input.seedBrandName?.trim() ?? "";
    return {
      accountOrganizationName: null,
      brandName: seedBrand,
      usesExternalBrand: false,
      hasExplicitCampaignBrand: false,
      organizationIdentitySource: "unknown",
      externalBrandDecisionSource: "seed_campaign",
    };
  }

  const org = resolveDurableOrganizationName({
    durableOrganizationName: input.durableOrganizationName,
    accountOrganizationNameOverride: input.accountOrganizationNameOverride,
    understanding: input.understanding,
  });

  const explicitBrand = resolveExplicitCampaignBrandName(input.setup);
  const hasExplicitCampaignBrand = Boolean(explicitBrand);

  if (explicitBrand) {
    const usesExternalBrand = campaignUsesExternalBrand({
      brandName: explicitBrand,
      accountOrganizationName: org.name,
      isSeedCampaign: false,
    });
    return {
      accountOrganizationName: org.name,
      brandName: explicitBrand,
      usesExternalBrand,
      hasExplicitCampaignBrand: true,
      organizationIdentitySource: org.source,
      externalBrandDecisionSource: input.setup?.campaignBrandName?.trim()
        ? "explicit_campaign_brand"
        : "explicit_campaign_brand_context",
    };
  }

  const brandName =
    org.name ?? inferCampaignBrandName(input.campaignTitle, input.setup);

  return {
    accountOrganizationName: org.name,
    brandName,
    usesExternalBrand: false,
    hasExplicitCampaignBrand: false,
    organizationIdentitySource: org.source,
    externalBrandDecisionSource: "own_org_default",
  };
}

export function shouldUseOrganizationIntelligence(input: {
  usesExternalBrand: boolean;
  isSeedCampaign: boolean;
}): boolean {
  if (input.isSeedCampaign) return true;
  return !input.usesExternalBrand;
}

const PEERGENT_LEAK_TERMS = [
  "peergent office",
  "peer studio",
  "command center",
  "marketing peer",
  "ai-collega",
  "ai colleague",
  "ai-werkplek",
  "ai workforce",
] as const;

/** Suppress org-level facts that leaked into campaign evidence for external brands. */
export function filterLeakedOrganizationFacts(
  items: readonly string[],
  input: { usesExternalBrand: boolean; accountOrganizationName: string | null }
): string[] {
  if (!input.usesExternalBrand) return [...items];
  const org = normalizeBrandKey(input.accountOrganizationName ?? "peergent");
  return items.filter((item) => {
    const lower = item.toLowerCase();
    if (org && lower.includes(org)) return false;
    return !PEERGENT_LEAK_TERMS.some((term) => lower.includes(term));
  });
}
