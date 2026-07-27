import type { CampaignContinuationResult, CampaignContinuationStopReason } from "./types";

export const CAMPAIGN_CONTINUATION_STOP_MESSAGES: Record<CampaignContinuationStopReason, string> = {
  no_executable_work_units: "No executable work units remain",
  execution_failed: "A work unit could not be executed",
  review_required: "Review is required before continuing",
  iteration_limit: "Campaign continuation reached the safety iteration limit",
};

export function campaignContinuationStopMessage(
  reason: CampaignContinuationStopReason
): string {
  return CAMPAIGN_CONTINUATION_STOP_MESSAGES[reason];
}

export function formatCampaignContinuationSummary(result: CampaignContinuationResult): {
  completedLine: string;
  stoppedBecauseLine: string;
} {
  const count = result.completedWorkUnits.length;
  const completedLine =
    count === 1 ? "Completed 1 work unit" : `Completed ${count} work units`;
  return {
    completedLine,
    stoppedBecauseLine: `Stopped because:\n"${result.stopMessage}"`,
  };
}
