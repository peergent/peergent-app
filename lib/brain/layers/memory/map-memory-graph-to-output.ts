import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { CapabilityExecutionResult } from "../../capabilities/execution-context";
import { campaignProvenance, upstreamProvenance } from "../../capabilities/shared/provenance";
import { getBrainCapability } from "../../capabilities/registry";
import { emptyBrainStructuredOutput } from "../../evidence/structured-output";
import type { MemoryGraph } from "./types";

/** Maps MemoryGraph → BrainStructuredOutput for persistence — never UI text. */
export function mapMemoryGraphToBrainOutput(input: {
  graph: MemoryGraph;
  campaignContext?: CampaignContext | null;
  locale?: "nl" | "en";
}): CapabilityExecutionResult {
  const def = getBrainCapability("memory");
  const generatedAt = input.graph.createdAt;
  const base = emptyBrainStructuredOutput("memory", def.version, generatedAt);
  const campaign = input.campaignContext;
  const summary = input.graph.summary;

  const findings = [
    {
      id: "memory-stored-count",
      label: "Memories stored",
      value: String(summary.storedCount),
      confidence: input.graph.confidence as "low" | "medium" | "high",
      provenance: campaign ? [campaignProvenance(campaign.projectId, "memory-stored")] : [],
    },
    {
      id: "memory-total-active",
      label: "Active memories",
      value: String(summary.totalActiveMemories),
      confidence: input.graph.confidence as "low" | "medium" | "high",
      provenance: campaign ? [campaignProvenance(campaign.projectId, "memory-active")] : [],
    },
    ...input.graph.nodes.map((node, i) => ({
      id: `memory-node-${i + 1}`,
      label: node.label,
      value: JSON.stringify({ domain: node.domain, count: node.memoryIds.length }),
      confidence: "medium" as const,
      provenance: [
        upstreamProvenance("memory", node.domain),
        ...(campaign ? [campaignProvenance(campaign.projectId, node.domain)] : []),
      ],
    })),
  ];

  const decisions = input.graph.decisions.slice(0, 10).map((d) => ({
    id: d.id,
    label: d.action.replace(/_/g, " "),
    rationale: d.reason,
    confidence: "medium" as const,
    provenance: campaign ? [campaignProvenance(campaign.projectId, d.category)] : [],
  }));

  return {
    ...base,
    findings,
    decisions,
    memoryGraph: input.graph,
    recommendations: [],
    actionProposals: [],
  };
}
