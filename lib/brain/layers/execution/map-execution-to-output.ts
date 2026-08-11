import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { CapabilityExecutionResult } from "../../capabilities/execution-context";
import { campaignProvenance, upstreamProvenance } from "../../capabilities/shared/provenance";
import { getBrainCapability } from "../../capabilities/registry";
import { emptyBrainStructuredOutput } from "../../evidence/structured-output";
import type { ExecutionHistory } from "./types";

/** Maps ExecutionHistory → BrainStructuredOutput — never UI text. */
export function mapExecutionToBrainOutput(input: {
  history: ExecutionHistory;
  campaignContext?: CampaignContext | null;
  locale?: "nl" | "en";
}): CapabilityExecutionResult {
  const def = getBrainCapability("execution");
  const generatedAt = input.history.createdAt;
  const base = emptyBrainStructuredOutput("execution", def.version, generatedAt);
  const campaign = input.campaignContext;
  const history = input.history;

  const findings = [
    {
      id: "execution-overall-status",
      label: "Execution status",
      value: history.overallStatus,
      confidence: history.overallStatus === "SUCCEEDED" ? ("high" as const) : ("medium" as const),
      provenance: campaign ? [campaignProvenance(campaign.projectId, "execution-status")] : [],
    },
    {
      id: "execution-deliverable-count",
      label: "Deliverables executed",
      value: String(history.entries.length),
      confidence: "high" as const,
      provenance: campaign ? [campaignProvenance(campaign.projectId, "execution-count")] : [],
    },
    ...history.entries.map((entry, i) => ({
      id: `execution-entry-${i + 1}`,
      label: entry.instruction.target.channel,
      value: JSON.stringify({
        provider: entry.instruction.target.provider,
        status: entry.status,
        externalId: entry.receipts[0]?.externalId ?? null,
        dryRun: history.dryRun,
      }),
      confidence: entry.status === "SUCCEEDED" ? ("high" as const) : ("medium" as const),
      provenance: [
        upstreamProvenance("execution", entry.instruction.target.provider),
        ...(campaign ? [campaignProvenance(campaign.projectId, entry.instruction.deliverable.id)] : []),
      ],
    })),
  ];

  const executionResults = history.entries.map((entry) => ({
    id: entry.instruction.executionId,
    actionId: entry.instruction.deliverable.id,
    status:
      entry.status === "SUCCEEDED"
        ? ("completed" as const)
        : entry.status === "RETRYABLE"
          ? ("pending" as const)
          : entry.status === "PARTIALLY_SUCCEEDED"
            ? ("completed" as const)
            : ("failed" as const),
    summary: entry.receipts[0]?.evidenceSummary ?? entry.failures[0]?.message ?? entry.status,
    provenance: campaign
      ? [campaignProvenance(campaign.projectId, entry.instruction.executionId)]
      : [],
  }));

  return {
    ...base,
    findings,
    executionResults,
    executionHistory: history,
    recommendations: [],
    actionProposals: [],
  };
}
