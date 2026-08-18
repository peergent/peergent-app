import type { CampaignBrandContextFields } from "@/lib/office/campaign/campaign-brand-boundary";

export type CampaignCompanyContextInput = CampaignBrandContextFields;

export function parseMultilineList(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export type CampaignCompanyContextValidationResult = {
  valid: boolean;
  brandNameError?: string;
  industryError?: string;
  targetAudienceError?: string;
  productsError?: string;
  uspError?: string;
};

export function validateCampaignCompanyContext(
  input: CampaignCompanyContextInput,
  nl: boolean
): CampaignCompanyContextValidationResult {
  const errors: CampaignCompanyContextValidationResult = { valid: true };

  if (!input.brandName?.trim()) {
    errors.valid = false;
    errors.brandNameError = nl
      ? "Vul een bedrijfs- of merknaam in."
      : "Enter a company or brand name.";
  }
  if (!input.industry?.trim()) {
    errors.valid = false;
    errors.industryError = nl ? "Vul een branche in." : "Enter an industry.";
  }
  if (!input.targetAudience?.trim()) {
    errors.valid = false;
    errors.targetAudienceError = nl ? "Vul een doelgroep in." : "Enter a target audience.";
  }
  const products = input.productsAndServices?.filter(Boolean) ?? [];
  if (products.length === 0) {
    errors.valid = false;
    errors.productsError = nl
      ? "Voeg minimaal één product of dienst toe."
      : "Add at least one product or service.";
  }
  const usps = input.uniqueSellingPoints?.filter(Boolean) ?? [];
  if (usps.length === 0) {
    errors.valid = false;
    errors.uspError = nl
      ? "Voeg minimaal één uniek voordeel toe."
      : "Add at least one unique selling point.";
  }

  return errors;
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
