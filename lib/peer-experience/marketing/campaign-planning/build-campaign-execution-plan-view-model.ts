import {
  assertCustomerSafeExecutionPlanViewModel,
  presentCampaignExecutionPlan,
  presentCampaignExecutionPlanUnavailable,
} from "@/features/marketing-workspace/lib/campaign-execution-plan-presenter";

import { planCampaignExecution } from "@/lib/campaign/planner";

import { CampaignPlanningError } from "./errors";
import { buildCampaignPlannerSourceFromDomainInput } from "./build-campaign-planner-source-from-domain-input";
import type {
  CampaignExecutionPlanViewModel,
  CampaignExecutionPlanViewModelResult,
} from "./campaign-execution-plan-view-model";
import { resolveSetupChannelLabels } from "../campaign-onboarding/map-setup-to-planner-explicit";
import type { MarketingPeerDomainInput } from "../view-models/marketing-peer-domain-input";
import { buildAllowedChannelLabelsFromSetup } from "@/features/marketing-workspace/lib/campaign-execution-plan-customer-presenter";

export type BuildCampaignExecutionPlanViewModelInput = {
  projectId: string;
  domainInput: MarketingPeerDomainInput;
  assembledAt: string;
  version?: number;
};

/**
 * Read-only: workspace domain → customer execution plan view model.
 */
export function buildCampaignExecutionPlanViewModel(
  input: BuildCampaignExecutionPlanViewModelInput
): CampaignExecutionPlanViewModelResult {
  try {
    const source = buildCampaignPlannerSourceFromDomainInput({
      projectId: input.projectId,
      domainInput: input.domainInput,
      assembledAt: input.assembledAt,
      version: input.version,
    });
    const plan = planCampaignExecution(source);
    const project = input.domainInput.projects.find((p) => p.id === input.projectId);
    const allowedChannelLabels =
      project?.campaignSetup?.onboardingCompletedAt &&
      project.campaignSetup.selectedChannels?.length
        ? buildAllowedChannelLabelsFromSetup(
            resolveSetupChannelLabels(project.campaignSetup)
          )
        : undefined;

    const viewModel = presentCampaignExecutionPlan({
      plan,
      scopeNotes: source.scopeNotes,
      presentation: allowedChannelLabels ? { allowedChannelLabels } : {},
    });
    assertCustomerSafeExecutionPlanViewModel(viewModel);
    return { ok: true, viewModel };
  } catch (error) {
    if (error instanceof CampaignPlanningError) {
      return {
        ok: false,
        unavailableMessage: presentCampaignExecutionPlanUnavailable().unavailableMessage!,
      };
    }
    return {
      ok: false,
      unavailableMessage: presentCampaignExecutionPlanUnavailable().unavailableMessage!,
    };
  }
}

export function buildCampaignExecutionPlanViewModelOrUnavailable(
  input: BuildCampaignExecutionPlanViewModelInput
): CampaignExecutionPlanViewModel {
  const result = buildCampaignExecutionPlanViewModel(input);
  if (result.ok) return result.viewModel;
  return presentCampaignExecutionPlanUnavailable();
}
