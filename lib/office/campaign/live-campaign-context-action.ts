"use server";

import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { CampaignCompanyContextInput } from "./campaign-company-context-validation";
import { normalizeCampaignCompanyContext } from "./campaign-company-context-validation";
import {
  submitCampaignContextResolutionAction,
  type SubmitCampaignContextResolutionActionResult,
} from "./campaign-context-resolution-action";

export type SubmitLiveCampaignCompanyContextActionInput = {
  peerId: string;
  projectId: string;
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  context: CampaignCompanyContextInput;
  locale?: "nl" | "en";
};

export type SubmitLiveCampaignCompanyContextActionResult = SubmitCampaignContextResolutionActionResult;

/** PX-61 — company context via unified resolution bridge. */
export async function submitLiveCampaignCompanyContextAction(
  input: SubmitLiveCampaignCompanyContextActionInput
): Promise<SubmitLiveCampaignCompanyContextActionResult> {
  return submitCampaignContextResolutionAction({
    peerId: input.peerId,
    projectId: input.projectId,
    project: input.project,
    domainInput: input.domainInput,
    locale: input.locale,
    resolution: {
      kind: "company",
      decision: "supplied",
      brandContext: normalizeCampaignCompanyContext(input.context),
    },
  });
}
