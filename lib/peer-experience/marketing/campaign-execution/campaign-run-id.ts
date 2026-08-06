/** Stable campaign run identifiers. */

let runCounter = 0;

export function createCampaignRunId(now = Date.now()): string {
  runCounter += 1;
  return `crun_${now}_${runCounter.toString(36)}`;
}

export function buildCampaignContinuationIdempotencyKey(input: {
  peerId: string;
  projectId: string;
  campaignRunId: string;
  phase: "continuation" | "publication";
  approvalId?: string;
}): string {
  const approval = input.approvalId ?? "none";
  return `campaign-${input.phase}-${input.peerId}-${input.projectId}-${input.campaignRunId}-${approval}`;
}
