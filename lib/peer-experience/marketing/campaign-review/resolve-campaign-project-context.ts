import type { MarketingProject } from "../projects/types";
import { buildMarketingCampaignDetailViewModel } from "../view-models/build-marketing-campaign-detail-view-model";
import { buildMarketingCampaignDetailSourceFromDomainInput } from "../view-models/build-project-campaign-projection";
import { buildMarketingProjectDetailViewModel } from "../view-models/build-marketing-project-detail-view-model";
import type { MarketingCampaignDetailViewModel } from "../view-models/marketing-campaign-types";
import type { MarketingPeerDomainInput } from "../view-models/marketing-peer-domain-input";
import type { MarketingProjectDetailViewModel } from "../view-models/build-marketing-project-detail-view-model";

export type ResolvedCampaignProjectContext =
  | { readonly status: "loading" }
  | { readonly status: "not-found"; readonly projectId: string }
  | {
      readonly status: "ready";
      readonly project: MarketingProject;
      readonly projectDetail: MarketingProjectDetailViewModel;
      readonly campaignDetail: MarketingCampaignDetailViewModel | null;
    };

/**
 * Canonical project lookup for campaign project routes (customer + inspector).
 * Does not treat missing campaign detail VM as missing project.
 */
export function resolveCampaignProjectContext(input: {
  domainInput: MarketingPeerDomainInput;
  projectId: string;
  workspaceReady: boolean;
}): ResolvedCampaignProjectContext {
  if (!input.workspaceReady) {
    return { status: "loading" };
  }

  const project = input.domainInput.projects.find((p) => p.id === input.projectId);
  if (!project) {
    return { status: "not-found", projectId: input.projectId };
  }

  const projectDetail = buildMarketingProjectDetailViewModel({
    ...input.domainInput,
    projectId: input.projectId,
  });

  if (!projectDetail) {
    return { status: "not-found", projectId: input.projectId };
  }

  const source = buildMarketingCampaignDetailSourceFromDomainInput(
    input.domainInput,
    input.projectId
  );
  const campaignDetail = buildMarketingCampaignDetailViewModel(source);

  return {
    status: "ready",
    project,
    projectDetail,
    campaignDetail,
  };
}

export function campaignTitleForInspector(input: {
  campaignDetail: MarketingCampaignDetailViewModel | null;
  project: MarketingProject;
}): string {
  return input.campaignDetail?.title ?? input.project.title;
}
