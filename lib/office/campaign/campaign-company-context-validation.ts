import type { CampaignBrandContextFields } from "@/lib/office/campaign/campaign-brand-boundary";

export type CampaignCompanyContextInput = CampaignBrandContextFields;

export function parseMultilineList(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function validateCampaignCompanyContext(
  input: CampaignCompanyContextInput,
  nl: boolean
): { valid: boolean; brandNameError?: string } {
  if (!input.brandName?.trim()) {
    return {
      valid: false,
      brandNameError: nl ? "Vul een bedrijfs- of merknaam in." : "Enter a company or brand name.",
    };
  }
  return { valid: true };
}

export function normalizeCampaignCompanyContext(
  input: CampaignCompanyContextInput
): Required<Pick<CampaignBrandContextFields, "brandName">> &
  Omit<CampaignBrandContextFields, "brandName"> {
  return {
    brandName: input.brandName!.trim(),
    industry: input.industry?.trim() || undefined,
    mission: input.mission?.trim() || undefined,
    positioning: input.positioning?.trim() || undefined,
    tone: input.tone?.trim() || undefined,
    targetAudience: input.targetAudience?.trim() || undefined,
    uniqueSellingPoints: input.uniqueSellingPoints?.map((v) => v.trim()).filter(Boolean),
    productsAndServices: input.productsAndServices?.map((v) => v.trim()).filter(Boolean),
  };
}
