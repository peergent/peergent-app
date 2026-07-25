import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingPeerTabId } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import type { PeerRow } from "@/lib/peer-display";
import { buildMarketingOverviewViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-overview-view-model";
import { buildMarketingReviewViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-review-view-model";
import { buildMarketingProjectsViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-projects-view-model";
import { buildMarketingContentViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-content-view-model";
import { buildMarketingPerformanceViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-performance-view-model";
import { buildMarketingResponsibilitiesViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-responsibilities-view-model";
import { buildMarketingKnowledgeViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-knowledge-view-model";
import { buildAllMarketingApprovalQueue } from "@/lib/peer-experience/marketing/view-models/build-marketing-activity-mappers";
import { buildMarketingBrainInsights } from "@/lib/peer-experience/marketing/view-models/build-marketing-brain-insights";
import { buildMarketingWorkspaceShellViewModel } from "./buildMarketingWorkspaceShellViewModel";
import type { MarketingReviewFilter } from "@/lib/peer-experience/marketing/domain/marketing-peer-types";
import type { MarketingProjectFilter } from "@/lib/peer-experience/marketing/domain/marketing-peer-types";
import type { MarketingPerformanceFilters } from "@/lib/peer-experience/marketing/domain/marketing-peer-types";

export type MarketingWorkspaceViewModel = {
  shell: ReturnType<typeof buildMarketingWorkspaceShellViewModel>;
  decisions: ReturnType<typeof buildAllMarketingApprovalQueue>;
  overview: ReturnType<typeof buildMarketingOverviewViewModel>;
  review: (filter: MarketingReviewFilter, selectedDraftId?: string | null) => ReturnType<
    typeof buildMarketingReviewViewModel
  >;
  projects: (filter: MarketingProjectFilter) => ReturnType<typeof buildMarketingProjectsViewModel>;
  content: ReturnType<typeof buildMarketingContentViewModel>;
  performance: (filters?: MarketingPerformanceFilters) => ReturnType<
    typeof buildMarketingPerformanceViewModel
  >;
  responsibilities: ReturnType<typeof buildMarketingResponsibilitiesViewModel>;
  knowledge: ReturnType<typeof buildMarketingKnowledgeViewModel>;
  insights: ReturnType<typeof buildMarketingBrainInsights>;
};

export function buildMarketingWorkspaceViewModel(input: {
  peer: PeerRow;
  domainInput: MarketingPeerDomainInput;
  activeTab: MarketingPeerTabId;
}): MarketingWorkspaceViewModel {
  const { peer, domainInput, activeTab } = input;
  const decisions = buildAllMarketingApprovalQueue(domainInput);

  return {
    shell: buildMarketingWorkspaceShellViewModel({ peer, domainInput, activeTab }),
    decisions,
    overview: buildMarketingOverviewViewModel(domainInput),
    review: (filter, selectedDraftId) =>
      buildMarketingReviewViewModel({ ...domainInput, filter, selectedDraftId }),
    projects: (filter) => buildMarketingProjectsViewModel({ ...domainInput, filter }),
    content: buildMarketingContentViewModel(domainInput),
    performance: (filters) => buildMarketingPerformanceViewModel({ ...domainInput, filters }),
    responsibilities: buildMarketingResponsibilitiesViewModel(domainInput),
    knowledge: buildMarketingKnowledgeViewModel(domainInput),
    insights: buildMarketingBrainInsights(domainInput),
  };
}
