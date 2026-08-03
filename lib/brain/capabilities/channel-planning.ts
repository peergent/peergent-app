import type { BrainFinding } from "../evidence/structured-output";
import { emptyBrainStructuredOutput } from "../evidence/structured-output";
import type { CapabilityExecutionContext, CapabilityExecutionResult } from "./execution-context";
import { getBrainCapability } from "./registry";
import { campaignProvenance, upstreamProvenance } from "./shared/provenance";

const CHANNEL_IDS = [
  "linkedin",
  "google_ads",
  "email",
  "newsletter",
  "landing_page",
  "blog",
  "instagram",
  "meta_ads",
  "seo",
] as const;

type ChannelId = (typeof CHANNEL_IDS)[number];

function normalizeChannel(ch: string): ChannelId | null {
  const n = ch.toLowerCase().replace(/\s+/g, "_");
  if (CHANNEL_IDS.includes(n as ChannelId)) return n as ChannelId;
  if (n.includes("linkedin")) return "linkedin";
  if (n.includes("google")) return "google_ads";
  if (n.includes("email")) return "email";
  if (n.includes("newsletter")) return "newsletter";
  if (n.includes("landing")) return "landing_page";
  if (n.includes("blog")) return "blog";
  if (n.includes("instagram")) return "instagram";
  if (n.includes("meta")) return "meta_ads";
  if (n.includes("seo")) return "seo";
  return null;
}

export function executeChannelPlanning(ctx: CapabilityExecutionContext): CapabilityExecutionResult {
  const def = getBrainCapability("channel_planning");
  const generatedAt = new Date().toISOString();
  const nl = ctx.locale === "nl";
  const campaign = ctx.campaignContext;
  const base = emptyBrainStructuredOutput("channel_planning", def.version, generatedAt);

  const strategyOut = ctx.upstreamOutputs.strategy;
  if (!strategyOut?.findings.length) {
    return {
      ...base,
      warnings: [
        {
          id: "warn-no-strategy",
          code: "strategy_required",
          message: nl
            ? "Kanaalplanning vereist een voltooide strategie."
            : "Channel planning requires a completed strategy.",
          provenance: campaign ? [campaignProvenance(campaign.projectId, "strategy")] : [],
        },
      ],
    };
  }

  if (!campaign) {
    return { ...base, warnings: [{ id: "w1", code: "no_campaign", message: "No campaign.", provenance: [] }] };
  }

  const strategyChannelHypothesis =
    strategyOut.findings.find((f) => /channel|kanaal/i.test(f.label))?.value ?? "";

  const manualSelected = campaign.selectedChannels
    .map((c) => normalizeChannel(String(c)))
    .filter(Boolean) as ChannelId[];

  const isManual = campaign.campaignMode === "manual" || campaign.executionMode === "manual";

  const findings: BrainFinding[] = [];

  for (const channelId of CHANNEL_IDS) {
    const selected =
      manualSelected.length > 0
        ? manualSelected.includes(channelId)
        : strategyChannelHypothesis.toLowerCase().includes(channelId.replace("_", ""));

    findings.push({
      id: `channel-${channelId}`,
      label: nl ? `Kanaal: ${channelId}` : `Channel: ${channelId}`,
      value: selected
        ? nl
          ? `Geselecteerd — rol: ${isManual ? "klantkeuze (constraint)" : "strategie-fit"}`
          : `Selected — role: ${isManual ? "customer choice (constraint)" : "strategy fit"}`
        : nl
          ? "Afgewezen — onvoldoende deterministische basis"
          : "Rejected — insufficient deterministic basis",
      confidence: selected ? "medium" : "low",
      provenance: [
        upstreamProvenance("strategy", "strategy-rec"),
        campaignProvenance(campaign.projectId, "selectedChannels"),
      ],
    });
  }

  const recommendations = manualSelected.slice(0, 3).map((ch, i) => ({
    id: `rec-channel-${i}`,
    label: nl ? "Kanaalprioriteit" : "Channel priority",
    priority: (i === 0 ? "high" : "medium") as "high" | "medium",
    provenance: [campaignProvenance(campaign.projectId, ch)],
  }));

  if (isManual && manualSelected.length === 0) {
    return {
      ...base,
      findings,
      warnings: [
        {
          id: "warn-manual-no-channels",
          code: "manual_channels_missing",
          message: nl
            ? "Handmatige modus — selecteer kanalen in campagne-setup."
            : "Manual mode — select channels in campaign setup.",
          provenance: [campaignProvenance(campaign.projectId, "selectedChannels")],
        },
      ],
    };
  }

  return { ...base, findings, recommendations };
}
