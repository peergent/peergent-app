import type { ContextPackage } from "@/lib/intelligence";
import type { BrandBrainContextSlice } from "@/lib/brand-brain/types";
import type { BusinessBrainContextSlice } from "@/lib/intelligence/types/business-brain-context-slice";
import type { CompanyDnaContextSlice } from "@/lib/intelligence/types/company-dna-context-slice";
import type { MarketingUnderstandingContextSlice } from "@/lib/intelligence/types/marketing-understanding-context-slice";
import type { MarketingDecisionSource } from "@/lib/marketing-decision";
import type { MarketingPlan, MarketingStrategy } from "@/lib/marketing-intelligence";

import { resolveSetupChannelLabels } from "../campaign-onboarding/map-setup-to-planner-explicit";
import type { MarketingProject } from "../projects/types";
import type { MarketingResponsibility } from "../responsibilities/types";

export function buildMarketingDecisionSourceForCampaign(input: {
  contextPackage: ContextPackage;
  project: MarketingProject;
  strategy: MarketingStrategy | null;
  plan: MarketingPlan | null;
  responsibilities: readonly MarketingResponsibility[];
}): MarketingDecisionSource {
  const { contextPackage, project, strategy, plan, responsibilities } = input;
  const scope = contextPackage.scope;

  const companyDna = contextPackage.slices.companyDna as CompanyDnaContextSlice | undefined;
  const businessBrain = contextPackage.slices.businessBrain as
    | BusinessBrainContextSlice
    | undefined;
  const marketingUnderstanding = contextPackage.slices
    .marketingUnderstanding as MarketingUnderstandingContextSlice | undefined;
  const brandBrain = contextPackage.slices.brandBrain as BrandBrainContextSlice | undefined;

  const setupChannels = project.campaignSetup
    ? resolveSetupChannelLabels(project.campaignSetup)
    : [];

  const objective =
    project.goal?.trim() ||
    project.campaignSetup?.description?.trim() ||
    scope.peer.objective?.trim() ||
    `Campaign strategy for "${project.title}"`;

  return {
    organizationId: scope.organization.organizationId,
    peerId: scope.peer.peerId,
    peerRole: scope.peer.role,
    objective,
    assembledAt: contextPackage.scope.requestedAt,
    context: {
      companyDnaAvailable: companyDna?.available,
      businessBrainAvailable: businessBrain?.available,
      businessBrainSparse: businessBrain?.sparse,
      marketingUnderstandingAvailable: marketingUnderstanding?.available,
      marketingUnderstandingCompleteness: marketingUnderstanding?.completeness,
      marketingUnderstandingSparse: marketingUnderstanding?.sparse,
      marketingUnderstandingGaps: marketingUnderstanding?.gaps,
      brandBrainAvailable: brandBrain?.available,
      brandForbiddenPhrases: brandBrain?.snapshot.voice?.forbiddenPhrases,
      brandPreferredCtaPatterns: brandBrain?.snapshot.voice?.preferredCtaPatterns,
      customerSegmentCount: marketingUnderstanding?.customerSegments?.length ?? 0,
    },
    ...(strategy
      ? {
          strategy: {
            summary: strategy.summary,
            confidence: strategy.confidence,
            channelLabels: setupChannels.length
              ? setupChannels
              : strategy.campaignIdeas.flatMap((c) => c.channels),
          },
        }
      : {}),
    ...(plan
      ? {
          plan: {
            summary: plan.summary,
            confidence: plan.confidence,
            contentCalendarCount: plan.contentCalendar.length,
            campaignChannelLabels: plan.campaigns.flatMap((c) => c.channels),
          },
        }
      : {}),
    responsibilityPolicy: {
      responsibilities: responsibilities.map((r) => ({
        category: r.category,
        enabled: r.enabled,
        approvalPolicy: r.approvalPolicy,
        autonomyLevel: r.autonomyLevel,
        ...(r.guardrails.maxMonthlySpend !== undefined
          ? { maxMonthlySpend: r.guardrails.maxMonthlySpend }
          : {}),
        approvalRequired: r.approvalPolicy !== "fully_automatic",
      })),
    },
    ...(project.campaignSetup?.budgetAmount
      ? {
          budgetConstraint: {
            maxMonthlySpend: project.campaignSetup.budgetAmount,
            paidSpendBlocked: false,
          },
        }
      : {}),
  };
}
