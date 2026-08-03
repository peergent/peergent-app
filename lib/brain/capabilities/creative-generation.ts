import type { CapabilityExecutionContext, CapabilityExecutionResult } from "./execution-context";
import { emptyBrainStructuredOutput } from "../evidence/structured-output";
import { getBrainCapability } from "./registry";
import { campaignProvenance, upstreamProvenance } from "./shared/provenance";

const DELIVERABLE_TYPES = [
  "linkedin_post",
  "linkedin_carousel",
  "acquisition_email",
  "newsletter",
  "google_ads_campaign",
  "landing_page",
  "blog",
  "instagram_post",
  "campaign_concept",
] as const;

/** Deliverable planning — registry id `creative_generation`. No final copy generated. */
export function executeCreativeGeneration(ctx: CapabilityExecutionContext): CapabilityExecutionResult {
  const def = getBrainCapability("creative_generation");
  const generatedAt = new Date().toISOString();
  const nl = ctx.locale === "nl";
  const campaign = ctx.campaignContext;
  const base = emptyBrainStructuredOutput("creative_generation", def.version, generatedAt);

  const strategyOut = ctx.upstreamOutputs.strategy;
  const channelOut = ctx.upstreamOutputs.channel_planning;

  if (!strategyOut?.findings.length || !channelOut?.findings.length) {
    return {
      ...base,
      warnings: [
        {
          id: "warn-deliverable-deps",
          code: "missing_upstream_plans",
          message: nl
            ? "Deliverable-planning vereist strategie en kanaalplan."
            : "Deliverable planning requires strategy and channel plan.",
          provenance: campaign ? [campaignProvenance(campaign.projectId, "deliverables")] : [],
        },
      ],
    };
  }

  if (!campaign) return { ...base, warnings: [] };

  const selectedChannels = channelOut.findings
    .filter((f) => /geselecteerd|selected/i.test(f.value))
    .map((f) => f.label.replace(/^(Kanaal:|Channel:)\s*/i, ""));

  const deliverablesFromSetup = campaign.selectedDeliverables.length
    ? campaign.selectedDeliverables.map(String)
    : selectedChannels.flatMap((ch) => {
        if (ch.includes("linkedin")) return ["linkedin_post"];
        if (ch.includes("email")) return ["acquisition_email"];
        if (ch.includes("google")) return ["google_ads_campaign"];
        if (ch.includes("landing")) return ["landing_page"];
        return [];
      });

  const types = deliverablesFromSetup.length
    ? deliverablesFromSetup
    : DELIVERABLE_TYPES.slice(0, 3);

  const coreMessage =
    strategyOut.findings.find((f) => /core|kern/i.test(f.label))?.value ?? campaign.description;

  const findings = types.slice(0, 6).map((type, i) => ({
    id: `deliverable-${i + 1}`,
    label: nl ? "Deliverable" : "Deliverable",
    value: [
      `id: del-${campaign.projectId}-${i + 1}`,
      `type: ${type}`,
      `channel: ${selectedChannels[i] ?? selectedChannels[0] ?? "tbd"}`,
      `purpose: support campaign objective`,
      `message: ${coreMessage.slice(0, 120)}`,
      `status: planned`,
      `review: ${campaign.executionMode === "manual" ? "required" : "semi-automatic"}`,
    ].join(" | "),
    confidence: "medium" as const,
    provenance: [
      upstreamProvenance("strategy", "strategy-core"),
      upstreamProvenance("channel_planning", `channel-${i}`),
      campaignProvenance(campaign.projectId, "deliverables"),
    ],
  }));

  return {
    ...base,
    findings,
    actionProposals: [
      {
        id: "act-generate-deliverables",
        actionType: "generate_content",
        label: nl ? "Content genereren (planning)" : "Generate content (planning)",
        requiresApproval: campaign.executionMode !== "fully_automatic",
        provenance: [campaignProvenance(campaign.projectId, "deliverables")],
      },
    ],
  };
}
