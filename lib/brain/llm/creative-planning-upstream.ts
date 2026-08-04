import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { CapabilityExecutionContext } from "../capabilities/execution-context";
import { getBrainCapability } from "../capabilities/registry";
import type { BrainCapabilityId } from "../capabilities/registry";

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
  "website_landing",
] as const;

export type CreativeGenerationValidationCategory =
  | "missing_strategy_output"
  | "missing_channel_output"
  | "no_selected_channels"
  | "stale_strategy_output"
  | "stale_channel_output"
  | "missing_campaign_goal"
  | "missing_target_audience"
  | "missing_offer_context"
  | "approved_without_output";

export type ApprovedStrategyForCreativePlanning = {
  output: BrainStructuredOutput;
  summaryLines: string[];
};

export type CreativeGenerationUpstreamDiagnostics = {
  upstreamStrategyFound: boolean;
  upstreamChannelsFound: boolean;
  strategyVersionCompatible: boolean;
  channelVersionCompatible: boolean;
  selectedChannelCount: number;
  businessValidationCategory?: CreativeGenerationValidationCategory;
};

export type CreativeGenerationUpstreamValidation = {
  ok: boolean;
  category?: CreativeGenerationValidationCategory;
  strategy?: ApprovedStrategyForCreativePlanning;
  approvedChannelIds: string[];
  diagnostics: CreativeGenerationUpstreamDiagnostics;
};

function normalizeChannelId(raw: string): string | null {
  const n = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if ((CHANNEL_IDS as readonly string[]).includes(n)) return n;
  if (n.includes("linkedin")) return "linkedin";
  if (n.includes("google")) return "google_ads";
  if (n.includes("email")) return "email";
  if (n.includes("newsletter")) return "newsletter";
  if (n.includes("landing")) return n.includes("website") ? "website_landing" : "landing_page";
  if (n.includes("blog")) return "blog";
  if (n.includes("instagram")) return "instagram";
  if (n.includes("meta")) return "meta_ads";
  if (n.includes("seo")) return "seo";
  return null;
}

function parseChannelIdFromLabel(label: string): string | null {
  const prefixed = label.match(/^(?:Kanaal|Channel)\s*:\s*(.+)$/i);
  if (prefixed?.[1]) return normalizeChannelId(prefixed[1]);
  return normalizeChannelId(label);
}

function isExplicitlyRejected(value: string): boolean {
  return /afgewezen|rejected|not selected|niet geselecteerd|insufficient|onvoldoende|uitgesloten|excluded/i.test(
    value
  );
}

function isExplicitlySelected(value: string): boolean {
  return /geselecteerd|selected|aanbevolen|recommended|primary|priorit|fit|past bij|geschikt|in scope|actief kanaal|active channel/i.test(
    value
  );
}

function channelMentionedInText(text: string, channelId: string): boolean {
  const needle = channelId.replace("_", " ");
  return text.toLowerCase().includes(channelId.replace("_", "")) || text.toLowerCase().includes(needle);
}

function collectChannelIdsFromText(text: string): string[] {
  const found = new Set<string>();
  for (const channelId of CHANNEL_IDS) {
    if (channelMentionedInText(text, channelId)) found.add(channelId);
  }
  return [...found];
}

export function extractApprovedStrategyForCreativePlanning(
  strategy: BrainStructuredOutput | undefined
): ApprovedStrategyForCreativePlanning | null {
  if (!strategy?.findings.length) return null;
  return {
    output: strategy,
    summaryLines: strategy.findings.map((f) => `${f.label}: ${f.value}`),
  };
}

export function extractApprovedChannelsForCreativePlanning(input: {
  channelOutput: BrainStructuredOutput | undefined;
  campaignContext?: CampaignContext | null;
  channelsStepApproved?: boolean;
}): string[] {
  const selected = new Set<string>();
  const channelOut = input.channelOutput;

  for (const finding of channelOut?.findings ?? []) {
    const channelId = parseChannelIdFromLabel(finding.label);
    if (!channelId) continue;
    if (isExplicitlyRejected(finding.value)) continue;
    if (isExplicitlySelected(finding.value) || finding.value.trim().length > 0) {
      selected.add(channelId);
    }
  }

  if (selected.size === 0) {
    for (const rec of channelOut?.recommendations ?? []) {
      for (const channelId of collectChannelIdsFromText(rec.label)) {
        selected.add(channelId);
      }
    }
  }

  if (selected.size === 0) {
    for (const decision of channelOut?.decisions ?? []) {
      for (const channelId of collectChannelIdsFromText(`${decision.label} ${decision.rationale}`)) {
        selected.add(channelId);
      }
    }
  }

  const manualChannels = input.campaignContext?.selectedChannels ?? [];
  if (selected.size === 0 && manualChannels.length > 0) {
    for (const channel of manualChannels) {
      const normalized = normalizeChannelId(String(channel));
      if (normalized) selected.add(normalized);
    }
  }

  if (selected.size === 0 && input.channelsStepApproved && channelOut?.findings.length) {
    for (const finding of channelOut.findings) {
      const channelId = parseChannelIdFromLabel(finding.label);
      if (channelId && !isExplicitlyRejected(finding.value)) {
        selected.add(channelId);
      }
    }
  }

  return [...selected];
}

function hasCampaignGoal(campaign: CampaignContext | null | undefined): boolean {
  if (!campaign) return false;
  return Boolean(campaign.description?.trim()) || campaign.goals.some((g) => g.trim().length > 0);
}

