import { CampaignOrchestrator } from "@/lib/peer-experience/marketing/campaign-orchestrator";
import type { CampaignOrchestratorInput } from "@/lib/peer-experience/marketing/campaign-orchestrator";

export type CampaignContinueActionViewModel = {
  show: boolean;
  primaryLabel: string;
  primaryDisabled: boolean;
  runningMessage: string | null;
  executableCount: number;
};

export function buildCampaignContinueActionViewModel(input: {
  campaignsEnabled: boolean;
  orchestratorInput: CampaignOrchestratorInput;
  continuationRunning: boolean;
  manualExecutionDisabled?: boolean;
}): CampaignContinueActionViewModel {
  const runningMessage = input.continuationRunning
    ? "Marketing Peer is continuing your campaign..."
    : null;

  if (!input.campaignsEnabled) {
    return {
      show: false,
      primaryLabel: "Continue campaign",
      primaryDisabled: true,
      runningMessage,
      executableCount: 0,
    };
  }

  const plan = CampaignOrchestrator.plan(input.orchestratorInput);
  const executableCount = plan.executableWorkUnits.length;

  return {
    show: true,
    primaryLabel: input.continuationRunning ? "Continuing campaign..." : "Continue campaign",
    primaryDisabled:
      input.continuationRunning ||
      Boolean(input.manualExecutionDisabled) ||
      executableCount === 0,
    runningMessage,
    executableCount,
  };
}
