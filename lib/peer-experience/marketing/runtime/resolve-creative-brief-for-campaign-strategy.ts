import { assembleCreativeBrief } from "@/lib/creative-brief";
import type { CreativeBrief } from "@/lib/creative-brief";
import { CreativeBriefAssemblyError } from "@/lib/creative-brief/errors";
import type { ContextPackage } from "@/lib/intelligence";
import type { BrandBrainContextSlice } from "@/lib/brand-brain/types";
import { emptyBrandBrainContextSlice } from "@/lib/intelligence/types/brand-brain-context-slice";
import type { MarketingDecisionRecord } from "@/lib/marketing-decision";

import type { MarketingProject } from "../projects/types";

export type ResolveCreativeBriefForCampaignStrategyResult = {
  readonly brief?: CreativeBrief;
  readonly warnings: readonly string[];
};

function resolveBrandSlice(contextPackage: ContextPackage): BrandBrainContextSlice {
  const slice = contextPackage.slices.brandBrain as BrandBrainContextSlice | undefined;
  return slice ?? emptyBrandBrainContextSlice(contextPackage.scope.requestedAt);
}

export function resolveCreativeBriefForCampaignStrategy(input: {
  contextPackage: ContextPackage;
  project: MarketingProject;
  decision: MarketingDecisionRecord;
}): ResolveCreativeBriefForCampaignStrategyResult {
  const warnings: string[] = [];
  const brand = resolveBrandSlice(input.contextPackage);

  if (!brand.available) {
    warnings.push("Brand Brain unavailable — creative brief may be limited.");
  }

  if (
    input.decision.status === "blocked" ||
    !input.decision.eligibility.canExecute
  ) {
    warnings.push("Marketing decision blocked — creative brief skipped.");
    return { warnings };
  }

  try {
    const brief = assembleCreativeBrief({
      decision: input.decision,
      brand,
      assembledAt: input.contextPackage.scope.requestedAt,
      campaignId: input.project.id,
      projectId: input.project.id,
      briefTitle: `Campaign strategy — ${input.project.title}`,
    });
    return { brief, warnings };
  } catch (error) {
    if (error instanceof CreativeBriefAssemblyError) {
      warnings.push(error.message);
    } else {
      warnings.push("Creative brief assembly failed.");
    }
    return { warnings };
  }
}
