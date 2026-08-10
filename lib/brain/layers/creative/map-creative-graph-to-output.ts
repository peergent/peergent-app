import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { CapabilityExecutionResult } from "../../capabilities/execution-context";
import { campaignProvenance, upstreamProvenance } from "../../capabilities/shared/provenance";
import { getBrainCapability } from "../../capabilities/registry";
import { emptyBrainStructuredOutput } from "../../evidence/structured-output";
import type { CreativeGraph } from "./types";

/** Maps CreativeGraph → BrainStructuredOutput for persistence and Brain Output Layer consumption. */
export function mapCreativeGraphToBrainOutput(input: {
  graph: CreativeGraph;
  campaignContext?: CampaignContext | null;
  locale?: "nl" | "en";
}): CapabilityExecutionResult {
  const def = getBrainCapability("creative_generation");
  const generatedAt = input.graph.createdAt;
  const base = emptyBrainStructuredOutput("creative_generation", def.version, generatedAt);
  const nl = input.locale === "nl";
  const campaign = input.campaignContext;
  const g = input.graph;

  const selectedCampaign = g.campaigns.find((c) => c.selected) ?? g.campaigns[0];
  const primaryMessaging = g.messaging[0];

  const findings = [
    {
      id: "creative-direction",
      label: nl ? "Creatieve richting" : "Creative direction",
      value: g.direction
        ? JSON.stringify({
            id: g.direction.id,
            name: g.direction.name,
            angle: g.direction.angle,
            emotion: g.direction.emotion,
            rationale: g.direction.rationale,
          })
        : "",
      confidence: g.confidence as "low" | "medium" | "high",
      provenance: campaign ? [campaignProvenance(campaign.projectId, "creative-direction")] : [],
    },
    ...(selectedCampaign
      ? [
          {
            id: "creative-campaign-primary",
            label: nl ? "Campagneconcept" : "Campaign concept",
            value: JSON.stringify(selectedCampaign),
            confidence: selectedCampaign.confidence as "low" | "medium" | "high",
            provenance: campaign ? [campaignProvenance(campaign.projectId, "creative-campaign")] : [],
          },
        ]
      : []),
    ...(primaryMessaging
      ? [
          {
            id: "creative-messaging",
            label: nl ? "Messaging framework" : "Messaging framework",
            value: JSON.stringify(primaryMessaging),
            confidence: "high" as const,
            provenance: campaign ? [campaignProvenance(campaign.projectId, "creative-messaging")] : [],
          },
        ]
      : []),
    ...g.channelPlans.map((plan, i) => ({
      id: `creative-channel-${i + 1}`,
      label: nl ? `Kanaal: ${plan.channel}` : `Channel: ${plan.channel}`,
      value: JSON.stringify(plan),
      confidence: "medium" as const,
      provenance: [
        upstreamProvenance("channel_planning", plan.channel),
        ...(campaign ? [campaignProvenance(campaign.projectId, plan.channel)] : []),
      ],
    })),
    ...g.deliverables.map((del, i) => ({
      id: `creative-deliverable-${i + 1}`,
      label: nl ? "Deliverable" : "Deliverable",
      value: JSON.stringify(del),
      confidence: "medium" as const,
      provenance: campaign ? [campaignProvenance(campaign.projectId, del.type)] : [],
    })),
  ].filter((f) => f.value);

  const decisions = g.decisions.map((d) => ({
    id: d.id,
    label: d.title,
    rationale: d.reason,
    confidence: d.confidence as "low" | "medium" | "high",
    provenance: campaign ? [campaignProvenance(campaign.projectId, d.id)] : [],
  }));

  const recommendations = g.campaigns
    .filter((c) => !c.selected)
    .map((c) => ({
      id: `rec-alt-${c.id}`,
      label: c.name,
      priority: "medium" as const,
      provenance: campaign ? [campaignProvenance(campaign.projectId, c.id)] : [],
    }));

  return {
    ...base,
    findings,
    decisions,
    recommendations,
    creativeGraph: g,
    actionProposals: [
      {
        id: "act-review-creative",
        actionType: "review_creative",
        label: nl ? "Creatieve richting beoordelen" : "Review creative direction",
        requiresApproval: true,
        provenance: campaign ? [campaignProvenance(campaign.projectId, "creative-review")] : [],
      },
    ],
  };
}
