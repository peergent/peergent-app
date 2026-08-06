/** Correlation metadata for distributed tracing — Sprint 9.5. */

export type CampaignExecutionCorrelation = {
  readonly campaignId: string;
  readonly campaignRunId: string;
  readonly approvalId?: string;
  readonly projectId: string;
  readonly organizationId: string;
};

export function buildCampaignExecutionCorrelation(input: {
  projectId: string;
  organizationId: string;
  campaignRunId: string;
  approvalId?: string;
}): CampaignExecutionCorrelation {
  return {
    campaignId: input.projectId,
    campaignRunId: input.campaignRunId,
    approvalId: input.approvalId,
    projectId: input.projectId,
    organizationId: input.organizationId,
  };
}

export function formatCampaignExecutionCorrelation(
  correlation: CampaignExecutionCorrelation
): string {
  const parts = [
    `campaignId=${correlation.campaignId}`,
    `campaignRunId=${correlation.campaignRunId}`,
    `projectId=${correlation.projectId}`,
    `organizationId=${correlation.organizationId}`,
  ];
  if (correlation.approvalId) {
    parts.push(`approvalId=${correlation.approvalId}`);
  }
  return parts.join("; ");
}
