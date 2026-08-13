import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import {
  isActiveStrategyRunStatus,
  isStrategyRunStale,
} from "./strategy-run-types";

function strategyOutputCurrent(project: MarketingProject): boolean {
  const setup = project.campaignSetup;
  if (!setup?.strategyGeneratedAt) return false;
  const runVersion = setup.strategyRun?.contextVersion;
  if (runVersion === undefined) return true;
  return runVersion >= (setup.campaignContextVersion ?? 0);
}

/** Campaign wizard chose "Let Emma design a campaign". */
export function isAutomaticCampaignSetup(project: MarketingProject): boolean {
  return project.campaignSetup?.setupMode !== "manual";
}

export function isManualCampaignSetup(project: MarketingProject): boolean {
  return project.campaignSetup?.setupMode === "manual";
}

/**
 * Automatic campaigns defer lifecycle authority to ProjectEpisode / Project Engine.
 * Frontend strategy-readiness must not block bootstrap.
 */
export function usesProjectEngineLifecycleAuthority(project: MarketingProject): boolean {
  return isAutomaticCampaignSetup(project);
}

/** Whether an automatic campaign should request/resume server episode orchestration. */
export function shouldBootstrapAutomaticEpisode(
  project: MarketingProject
): boolean {
  if (!isAutomaticCampaignSetup(project)) return false;
  if (strategyOutputCurrent(project)) return false;

  const run = project.campaignSetup?.strategyRun;
  if (run?.status === "failed" || run?.status === "waiting_for_input") return false;
  if (isActiveStrategyRunStatus(run?.status)) {
    return isStrategyRunStale(run);
  }
  return true;
}
