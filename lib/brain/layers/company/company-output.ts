import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { CapabilityExecutionResult } from "../../capabilities/execution-context";
import { campaignProvenance, upstreamProvenance } from "../../capabilities/shared/provenance";
import { getBrainCapability } from "../../capabilities/registry";
import { emptyBrainStructuredOutput } from "../../evidence/structured-output";
import type { CompanyGraph, CompanyGraphSnapshot, CompanyOutput } from "./types";

/** Maps CompanyGraph → BrainStructuredOutput — never UI text. */
export function mapCompanyGraphToBrainOutput(input: {
  graph: CompanyGraph;
  snapshot: CompanyGraphSnapshot;
  campaignContext?: CampaignContext | null;
  locale?: "nl" | "en";
}): CapabilityExecutionResult {
  const def = getBrainCapability("company_understanding");
  const generatedAt = input.graph.updatedAt;
  const base = emptyBrainStructuredOutput("company_understanding", def.version, generatedAt);
  const campaign = input.campaignContext;
  const graph = input.graph;

  const findings = [
    {
      id: "company-version",
      label: "Company graph version",
      value: String(graph.versionMeta.version),
      confidence: graph.confidence,
      provenance: [{ kind: "company_profile" as const, refId: graph.organizationId }],
    },
    {
      id: "company-fact-count",
      label: "Organizational facts",
      value: String(graph.facts.length),
      confidence: graph.confidence,
      provenance: [{ kind: "company_profile" as const, refId: graph.organizationId }],
    },
    ...graph.nodes.slice(0, 12).map((node, i) => ({
      id: `company-node-${i + 1}`,
      label: node.label,
      value: JSON.stringify({ domain: node.domain, count: node.factIds.length }),
      confidence: "medium" as const,
      provenance: [
        upstreamProvenance("company_understanding", node.domain),
        ...(campaign ? [campaignProvenance(campaign.projectId, node.domain)] : []),
      ],
    })),
  ];

  return {
    ...base,
    findings,
    companyGraph: graph,
    recommendations: [],
    actionProposals: [],
  };
}

export function buildCompanyOutput(input: {
  graph: CompanyGraph;
  snapshot: CompanyGraphSnapshot;
  outputRef: string;
  campaignContext?: CampaignContext | null;
  locale?: "nl" | "en";
}): CompanyOutput {
  return {
    graph: input.graph,
    snapshot: input.snapshot,
    outputRef: input.outputRef,
    structuredOutput: mapCompanyGraphToBrainOutput({
      graph: input.graph,
      snapshot: input.snapshot,
      campaignContext: input.campaignContext,
      locale: input.locale,
    }),
  };
}
