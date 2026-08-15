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

function normalizeBrandKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Derive campaign brand/client name — distinct from campaign title. */
export function inferCampaignBrandName(
  campaignTitle: string,
  setup?: MarketingProjectCampaignSetup
): string {
  const explicit =
    setup?.campaignBrandName?.trim() || setup?.campaignBrandContext?.brandName?.trim();
  if (explicit) return explicit;

  const trimmed = campaignTitle.trim();
  const withoutSuffix = trimmed.replace(
    /\s+(launch|campagne|campaign|promotie|promotion|introductie|introduction)$/i,
    ""
  );
  return withoutSuffix.trim() || trimmed;
}

/** Account organization name from Business/Brand Brain — never the campaign title. */
export function resolveAccountOrganizationName(
  understanding: MarketingUnderstanding | null | undefined,
  fallback?: string | null
): string | null {
  const productNames = understanding?.products?.map((p) => p.name) ?? [];
  if (productNames.some((name) => /peergent|marketing peer/i.test(name))) {
    return "Peergent";
  }
  const category = understanding?.brand?.marketCategory?.trim();
  if (category && /peergent|ai.?werkplek|ai workforce/i.test(category)) {
    return "Peergent";
  }
  return fallback?.trim() ?? null;
}

/** Live campaigns for a different brand/client must not inherit org-level intelligence. */
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
