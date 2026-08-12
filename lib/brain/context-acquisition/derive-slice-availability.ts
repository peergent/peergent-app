import type { BrainContextSlices } from "../project-engine/brain-contract";
import { isContextReadyForResearch } from "../project-engine/context-model";
import type { ContextAssemblyResult } from "../context/assembly-types";
import type { AcquiredContextItem } from "./types";
import { itemMatchesRequirement } from "./normalize/context-item";

export function deriveSliceAvailability(input: {
  items: readonly AcquiredContextItem[];
  assembly: ContextAssemblyResult | null;
  campaignHasGoals: boolean;
}): Partial<BrainContextSlices> {
  const hasKey = (key: string) => input.items.some((item) => item.key === key || item.key.startsWith(`${key}.`));

  const businessFromAssembly = input.assembly
    ? input.assembly.readiness.scores.some((s) => s.dimension === "business" && s.score > 0)
    : false;
  const brandFromAssembly = input.assembly
    ? input.assembly.readiness.scores.some((s) => s.dimension === "brand" && s.score > 0)
    : false;
  const websiteFromAssembly = Boolean(input.assembly?.companySnapshot.website);

  return {
    business:
      businessFromAssembly ||
      hasKey("organization.identity") ||
      hasKey("business.positioning") ||
      hasKey("business.target_audience") ||
      hasKey("intelligence.coverage"),
    brand: brandFromAssembly || hasKey("dna.tone_of_voice") || hasKey("dna.values"),
    website: websiteFromAssembly || hasKey("website.messaging"),
    products: hasKey("business.products"),
    competitors: hasKey("business.competitors") || hasKey("intelligence.competitors"),
    goals: hasKey("project.goals") || hasKey("intelligence.goals") || input.campaignHasGoals,
    campaign: hasKey("project.identity") || hasKey("project.objective") || true,
  };
}

export function isAcquisitionContextReady(slices: Partial<BrainContextSlices>): boolean {
  const full: BrainContextSlices = {
    business: slices.business ?? false,
    brand: slices.brand ?? false,
    website: slices.website ?? false,
    products: slices.products ?? false,
    competitors: slices.competitors ?? false,
    goals: slices.goals ?? false,
    campaign: slices.campaign ?? true,
  };
  return isContextReadyForResearch(full);
}

export function itemSatisfiesRequirement(
  items: readonly AcquiredContextItem[],
  requirementKey: string
): boolean {
  return items.some((item) => itemMatchesRequirement(item, requirementKey));
}
