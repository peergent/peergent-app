import type { MarketingStrategy } from "@/lib/marketing-intelligence";
import type { MarketingDecisionRecord } from "@/lib/marketing-decision";

import type { MarketingProject } from "../projects/types";
import type { CampaignStrategyWorkUnitOutput } from "./types";

function uniqueChannels(channels: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of channels) {
    const label = raw.trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}

export function mapMarketingStrategyToCampaignStrategyOutput(input: {
  project: MarketingProject;
  strategy: MarketingStrategy;
  decision?: MarketingDecisionRecord | null;
}): CampaignStrategyWorkUnitOutput {
  const positioning =
    input.strategy.positioningRecommendations[0]?.recommendation?.trim() ??
    input.strategy.positioningRecommendations
      .map((p) => p.recommendation.trim())
      .filter(Boolean)
      .join(" ");

  const messagingPillars = input.strategy.contentPillars
    .map((p) => p.name.trim())
    .filter(Boolean);

  const fromStrategy = input.strategy.campaignIdeas.flatMap((idea) => idea.channels);
  const fromSocial = input.strategy.socialMediaStrategy.map((s) => s.platform);
  const fromDecision = (input.decision?.channelRecommendations ?? [])
    .filter((c) => c.status !== "BLOCKED")
    .map((c) => c.label);

  const recommendedChannels = uniqueChannels([...fromStrategy, ...fromSocial, ...fromDecision]);

  const ctaParts: string[] = [];
  const cta = input.decision?.ctaStrategy;
  if (cta?.primaryPattern?.trim()) {
    ctaParts.push(cta.primaryPattern.trim());
  }
  if (cta?.secondaryPattern?.trim()) {
    ctaParts.push(cta.secondaryPattern.trim());
  }
  if (cta?.constraints.length) {
    ctaParts.push(...cta.constraints.map((c) => c.trim()).filter(Boolean));
  }

  return {
    title: `${input.project.title} — Campaign strategy`,
    summary: input.strategy.summary.trim(),
    positioning: positioning.trim(),
    messagingPillars,
    recommendedChannels,
    ctaGuidance: ctaParts.join(" · ") || "Follow brand-preferred CTA patterns from verified context.",
  };
}
