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

/** Client-visible signals that strategy bootstrap already started or finished (may lag durable episode). */
export function isAutomaticCampaignPastStrategyBootstrap(
  project: MarketingProject
): boolean {
  const setup = project.campaignSetup;
  if (!setup) return false;
  if (setup.strategyGeneratedAt || setup.campaignBrainOutputs?.strategy) return true;
  const status = setup.strategyRun?.status;
  if (status === "completed") return true;
  if (
    status === "running" ||
    status === "validating" ||
    status === "gathering_context" ||
    status === "queued"
  ) {
    return true;
  }
  return false;
}

export type AutomaticPipelineRecoveryMountDecision = {
  eligible: boolean;
  decisionReason: string;
};

/** Whether page-mount should invoke durable pipeline recovery (server decides if stall exists). */
export function evaluateAutomaticPipelineRecoveryOnMount(
  project: MarketingProject
): AutomaticPipelineRecoveryMountDecision {
  if (!isAutomaticCampaignSetup(project)) {
    return { eligible: false, decisionReason: "manual_setup" };
  }
  if (!project.campaignSetup) {
    return { eligible: false, decisionReason: "missing_campaign_setup" };
  }
  if (isAutomaticCampaignPastStrategyBootstrap(project)) {
    if (project.campaignSetup.strategyGeneratedAt) {
      return { eligible: true, decisionReason: "strategy_generated_at" };
    }
    if (project.campaignSetup.campaignBrainOutputs?.strategy) {
      return { eligible: true, decisionReason: "strategy_brain_output" };
    }
    if (project.campaignSetup.strategyRun?.status === "completed") {
      return { eligible: true, decisionReason: "strategy_run_completed" };
    }
    return { eligible: true, decisionReason: "strategy_run_in_flight" };
  }
  return { eligible: false, decisionReason: "pre_strategy_bootstrap" };
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
