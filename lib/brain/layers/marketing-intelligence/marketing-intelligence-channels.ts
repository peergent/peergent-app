/**
 * Marketing Intelligence — channel domain.
 * Intelligence only — never channel allocation strategy.
 */

import type { ReasoningBrainGraph } from "../reasoning/brain-types";
import type { ResearchBrainGraph } from "../research/brain-types";
import type { ChannelIntelligence, MarketingEvidenceRef } from "./brain-types";
import { enforceMarketingConfidenceCeiling } from "./marketing-intelligence-confidence";

const CHANNELS = [
  "Google Search",
  "Google Display",
  "LinkedIn",
  "Meta",
  "Instagram",
  "Email",
  "SEO",
  "Organic Social",
  "YouTube",
  "Blog",
  "Landing Pages",
  "Retargeting",
] as const;

let channelCounter = 0;

export function resetChannelIntelligenceCounter(): void {
  channelCounter = 0;
}

function channelMentioned(channel: string, text: string): boolean {
  return text.toLowerCase().includes(channel.toLowerCase().split(" ")[0] ?? channel);
}

export function buildChannelIntelligence(input: {
  researchGraph: ResearchBrainGraph;
  reasoningGraph: ReasoningBrainGraph;
  evidence: readonly MarketingEvidenceRef[];
  channelData?: readonly string[];
  selectedChannels?: readonly string[];
}): ChannelIntelligence[] {
  const channels: ChannelIntelligence[] = [];
  const allText = [
    ...input.evidence.map((e) => e.summary),
    ...input.researchGraph.findings.map((f) => f.summary),
    ...input.reasoningGraph.interpretations.map((i) => i.summary),
    ...(input.channelData ?? []),
  ].join(" ");

  for (const channel of CHANNELS) {
    channelCounter += 1;
    const mentioned =
      channelMentioned(channel, allText) ||
      (input.selectedChannels ?? []).some((c) => c.toLowerCase().includes(channel.toLowerCase().split(" ")[0] ?? ""));
    const competitorUses = input.researchGraph.competitorProfiles.some((p) =>
      p.channels.some((c) => channelMentioned(channel, c))
    );

    if (!mentioned && !competitorUses) continue;

    const relatedEvidence = input.evidence.filter((e) => channelMentioned(channel, e.summary));
    const evidenceIds = relatedEvidence.map((e) => e.id);
    const confidence = enforceMarketingConfidenceCeiling(
      evidenceIds.length >= 2 ? "medium" : "low",
      evidenceIds.length
    );

    const isSearch = channel === "Google Search" || channel === "SEO";
    const isLinkedIn = channel === "LinkedIn";
    const linkedInInterp = input.reasoningGraph.interpretations.find((i) =>
      /linkedin|underutilized/i.test(i.summary)
    );

    channels.push({
      channel,
      audienceFit: isLinkedIn ? "medium" : isSearch ? "high" : "medium",
      intentFit: isSearch ? "high" : channel === "Google Display" ? "medium" : "low",
      objectiveFit: mentioned ? "medium" : "low",
      creativeFit: channel === "Meta" || channel === "Instagram" ? "medium" : "low",
      competitiveIntensity: competitorUses ? "high" : "medium",
      estimatedComplexity: channel === "Google Search" ? "medium" : "low",
      measurementQuality: isSearch || channel === "Email" ? "high" : "medium",
      organicOrPaid:
        channel === "SEO" || channel === "Organic Social" || channel === "Blog"
          ? "organic"
          : channel === "Google Search"
            ? "both"
            : "paid",
      funnelRole: isSearch
        ? "Direct demand capture"
        : isLinkedIn
          ? "B2B awareness and consideration"
          : "Varies by objective",
      confidence,
      evidenceIds,
      risks: competitorUses ? [`Competitive pressure on ${channel}`] : [],
      opportunities: linkedInInterp && isLinkedIn
        ? ["LinkedIn appears underutilized despite competitor activity"]
        : isSearch
          ? ["Strong observed intent fit for direct demand capture"]
          : [],
    });
  }

  return channels;
}

export function containsChannelStrategyLanguage(text: string): boolean {
  return /\b(spend \d+|allocate \d+|primary acquisition channel|use .+ as primary)\b/i.test(text);
}