function hasTargetAudience(
  campaign: CampaignContext | null | undefined,
  executionContext: CapabilityExecutionContext
): boolean {
  const audience =
    campaign?.audience?.trim() ||
    campaign?.brandContext?.targetAudience?.trim() ||
    executionContext.companySnapshot.profile.targetAudiences.value?.[0]?.trim();
  return Boolean(audience);
}

function hasOfferContext(executionContext: CapabilityExecutionContext): boolean {
  const brandProducts = executionContext.campaignContext?.brandContext?.productsAndServices ?? [];
  const profileProducts = executionContext.companySnapshot.profile.products.value ?? [];
  return brandProducts.some((p) => p.trim().length > 0) || profileProducts.some((p) => p.trim().length > 0);
}

export function isCapabilityOutputVersionCompatible(
  capabilityId: BrainCapabilityId,
  output: BrainStructuredOutput | undefined
): boolean {
  if (!output) return false;
  return output.capabilityVersion === getBrainCapability(capabilityId).version;
}

export function validateCreativeGenerationUpstream(input: {
  executionContext: CapabilityExecutionContext;
  storedContextVersion?: number;
  channelsStepApproved?: boolean;
}): CreativeGenerationUpstreamValidation {
  const strategyOut = input.executionContext.upstreamOutputs.strategy;
  const channelOut = input.executionContext.upstreamOutputs.channel_planning;
  const campaign = input.executionContext.campaignContext;
  const currentContextVersion = campaign?.contextVersion ?? input.storedContextVersion;

  const upstreamStrategyFound = Boolean(strategyOut?.findings.length);
  const upstreamChannelsFound = Boolean(channelOut?.findings.length);
  const strategyVersionCompatible = isCapabilityOutputVersionCompatible("strategy", strategyOut);
  const channelVersionCompatible = isCapabilityOutputVersionCompatible("channel_planning", channelOut);

  const approvedChannelIds = extractApprovedChannelsForCreativePlanning({
    channelOutput: channelOut,
    campaignContext: campaign,
    channelsStepApproved: input.channelsStepApproved,
  });

  const diagnostics: CreativeGenerationUpstreamDiagnostics = {
    upstreamStrategyFound,
    upstreamChannelsFound,
    strategyVersionCompatible,
    channelVersionCompatible,
    selectedChannelCount: approvedChannelIds.length,
  };

  if (
    input.channelsStepApproved &&
    input.executionContext.campaignContext &&
    !upstreamStrategyFound &&
    !upstreamChannelsFound
  ) {
    return {
      ok: false,
      category: "approved_without_output",
      approvedChannelIds: [],
      diagnostics: { ...diagnostics, businessValidationCategory: "approved_without_output" },
    };
  }

  if (!upstreamStrategyFound) {
    return {
      ok: false,
      category: "missing_strategy_output",
      approvedChannelIds: [],
      diagnostics: { ...diagnostics, businessValidationCategory: "missing_strategy_output" },
    };
  }

  if (!strategyVersionCompatible) {
    return {
      ok: false,
      category: "stale_strategy_output",
      approvedChannelIds: [],
      diagnostics: { ...diagnostics, businessValidationCategory: "stale_strategy_output" },
    };
  }

  if (!upstreamChannelsFound) {
    return {
      ok: false,
      category: "missing_channel_output",
      approvedChannelIds: [],
      diagnostics: { ...diagnostics, businessValidationCategory: "missing_channel_output" },
    };
  }

  if (!channelVersionCompatible) {
    return {
      ok: false,
      category: "stale_channel_output",
      approvedChannelIds: [],
      diagnostics: { ...diagnostics, businessValidationCategory: "stale_channel_output" },
    };
  }

  if (
    currentContextVersion != null &&
    input.storedContextVersion != null &&
    input.storedContextVersion !== currentContextVersion
  ) {
    return {
      ok: false,
      category: "stale_strategy_output",
      approvedChannelIds: [],
      diagnostics: { ...diagnostics, businessValidationCategory: "stale_strategy_output" },
    };
  }

  if (approvedChannelIds.length === 0) {
    return {
      ok: false,
      category: "no_selected_channels",
      approvedChannelIds: [],
      diagnostics: { ...diagnostics, businessValidationCategory: "no_selected_channels" },
    };
  }

  if (!hasCampaignGoal(campaign)) {
    return {
      ok: false,
      category: "missing_campaign_goal",
      approvedChannelIds,
      diagnostics: { ...diagnostics, businessValidationCategory: "missing_campaign_goal" },
    };
  }

  if (!hasTargetAudience(campaign, input.executionContext)) {
    return {
      ok: false,
      category: "missing_target_audience",
      approvedChannelIds,
      diagnostics: { ...diagnostics, businessValidationCategory: "missing_target_audience" },
    };
  }

  if (!hasOfferContext(input.executionContext)) {
    return {
      ok: false,
      category: "missing_offer_context",
      approvedChannelIds,
      diagnostics: { ...diagnostics, businessValidationCategory: "missing_offer_context" },
    };
  }

  const strategy = extractApprovedStrategyForCreativePlanning(strategyOut);
  if (!strategy) {
    return {
      ok: false,
      category: "missing_strategy_output",
      approvedChannelIds,
      diagnostics: { ...diagnostics, businessValidationCategory: "missing_strategy_output" },
    };
  }

  return {
    ok: true,
    strategy,
    approvedChannelIds,
    diagnostics,
  };
}
